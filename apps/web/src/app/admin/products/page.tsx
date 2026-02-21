'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminProducts } from '@lessence/supabase';
import { Product } from '@lessence/core';

export default function AdminProductsPage() {
  const { products, categories, loading, fetchProducts, createProduct, toggleProductActive, toggleProductNew } = useAdminProducts(supabase);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', subtitle: '', description: '', price: '', category_id: '', sku: '' });
  const [creating, setCreating] = useState(false);

  const handleSearch = (val: string) => {
    setSearch(val);
    fetchProducts(val || undefined);
  };

  const handleCreate = async () => {
    setCreating(true);
    await createProduct({
      name: newProduct.name,
      subtitle: newProduct.subtitle,
      description: newProduct.description,
      price: parseFloat(newProduct.price) || 0,
      category_id: newProduct.category_id,
      sku: newProduct.sku,
      image_url: '',
      size_options: [],
      scent_profiles: [],
      rating: 0,
      review_count: 0,
      is_new: false,
    });
    setNewProduct({ name: '', subtitle: '', description: '', price: '', category_id: '', sku: '' });
    setShowCreate(false);
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-white/40 text-sm mt-1">{products.length} products</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 transition-colors"
        >
          + New Product
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Quick Create</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Name *" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <input placeholder="Subtitle" value={newProduct.subtitle} onChange={e => setNewProduct({ ...newProduct, subtitle: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <input placeholder="Price *" type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <input placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
            <select title="Category" value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
              className="bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id} className="bg-[#1e1b16]">{c.name}</option>)}
            </select>
          </div>
          <textarea placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
            rows={2} className="w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40" />
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowCreate(false)} className="text-sm text-white/40 hover:text-white px-4 py-2">Cancel</button>
            <button onClick={handleCreate} disabled={creating || !newProduct.name || !newProduct.price}
              className="px-5 py-2 bg-[#f4c025] text-black text-sm font-bold rounded-xl hover:bg-[#f4c025]/90 disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={e => handleSearch(e.target.value)}
        className="w-full sm:w-80 bg-[#1e1b16] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40"
      />

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className={`bg-[#1e1b16] border rounded-2xl overflow-hidden transition-all ${product.is_active === false ? 'border-red-500/20 opacity-60' : 'border-white/5'}`}>
              <div className="h-40 bg-white/5 relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">🧴</div>
                )}
                {product.is_new && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-[#f4c025] text-black px-2 py-0.5 rounded-full">New</span>
                )}
                {product.is_active === false && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold uppercase bg-red-500/80 text-white px-2 py-0.5 rounded-full">Inactive</span>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
                  <p className="text-xs text-white/30 truncate">{product.subtitle}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#f4c025]">${Number(product.price).toFixed(2)}</span>
                  <span className="text-[10px] text-white/20 font-mono">{product.sku}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <Link href={`/admin/products/${product.id}`} className="flex-1 text-center text-xs font-semibold text-[#f4c025] bg-[#f4c025]/10 px-3 py-1.5 rounded-lg hover:bg-[#f4c025]/20 transition-colors">
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleProductNew(product.id, !product.is_new)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${product.is_new ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/30 hover:text-white'}`}
                  >
                    {product.is_new ? '★ New' : '☆ New'}
                  </button>
                  <button
                    onClick={() => toggleProductActive(product.id, !(product.is_active ?? true))}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${product.is_active !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                  >
                    {product.is_active !== false ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
