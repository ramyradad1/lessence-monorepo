'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminReturnRequests } from '@lessence/supabase';
import { RotateCcw, Search, Filter, Eye, Clock, CheckCircle, XCircle, Package, Landmark } from 'lucide-react';
import { ReturnRequestStatus, ReturnRequest } from '@lessence/core';

const STATUS_ICONS: Record<string, any> = {
  requested: <Clock className="text-amber-500" size={16} />,
  approved: <CheckCircle className="text-blue-500" size={16} />,
  received: <Package className="text-indigo-500" size={16} />,
  refunded: <Landmark className="text-emerald-500" size={16} />,
  rejected: <XCircle className="text-rose-500" size={16} />,
};

const STATUS_LABELS: Record<string, string> = {
  requested: 'New Request',
  approved: 'Approved',
  received: 'Items Received',
  refunded: 'Refunded',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  received: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  refunded: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function AdminReturnsPage() {
  const router = useRouter();
  const { requests, loading } = useAdminReturnRequests(supabase);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnRequestStatus | 'all'>('all');

  const filteredRequests = (requests || []).filter((request: ReturnRequest) => {
    const matchesSearch = 
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      request.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
              <RotateCcw className="text-primary" />
              Return Requests
            </h1>
            <p className="text-zinc-400 mt-1">Manage customer returns and refunds</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              placeholder="Search by ID, Order # or Reason..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <select
              title="Filter by Status"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="refunded">Refunded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-zinc-500">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                <RotateCcw size={32} />
              </div>
              <p className="text-zinc-400 font-medium">No return requests found</p>
              <p className="text-zinc-500 text-sm mt-1">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Request ID</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Order #</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredRequests.map((request) => (
                    <tr 
                      key={request.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                        {request.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-white">
                          {request.order_number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-300 line-clamp-1 max-w-[200px]">
                          {request.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[request.status]}`}>
                          {STATUS_ICONS[request.status]}
                          {STATUS_LABELS[request.status]}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => router.push(`/admin/returns/${request.id}`)}
                          className="p-2 bg-white/5 hover:bg-primary/20 hover:text-primary rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
