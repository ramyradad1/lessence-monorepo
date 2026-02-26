'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminCoupons } from '@lessence/supabase';
import { Coupon } from '@lessence/core';
import { useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';

const EMPTY_COUPON = { code: '', discount_type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping', discount_amount: '', valid_from: '', valid_until: '', usage_limit: '' };

export default function AdminCouponsPage() {
  const { coupons, loading, createCoupon, updateCoupon, toggleCouponActive, deleteCoupon } = useAdminCoupons(supabase);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    code: string;
    discount_type: 'percentage' | 'fixed' | 'free_shipping';
    discount_amount: string;
    valid_from: string;
    valid_until: string;
    usage_limit: string;
  }>(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);
  const locale = useLocale();

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_COUPON);
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_amount: String(coupon.discount_amount),
      valid_from: coupon.valid_from?.split('T')[0] || '',
      valid_until: coupon.valid_until?.split('T')[0] || '',
      usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_amount: parseFloat(form.discount_amount) || 0,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
    };

    if (editingId) {
      await updateCoupon(editingId, payload);
    } else {
      await createCoupon(payload);
    }

    setShowForm(false);
    setForm(EMPTY_COUPON);
    setEditingId(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await deleteCoupon(id);
  };

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Coupons</h1>
          <p className="text-fg-muted text-sm mt-1">{coupons.length} coupons</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90">
          + New Coupon
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider">
            {editingId ? 'Edit Coupon' : 'Create Coupon'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Code</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="SUMMER2025" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Discount Type</label>
              <select title="Discount Type" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as Coupon['discount_type'] })} className={inputClass}>
                <option value="percentage" className="bg-[#1e1b16]">Percentage (%)</option>
                <option value="fixed" className="bg-[#1e1b16]">Fixed ($)</option>
                <option value="free_shipping" className="bg-[#1e1b16]">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Amount</label>
              <input type="number" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: e.target.value })} placeholder="10" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Usage Limit</label>
              <input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="100 (leave empty for unlimited)" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Valid From</label>
              <input type="date" title="Valid From" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Valid Until</label>
              <input type="date" title="Valid Until" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-sm text-fg-muted hover:text-white px-4 py-2">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.code || !form.discount_amount}
              className="px-5 py-2 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Valid Until</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {coupons.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-fg-faint">No coupons yet</td></tr>
                )}
                {coupons.map(coupon => {
                  const expired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                  return (
                    <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-bold text-white">{coupon.code}</td>
                      <td className="px-6 py-4 text-sm text-white">
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : coupon.discount_type === 'free_shipping' ? 'Free Shipping' : formatCurrency(Number(coupon.discount_amount), locale)}
                      </td>
                      <td className="px-6 py-4 text-sm text-fg-muted">
                        {coupon.times_used}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                      </td>
                      <td className="px-6 py-4 text-xs text-fg-faint">
                        {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : '∞'}
                        {expired && <span className="ml-1 text-red-400">(expired)</span>}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleCouponActive(coupon.id, !coupon.is_active)}
                          className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${coupon.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(coupon)} className="text-xs text-[#f4c025] hover:underline">Edit</button>
                          <button onClick={() => handleDelete(coupon.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
