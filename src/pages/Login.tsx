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
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(0 0% 100%)', // White for primary button background
                  brandAccent: 'hsl(222.2 47.4% 11.2%)', // Dark for primary button text/hover
                  defaultButtonBackground: 'hsl(0 0% 100%)', // White for default button background
                  defaultButtonBackgroundHover: 'hsl(222.2 47.4% 11.2%)', // Dark for default button text/hover
                  inputBackground: 'hsl(217.2 32.6% 17.5%)', // Dark gray for input background
                  inputBorder: 'hsl(217.2 32.6% 17.5%)', // Dark gray for input border
                  inputLabel: 'hsl(0 0% 100%)', // Pure white label text
                  inputText: 'hsl(0 0% 100%)', // Pure white input text
                  messageText: 'hsl(0 0% 100%)', // Pure white for message text (e.g., error messages)
                  messageBackground: 'hsl(0 62.8% 30.6%)', // Destructive red for message background
                  anchorTextColor: 'hsl(0 0% 100%)', // Pure white for links
                  inputPlaceholder: 'hsl(0 0% 100%)', // Pure white for placeholder text
                  dividerBackground: 'hsl(217.2 32.6% 17.5%)', // Dark gray for dividers
                  textColor: 'hsl(0 0% 100%)', // Pure white for general text
                },
              },
            },
          }}
          theme="dark"
          redirectTo={window.location.origin + '/clients'}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;