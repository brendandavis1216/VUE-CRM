import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const DOCUSIGN_AUTH_URL = 'https://account-d.docusign.com/oauth/auth';
const DOCUSIGN_TOKEN_URL = 'https://account-d.docusign.com/oauth/token';
const DOCUSIGN_API_BASE_URL = 'https://demo.docusign.net/restapi/v2.1'; // Use demo for developer account

serve(async (req) => {
  // This log might appear in Supabase logs if the function is invoked.
  console.log('DEBUG: DocuSign Edge Function received request for URL:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const DOCUSIGN_CLIENT_ID = Deno.env.get('DOCUSIGN_CLIENT_ID');
  const DOCUSIGN_CLIENT_SECRET = Deno.env.get('DOCUSIGN_CLIENT_SECRET');
  const DOCUSIGN_ACCOUNT_ID = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
  const DOCUSIGN_REDIRECT_URI = Deno.env.get('DOCUSIGN_REDIRECT_URI');
  const DOCUSIGN_STATE_SECRET = Deno.env.get('DOCUSIGN_STATE_SECRET'); // For CSRF protection
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  const requiredEnvVars = [
    'DOCUSIGN_CLIENT_ID', 'DOCUSIGN_CLIENT_SECRET', 'DOCUSIGN_ACCOUNT_ID',
    'DOCUSIGN_REDIRECT_URI', 'DOCUSIGN_STATE_SECRET', 'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(v => !Deno.env.get(v));
  if (missingVars.length > 0) {
    const errorMessage = `Server configuration error: Missing environment variables for DocuSign integration: ${missingVars.join(', ')}. Please ensure these are set as Supabase secrets.`;
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  // The pathname received by the Edge Function is relative to the function's base path.
  // For a function named 'docusign', a request to /functions/v1/docusign/auth will have url.pathname as /docusign/auth.
  const path = url.pathname; 

  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;

  // Client for operations requiring user JWT (e.g., /auth, /send-document)
  const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: authHeader } },
  });

  // Client for operations requiring service role (e.g., /callback, token refresh DB updates)
  const supabaseAdminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  if (authHeader) {
    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        throw new Error('Invalid or expired token');
      }
      userId = user.id;
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else {
    // For /docusign/callback, we get userId from state, so it's okay if authHeader is missing initially
    if (path !== '/docusign/callback') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const getUserDocuSignTokens = async (uid: string) => {
    const { data, error } = await supabaseAdminClient
      .from('user_docusign_tokens')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      return null;
    }
    return data;
  };

  const refreshDocuSignAccessToken = async (refreshToken: string, uid: string) => {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const authString = btoa(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`);

    const response = await fetch(DOCUSIGN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to refresh access token: ${errorData.error_description || response.statusText}`);
    }

    const newTokens = await response.json();
    const expiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));

    const { error: updateError } = await supabaseAdminClient
      .from('user_docusign_tokens')
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || refreshToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid);

    if (updateError) {
      throw updateError;
    }

    return {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || refreshToken,
      expires_at: expiresAt,
    };
  };

  switch (path) { // Use path directly in the switch
    case '/docusign/auth': {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { clientOrigin } = await req.json();

      const scopes = [
        'signature',
        'extended',
      ];

      const statePayload = btoa(JSON.stringify({ userId, clientOrigin, csrf: DOCUSIGN_STATE_SECRET }));

      const params = new URLSearchParams({
        client_id: DOCUSIGN_CLIENT_ID!,
        scope: scopes.join(' '),
        redirect_uri: DOCUSIGN_REDIRECT_URI!,
        response_type: 'code',
        state: statePayload,
      });

      const authorizeUrl = `${DOCUSIGN_AUTH_URL}?${params.toString()}`;

      return new Response(JSON.stringify({ authorizeUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    case '/docusign/callback': {
      if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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
      let csrfFromState: string;
      try {
        const decodedState = JSON.parse(atob(state));
        userIdFromState = decodedState.userId;
        clientOriginFromState = decodedState.clientOrigin;
        csrfFromState = decodedState.csrf;

        if (csrfFromState !== DOCUSIGN_STATE_SECRET) {
          throw new Error('CSRF token mismatch');
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: DOCUSIGN_REDIRECT_URI!,
        });

        const authString = btoa(`${DOCUSIGN_CLIENT_ID}:${DOCUSIGN_CLIENT_SECRET}`);

        const response = await fetch(DOCUSIGN_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${authString}`,
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to get tokens: ${errorData.error_description || response.statusText}`);
        }

        const tokens = await response.json();
        const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

        const { data: existingTokens, error: fetchError } = await supabaseAdminClient
          .from('user_docusign_tokens')
          .select('id, refresh_token')
          .eq('user_id', userIdFromState)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingTokens) {
          const { error: updateError } = await supabaseAdminClient
            .from('user_docusign_tokens')
            .update({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || existingTokens.refresh_token,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userIdFromState);

          if (updateError) {
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabaseAdminClient
            .from('user_docusign_tokens')
            .insert({
              user_id: userIdFromState,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt.toISOString(),
            });

          if (insertError) {
            throw insertError;
          }
        }

        return new Response(null, {
          status: 302,
          headers: {
            Location: `${clientOriginFromState}/inquiries?docusign_auth_success=true`,
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: `Failed to authenticate with DocuSign: ${error instanceof Error ? error.message : JSON.stringify(error)}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    case '/docusign/send-document': {
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let userTokens = await getUserDocuSignTokens(userId);
      if (!userTokens) {
        return new Response(JSON.stringify({ error: 'DocuSign account not connected' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let currentAccessToken = userTokens.access_token;
      let currentRefreshToken = userTokens.refresh_token;
      let currentExpiresAt = new Date(userTokens.expires_at);

      if (currentExpiresAt < new Date() && currentRefreshToken) {
        try {
          const refreshed = await refreshDocuSignAccessToken(currentRefreshToken, userId);
          currentAccessToken = refreshed.access_token;
          currentRefreshToken = refreshed.refresh_token;
          currentExpiresAt = refreshed.expires_at;
        } catch (refreshError) {
          return new Response(JSON.stringify({ error: 'Failed to refresh DocuSign access token. Please reconnect.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (currentExpiresAt < new Date() && !currentRefreshToken) {
        return new Response(JSON.stringify({ error: 'DocuSign access token expired and no refresh token available. Please reconnect.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const { recipientName, recipientEmail, templateId, templateFieldValues, documentName, subject, emailBlurb } = await req.json();

        if (!recipientName || !recipientEmail || !templateId || !documentName || !subject || !emailBlurb) {
          return new Response(JSON.stringify({ error: 'Missing required fields for sending document' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const textTabs = Object.entries(templateFieldValues).map(([tabLabel, value]) => ({
          tabLabel: tabLabel,
          value: value,
        }));

        const envelopeDefinition = {
          emailSubject: subject,
          emailBlurb: emailBlurb,
          templateId: templateId,
          templateRoles: [
            {
              email: recipientEmail,
              name: recipientName,
              roleName: 'Signer',
              clientUserId: userId,
              tabs: {
                signHereTabs: [
                  {
                    anchorString: '/sn1/',
                    anchorUnits: 'pixels',
                    anchorXOffset: '20',
                    anchorYOffset: '10',
                    tabLabel: 'SignHere1',
                  },
                ],
                textTabs: textTabs,
              },
            },
          ],
          status: 'sent',
        };
        
        const response = await fetch(`${DOCUSIGN_API_BASE_URL}/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(envelopeDefinition),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to send DocuSign document: ${errorData.message || response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: `Failed to send DocuSign document: ${error instanceof Error ? error.message : String(error)}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    default:
      return new Response(JSON.stringify({ error: 'DocuSign Function Path Not Found', receivedPath: path, debugInfo: 'The path received by the Edge Function did not match any defined routes.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
  }
});