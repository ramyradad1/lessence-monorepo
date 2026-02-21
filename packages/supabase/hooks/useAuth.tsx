import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';

import { Profile } from '@lessence/core';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signUp: (email: string, full_name: string, password?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const AuthProvider = ({
  supabase,
  children,
}: {
  supabase: SupabaseClient;
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted && data.session) {
          // Validate the session is actually still valid by hitting the server
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            // Session is expired/invalid — clear it
            console.warn('[Auth] Stale session detected, signing out');
            await supabase.auth.signOut();
            if (mounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setIsLoading(false);
            }
            return;
          }
          setSession(data.session);
          setUser(data.session.user);
          await fetchProfile(data.session.user.id);
        } else {
          if (mounted) setIsLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Error getting initial session:', err);
        if (mounted) setIsLoading(false);
      }
    }

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!error && data) {
        setProfile(data);
      } else if (error && error.code === 'PGRST116') {
        // No profile found, let's create a stub
        const { data: userResp } = await supabase.auth.getUser();
        const newProfile = { 
            id: userId, 
            email: userResp?.user?.email || '', 
            role: 'user' 
        };
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (!insertError && inserted) {
          setProfile(inserted as Profile);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async (email: string, password?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = password 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ email });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, full_name: string, password?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = password
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: { full_name } // supabase passes this into trigger usually, but we can also manually write profile
            }
          })
        : await supabase.auth.signInWithOtp({ email });
        
      if (!error && data?.user) {
        // Manually write profile if we don't have triggers
        await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name
        });
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, profile, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
