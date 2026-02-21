"use client";
import { AuthProvider } from '@lessence/supabase';
import { supabase } from '@/lib/supabase';
import React from 'react';

export default function WebAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider supabase={supabase}>{children}</AuthProvider>;
}
