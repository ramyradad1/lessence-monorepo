'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Package, AlertTriangle } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function AdminAlertsPage() {
  const [activeTab, setActiveTab] = useState<'low_stock' | 'back_in_stock'>('low_stock');
  
  // Low Stock state
  const [lowStockVariants, setLowStockVariants] = useState<Array<{ product_name_en: string; product_name_ar: string; sku: string; size_ml: string; stock_quantity: number; threshold: number }>>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  
  // Back in Stock state
  const [bisSubscriptions, setBisSubscriptions] = useState<Array<{ id: string; email: string | null; status: 'pending' | 'notified'; created_at: string; product: { id: string; name_en: string; name_ar: string }; variant: { id: string; sku: string; size_ml: string; stock_quantity: number | null } }>>([]);
  const [bisLoading, setBisLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    if (activeTab === 'low_stock') {
      fetchLowStock();
    } else {
      fetchBackInStock();
    }
  }, [activeTab]);

  const fetchLowStock = async () => {
    setLowStockLoading(true);
    try {
      // Use the newly created RPC
      const { data, error } = await supabase.rpc('get_low_stock_variants');
      if (error) console.error("Error fetching low stock:", error);
      else setLowStockVariants(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLowStockLoading(false);
    }
  };

  const fetchBackInStock = async () => {
    setBisLoading(true);
    try {
      const { data, error } = await supabase
        .from('back_in_stock_subscriptions')
        .select(`
          id,
          email,
          status,
          created_at,
          product:products (id, name_en, name_ar),
          variant:product_variants (id, sku, stock_quantity, size_ml)
        `)
        .order('created_at', { ascending: false });
        
      if (error) console.error("Error fetching BIS:", error);
      else setBisSubscriptions((data as unknown) as Array<{ id: string; email: string | null; status: 'pending' | 'notified'; created_at: string; product: { id: string; name_en: string; name_ar: string }; variant: { id: string; sku: string; size_ml: string; stock_quantity: number | null } }> || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBisLoading(false);
    }
  };

  const handleNotifyUsers = async (variantId: string) => {
    try {
      const { data, error } = await supabase.rpc('process_back_in_stock', { p_variant_id: variantId });
      if (error) {
        alert("Error notifying users");
        console.error(error);
      } else {
        alert(`Successfully notified ${data} users`);
        fetchBackInStock(); // Refresh list
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-sans text-white mb-2">Alerts & Notifications</h1>
          <p className="text-fg-muted text-sm">Monitor low stock and customer requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1e1b16] rounded-xl p-1 gap-1 border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('low_stock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'low_stock' ? 'bg-[#f4c025] text-black' : 'text-fg-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <AlertTriangle size={16} />
          Low Stock Alerts
          {lowStockVariants.length > 0 && activeTab !== 'low_stock' && (
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('back_in_stock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'back_in_stock' ? 'bg-[#f4c025] text-black' : 'text-fg-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell size={16} />
          Back in Stock Requests
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        
        {activeTab === 'low_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Product / SKU</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-center">Size</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-center">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-center">Alert Threshold</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lowStockLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-fg-muted">Loading...</td></tr>
                ) : lowStockVariants.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-fg-muted">No low stock alerts</td></tr>
                ) : (
                  lowStockVariants.map((variant, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 border border-red-500/20">
                            <Package size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{locale === 'ar' ? variant.product_name_ar : variant.product_name_en}</div>
                            <div className="text-xs text-fg-muted">{variant.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-white/70">{variant.size_ml}ml</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${variant.stock_quantity === 0 ? 'text-red-500' : 'text-orange-400'}`}>
                          {variant.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-fg-muted">{variant.threshold}</td>
                      <td className="px-6 py-4 text-right">
                        {variant.stock_quantity === 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Out of Stock</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">Low Stock</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'back_in_stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Product / Size (SKU)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Customer Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider">Requested On</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-center">Current Stock</th>
                  <th className="px-6 py-4 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Actions / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bisLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-fg-muted">Loading...</td></tr>
                ) : bisSubscriptions.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-fg-muted">No back-in-stock requests</td></tr>
                ) : (
                  bisSubscriptions.map((sub, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{locale === 'ar' ? sub.product?.name_ar : sub.product?.name_en}</div>
                        <div className="text-xs text-fg-muted">{sub.variant?.size_ml}ml ({sub.variant?.sku})</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">{sub.email || 'Registered User'}</td>
                      <td className="px-6 py-4 text-sm text-fg-muted">{new Date(sub.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-medium ${(sub.variant?.stock_quantity ?? 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {sub.variant?.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sub.status === 'notified' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Notified</span>
                        ) : (sub.variant?.stock_quantity ?? 0) > 0 ? (
                          <button
                            onClick={() => handleNotifyUsers(sub.variant.id)}
                            className="bg-[#f4c025] hover:bg-[#f4c025]/90 text-black text-xs font-bold px-3 py-1.5 rounded"
                          >
                            Notify Now
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white/5 text-fg-muted border border-white/10">Waiting for Stock</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
