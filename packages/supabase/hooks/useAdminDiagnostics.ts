"use client";

import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'perf';
  source: string;
  action: string;
  message: string;
  duration_ms: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useAdminDiagnostics(supabase: SupabaseClient) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterLevel !== 'all') {
        query = query.eq('level', filterLevel);
      }
      
      if (filterSource !== 'all') {
        query = query.eq('source', filterSource);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      setLogs(data as SystemLog[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [supabase, filterLevel, filterSource]);

  return {
    logs,
    loading,
    error,
    filterLevel,
    setFilterLevel,
    filterSource,
    setFilterSource,
    refresh: fetchLogs
  };
}
