"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg border border-border text-black">
        <h1 className="text-3xl font-bold text-center text-black">Welcome Back!</h1>
        <p className="text-center text-gray-700">Sign in to manage your events and clients.</p>
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
                  inputBackground: 'hsl(var(--background))', // Use background (white in light theme) for input background
                  inputBorder: 'hsl(var(--border))', // Use border (light gray in light theme) for input border
                  inputLabel: 'hsl(var(--foreground))', // Use foreground (dark) for input label
                  inputText: 'hsl(var(--foreground))', // Use foreground (dark) for input text
                  messageText: 'hsl(var(--destructive-foreground))', // White text on red background
                  messageBackground: 'hsl(var(--destructive))', // Red background
                  anchorTextColor: 'hsl(var(--primary))', // Use primary (dark) for links
                },
              },
            },
          }}
          theme="light" // Use light theme for the Auth UI components
          redirectTo={window.location.origin + '/clients'} // Redirect to clients page after login
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;