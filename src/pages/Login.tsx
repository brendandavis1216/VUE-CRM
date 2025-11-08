"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login = () => {
  return (
    <div className="dark min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold text-center text-white mb-2">Welcome Back!</h1>
      <p className="text-center text-white mb-6">Sign in to manage your events and clients.</p>
      <div className="w-full max-w-md space-y-6">
        <Auth
          key="supabase-auth-ui"
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              dark: { // Moved custom colors under 'dark' to ensure they apply in dark mode
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  defaultButtonBackground: 'hsl(var(--primary))',
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--secondary))',
                  inputBorder: 'hsl(var(--border))',
                  inputLabel: 'hsl(0 0% 100%)', // Explicitly set to pure white for label text
                  inputText: 'hsl(0 0% 100%)',
                  messageText: 'hsl(0 0% 100%)',
                  messageBackground: 'hsl(0 62.8% 30.6%)',
                  anchorTextColor: 'hsl(0 0% 100%)',
                  inputPlaceholder: 'hsl(0 0% 100%)',
                  dividerBackground: 'hsl(var(--border))',
                  textColor: 'hsl(0 0% 100%)',
                },
              },
            },
          }}
          // Removed theme="dark" as it might conflict with appearance.variables.dark
          redirectTo={window.location.origin + '/clients'}
          className="supabase-auth-ui-custom-theme"
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;