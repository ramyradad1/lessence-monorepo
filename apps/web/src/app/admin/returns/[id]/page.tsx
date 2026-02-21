'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminReturnRequests } from '@lessence/supabase';
import { 
  RotateCcw, 
  ChevronLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Landmark, 
  MessageSquare, 
  Image as ImageIcon,
  User,
  Hash,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { ReturnRequest, ReturnRequestStatus } from '@lessence/core';

const STATUS_ICONS: Record<string, any> = {
  requested: <Clock size={20} />,
  approved: <CheckCircle size={20} />,
  received: <Package size={20} />,
  refunded: <Landmark size={20} />,
  rejected: <XCircle size={20} />,
};

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
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
export default function AdminReturnDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { fetchRequestDetail, updateRequestStatus, loading: updatingStatus } = useAdminReturnRequests(supabase);
  
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchRequestDetail(id as string);
        setRequest(data);
        setAdminNotes(data.admin_notes || '');
      } catch (err) {
        console.error('Error loading request detail:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, fetchRequestDetail]);

  const handleUpdateStatus = async (newStatus: ReturnRequestStatus) => {
    try {
      await updateRequestStatus(id as string, newStatus, adminNotes);
      const updated = await fetchRequestDetail(id as string);
      setRequest(updated);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!request) return;
    try {
      await updateRequestStatus(id as string, request.status, adminNotes);
      alert('Notes saved successfully');
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-8">
        <RotateCcw className="text-zinc-600 mb-4" size={48} />
        <h2 className="text-xl font-bold">Request not found</h2>
        <button 
          onClick={() => router.push('/admin/returns')}
          className="mt-4 text-primary hover:underline flex items-center gap-2"
        >
          <ChevronLeft size={16} /> Back to Returns
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <button 
          onClick={() => router.push('/admin/returns')}
          className="mb-6 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Return Requests
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${STATUS_COLORS[request.status]}`}>
              {STATUS_ICONS[request.status]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">Return Request</h1>
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[request.status]}`}>
                  {STATUS_LABELS[request.status]}
                </span>
              </div>
              <p className="text-zinc-400 font-mono text-xs mt-1">ID: {request.id}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select 
              title="Update Return Status"
              value={request.status}
              onChange={(e) => handleUpdateStatus(e.target.value as ReturnRequestStatus)}
              disabled={updatingStatus}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="requested">Set to Requested</option>
              <option value="approved">Approve Request</option>
              <option value="received">Mark as Received</option>
              <option value="refunded">Complete Refund</option>
              <option value="rejected">Reject Request</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Request Details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <MessageSquare size={14} />
                  Return Reason & Comments
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Reason</p>
                  <p className="text-white text-lg font-medium">{request.reason}</p>
                </div>
                {request.comment && (
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Customer Comment</p>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 italic text-zinc-300">
                      "{request.comment}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Returned Items */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <ShoppingBag size={14} />
                  Items for Return
                </h2>
              </div>
              <div className="divide-y divide-white/[0.05]">
                {request.items?.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <Package className="text-zinc-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.product_name}</p>
                        <p className="text-xs text-zinc-500">{item.selected_size} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Media */}
            {request.media_urls && request.media_urls.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <ImageIcon size={14} />
                    Photo Evidence
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {request.media_urls.map((url, index) => (
                    <a 
                      key={index} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="aspect-square bg-black/50 rounded-xl border border-white/10 overflow-hidden hover:border-primary/50 transition-colors group"
                    >
                      <img 
                        src={url} 
                        alt={`Evidence ${index + 1}`} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* Customer & Order Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <User size={12} /> Customer
                  </div>
                  <p className="text-sm font-bold text-white">{request.customer_name || 'Anonymous'}</p>
                  <p className="text-xs text-zinc-500">{request.customer_email}</p>
                </div>
                
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Hash size={12} /> Order Details
                  </div>
                  <button 
                    onClick={() => router.push(`/admin/orders/${request.order_id}`)}
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                  >
                    #{request.order_number}
                    <ExternalLink size={12} />
                  </button>
                  <p className="text-[10px] text-zinc-600 font-mono mt-1">{request.order_id}</p>
                </div>

                <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Clock size={12} /> Requested On
                  </div>
                  <p className="text-sm text-zinc-300">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Internal Notes</h2>
              </div>
              <div className="p-6">
                <textarea
                  className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors resize-none mb-3"
                  rows={6}
                  placeholder="Internal notes only可见..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                <button 
                  onClick={handleSaveNotes}
                  disabled={updatingStatus}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
