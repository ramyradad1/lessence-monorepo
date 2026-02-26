"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, CheckCircle2, RefreshCw } from 'lucide-react';

interface Mapping {
  original_value: string;
  normalized_value_en: string;
  normalized_value_ar: string;
  isNew?: boolean;
}

export default function AdminVariantsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [mappings, setMappings] = useState<Mapping[]>([]);

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    const { data } = await supabase.from('variant_normalizations').select('*').order('created_at', { ascending: true });
    if (data) {
      setMappings(data);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setMappings([...mappings, { original_value: '', normalized_value_en: '', normalized_value_ar: '', isNew: true }]);
  };

  const handleUpdate = (index: number, field: keyof Mapping, value: string) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index], [field]: value };
    setMappings(updated);
  };

  const handleRemove = async (index: number) => {
    const mapping = mappings[index];
    if (!mapping.isNew && mapping.original_value) {
      await supabase.from('variant_normalizations').delete().eq('original_value', mapping.original_value);
    }
    const updated = [...mappings];
    updated.splice(index, 1);
    setMappings(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    // Filter out rows with empty original_value
    const validMappings = mappings.filter(m => m.original_value.trim() !== '');

    if (validMappings.length > 0) {
      // Need to separate new vs old to safely upsert, though Supabase upsert works well if PK is present
      const rowsToUpsert = validMappings.map(m => ({
        original_value: m.original_value,
        normalized_value_en: m.normalized_value_en,
        normalized_value_ar: m.normalized_value_ar,
      }));
      await supabase.from('variant_normalizations').upsert(rowsToUpsert, { onConflict: 'original_value' });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'UPDATE_VARIANT_MAPPINGS',
          entity_type: 'variant_normalizations',
          new_data: { count: rowsToUpsert.length }
        });
      }
    }

    setMessage('Variant mappings saved successfully');
    setSaving(false);
    fetchMappings();
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading && mappings.length === 0) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-sans text-white mb-2">Sizes Mapping</h1>
          <p className="text-fg-muted">Normalize varying size labels (e.g. &quot;Small&quot;, &quot;S&quot;, &quot;صغير&quot;) to consistent frontend display values.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchMappings}
            title="Refresh Mappings"
            aria-label="Refresh Mappings"
            className="flex items-center gap-2 bg-surface-dark border border-white/10 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Mappings
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <div className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Raw Input (DB/Stripe)</th>
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">English Display</th>
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted">Arabic Display</th>
              <th className="p-4 text-xs font-bold tracking-widest uppercase text-fg-muted text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mappings.map((mapping, index) => (
              <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <input
                    type="text"
                    value={mapping.original_value}
                    disabled={!mapping.isNew}
                    onChange={(e) => handleUpdate(index, 'original_value', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g. S"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    value={mapping.normalized_value_en}
                    onChange={(e) => handleUpdate(index, 'normalized_value_en', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="e.g. Small"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="text"
                    value={mapping.normalized_value_ar}
                    onChange={(e) => handleUpdate(index, 'normalized_value_ar', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none transition-colors"
                    placeholder="e.g. صغير"
                  />
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleRemove(index)}
                    className="p-2 text-fg-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Remove Mapping"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <button
            onClick={handleAdd}
            className="w-full py-3 border-2 border-dashed border-white/10 hover:border-white/30 text-fg-muted hover:text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            Add New Mapping
          </button>
        </div>
      </div>
    </div>
  );
}
