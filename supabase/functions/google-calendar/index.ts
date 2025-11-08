import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { google } from 'https://esm.sh/googleapis@140.0.0/build/src/index.js';
import * as jose from 'https://esm.sh/jose@5.6.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('VITE_GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing environment variables for Google Calendar integration.');
  Deno.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${SUPABASE_URL}/functions/v1/google-calendar/callback`
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1/google-calendar', '');

  // Verify JWT token from Supabase for authenticated requests
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;

  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { payload } = await jose.jwtVerify(
        token,
        jose.base64url.decode(Deno.env.get('SUPABASE_JWT_SECRET')!)
      );
      userId = payload.sub as string;
    } catch (e) {
      console.error('JWT verification failed:', e);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${authHeader}` } },
  });

  // Helper to get user's Google tokens
  const getUserGoogleTokens = async (uid: string) => {
    const { data, error } = await supabaseClient
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching Google tokens:', error);
      return null;
    }
    return data;
  };

  // Helper to refresh token if expired
  const refreshAccessToken = async (refreshToken: string) => {
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oAuth2Client.refreshAccessToken();
    return credentials;
  };

  switch (path) {
    case '/auth': {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ];

      const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: userId, // Pass userId as state to retrieve it in callback
      });

      return new Response(JSON.stringify({ authorizeUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case '/callback': {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // This is our userId

      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Missing code or state parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        const expiresAt = new Date(Date.now() + (tokens.expiry_date! - Date.now()));

        const { data: existingTokens, error: fetchError } = await supabaseClient
          .from('user_google_tokens')
          .select('id')
          .eq('user_id', state)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking existing tokens:', fetchError);
          throw fetchError;
        }

        if (existingTokens) {
          // Update existing tokens
          const { error: updateError } = await supabaseClient
            .from('user_google_tokens')
            .update({
              access_token: tokens.access_token!,
              refresh_token: tokens.refresh_token || existingTokens.refresh_token, // Keep old refresh token if new one not provided
              expires_at: expiresAt.toISOString(),
              scope: tokens.scope,
              token_type: tokens.token_type,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', state);

          if (updateError) throw updateError;
        } else {
          // Insert new tokens
          const { error: insertError } = await supabaseClient
            .from('user_google_tokens')
            .insert({
              user_id: state,
              access_token: tokens.access_token!,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt.toISOString(),
              scope: tokens.scope,
              token_type: tokens.token_type,
            });

          if (insertError) throw insertError;
        }

        // Redirect back to the app's calendar page
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${url.origin}/calendar?google_auth_success=true`,
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        return new Response(JSON.stringify({ error: 'Failed to authenticate with Google' }), {
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

      const userTokens = await getUserGoogleTokens(userId);
      if (!userTokens) {
        return new Response(JSON.stringify({ error: 'Google account not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let currentAccessToken = userTokens.access_token;
      let currentRefreshToken = userTokens.refresh_token;
      let currentExpiresAt = new Date(userTokens.expires_at);

      // Check if token is expired and refresh if possible
      if (currentExpiresAt < new Date() && currentRefreshToken) {
        try {
          const newCredentials = await refreshAccessToken(currentRefreshToken);
          currentAccessToken = newCredentials.access_token!;
          currentRefreshToken = newCredentials.refresh_token || currentRefreshToken;
          currentExpiresAt = new Date(newCredentials.expiry_date!);

          // Update tokens in Supabase
          await supabaseClient
            .from('user_google_tokens')
            .update({
              access_token: currentAccessToken,
              refresh_token: currentRefreshToken,
              expires_at: currentExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
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

      oAuth2Client.setCredentials({ access_token: currentAccessToken });
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      try {
        const timeMin = url.searchParams.get('timeMin') || new Date().toISOString();
        const timeMax = url.searchParams.get('timeMax') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

        const res = await calendar.events.list({
          calendarId: 'primary',
          timeMin: timeMin,
          timeMax: timeMax,
          singleEvents: true,
          orderBy: 'startTime',
        });

        return new Response(JSON.stringify(res.data.items), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch Google Calendar events' }), {
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

      const userTokens = await getUserGoogleTokens(userId);
      if (!userTokens) {
        return new Response(JSON.stringify({ error: 'Google account not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let currentAccessToken = userTokens.access_token;
      let currentRefreshToken = userTokens.refresh_token;
      let currentExpiresAt = new Date(userTokens.expires_at);

      // Check if token is expired and refresh if possible
      if (currentExpiresAt < new Date() && currentRefreshToken) {
        try {
          const newCredentials = await refreshAccessToken(currentRefreshToken);
          currentAccessToken = newCredentials.access_token!;
          currentRefreshToken = newCredentials.refresh_token || currentRefreshToken;
          currentExpiresAt = new Date(newCredentials.expiry_date!);

          // Update tokens in Supabase
          await supabaseClient
            .from('user_google_tokens')
            .update({
              access_token: currentAccessToken,
              refresh_token: currentRefreshToken,
              expires_at: currentExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
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

      oAuth2Client.setCredentials({ access_token: currentAccessToken });
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      try {
        const eventData = await req.json();
        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventData,
        });

        return new Response(JSON.stringify(res.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return new Response(JSON.stringify({ error: 'Failed to create Google Calendar event' }), {
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