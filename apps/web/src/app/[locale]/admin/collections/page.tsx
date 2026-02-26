'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminCollections, Collection } from '@lessence/supabase';

const EMPTY_COLLECTION = { name_en: '', name_ar: '', description_en: '', description_ar: '', sort_order: 0, is_active: true, show_on_homepage: false, is_smart: false };

export default function AdminCollectionsPage() {
  const { collections, loading, createCollection, updateCollection, toggleCollectionActive, deleteCollection } = useAdminCollections(supabase);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Collection>>(EMPTY_COLLECTION);
  const [saving, setSaving] = useState(false);

  // Smart collection rule builder state
  const [rules, setRules] = useState<{field: string; operator: string; value: string}[]>([]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_COLLECTION);
    setRules([]);
    setShowForm(true);
  };

  const openEdit = (collection: Collection) => {
    setEditingId(collection.id);
    setForm({
      name_en: collection.name_en,
      name_ar: collection.name_ar,
      description_en: collection.description_en || '',
      description_ar: collection.description_ar || '',
      sort_order: collection.sort_order || 0,
      is_active: collection.is_active,
      show_on_homepage: collection.show_on_homepage,
      is_smart: collection.is_smart,
    });
    setRules(collection.smart_rules || []);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name_en: form.name_en || '',
      name_ar: form.name_ar || '',
      description_en: form.description_en,
      description_ar: form.description_ar,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
      show_on_homepage: form.show_on_homepage,
      is_smart: form.is_smart,
      smart_rules: form.is_smart ? rules : null,
    };

    let result;
    if (editingId) {
      result = await updateCollection(editingId, payload);
    } else {
      result = await createCollection(payload);
    }

    if (!result.success) {
      alert('Error saving collection: ' + result.error);
    } else {
      setShowForm(false);
      setForm(EMPTY_COLLECTION);
      setRules([]);
      setEditingId(null);
    }
    
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    const result = await deleteCollection(id);
    if (!result.success) {
      alert('Error deleting collection: ' + result.error);
    }
  };

  const addRule = () => {
    setRules([...rules, { field: 'is_new', operator: '=', value: 'true' }]);
  };

  const updateRule = (index: number, key: 'field' | 'operator' | 'value', value: string) => {
    const nextR = [...rules];
    nextR[index][key] = value;
    setRules(nextR);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Collections</h1>
          <p className="text-fg-muted text-sm mt-1">{collections.length} collections</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90">
          + New Collection
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider">
            {editingId ? 'Edit Collection' : 'Create Collection'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Name (EN) *</label>
              <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} placeholder="Summer Collection" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Name (AR) *</label>
              <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="مجموعة الصيف" className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Description (EN)</label>
              <input value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} placeholder="Description" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Description (AR)</label>
              <input value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} placeholder="الوصف" className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="text-xs text-fg-muted mb-1 block">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} placeholder="0" className={inputClass} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 mt-2 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded bg-[#181611] border-white/10 text-[#f4c025] focus:ring-[#f4c025]" />
              <label htmlFor="is_active" className="text-sm text-fg">Active</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="show_on_homepage" checked={form.show_on_homepage} onChange={e => setForm({ ...form, show_on_homepage: e.target.checked })} className="rounded bg-[#181611] border-white/10 text-[#f4c025] focus:ring-[#f4c025]" />
              <label htmlFor="show_on_homepage" className="text-sm text-fg">Show on Homepage</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_smart" checked={form.is_smart} onChange={e => setForm({ ...form, is_smart: e.target.checked })} className="rounded bg-[#181611] border-white/10 text-[#f4c025] focus:ring-[#f4c025]" />
              <label htmlFor="is_smart" className="text-sm text-fg font-bold">Is Smart Collection?</label>
            </div>
          </div>

          {form.is_smart && (
            <div className="mt-4 p-4 border border-white/5 bg-[#181611] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fg-muted">Smart Rules</h3>
                <button onClick={addRule} className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">+ Add Rule</button>
              </div>
              {rules.length === 0 ? (
                <div className="text-xs text-fg-faint italic pb-2">No rules configured. All active products will be included. Add a rule to filter products.</div>
              ) : (
                rules.map((rule, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center">
                    <select title="Field" className={`${inputClass} !py-2`} value={rule.field} onChange={e => updateRule(idx, 'field', e.target.value)}>
                      <option value="is_new">Is New</option>
                      <option value="price">Price</option>
                      <option value="category_id">Category ID</option>
                      <option value="brand_id">Brand ID</option>
                    </select>
                    <select title="Operator" className={`${inputClass} !py-2 w-full sm:w-24`} value={rule.operator} onChange={e => updateRule(idx, 'operator', e.target.value)}>
                      <option value="=">Equals</option>
                      <option value="!=">Not Eq</option>
                      <option value="<">Less &lt;</option>
                      <option value=">">Grter &gt;</option>
                    </select>
                    <input className={`${inputClass} !py-2`} value={rule.value} onChange={e => updateRule(idx, 'value', e.target.value)} placeholder="Value (e.g. true)" />
                    <button onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-300 p-2">✕</button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-sm text-fg-muted hover:text-white px-4 py-2">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name_en || !form.name_ar}
              className="px-5 py-2 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Collections Table */}
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
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Flags</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {collections.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-fg-faint">No collections found</td></tr>
                )}
                {collections.map(col => (
                  <tr key={col.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-fg-muted">{col.sort_order}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{col.name_en}</div>
                      <div className="text-xs text-fg-muted" dir="rtl">{col.name_ar}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-muted font-mono">{col.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${col.is_smart ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {col.is_smart ? 'Smart' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {col.show_on_homepage && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#f4c025]/10 text-[#f4c025] border border-[#f4c025]/20">
                          Homepage
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleCollectionActive(col.id, !col.is_active)}
                        className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border ${col.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                      >
                        {col.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(col)} className="text-xs text-[#f4c025] hover:underline">Edit</button>
                        <button onClick={() => handleDelete(col.id)} className="text-xs text-red-400 hover:underline">Delete</button>
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
