"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, RefreshCw, User } from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  admin_user?: {
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    // Note: Due to limitations with auth.users JOINs in some Supabase setups, 
    // we may just display the admin_id if email is inaccessible directly.
    const { data } = await supabase
      .from('admin_audit_logs')
      .select('*, admin_user:admin_id(email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      setLogs(data);
    } else {
      // Fallback if JOIN fails on auth.users for this specific setup
      const { data: fallbackData } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (fallbackData) setLogs(fallbackData);
    }
    setLoading(false);
  };

  const formatTime = (isoString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(isoString));
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-sans text-white mb-2">Audit Logs</h1>
          <p className="text-fg-muted">Track configuration and content changes made by administrators.</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 bg-surface-dark border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Timestamp</th>
                <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Admin</th>
                <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Action</th>
                <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Entity Filter</th>
                <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted w-1/3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-fg-muted">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-4 opacity-50" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-fg-muted italic">
                    No recent audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm text-fg-muted whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        {formatTime(log.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-fg">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-fg-muted" />
                        <span className="truncate max-w-[150px]" title={log.admin_id}>
                          {log.admin_id.split('-')[0]}...
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-fg-muted">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                    </td>
                    <td className="p-4">
                      <div className="max-w-[300px] lg:max-w-md">
                        {log.new_data && (
                          <details className="text-xs">
                            <summary className="text-primary/70 hover:text-primary cursor-pointer select-none">View Changes</summary>
                            <pre className="mt-2 p-3 bg-black/40 rounded border border-white/5 text-fg-muted overflow-x-auto max-h-48">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
