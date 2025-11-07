"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border border-border">
        <h1 className="text-3xl font-bold text-center text-foreground">Welcome Back!</h1>
        <p className="text-center text-muted-foreground">Sign in to manage your events and clients.</p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Only email/password for now, can add more later
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                  inputBackground: 'hsl(var(--input))',
                  inputBorder: 'hsl(var(--border))',
                  inputLabel: 'hsl(var(--foreground))',
                  inputText: 'hsl(var(--foreground))',
                  messageText: 'hsl(var(--destructive-foreground))',
                  messageBackground: 'hsl(var(--destructive))',
                  anchorTextColor: 'hsl(var(--primary))',
                },
              },
            },
          }}
          theme="dark" // Use dark theme to match app
          redirectTo={window.location.origin + '/clients'} // Redirect to clients page after login
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Login;