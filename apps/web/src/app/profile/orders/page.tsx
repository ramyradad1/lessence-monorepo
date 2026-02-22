"use client";

import { useAuth, useOrders } from "@lessence/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Package, ChevronRight, Calendar, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-orange-400 bg-orange-500/10',
  paid: 'text-emerald-400 bg-emerald-500/10',
  processing: 'text-blue-400 bg-blue-500/10',
  shipped: 'text-indigo-400 bg-indigo-500/10',
  delivered: 'text-green-400 bg-green-500/10',
  cancelled: 'text-red-400 bg-red-500/10',
  refunded: 'text-gray-400 bg-gray-500/10',
};

export default function OrderHistoryPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { orders, loading: ordersLoading } = useOrders(supabase);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#181611] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background-dark pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => router.push('/profile')}
              className="text-white/40 hover:text-white transition-colors text-sm"
            >
              Profile
            </button>
            <ChevronRight size={14} className="text-white/20" />
            <h1 className="font-display text-2xl text-white">Order History</h1>
          </div>

          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center py-20">
                <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-effect p-12 rounded-3xl border border-white/5 text-center">
                <Package size={48} className="text-white/10 mx-auto mb-4" />
                <p className="text-white/40 mb-6">You haven&apos;t placed any orders yet.</p>
                <button 
                  onClick={() => router.push('/shop')}
                  className="bg-[#f4c025] text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id}
                  onClick={() => router.push(`/profile/orders/${order.id}`)}
                  className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-[#f4c025]/10 transition-colors">
                      <Package size={20} className="text-[#f4c025]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{order.order_number}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          ${order.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[#f4c025] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
