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
          key="supabase-auth-ui" // Added key to force re-render
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))', // Dark background for primary button
                  brandAccent: 'hsl(var(--primary-foreground))', // White text for primary button
                  defaultButtonBackground: 'hsl(var(--primary))', // Dark background for default button
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))', // White text for default button hover
                  inputBackground: 'hsl(var(--secondary))', // Dark gray for input background
                  inputBorder: 'hsl(var(--border))', // Dark gray for input border
                  inputLabel: 'hsl(0 0% 100%)', // Explicitly set to pure white for label text
                  inputText: 'hsl(0 0% 100%)', // Pure white input text
                  messageText: 'hsl(0 0% 100%)', // Pure white for message text (e.g., error messages)
                  messageBackground: 'hsl(0 62.8% 30.6%)', // Red background
                  anchorTextColor: 'hsl(0 0% 100%)', // Pure white for links
                  inputPlaceholder: 'hsl(0 0% 100%)', // Pure white for placeholder text
                  dividerBackground: 'hsl(var(--border))', // Dark gray for dividers
                  textColor: 'hsl(0 0% 100%)', // Pure white for general text, directly set
                },
              },
            },
          }}
          theme="dark"
          redirectTo={window.location.origin + '/clients'}
          className="supabase-auth-ui-custom-theme" // Add custom class here
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;