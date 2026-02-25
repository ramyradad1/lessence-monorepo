'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminBundles, useAdminProducts } from '@lessence/supabase';
import { Bundle } from '@lessence/core';

type BundleFormItem = { product_id: string; variant_id?: string; quantity: number };
type BundleItemField = 'product_id' | 'variant_id' | 'quantity';
type ProductVariantOption = { id: string; size?: string | null; concentration?: string | null };
type ProductWithVariants = { variants?: ProductVariantOption[] };

import { useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';

export default function AdminBundlesPage() {
  const locale = useLocale();
  const { bundles, loading, createBundle, updateBundle, deleteBundle } = useAdminBundles(supabase);
  const { products } = useAdminProducts(supabase);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [bundleItems, setBundleItems] = useState<BundleFormItem[]>([]);

  const handleOpenModal = (bundle?: Bundle) => {
    if (bundle) {
      setSelectedBundle(bundle);
      setName(bundle.name);
      setSlug(bundle.slug);
      setDescription(bundle.description || '');
      setPrice(bundle.price.toString());
      setIsActive(bundle.is_active);
      setBundleItems(bundle.items?.map(i => ({
         product_id: i.product_id,
         variant_id: i.variant_id,
         quantity: i.quantity
      })) || []);
    } else {
      setSelectedBundle(null);
      setName('');
      setSlug('');
      setDescription('');
      setPrice('');
      setIsActive(true);
      setBundleItems([]);
    }
    setIsModalOpen(true);
  };

  const addItem = () => {
    setBundleItems([...bundleItems, { product_id: '', quantity: 1 }]);
  };

  const updateItem = (index: number, field: BundleItemField, value: string | number) => {
    const newItems = [...bundleItems];
    const currentItem = newItems[index];
    if (!currentItem) return;

    if (field === 'quantity') {
      currentItem.quantity = typeof value === 'number' ? value : parseInt(String(value), 10) || 1;
    } else if (field === 'variant_id') {
      const nextValue = String(value);
      currentItem.variant_id = nextValue || undefined;
    } else {
      currentItem.product_id = String(value);
      // If product changed, reset variant
      currentItem.variant_id = undefined;
    }
    setBundleItems(newItems);
  };

  const removeItem = (index: number) => {
    setBundleItems(bundleItems.filter((_, i) => i !== index));
  };


  const handleSave = async () => {
    // validation
    if (!name || !slug || !price) {
        alert('Name, Slug, and Price are required.');
        return;
    }
    if (bundleItems.some(i => !i.product_id || i.quantity <= 0)) {
         alert('Please ensure all bundle items have a selected product and valid quantity.');
         return;
    }

    const bundleData = {
      name,
      slug,
      description,
      price: parseFloat(price),
      is_active: isActive
    };

    if (selectedBundle) {
      const res = await updateBundle(selectedBundle.id, bundleData, bundleItems);
      if (res.success) {
         setIsModalOpen(false);
      } else {
         alert(res.error);
      }
    } else {
      const res = await createBundle(bundleData, bundleItems);
       if (res.success) {
         setIsModalOpen(false);
      } else {
         alert(res.error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Gift Set?')) {
      await deleteBundle(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[#1e1b16] p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Gift Sets</h1>
          <p className="text-sm text-white/50 mt-1">Manage bundled products and special sets</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#f4c025] text-black px-6 py-2.5 rounded-full font-medium hover:bg-white transition-colors flex items-center gap-2"
        >
          <span>🎁</span> Create Set
        </button>
      </div>

      <div className="bg-[#1e1b16] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-white/40 uppercase bg-black/20 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Name</th>
                <th className="px-6 py-4 font-medium tracking-wider">Items</th>
                <th className="px-6 py-4 font-medium tracking-wider">Price</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-white/5">
              {bundles.map((bundle) => (
                <tr key={bundle.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{bundle.name}</div>
                    <div className="text-xs text-white/40 font-mono mt-0.5">{bundle.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/70">
                        {bundle.items?.length || 0} component{(bundle.items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#f4c025] font-medium">{formatCurrency(bundle.price, locale)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      bundle.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/40'
                    }`}>
                      {bundle.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button
                        onClick={() => handleOpenModal(bundle)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(bundle.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bundles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">
                    No gift sets created yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e1b16] rounded-2xl border border-white/5 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">
                {selectedBundle ? 'Edit Gift Set' : 'Create Gift Set'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bundle-name" className="block text-sm font-medium text-white/70 mb-1.5 cursor-pointer">Name</label>
                  <input
                    id="bundle-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (!selectedBundle) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="bundle-slug" className="block text-sm font-medium text-white/70 mb-1.5 cursor-pointer">Slug</label>
                  <input
                    id="bundle-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#f4c025] transition-colors font-mono text-sm"
                  />
                </div>
              </div>
              
               <div>
                <label htmlFor="bundle-description" className="block text-sm font-medium text-white/70 mb-1.5 cursor-pointer">Description</label>
                  <textarea
                  id="bundle-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                     className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label htmlFor="bundle-price" className="block text-sm font-medium text-white/70 mb-1.5 cursor-pointer">Price ($)</label>
                    <input
                    id="bundle-price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.01"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#f4c025] transition-colors"
                    />
                  </div>
                   <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-black/40 text-[#f4c025] focus:ring-[#f4c025] focus:ring-offset-0"
                      />
                      <span className="text-sm font-medium text-white/70">Active</span>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4">
                     <div className="flex justify-between items-center">
                        <label className="block text-sm font-bold text-white tracking-wider uppercase">Set Components</label>
                        <button onClick={addItem} className="text-xs text-[#f4c025] font-medium hover:text-white transition-colors">
                            + Add Item
                        </button>
                     </div>

                     <div className="space-y-3">
                         {bundleItems.map((item, index) => {
                             const product = products.find(p => p.id === item.product_id);
                             const variants = ((product as ProductWithVariants | undefined)?.variants ?? []) as ProductVariantOption[];

                             return (
                                 <div key={index} className="flex gap-3 items-start bg-black/20 p-3 rounded-xl border border-white/5">
                                    <div className="flex-1 space-y-3">
                                        <select
                                            value={item.product_id}
                                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                     aria-label="Select product"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f4c025]"
                                        >
                                            <option value="">Select Product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        
                                        {variants.length > 0 && (
                                            <select
                                                value={item.variant_id || ''}
                                                onChange={(e) => updateItem(index, 'variant_id', e.target.value)}
                                       aria-label="Select variant"
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f4c025]"
                                            >
                                                <option value="">Select Variant (Optional)</option>
                                                {variants.map((v) => (
                                                    <option key={v.id} value={v.id}>{v.size} {v.concentration ? `- ${v.concentration}` : ''}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                            min="1"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f4c025]"
                                            placeholder="Qty"
                                        />
                                    </div>
                                     <button
                                        onClick={() => removeItem(index)}
                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors mt-0.5"
                                      >
                                        ✕
                                      </button>
                                 </div>
                             );
                         })}
                          {bundleItems.length === 0 && (
                            <div className="text-sm text-white/40 text-center py-4 bg-black/20 rounded-xl border border-white/5 border-dashed">
                                No components added yet.
                            </div>
                        )}
                     </div>
                </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-[#f4c025] text-black px-6 py-2.5 rounded-full font-medium hover:bg-white transition-colors"
              >
                Save Gift Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
