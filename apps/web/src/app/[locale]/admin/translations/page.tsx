'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type MissingTranslationNode = {
  id: string;
  type: 'product' | 'category' | 'brand';
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
};

export default function AdminTranslationsPage() {
  const [missingNodes, setMissingNodes] = useState<MissingTranslationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMissingTranslations();
  }, []);

  const fetchMissingTranslations = async () => {
    setLoading(true);
    try {
      // Products
      const { data: products } = await supabase
        .from('products')
        .select('id, name_en, name_ar, description_en, description_ar')
        .or('name_ar.is.null,name_ar.eq."",description_ar.is.null,description_ar.eq.""');

      // Categories
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name_en, name_ar, description_en, description_ar')
        .or('name_ar.is.null,name_ar.eq."",description_ar.is.null,description_ar.eq.""');

      // Brands
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name_en, name_ar, description_en, description_ar')
        .or('name_ar.is.null,name_ar.eq."",description_ar.is.null,description_ar.eq.""');

      const combined: MissingTranslationNode[] = [];
      
      if (products) {
        combined.push(...products.map(p => ({ ...p, type: 'product' as const })));
      }
      if (categories) {
        combined.push(...categories.map(c => ({ ...c, type: 'category' as const })));
      }
      if (brands) {
        combined.push(...brands.map(b => ({ ...b, type: 'brand' as const })));
      }

      setMissingNodes(combined);
    } catch (err) {
      console.error('Error fetching missing translations', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (id: string, field: string, value: string) => {
    setMissingNodes(prev => prev.map(node => node.id === id ? { ...node, [field]: value } : node));
  };

  const saveTranslation = async (node: MissingTranslationNode) => {
    setSavingId(node.id);
    let tableName = '';
    if (node.type === 'product') tableName = 'products';
    if (node.type === 'category') tableName = 'categories';
    if (node.type === 'brand') tableName = 'brands';

    try {
      await supabase.from(tableName).update({
        name_ar: node.name_ar || null,
        description_ar: node.description_ar || null
      }).eq('id', node.id);
      
      // If fully translated, remove from list visually
      if (node.name_ar && node.description_ar) {
        setMissingNodes(prev => prev.filter(n => n.id !== node.id));
      }
    } catch (err) {
      console.error('Save translation error', err);
    } finally {
      setSavingId(null);
    }
  };

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40 transition-colors";

  return (
    <div className="space-y-6 max-w-6xl pb-20">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Missing Translations</h1>
          <p className="text-fg-muted text-sm mt-1">Review and add missing Arabic translations across catalog items.</p>
        </div>
        <button onClick={fetchMissingTranslations} className="px-4 py-2 border border-white/10 rounded-xl text-sm font-medium text-white hover:bg-white/5 transition-colors">
          Refresh List
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : missingNodes.length === 0 ? (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-12 text-center space-y-3">
          <div className="text-4xl">🎉</div>
          <h3 className="text-lg font-bold text-white">All Caught Up!</h3>
          <p className="text-fg-muted text-sm">Every active product, category, and brand has Arabic translations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missingNodes.map(node => (
            <div key={`${node.type}-${node.id}`} className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded text-[#f4c025]">
                    {node.type}
                  </span>
                  <span className="text-sm font-medium text-fg-muted">ID: {node.id.substring(0, 8)}...</span>
                </div>
                <button 
                  onClick={() => saveTranslation(node)}
                  disabled={savingId === node.id || (!node.name_ar && !node.description_ar)}
                  className="px-4 py-1.5 bg-[#f4c025]/10 text-[#f4c025] hover:bg-[#f4c025]/20 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
                >
                  {savingId === node.id ? 'Saving...' : 'Save Translations'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-fg-muted uppercase tracking-widest block mb-2">Original English</span>
                    <div className="bg-[#181611] border border-white/5 rounded-xl p-4">
                      <h4 className="font-bold text-white">{node.name_en || 'Unnamed'}</h4>
                      <p className="text-sm text-fg-muted mt-1">{node.description_en || 'No description provided'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-[#f4c025]/70 uppercase tracking-widest block mb-2">Arabic Translation</span>
                    <div className="space-y-3">
                      <div>
                        <input
                          dir="rtl"
                          placeholder="الاسم بالعربية"
                          value={node.name_ar || ''}
                          onChange={e => handleUpdate(node.id, 'name_ar', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <textarea
                          dir="rtl"
                          rows={3}
                          placeholder="الوصف بالعربية"
                          value={node.description_ar || ''}
                          onChange={e => handleUpdate(node.id, 'description_ar', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
