import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const mountedRef = useRef(true);

  // Profile fetched automatically via React Query when user.id is present
  const { data: profile = null, isLoading: isProfileLoading } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user!.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No profile found, create one
            const { data: userResp } = await supabase.auth.getUser();
            const newProfile = {
              id: user!.id,
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
    }
  });

  const isLoading = isAuthLoading || (!!user?.id && isProfileLoading);

  useEffect(() => {
    mountedRef.current = true;

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) setIsAuthLoading(false);
    }, 10000);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mountedRef.current) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setIsAuthLoading(false);
        } else {
          setSession(null);
          setUser(null);
          setIsAuthLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const queryClient = useQueryClient();

  const signIn = async (email: string, password?: string) => {
    try {
      setIsAuthLoading(true);
      const { error } = password
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithOtp({ email });

      if (error) setIsAuthLoading(false);
      // On success, onAuthStateChange will fire and handle the rest
      return { error };
    } catch (err: any) {
      setIsAuthLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, full_name: string, password?: string) => {
    try {
      setIsAuthLoading(true);
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

      if (error) setIsAuthLoading(false);
      return { error };
    } catch (err: any) {
      setIsAuthLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    console.log('useAuth: SignOut started');
    try {
      // Clear session from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) console.error('useAuth: Supabase signOut error', error);

      // Manual cleanup of cookies and storage as fallback
      if (typeof window !== 'undefined') {
        // Clear all cookies starting with sb- (Supabase auth cookies)
        document.cookie.split(";").forEach((c) => {
          const cookieName = c.split("=")[0].trim();
          if (cookieName.startsWith("sb-")) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });

        // Clear local storage items for good measure
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) localStorage.removeItem(key);
        });
      }
    } catch (err) {
      console.error('useAuth: SignOut exception', err);
    } finally {
      // ALWAYS clear local state regardless of Supabase result
      setUser(null);
      setSession(null);
      queryClient.removeQueries({ queryKey: ['profile'] });
      setIsAuthLoading(false);
      console.log('useAuth: SignOut completed, state cleared');
    }
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
