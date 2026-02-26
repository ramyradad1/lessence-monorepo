"use client";

import React from "react";
import { useAdminDiagnostics, SystemLog } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { Activity, AlertTriangle, Clock, ServerCrash, RefreshCw, Filter, CheckCircle2, Box, FileText, Database } from "lucide-react";

export default function DiagnosticsPage() {
  const [storeStats, setStoreStats] = React.useState<{
    total_products: number;
    placeholder_products: number;
    missing_metadata_products: number;
    placeholder_categories: number;
    status: string;
  } | null>(null);
  const [checkingStore, setCheckingStore] = React.useState(true);

  React.useEffect(() => {
    fetchStoreStats();
  }, []);

  const fetchStoreStats = async () => {
    setCheckingStore(true);
    const { data } = await supabase.rpc('get_store_diagnostics');
    if (data) setStoreStats(data);
    setCheckingStore(false);
  };
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
      default: return 'text-fg-muted bg-white/5 border-white/10';
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
          <h1 className="text-3xl font-sans text-white mb-2">System Diagnostics</h1>
          <p className="text-fg-muted">Monitor performance and error logs across the platform.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-dark border border-white/5 rounded-lg px-3 py-2">
            <Filter size={16} className="text-fg-muted" />
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
            <Filter size={16} className="text-fg-muted" />
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

      {/* Store Content Health */}
      <h2 className="text-xl font-sans text-white mb-4 mt-8">Store Content Health</h2>
      {checkingStore ? (
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 mb-8 flex items-center justify-center">
          <RefreshCw className="animate-spin text-fg-muted" size={24} />
        </div>
      ) : storeStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-fg-muted mb-2">
              <Box size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Total Products</span>
            </div>
            <div className="text-3xl font-sans text-white">{storeStats.total_products}</div>
          </div>

          <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-yellow-500/80 mb-2">
              <FileText size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Placeholder Titles</span>
            </div>
            <div className="text-3xl font-sans text-white">{storeStats.placeholder_products + storeStats.placeholder_categories}</div>
            {storeStats.placeholder_products > 0 && <p className="text-xs text-yellow-500/60 mt-2">Replace dummy text in products/categories</p>}
          </div>

          <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-red-400 mb-2">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Missing Metadata</span>
            </div>
            <div className="text-3xl font-sans text-white">{storeStats.missing_metadata_products}</div>
            {storeStats.missing_metadata_products > 0 && <p className="text-xs text-red-400/60 mt-2">Products missing SKU or price</p>}
          </div>

          <div className="bg-surface-dark border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-fg-muted mb-2">
              <Database size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Overall Status</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {storeStats.status === 'healthy' ? (
                <>
                  <CheckCircle2 size={24} className="text-green-500" />
                  <span className="text-xl font-sans text-green-500">Healthy</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={24} className="text-yellow-500" />
                  <span className="text-xl font-sans text-yellow-500">Action Needed</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <h2 className="text-xl font-sans text-white mb-4">System Event Logs</h2>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <AlertTriangle size={32} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-red-500 font-sans text-lg mb-2">Failed to load diagnostics</h3>
          <p className="text-red-400/80 text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Timestamp</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Level</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Source</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Action</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Duration</th>
                  <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-fg-muted">
                      <RefreshCw size={24} className="animate-spin mx-auto mb-4 opacity-50" />
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-fg-muted font-light italic">
                      No logs found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: SystemLog) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-sm text-fg-muted whitespace-nowrap">
                        {formatTime(log.created_at)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getLevelColor(log.level)}`}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-fg">{log.source}</td>
                      <td className="p-4 text-sm font-medium text-white">{log.action}</td>
                      <td className="p-4 text-sm text-fg-muted">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-fg line-clamp-2 max-w-md">
                          {log.message}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2 text-xs">
                            <summary className="text-primary/70 hover:text-primary cursor-pointer select-none">Show Metadata</summary>
                            <pre className="mt-2 p-3 bg-black/40 rounded border border-white/5 text-fg-muted overflow-x-auto">
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
