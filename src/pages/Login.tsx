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
      <p className="text-center text-gray-300 mb-6">Sign in to manage your events and clients.</p>
      <div className="w-full max-w-md space-y-6"> {/* This div now only provides max-width and spacing */}
        <Auth
          supabaseClient={supabase}
          providers={[]} // Only email/password for now, can add more later
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))', // Use primary (dark) for brand button
                  brandAccent: 'hsl(var(--foreground))', // Use foreground (darker) for accent
                  defaultButtonBackground: 'hsl(var(--primary))', // Primary button background
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))', // Primary button hover
                  inputBackground: 'hsl(0 0% 100%)', // White input background
                  inputBorder: 'hsl(var(--border))', // Border color
                  inputLabel: 'hsl(var(--foreground))', // White label text
                  inputText: 'hsl(var(--background))', // Black input text
                  messageText: 'hsl(var(--destructive-foreground))', // White text on red background
                  messageBackground: 'hsl(var(--destructive))', // Red background
                  anchorTextColor: 'hsl(var(--primary))', // Use primary (dark) for links
                  // Ensure other text elements are white
                  inputPlaceholder: 'hsl(215 20.2% 65.1%)', // Muted foreground for placeholder
                  dividerBackground: 'hsl(217.2 32.6% 17.5%)', // Muted border for dividers
                  // Remove card background from Auth component itself
                  // ThemeSupa applies a background, so we need to override it if possible or accept it as a subtle card
                },
              },
            },
          }}
          theme="dark" // Use dark theme for the Auth UI components
          redirectTo={window.location.origin + '/clients'} // Redirect to clients page after login
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;