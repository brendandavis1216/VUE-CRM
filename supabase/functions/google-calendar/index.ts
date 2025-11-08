import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
// JWT_SECRET is no longer needed for verifying Supabase session tokens via auth.getUser()

console.log('Edge Function Environment Variables:');
console.log(`GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`SUPABASE_URL: ${SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing environment variables for Google Calendar integration. Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SUPABASE_URL, and SUPABASE_ANON_KEY are set as Supabase secrets.');
  throw new Error('Server configuration error: Missing environment variables for Google Calendar integration.');
}

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar/callback`;
console.log('DEBUG: Constructed REDIRECT_URI:', REDIRECT_URI);

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/google-calendar', ''); 
  console.log('DEBUG: Received path in Edge Function:', path);

  const authHeader = req.headers.get('Authorization');
  console.log('DEBUG: Authorization Header:', authHeader ? 'Present' : 'Missing');
  let userId: string | null = null;

  const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } }, // Pass the full header for auth.getUser()
  });

  if (authHeader) {
    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(); // Verify JWT using Supabase client
      if (userError || !user) {
        console.error('Supabase auth.getUser failed:', userError?.message || 'No user found');
        throw new Error('Invalid or expired token');
      }
      userId = user.id;
      console.log('DEBUG: Supabase JWT Verified. User ID:', userId);
    } catch (e) {
      console.error('JWT verification failed via Supabase auth.getUser:', e instanceof Error ? e.message : String(e));
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    console.log('DEBUG: No Authorization header found. User is not authenticated via JWT.');
  }

  const getUserGoogleTokens = async (uid: string) => {
    const { data, error } = await supabaseClient
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Google tokens:', error);
      return null;
    }
    return data;
  };

  const refreshAccessToken = async (refreshToken: string, uid: string) => {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error refreshing token:', errorData);
      throw new Error(`Failed to refresh access token: ${errorData.error_description || response.statusText}`);
    }

    const newTokens = await response.json();
    const expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));

    const { error: updateError } = await supabaseClient
      .from('user_google_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        ...(newTokens.refresh_token && { refresh_token: newTokens.refresh_token }),
      })
      .eq('user_id', uid);

    if (updateError) {
      console.error('Error updating tokens in DB after refresh:', updateError);
      throw updateError;
    }

    return {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || refreshToken,
      expires_at: expiresAt,
    };
  };

  switch (path) {
    case '/auth': {
      if (!userId) {
        console.log('DEBUG: /auth endpoint: userId is null, returning Unauthorized.');
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { clientOrigin } = await req.json(); // Get clientOrigin from request body

      const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ];

      // Encode both userId and clientOrigin into the state parameter
      const statePayload = btoa(JSON.stringify({ userId, clientOrigin }));

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: statePayload, // Use the encoded state
      });

      const authorizeUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

      return new Response(JSON.stringify({ authorizeUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case '/callback': {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let userIdFromState: string;
      let clientOriginFromState: string;
      try {
        const decodedState = JSON.parse(atob(state));
        userIdFromState = decodedState.userId;
        clientOriginFromState = decodedState.clientOrigin;
      } catch (e) {
        console.error('Error decoding state parameter:', e);
        return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code: code,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        });

        const response = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error exchanging code for tokens:', errorData);
          throw new Error(`Failed to get tokens: ${errorData.error_description || response.statusText}`);
        }

        const tokens = await response.json();
        const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

        const { data: existingTokens, error: fetchError } = await supabaseClient
          .from('user_google_tokens')
          .select('id')
          .eq('user_id', userIdFromState)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking existing tokens:', fetchError);
          throw fetchError;
        }

        if (existingTokens) {
          const { error: updateError } = await supabaseClient
            .from('user_google_tokens')
            .update({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || existingTokens.refresh_token,
              expires_at: expiresAt.toISOString(),
              scope: tokens.scope,
              token_type: tokens.token_type,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userIdFromState);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabaseClient
            .from('user_google_tokens')
            .insert({
              user_id: userIdFromState,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt.toISOString(),
              scope: tokens.scope,
              token_type: tokens.token_type,
            });

          if (insertError) throw insertError;
        }

        // Redirect back to the client application's origin
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${clientOriginFromState}/calendar?google_auth_success=true`,
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('Error in Google callback:', error);
        return new Response(JSON.stringify({ error: `Failed to authenticate with Google: ${error instanceof Error ? error.message : String(error)}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    case '/events': {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let userTokens = await getUserGoogleTokens(userId);
      if (!userTokens) {
        return new Response(JSON.stringify({ error: 'Google account not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let currentAccessToken = userTokens.access_token;
      let currentRefreshToken = userTokens.refresh_token;
      let currentExpiresAt = new Date(userTokens.expires_at);

      if (currentExpiresAt < new Date() && currentRefreshToken) {
        try {
          const refreshed = await refreshAccessToken(currentRefreshToken, userId);
          currentAccessToken = refreshed.access_token;
          currentRefreshToken = refreshed.refresh_token;
          currentExpiresAt = refreshed.expires_at;
        } catch (refreshError) {
          console.error('Error refreshing Google access token:', refreshError);
          return new Response(JSON.stringify({ error: 'Failed to refresh Google access token. Please reconnect.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (currentExpiresAt < new Date() && !currentRefreshToken) {
        return new Response(JSON.stringify({ error: 'Google access token expired and no refresh token available. Please reconnect.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const timeMin = url.searchParams.get('timeMin') || new Date().toISOString();
        const timeMax = url.searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const calendarParams = new URLSearchParams({
          timeMin: timeMin,
          timeMax: timeMax,
          singleEvents: 'true',
          orderBy: 'startTime',
        });

        const response = await fetch(`${GOOGLE_CALENDAR_API_URL}?${calendarParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching Google Calendar events:', errorData);
          throw new Error(`Failed to fetch Google events: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data.items), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return new Response(JSON.stringify({ error: `Failed to fetch Google Calendar events: ${error instanceof Error ? error.message : String(error)}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    case '/create-event': {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let userTokens = await getUserGoogleTokens(userId);
      if (!userTokens) {
        return new Response(JSON.stringify({ error: 'Google account not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let currentAccessToken = userTokens.access_token;
      let currentRefreshToken = userTokens.refresh_token;
      let currentExpiresAt = new Date(userTokens.expires_at);

      if (currentExpiresAt < new Date() && currentRefreshToken) {
        try {
          const refreshed = await refreshAccessToken(currentRefreshToken, userId);
          currentAccessToken = refreshed.access_token;
          currentRefreshToken = refreshed.refresh_token;
          currentExpiresAt = refreshed.expires_at;
        } catch (refreshError) {
          console.error('Error refreshing Google access token:', refreshError);
          return new Response(JSON.stringify({ error: 'Failed to refresh Google access token. Please reconnect.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (currentExpiresAt < new Date() && !currentRefreshToken) {
        return new Response(JSON.stringify({ error: 'Google access token expired and no refresh token available. Please reconnect.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const eventData = await req.json();
          const response = await fetch(GOOGLE_CALENDAR_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating Google Calendar event:', errorData);
            throw new Error(`Failed to create Google Calendar event: ${errorData.error?.message || response.statusText}`);
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error('Error creating Google Calendar event:', error);
          return new Response(JSON.stringify({ error: `Failed to create Google Calendar event: ${error instanceof Error ? error.message : String(error)}` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      default:
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  });