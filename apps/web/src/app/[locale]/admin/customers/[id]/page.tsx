'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminCustomers, CustomerDetail } from '@lessence/supabase';
import {
  ArrowLeft, User as UserIcon, Mail, Phone, Calendar, ShoppingBag,
  MapPin, StickyNote, Loader2, Trash2, Send
} from 'lucide-react';

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

export default function CustomerDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { fetchCustomerDetail, addNote, deleteNote } = useAdminCustomers(supabase);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    const data = await fetchCustomerDetail(customerId);
    setCustomer(data);
    setLoading(false);
  }, [customerId, fetchCustomerDetail]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    const { success, error } = await addNote(customerId, newNote.trim());
    if (success) {
      setNewNote('');
      await loadCustomer();
    } else {
      alert(error);
    }
    setSubmittingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    setDeletingNoteId(noteId);
    const { success, error } = await deleteNote(noteId);
    if (success) {
      await loadCustomer();
    } else {
      alert(error);
    }
    setDeletingNoteId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#f4c025]" />
      </div>
    );
  }

  if (!customer) {
    return <p className="text-white/40 text-center py-12">Customer not found</p>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button onClick={() => router.push('/admin/customers')} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      {/* Customer Header */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-[#f4c025]/10 flex items-center justify-center text-[#f4c025] shrink-0">
            {customer.avatar_url ? (
              <img src={customer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon size={28} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">{customer.full_name || 'Anonymous Customer'}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-white/50">
              <span className="flex items-center gap-1.5"><Mail size={14} /> {customer.email}</span>
              {customer.phone && <span className="flex items-center gap-1.5"><Phone size={14} /> {customer.phone}</span>}
              <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-[#f4c025]/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-[#f4c025]">{customer.total_orders}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Orders</div>
            </div>
            <div className="bg-[#f4c025]/10 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-bold text-[#f4c025]">{formatCurrency(Number(customer.total_spend), locale)}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Total Spend</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order History */}
          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShoppingBag size={14} /> Order History
            </h2>
            {customer.orders.length === 0 ? (
              <p className="text-white/20 text-sm py-4 text-center">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-2 text-xs font-semibold text-white/20 uppercase">Order</th>
                      <th className="pb-2 text-xs font-semibold text-white/20 uppercase">Status</th>
                      <th className="pb-2 text-xs font-semibold text-white/20 uppercase text-right">Total</th>
                      <th className="pb-2 text-xs font-semibold text-white/20 uppercase text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {customer.orders.map(order => (
                      <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4">
                          <a href={`/admin/orders/${order.id}`} className="text-sm font-medium text-white hover:text-[#f4c025] transition-colors">
                            {order.order_number}
                          </a>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-sm font-semibold text-white">{formatCurrency(Number(order.total_amount), locale)}</td>
                        <td className="py-3 text-right text-xs text-white/30">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Addresses + Notes */}
        <div className="space-y-6">
          {/* Addresses */}
          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} /> Addresses
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-white/20 text-sm py-2 text-center">No addresses saved</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map(addr => (
                  <div key={addr.id} className="bg-black/20 rounded-xl p-3 border border-white/5">
                    {addr.is_default && (
                      <span className="text-[10px] font-bold text-[#f4c025] uppercase tracking-wider">Default</span>
                    )}
                    <p className="text-sm text-white font-medium">{addr.full_name}</p>
                    <p className="text-xs text-white/50">{addr.address_line1}</p>
                    {addr.address_line2 && <p className="text-xs text-white/50">{addr.address_line2}</p>}
                    <p className="text-xs text-white/50">{addr.city}, {addr.state} {addr.postal_code}</p>
                    <p className="text-xs text-white/50">{addr.country}</p>
                    {addr.phone && (
                      <p className="text-xs text-white/30 mt-1 flex items-center gap-1"><Phone size={10} /> {addr.phone}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <StickyNote size={14} /> Admin Notes
            </h2>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="bg-[#f4c025] text-black p-2.5 rounded-xl hover:bg-[#f4c025]/90 transition-colors disabled:opacity-40"
                  title="Add note"
                >
                  {submittingNote ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </form>

            {/* Notes List */}
            {customer.notes.length === 0 ? (
              <p className="text-white/20 text-sm py-2 text-center">No notes yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {customer.notes.map(note => (
                  <div key={note.id} className="bg-black/20 rounded-xl p-3 border border-white/5 group relative">
                    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{note.note}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-white/20">
                        {note.admin_name || 'Admin'} · {new Date(note.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deletingNoteId === note.id}
                        className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-1"
                        title="Delete note"
                      >
                        {deletingNoteId === note.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
