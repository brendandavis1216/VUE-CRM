"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { handleAuthError } from '@/integrations/supabase/auth';
import { toast } from 'sonner';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            // Redirect authenticated users away from login page
            if (window.location.pathname === '/login') {
              navigate('/clients', { replace: true });
            }
          }
        } else {
          setSession(null);
          setUser(null);
          // Redirect unauthenticated users to login page
          if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        if (window.location.pathname === '/login') {
          navigate('/clients', { replace: true });
        }
      } else {
        if (window.location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error("Error getting initial session:", handleAuthError(error));
      toast.error("Failed to load session.");
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading }}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen text-white">Loading authentication...</div>
      ) : (
        children
      )}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};