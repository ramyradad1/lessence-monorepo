'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminProducts } from '@lessence/supabase';
import { Product } from '@lessence/core';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { categories } = useAdminProducts(supabase);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string; subtitle: string; description: string; price: number; sku: string;
    image_url: string; is_active: boolean; is_new: boolean; category_id: string;
    low_stock_threshold: number;
  }>({
    name: '', subtitle: '', description: '', price: 0, sku: '',
    image_url: '', is_active: true, is_new: false, category_id: '',
    low_stock_threshold: 5
  });

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
      if (!error && data) {
        setProduct(data);
        setForm({
          name: data.name, subtitle: data.subtitle || '', description: data.description || '',
          price: data.price, sku: data.sku || '', image_url: data.image_url || '',
          is_active: data.is_active, is_new: data.is_new, category_id: data.category_id,
          low_stock_threshold: data.low_stock_threshold ?? 5
        });
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('products').update(form).eq('id', productId);
    setSaving(false);
    router.push('/admin/products');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <p className="text-white/40 text-center py-12">Product not found</p>;
  }

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors";

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => router.push('/admin/products')} className="text-sm text-white/40 hover:text-white">← Back to Products</button>
      <h1 className="text-2xl font-bold text-white">Edit Product</h1>

      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Name</label>
          <input title="Product name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Subtitle</label>
          <input title="Product subtitle" value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Description</label>
          <textarea title="Product description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Price</label>
            <input title="Product price" type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">SKU</label>
            <input title="Product SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Image URL</label>
          <input title="Product image URL" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Category</label>
          <select title="Product category" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className={inputClass}>
            <option value="" className="bg-[#1e1b16]">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id} className="bg-[#1e1b16]">{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-white/40 mb-1 block uppercase tracking-wider">Low Stock Threshold</label>
          <input
            title="Low stock threshold"
            type="number"
            value={form.low_stock_threshold}
            onChange={e => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} className="accent-[#f4c025]" />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
            <input type="checkbox" checked={form.is_new} onChange={e => setForm({...form, is_new: e.target.checked})} className="accent-[#f4c025]" />
            New Badge
          </label>
        </div>
        <button onClick={handleSave} disabled={saving} className="w-full bg-[#f4c025] text-black h-12 rounded-xl font-bold hover:bg-[#f4c025]/90 transition-all disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
