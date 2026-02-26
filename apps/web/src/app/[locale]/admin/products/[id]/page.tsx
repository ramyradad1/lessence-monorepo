'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminProducts } from '@lessence/supabase';
import { ProductVariant } from '@lessence/core';
import Image from 'next/image';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { categories, saveProductFull } = useAdminProducts(supabase);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Need brands and collections too for the full form
  const [brands, setBrands] = useState<{ id: string, name_en: string }[]>([]);

  const [form, setForm] = useState<{
    name: string; name_ar: string;
    subtitle: string; subtitle_ar: string;
    description: string; description_ar: string;
    price: number; slug: string;
    image_url: string; images: string[];
    status: string; is_active: boolean; is_new: boolean; is_featured: boolean; is_sale: boolean;
    category_id: string; brand_id: string;
    tags: string; top_notes: string; heart_notes: string; base_notes: string;
  }>({
    name: '', name_ar: '', subtitle: '', subtitle_ar: '', description: '', description_ar: '',
    price: 0, slug: '', image_url: '', images: [],
    status: 'active', is_active: true, is_new: false, is_featured: false, is_sale: false,
    category_id: '', brand_id: '',
    tags: '', top_notes: '', heart_notes: '', base_notes: ''
  });

  const [variants, setVariants] = useState<ProductVariant[]>([]);

  useEffect(() => {
    const load = async () => {
      // Load brands
      const { data: bData } = await supabase.from('brands').select('id, name_en');
      if (bData) setBrands(bData);

      if (productId === 'new') {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('products').select('*, variants:product_variants(*)').eq('id', productId).single();
      if (!error && data) {
        setForm({
          name: data.name_en || data.name, name_ar: data.name_ar || '',
          subtitle: data.subtitle_en || data.subtitle || '', subtitle_ar: data.subtitle_ar || '',
          description: data.description_en || data.description || '', description_ar: data.description_ar || '',
          price: data.base_price || data.price, slug: data.slug || '', image_url: data.image_url || '', images: data.images || [],
          status: data.status || 'active', is_active: data.is_active, is_new: data.is_new, is_featured: data.is_featured, is_sale: data.is_sale,
          category_id: data.category_id || '', brand_id: data.brand_id || '',
          tags: (data.tags || []).join(', '),
          top_notes: (data.top_notes || []).join(', '),
          heart_notes: (data.heart_notes || []).join(', '),
          base_notes: (data.base_notes || []).join(', ')
        });
        setVariants(data.variants || []);
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const handleSave = async () => {
    setSaving(true);

    // Format arrays
    const tagsArr = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    const topNotesArr = form.top_notes.split(',').map(s => s.trim()).filter(Boolean);
    const heartNotesArr = form.heart_notes.split(',').map(s => s.trim()).filter(Boolean);
    const baseNotesArr = form.base_notes.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      p_product_id: productId === 'new' ? null : productId,
      p_category_id: form.category_id || null,
      p_brand_id: form.brand_id || null,
      p_slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      p_name_en: form.name,
      p_name_ar: form.name_ar,
      p_description_en: form.description,
      p_description_ar: form.description_ar,
      p_base_price: form.price,
      p_is_active: form.is_active,
      p_is_featured: form.is_featured,
      p_is_sale: form.is_sale,
      p_status: form.status,
      p_tags: tagsArr,
      p_top_notes: topNotesArr,
      p_heart_notes: heartNotesArr,
      p_base_notes: baseNotesArr,
      p_variants: variants
    };

    const res = await saveProductFull(payload);

    // Update simple fields that are outside the RPC
    if (res.success) {
      const pid = productId === 'new' ? res.productId : productId;
      await supabase.from('products').update({
        subtitle_en: form.subtitle,
        subtitle_ar: form.subtitle_ar,
        image_url: form.image_url,
        images: form.images.filter(Boolean)
      }).eq('id', pid);
    }

    setSaving(false);
    router.push('/admin/products');
  };

  const addVariant = () => {
    setVariants([...variants, {
      id: '', product_id: productId === 'new' ? '' : productId,
      sku: '', size_ml: 50, concentration: 'Eau de Parfum',
      concentration_en: 'Eau de Parfum', concentration_ar: 'ماء عطر',
      price: 0, stock_qty: 0, low_stock_threshold: 10, is_active: true, barcode: '', compare_at_price: undefined
    }]);
  };

  const updateVariant = (index: number, field: string, value: string | number | boolean | null | undefined) => {
    const newV = [...variants];
    newV[index] = { ...newV[index], [field]: value };
    setVariants(newV);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 transition-colors placeholder-white/20";
  const labelClass = "text-xs font-bold text-fg-muted mb-1.5 block uppercase tracking-wider";

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/admin/products')} className="text-sm text-fg-muted hover:text-white">← Back to Products</button>
        <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-[#f4c025] text-black rounded-xl font-bold hover:bg-[#f4c025]/90 transition-all disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Product'}
        </button>
      </div>

      <h1 className="text-2xl font-bold text-white">{productId === 'new' ? 'New Product' : 'Edit Product'}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">Core Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name (EN)</label>
                <input title="Name (EN)" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-right`}>Name (AR)</label>
                <input title="Name (AR)" placeholder="الاسم" dir="rtl" value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Subtitle (EN)</label>
                <input title="Subtitle (EN)" placeholder="Subtitle" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-right`}>Subtitle (AR)</label>
                <input title="Subtitle (AR)" placeholder="العنوان الفرعي" dir="rtl" value={form.subtitle_ar} onChange={e => setForm({ ...form, subtitle_ar: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Description (EN)</label>
                <textarea title="Description (EN)" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className={inputClass} />
              </div>
              <div>
                <label className={`${labelClass} text-right`}>Description (AR)</label>
                <textarea title="Description (AR)" placeholder="الوصف" dir="rtl" value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} rows={4} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Base Price</label>
                <input title="Base Price" placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Slug</label>
                <input title="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="Leave empty to auto-generate" />
              </div>
            </div>
          </div>

          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">Fragrance Profile</h2>
            <div>
              <label className={labelClass}>Top Notes (Comma separated)</label>
              <input value={form.top_notes} onChange={e => setForm({ ...form, top_notes: e.target.value })} className={inputClass} placeholder="Bergamot, Lemon..." />
            </div>
            <div>
              <label className={labelClass}>Heart Notes (Comma separated)</label>
              <input value={form.heart_notes} onChange={e => setForm({ ...form, heart_notes: e.target.value })} className={inputClass} placeholder="Rose, Jasmine..." />
            </div>
            <div>
              <label className={labelClass}>Base Notes (Comma separated)</label>
              <input value={form.base_notes} onChange={e => setForm({ ...form, base_notes: e.target.value })} className={inputClass} placeholder="Oud, Musk, Amber..." />
            </div>
            <div>
              <label className={labelClass}>Tags (Comma separated)</label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={inputClass} placeholder="summer, fresh, bestselling..." />
            </div>
          </div>

          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Variants & Inventory</h2>
              <button onClick={addVariant} className="text-sm text-[#f4c025] hover:text-[#f4c025]/80">+ Add Variant</button>
            </div>

            {variants.length === 0 ? (
              <p className="text-fg-muted text-sm text-center py-4">No variants added yet. Add at least one variant.</p>
            ) : (
              <div className="space-y-4">
                {variants.map((v, i) => (
                  <div key={i} className="p-4 border border-white/10 rounded-xl bg-[#181611] space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="font-bold text-white/70 text-sm">Variant {i + 1}</span>
                      <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={labelClass}>SKU</label>
                        <input title="SKU" placeholder="SKU" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Barcode</label>
                        <input title="Barcode" placeholder="Barcode" value={v.barcode || ''} onChange={e => updateVariant(i, 'barcode', e.target.value)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Size (ml)</label>
                        <input title="Size" placeholder="Size" type="number" value={v.size_ml} onChange={e => updateVariant(i, 'size_ml', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Price Adj.</label>
                        <input title="Price Adjustment" placeholder="Price Adjustment" type="number" value={v.price} onChange={e => updateVariant(i, 'price', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Compare At Price</label>
                        <input title="Compare At Price" placeholder="Compare At Price" type="number" value={v.compare_at_price || ''} onChange={e => updateVariant(i, 'compare_at_price', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Stock Qty</label>
                        <input title="Stock Quantity" placeholder="Stock Qty" type="number" value={v.stock_qty} onChange={e => updateVariant(i, 'stock_qty', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Low Stock AT</label>
                        <input title="Low Stock Threshold" placeholder="Low Stock" type="number" value={v.low_stock_threshold} onChange={e => updateVariant(i, 'low_stock_threshold', Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="flex items-center gap-2 pt-5">
                        <input type="checkbox" title="Active" checked={v.is_active} onChange={e => updateVariant(i, 'is_active', e.target.checked)} className="accent-[#f4c025]" />
                        <span className="text-sm text-white/70">Active</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Organization & Status */}
        <div className="space-y-6">
          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">Status & Visibility</h2>

            <div>
              <label className={labelClass}>Product Status</label>
              <select title="Product Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="active" className="bg-[#1e1b16]">Active</option>
                <option value="draft" className="bg-[#1e1b16]">Draft</option>
                <option value="hidden" className="bg-[#1e1b16]">Hidden</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 text-sm text-fg cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-[#f4c025] bg-transparent border-white/20" />
                Global Active Flag <span className="text-xs text-fg-faint ml-auto">(Legacy)</span>
              </label>
              <label className="flex items-center gap-3 text-sm text-fg cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 accent-[#f4c025] bg-transparent border-white/20" />
                Featured Product
              </label>
              <label className="flex items-center gap-3 text-sm text-fg cursor-pointer">
                <input type="checkbox" checked={form.is_sale} onChange={e => setForm({ ...form, is_sale: e.target.checked })} className="w-4 h-4 accent-[#f4c025] bg-transparent border-white/20" />
                On Sale
              </label>
              <label className="flex items-center gap-3 text-sm text-fg cursor-pointer">
                <input type="checkbox" checked={form.is_new} onChange={e => setForm({ ...form, is_new: e.target.checked })} className="w-4 h-4 accent-[#f4c025] bg-transparent border-white/20" />
                New Arrival
              </label>
            </div>
          </div>

          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">Organization</h2>

            <div>
              <label className={labelClass}>Category</label>
              <select title="Category" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
                <option value="" className="bg-[#1e1b16]">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#1e1b16]">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Brand</label>
              <select title="Brand" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })} className={inputClass}>
                <option value="" className="bg-[#1e1b16]">Select Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#1e1b16]">{b.name_en}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">Media</h2>
            <div>
              <label className={labelClass}>Primary Image URL</label>
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className={inputClass} placeholder="https://..." />
            </div>
            {form.image_url && (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-white/10 mt-2">
                <Image src={form.image_url} alt="Preview" fill unoptimized className="object-cover" />
              </div>
            )}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass}>Gallery URLs (One per line)</label>
              </div>
              <textarea
                rows={4}
                value={form.images.join('\n')}
                onChange={e => setForm({ ...form, images: e.target.value.split('\n').map(s => s.trim()) })}
                className={inputClass} 
                placeholder="https://...\nhttps://..." 
              />
            </div>
            {form.images.some(Boolean) && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {form.images.filter(Boolean).map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded overflow-hidden border border-white/10">
                    <Image src={img} alt={`Gallery ${idx}`} fill unoptimized className="object-cover" />
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
