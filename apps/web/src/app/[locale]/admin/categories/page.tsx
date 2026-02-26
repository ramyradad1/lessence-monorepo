'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminCategories } from '@lessence/supabase';
import { Category } from '@lessence/core';

const EMPTY_CATEGORY = { name_en: '', name_ar: '', description_en: '', description_ar: '', image_url: '', icon: '', sort_order: 0, is_active: true };

export default function AdminCategoriesPage() {
  const { categories, loading, createCategory, updateCategory, toggleCategoryActive, deleteCategory } = useAdminCategories(supabase);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Category>>(EMPTY_CATEGORY);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_CATEGORY);
    setShowForm(true);
  };

  const openEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name_en: category.name_en,
      name_ar: category.name_ar,
      description_en: category.description_en || '',
      description_ar: category.description_ar || '',
      image_url: category.image_url || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active,
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
      image_url: form.image_url || undefined,
      icon: form.icon || undefined,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    let result;
    if (editingId) {
      result = await updateCategory(editingId, payload);
    } else {
      result = await createCategory(payload);
    }

    if (!result.success) {
      alert('Error saving category: ' + result.error);
    } else {
      setShowForm(false);
      setForm(EMPTY_CATEGORY);
      setEditingId(null);
    }
    
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    const result = await deleteCategory(id);
    if (!result.success) {
      alert('Error deleting category: ' + result.error);
    }
  };

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-fg-muted text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90">
          + New Category
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider">
            {editingId ? 'Edit Category' : 'Create Category'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Name (EN) *</label>
              <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="Fragrances" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Name (AR) *</label>
              <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="عطور" className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Description (EN)</label>
              <input value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Explore our fragrances" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Description (AR)</label>
              <input value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="اكتشف عطورنا" className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Image URL</label>
              <input value={form.image_url || ''} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Icon</label>
              <input value={form.icon || ''} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="Sparkles, Star, etc. or URL" className={inputClass} />
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

      {/* Categories Table */}
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
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-fg-faint">No categories found</td></tr>
                )}
                {categories.map(category => (
                  <tr key={category.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-fg-muted">{category.sort_order}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{category.name_en}</div>
                      <div className="text-xs text-fg-muted" dir="rtl">{category.name_ar}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-muted">{category.slug}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleCategoryActive(category.id, !category.is_active)}
                        className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${category.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(category)} className="text-xs text-[#f4c025] hover:underline">Edit</button>
                        <button onClick={() => handleDelete(category.id)} className="text-xs text-red-400 hover:underline">Delete</button>
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
