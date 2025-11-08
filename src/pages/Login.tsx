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
              dark: { // Custom colors for dark mode
                colors: {
                  brand: 'hsl(222.2 47.4% 11.2%)', // Explicitly set to dark blue/gray
                  brandAccent: 'hsl(222.2 47.4% 20%)', // Slightly lighter dark blue/gray for hover
                  defaultButtonBackground: 'hsl(222.2 47.4% 11.2%)', // Explicitly set to dark blue/gray
                  defaultButtonBackgroundHover: 'hsl(222.2 47.4% 20%)', // Slightly lighter dark blue/gray for hover
                  inputBackground: 'hsl(var(--secondary))',
                  inputBorder: 'hsl(var(--border))',
                  inputLabel: 'hsl(0 0% 100%)', // This should ideally work, but we're adding localization as a fallback
                  inputText: 'hsl(0 0% 100%)',
                  messageText: 'hsl(0 0% 100%)',
                  messageBackground: 'hsl(0 62.8% 30.6%)',
                  anchorTextColor: 'hsl(0 0% 100%)',
                  inputPlaceholder: 'hsl(0 0% 100%)',
                  dividerBackground: 'hsl(var(--border))',
                  textColor: 'hsl(0 0% 100%)', // This should ideally work, but we're adding localization as a fallback
                },
              },
            },
          }}
          theme="dark" // Explicitly set theme to dark
          redirectTo={window.location.origin + '/clients'}
          className="supabase-auth-ui-custom-theme"
          localization={{
            variables: {
              sign_in: {
                email_label: <span className="text-white">Email address</span>,
                password_label: <span className="text-white">Your Password</span>,
              },
              sign_up: {
                email_label: <span className="text-white">Email address</span>,
                password_label: <span className="text-white">Create a Password</span>,
              },
              forgotten_password: {
                email_label: <span className="text-white">Email address</span>,
              },
              update_password: {
                password_label: <span className="text-white">New Password</span>,
              },
            },
          }}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;