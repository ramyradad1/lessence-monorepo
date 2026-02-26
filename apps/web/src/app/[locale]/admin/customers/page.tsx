'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAdminCustomers } from '@lessence/supabase';
import { Search, ArrowUpDown, User as UserIcon, Mail, Phone, ShoppingBag, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { formatCurrency } from '@lessence/core';

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest First' },
  { value: 'created_at:asc', label: 'Oldest First' },
  { value: 'total_spend:desc', label: 'Highest Spend' },
  { value: 'total_spend:asc', label: 'Lowest Spend' },
  { value: 'total_orders:desc', label: 'Most Orders' },
  { value: 'full_name:asc', label: 'Name A–Z' },
  { value: 'full_name:desc', label: 'Name Z–A' },
] as const;

type CustomerSortBy = 'created_at' | 'total_spend' | 'total_orders' | 'full_name';
type CustomerSortOrder = 'asc' | 'desc';

export default function AdminCustomersPage() {
  const { customers, loading, totalCount, fetchCustomers } = useAdminCustomers(supabase);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at:desc');
  const [page, setPage] = useState(1);
  const locale = useLocale();

  useEffect(() => {
    const [sortBy, sortOrder] = sort.split(':') as [CustomerSortBy, CustomerSortOrder];
    const timer = setTimeout(() => {
      fetchCustomers({ search: search || undefined, sortBy, sortOrder, page });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sort, page, fetchCustomers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-fg-muted text-sm mt-1">{totalCount} total customers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#1e1b16] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40"
          />
        </div>
        <div className="relative">
          <ArrowUpDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-faint pointer-events-none" />
          <select
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1); }}
            title="Sort customers"
            className="bg-[#1e1b16] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#f4c025]/40 appearance-none"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-[#1e1b16]">{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e1b16] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-[#f4c025]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-center">Orders</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right">Total Spend</th>
                  <th className="px-6 py-3 text-xs font-semibold text-fg-faint uppercase tracking-wider text-right hidden sm:table-cell">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-fg-faint">No customers found</td></tr>
                )}
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3 group-hover:text-[#f4c025] transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#f4c025]/10 flex items-center justify-center text-[#f4c025] shrink-0">
                          {c.avatar_url ? (
                            <Image src={c.avatar_url} alt="" width={40} height={40} unoptimized className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <UserIcon size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate group-hover:text-[#f4c025] transition-colors">
                            {c.full_name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-fg-muted flex items-center gap-1 truncate">
                            <Mail size={11} /> {c.email}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      {c.phone ? (
                        <span className="text-sm text-fg-muted flex items-center gap-1"><Phone size={12} /> {c.phone}</span>
                      ) : (
                        <span className="text-xs text-fg-faint">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-white">
                        <ShoppingBag size={13} className="text-fg-faint" /> {c.total_orders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-[#f4c025]">{formatCurrency(Number(c.total_spend), locale)}</span>
                    </td>
                    <td className="px-6 py-4 text-right hidden sm:table-cell">
                      <span className="text-xs text-fg-faint">
                        {c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : 'Never'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 25 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm text-fg-muted hover:text-white disabled:opacity-30 px-3 py-1.5 bg-white/5 rounded-lg"
          >
            ← Prev
          </button>
          <span className="text-sm text-fg-muted">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * 25 >= totalCount}
            className="text-sm text-fg-muted hover:text-white disabled:opacity-30 px-3 py-1.5 bg-white/5 rounded-lg"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
