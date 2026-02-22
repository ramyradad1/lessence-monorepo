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
  const profileFetchRef = useRef<string | null>(null); // track in-flight profile fetch

  const fetchProfile = useCallback(async (userId: string) => {
    // Prevent duplicate parallel fetches for the same user
    if (profileFetchRef.current === userId) return;
    profileFetchRef.current = userId;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!mountedRef.current) return;

      if (!error && data) {
        setProfile(data);
      } else if (error && error.code === 'PGRST116') {
        // No profile found, create a stub
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
          
        if (!insertError && inserted && mountedRef.current) {
          setProfile(inserted as Profile);
        }
      } else {
        console.error('[Auth] Error fetching profile:', error?.message);
      }
    } catch (err) {
      console.error('[Auth] Exception fetching profile:', err);
    } finally {
      profileFetchRef.current = null;
      if (mountedRef.current) setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    mountedRef.current = true;

    // Safety timeout: force loading to false after 10s no matter what
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 10000);

    // Use onAuthStateChange as the SINGLE source of truth
    // This handles both initial session and subsequent changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mountedRef.current) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          // Fetch profile (the function handles dedup)
          await fetchProfile(currentSession.user.id);
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
      setProfile(null); // Clear old profile
      const { data, error } = password 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ email });

      if (error) {
        setIsLoading(false);
      }
      // Don't set isLoading=false on success — let onAuthStateChange → fetchProfile handle it
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
            options: {
              data: { full_name }
            }
          })
        : await supabase.auth.signInWithOtp({ email });
        
      if (!error && data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name
        });
      }

      if (error) {
        setIsLoading(false);
      }
      return { error };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch { }
    // Explicitly clear state regardless of signOut result
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
