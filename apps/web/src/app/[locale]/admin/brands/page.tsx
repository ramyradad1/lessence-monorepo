'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminBrands, Brand } from '@lessence/supabase';

const EMPTY_BRAND = { name_en: '', name_ar: '', description_en: '', description_ar: '', logo_url: '', sort_order: 0, is_active: true };

export default function AdminBrandsPage() {
  const { brands, loading, createBrand, updateBrand, toggleBrandActive, deleteBrand } = useAdminBrands(supabase);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Brand>>(EMPTY_BRAND);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_BRAND);
    setShowForm(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setForm({
      name_en: brand.name_en,
      name_ar: brand.name_ar,
      description_en: brand.description_en || '',
      description_ar: brand.description_ar || '',
      logo_url: brand.logo_url || '',
      sort_order: brand.sort_order || 0,
      is_active: brand.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name_en: form.name_en || '',
      name_ar: form.name_ar || '',
      description_en: form.description_en,
      description_ar: form.description_ar,
      logo_url: form.logo_url || undefined,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    let result;
    if (editingId) {
      result = await updateBrand(editingId, payload);
    } else {
      result = await createBrand(payload);
    }

    if (!result.success) {
      alert('Error saving brand: ' + result.error);
    } else {
      setShowForm(false);
      setForm(EMPTY_BRAND);
      setEditingId(null);
    }
    
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    const result = await deleteBrand(id);
    if (!result.success) {
      alert('Error deleting brand: ' + result.error);
    }
  };

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Brands</h1>
          <p className="text-fg-muted text-sm mt-1">{brands.length} brands</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90">
          + New Brand
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider">
            {editingId ? 'Edit Brand' : 'Create Brand'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Name (EN) *</label>
              <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="Chanel" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Name (AR) *</label>
              <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="شانيل" className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Description (EN)</label>
              <input value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Brand description" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Description (AR)</label>
              <input value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="وصف الماركة" className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Logo URL</label>
              <input value={form.logo_url || ''} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} placeholder="0" className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded bg-[#181611] border-white/10 text-[#f4c025] focus:ring-[#f4c025]" />
            <label htmlFor="is_active" className="text-sm text-white">Active</label>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-sm text-fg-muted hover:text-white px-4 py-2">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name_en || !form.name_ar}
              className="px-5 py-2 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Brands Table */}
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
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider w-16">Sort</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {brands.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-fg-faint">No brands found</td></tr>
                )}
                {brands.map(brand => (
                  <tr key={brand.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-fg-muted">{brand.sort_order}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{brand.name_en}</div>
                      <div className="text-xs text-fg-muted" dir="rtl">{brand.name_ar}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleBrandActive(brand.id, !brand.is_active)}
                        className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${brand.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                      >
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(brand)} className="text-xs text-[#f4c025] hover:underline">Edit</button>
                        <button onClick={() => handleDelete(brand.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
