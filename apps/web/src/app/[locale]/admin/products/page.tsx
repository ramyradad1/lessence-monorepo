'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminProducts } from '@lessence/supabase';
import Image from 'next/image';

import { useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';

export default function AdminProductsPage() {
  const locale = useLocale();
  const {
    products, categories, loading,
    fetchProducts, createProduct, updateProduct,
    bulkUpdateProductStatus
  } = useAdminProducts(supabase);

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', name_ar: '', subtitle: '', subtitle_ar: '', description: '', description_ar: '', price: '', category_id: '', sku: '' });
  const [creating, setCreating] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchProducts(val || undefined);
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createProduct({
      name: newProduct.name,
      name_ar: newProduct.name_ar,
      subtitle: newProduct.subtitle,
      subtitle_ar: newProduct.subtitle_ar,
      description: newProduct.description,
      description_ar: newProduct.description_ar,
      price: parseFloat(newProduct.price) || 0,
      category_id: newProduct.category_id,
      sku: newProduct.sku,
      image_url: '',
      size_options: [],
      scent_profiles: [],
      rating: 0,
      review_count: 0,
      is_new: false,
      status: 'active'
    });

    if (!result.success) {
      alert('Error creating product: ' + result.error);
    } else {
      setNewProduct({ name: '', name_ar: '', subtitle: '', subtitle_ar: '', description: '', description_ar: '', price: '', category_id: '', sku: '' });
      setShowCreate(false);
    }
    setCreating(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!selectedProductIds.length) return;

    let is_active = true;
    let status = 'active';

    if (action === 'draft') {
      status = 'draft';
      is_active = false;
    } else if (action === 'hidden') {
      status = 'hidden';
      is_active = true;
    }

    if (['active', 'draft', 'hidden'].includes(action)) {
      await bulkUpdateProductStatus(selectedProductIds, status, is_active);
    } else if (action === 'set_sale') {
      for (const id of selectedProductIds) {
        await updateProduct(id, { is_sale: true });
      }
    } else if (action === 'unset_sale') {
      for (const id of selectedProductIds) {
        await updateProduct(id, { is_sale: false });
      }
    }

    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-fg-muted text-sm mt-1">{products.length} products</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New Product'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-fg-muted uppercase tracking-wider">Quick Create</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input title="Name (EN)" placeholder="Name (EN) *" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <input title="Name (AR)" dir="rtl" placeholder="Name (AR) *" value={newProduct.name_ar} onChange={e => setNewProduct({ ...newProduct, name_ar: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />

            <input title="Subtitle (EN)" placeholder="Subtitle (EN)" value={newProduct.subtitle} onChange={e => setNewProduct({ ...newProduct, subtitle: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <input title="Subtitle (AR)" dir="rtl" placeholder="Subtitle (AR)" value={newProduct.subtitle_ar} onChange={e => setNewProduct({ ...newProduct, subtitle_ar: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />

            <input title="Price" placeholder="Price *" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <input title="SKU" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />

            <select title="Category" value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
              className="col-span-1 sm:col-span-2 bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id} className="bg-[#1e1b16]">{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea title="Description (EN)" placeholder="Description (EN)" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              rows={2} className="w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <textarea title="Description (AR)" dir="rtl" placeholder="Description (AR)" value={newProduct.description_ar} onChange={e => setNewProduct({ ...newProduct, description_ar: e.target.value })}
              rows={2} className="w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCreate(false)} className="text-sm text-fg-muted hover:text-white px-4 py-2">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !newProduct.name || !newProduct.price}
              className="px-5 py-2 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#1e1b16] border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input
              title="Select All"
              type="checkbox"
              checked={products.length > 0 && selectedProductIds.length === products.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded appearance-none border border-white/20 checked:bg-[#f4c025] checked:border-[#f4c025] flex items-center justify-center relative after:content-[''] after:absolute after:hidden checked:after:block after:w-1.5 after:h-2.5 after:border-r-2 after:border-b-2 after:border-black after:rotate-45 after:-translate-y-0.5"
            />
            Select All
          </label>

          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#f4c025] font-semibold">{selectedProductIds.length} selected</span>
              <div className="h-4 w-px bg-white/10 mx-2" />
              <select
                title="Bulk Actions"
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-[#181611] text-sm text-white border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#f4c025]/50"
              >
                <option value="">Bulk Actions...</option>
                <option value="active">Set Active</option>
                <option value="draft">Set Draft</option>
                <option value="hidden">Set Hidden</option>
                <option value="set_sale">Mark as Sale</option>
                <option value="unset_sale">Remove Sale</option>
              </select>
            </div>
          )}
        </div>

        <input
          title="Search"
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="w-full sm:w-64 bg-[#181611] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => {
              const isSelected = selectedProductIds.includes(product.id);
              const missingTranslation = !product.name_ar || !product.description_ar;

              return (
                <div key={product.id} className={`bg-[#1e1b16] border rounded-2xl overflow-hidden transition-all ${isSelected ? 'border-[#f4c025] ring-1 ring-[#f4c025]/50' : product.status === 'draft' ? 'border-orange-500/20 opacity-60' : product.status === 'hidden' ? 'border-red-500/20 opacity-60' : 'border-white/5'}`}>
                  <div className="h-40 bg-white/5 relative group">
                    {/* Select Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        title="Select Product"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="w-5 h-5 rounded appearance-none border border-white/20 bg-black/50 backdrop-blur-sm checked:bg-[#f4c025] checked:border-[#f4c025] flex items-center justify-center cursor-pointer transition-all"
                      />
                    </div>

                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill unoptimized className={`object-cover ${isSelected ? 'opacity-80' : ''}`} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/10 text-4xl">
                        🧴
                        <span className="text-xs text-red-400 mt-2 font-mono bg-red-500/10 px-2 py-1 rounded">No Image</span>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {product.status !== 'active' && (
                        <span className={`text-[10px] font-bold uppercase text-white px-2 py-0.5 rounded-full ${product.status === 'draft' ? 'bg-orange-500/80' : 'bg-red-500/80'}`}>
                          {product.status || 'Inactive'}
                        </span>
                      )}
                      {product.is_new && (
                        <span className="text-[10px] font-bold uppercase bg-[#f4c025] text-black px-2 py-0.5 rounded-full">New</span>
                      )}
                      {product.is_sale && (
                        <span className="text-[10px] font-bold uppercase bg-pink-500 text-white px-2 py-0.5 rounded-full">Sale</span>
                      )}
                      {missingTranslation && (
                        <span className="text-[10px] font-bold uppercase bg-purple-500 text-white px-2 py-0.5 rounded-full" title="Missing Arabic Translation">A / E</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 space-y-3" onClick={() => !isSelected && toggleSelect(product.id)}>
                    <div>
                      <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
                      <p className="text-xs text-fg-faint truncate">{product.subtitle}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-[#f4c025]">{formatCurrency(Number(product.price), locale)}</span>
                      <span className="text-[10px] text-fg-faint font-mono">{product.sku}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5" onClick={e => e.stopPropagation()}>
                      <Link href={`/admin/products/${product.id}`} className="flex-1 text-center text-xs font-semibold text-[#f4c025] bg-[#f4c025]/10 px-3 py-1.5 rounded-lg hover:bg-[#f4c025]/20 transition-colors">
                        Edit Full Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
