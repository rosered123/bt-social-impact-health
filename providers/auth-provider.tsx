import { Session } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

type UserRole = 'customer' | 'business' | null;

type AuthContextValue = {
  session: Session | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: Exclude<UserRole, null>,
    displayName?: string
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfileRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('uid', userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  const role = data?.role;
  if (role === 'customer' || role === 'business') {
    return role;
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const {
        data: { session: initialSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      // Stale / invalid refresh token — clear it so the user is sent to sign-in
      if (sessionError) {
        await supabase.auth.signOut();
        if (mounted) setLoading(false);
        return;
      }

      setSession(initialSession);

      if (initialSession?.user?.id) {
        const profileRole = await fetchProfileRole(initialSession.user.id);
        if (mounted) {
          setRole(profileRole);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Supabase fires this when a refresh token is invalid — clear local state
      if (event === 'TOKEN_REFRESHED' && !nextSession) {
        setSession(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(nextSession);

      if (!nextSession?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      fetchProfileRole(nextSession.user.id)
        .then(profileRole => {
          const metadataRole = nextSession.user.user_metadata?.role;
          if (profileRole) {
            setRole(profileRole);
          } else if (metadataRole === 'customer' || metadataRole === 'business') {
            setRole(metadataRole);
          } else {
            setRole(null);
          }
        })
        .finally(() => setLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      role,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      },
      signUp: async (email, password, nextRole, displayName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: nextRole,
              display_name: displayName?.trim() || null,
            },
          },
        });

        if (error) {
          throw error;
        }

        const requiresEmailConfirmation = !data.session;
        return { requiresEmailConfirmation };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
    }),
    [loading, role, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}