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
                  brand: 'hsl(var(--primary))', // Dark background for primary button
                  brandAccent: 'hsl(var(--primary-foreground))', // White text for primary button
                  defaultButtonBackground: 'hsl(var(--primary))', // Dark background for default button
                  defaultButtonBackgroundHover: 'hsl(var(--primary-foreground))', // White text for default button hover
                  inputBackground: 'hsl(var(--secondary))', // Dark gray for input background
                  inputBorder: 'hsl(var(--border))', // Dark gray for input border
                  inputLabel: 'hsl(var(--foreground))', // Pure white label text
                  inputText: 'hsl(var(--foreground))', // Pure white input text
                  messageText: 'hsl(var(--destructive-foreground))', // Pure white text on red background
                  messageBackground: 'hsl(var(--destructive))', // Red background
                  anchorTextColor: 'hsl(var(--foreground))', // Pure white for links
                  inputPlaceholder: 'hsl(var(--muted-foreground))', // Pure white for placeholder text
                  dividerBackground: 'hsl(var(--border))', // Dark gray for dividers
                  textColor: 'hsl(var(--foreground))', // Pure white for general text
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