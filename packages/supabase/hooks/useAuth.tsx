import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, create one
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
            return inserted as Profile;
          }
        }
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    mountedRef.current = true;

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) setIsLoading(false);
    }, 10000);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mountedRef.current) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Fetch profile
          const p = await fetchProfile(currentSession.user.id);
          if (mountedRef.current) {
            setProfile(p);
            setIsLoading(false);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password?: string) => {
    try {
      setIsLoading(true);
      setProfile(null);
      const { error } = password
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ email });

      if (error) setIsLoading(false);
      // On success, onAuthStateChange will fire and handle the rest
      return { error };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, full_name: string, password?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = password
        ? await supabase.auth.signUp({
          email,
            password,
          options: { data: { full_name } }
          })
        : await supabase.auth.signInWithOtp({ email });

      if (!error && data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name
        });
      }

      if (error) setIsLoading(false);
      return { error };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { }
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsLoading(false);
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
