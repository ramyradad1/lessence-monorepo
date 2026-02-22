"use client";

import React from "react";
import { useAdminDiagnostics, SystemLog } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { Activity, AlertTriangle, Clock, ServerCrash, RefreshCw, Filter } from "lucide-react";

export default function DiagnosticsPage() {
  const {
    logs,
    loading,
    error,
    filterLevel,
    setFilterLevel,
    filterSource,
    setFilterSource,
    refresh
  } = useAdminDiagnostics(supabase);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'warn': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'perf': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-white/60 bg-white/5 border-white/10';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <ServerCrash size={16} />;
      case 'warn': return <AlertTriangle size={16} />;
      case 'perf': return <Clock size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display text-white mb-2">System Diagnostics</h1>
          <p className="text-white/40">Monitor performance and error logs across the platform.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-dark border border-white/5 rounded-lg px-3 py-2">
            <Filter size={16} className="text-white/40" />
            <select
              title="Filter by log level"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="error">Errors</option>
              <option value="warn">Warnings</option>
              <option value="perf">Performance</option>
              <option value="info">Info</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-surface-dark border border-white/5 rounded-lg px-3 py-2">
            <Filter size={16} className="text-white/40" />
            <select
              title="Filter by log source"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              <option value="all">All Sources</option>
              <option value="web-client">Web Client</option>
              <option value="mobile-client">Mobile Client</option>
              <option value="edge-function">Edge Functions</option>
            </select>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-red-500 font-display text-lg mb-2">Failed to load diagnostics</h3>
          <p className="text-red-400/80 text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-white/40">Timestamp</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-white/40">Level</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-white/40">Source</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-white/40">Action</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-white/40">Duration</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-white/40">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/40">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-4 opacity-50" />
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/40 font-light italic">
                      No logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: SystemLog) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-sm text-white/60 whitespace-nowrap">
                        {formatTime(log.created_at)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getLevelColor(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-white/80">{log.source}</td>
                      <td className="p-4 text-sm font-medium text-white">{log.action}</td>
                      <td className="p-4 text-sm text-white/60">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-white/80 line-clamp-2 max-w-md">
                          {log.message}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2 text-xs">
                            <summary className="text-primary/70 hover:text-primary cursor-pointer select-none">Show Metadata</summary>
                            <pre className="mt-2 p-3 bg-black/40 rounded border border-white/5 text-white/50 overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
