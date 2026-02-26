'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminOrders, OrderDetail } from '@lessence/supabase';
import { OrderStatus, OrderAdminNote } from '@lessence/core';
import OrderTimeline from '@/components/OrderTimeline';

const ALL_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

import { useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';

export default function OrderDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { fetchOrderDetail, updateOrderStatus, addOrderNote } = useAdminOrders(supabase);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrderDetail(orderId);
      setOrder(data);
      setLoading(false);
    };
    load();
  }, [orderId, fetchOrderDetail]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();
    await updateOrderStatus(orderId, newStatus, user?.id);
    const updated = await fetchOrderDetail(orderId);
    setOrder(updated);
    setUpdating(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !order) return;

    setAddingNote(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const result = await addOrderNote(orderId, newNote, user.id);
      if (result.success && result.note) {
        setOrder({
          ...order,
          admin_notes: [result.note, ...(order.admin_notes || [])]
        });
        setNewNote('');
      }
    }
    setAddingNote(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-fg-muted text-center py-12">Order not found</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.push('/admin/orders')} className="text-sm text-fg-muted hover:text-white">← Back to Orders</button>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{order.order_number}</h1>
          <p className="text-fg-faint text-sm mt-1">{order.customer_name || 'Guest'} {order.customer_email ? `(${order.customer_email})` : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={order.status}
            disabled={updating}
            onChange={e => handleStatusChange(e.target.value as OrderStatus)}
            title="Update order status"
            className="bg-[#1e1b16] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none disabled:opacity-50"
          >
            {ALL_STATUSES.map(s => (
              <option key={s} value={s} className="bg-[#1e1b16]">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <span className={`text-[11px] font-bold uppercase px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status]}`}>{order.status}</span>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-2">Order Progress</h2>
        <OrderTimeline currentStatus={order.status} history={order.status_history} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-4">Items</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white font-medium">{item.product_name}</p>
                  <p className="text-xs text-fg-faint">{item.selected_size} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-white">{formatCurrency((item.price * item.quantity), locale)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <span className="text-sm text-fg-muted">Total</span>
            <span className="text-lg font-bold text-[#f4c025]">{formatCurrency(Number(order.total_amount || 0), locale)}</span>
          </div>
        </div>

        {/* Payment & Address */}
        <div className="space-y-6">
          {order.payment && (
            <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-3">Payment</h2>
              <p className="text-sm text-white"><span className="text-fg-muted">Provider:</span> {order.payment.provider}</p>
              <p className="text-sm text-white"><span className="text-fg-muted">Status:</span> {order.payment.status}</p>
              {order.payment.transaction_id && (
                <p className="text-xs text-fg-faint mt-1 font-mono break-all">{order.payment.transaction_id}</p>
              )}
            </div>
          )}
          {order.address && (
            <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-3">Shipping Address</h2>
              <p className="text-sm text-white">{order.address.full_name}</p>
              <p className="text-sm text-fg-muted">{order.address.address_line1}</p>
              <p className="text-sm text-fg-muted">{order.address.city}, {order.address.state} {order.address.postal_code}</p>
              <p className="text-sm text-fg-muted">{order.address.country}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gift Details */}
      {order.is_gift && (
        <div className="bg-[#1e1b16] border border-[#f4c025]/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12V22H4V12" stroke="#f4c025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 7H2V12H22V7Z" stroke="#f4c025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22V7" stroke="#f4c025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="#f4c025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="#f4c025" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#f4c025] uppercase tracking-wider mb-4">Gift Information</h2>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">Gift Wrap Requested</p>
              <p className="text-sm text-white font-medium">{order.gift_wrap ? 'Yes, please wrap' : 'No'}</p>
            </div>
            {order.gift_message && (
              <div>
                <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">Gift Message</p>
                <div className="bg-black/30 p-4 rounded-xl border border-white/5 italic">
                  <p className="text-sm text-white/90 whitespace-pre-wrap">{order.gift_message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-4">Internal Admin Notes</h2>

        <form onSubmit={handleAddNote} className="mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an internal note..."
            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#f4c025] transition-colors resize-none mb-3"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addingNote || !newNote.trim()}
              className="bg-[#f4c025] text-black px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
            >
              {addingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {order.admin_notes && order.admin_notes.length > 0 ? (
            order.admin_notes.map((note: OrderAdminNote) => (
              <div key={note.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#f4c025] uppercase tracking-wider">{note.admin_name || 'Admin'}</span>
                  <span className="text-[10px] text-fg-faint">{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-fg whitespace-pre-wrap">{note.note}</p>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-fg-faint text-xs italic">No internal notes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
