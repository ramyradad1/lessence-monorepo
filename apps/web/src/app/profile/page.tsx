"use client";
import { useAuth } from "@lessence/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { User, LogOut, Package, MapPin, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [isStale, setIsStale] = useState(false);

  // Detect stale/stuck loading state — if loading takes >8s, session is likely corrupted
  useEffect(() => {
    if (!isLoading) {
      setIsStale(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsStale(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleForceRefresh = useCallback(async () => {
    try {
      await signOut();
    } catch { }
    // Clear any stale local data
    try {
      localStorage.removeItem('supabase.auth.token');
      // Clear all supabase-related keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch { }
    router.push("/login");
  }, [signOut, router]);

  if (isLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center p-4 gap-4">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-white/40 uppercase tracking-widest text-[10px]">
          {isLoading ? "Connecting to server..." : !user ? "Redirecting to login..." : "Fetching profile..."}
        </p>
        {isStale && (
          <div className="flex flex-col items-center gap-3 mt-4">
            <p className="text-amber-400/80 text-[10px] uppercase tracking-widest text-center max-w-xs">
              Connection appears stuck. Your session may have expired.
            </p>
            <button
              onClick={handleForceRefresh}
              className="bg-[#f4c025] text-black px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
            >
              Sign in again
            </button>
          </div>
        )}
        {!isLoading && user && !profile && !isStale && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-red-400 text-[10px] uppercase tracking-widest">Profile not found</p>
            <button onClick={() => window.location.reload()} className="text-[#f4c025] text-[10px] underline uppercase tracking-widest">
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background-dark pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl text-white mb-10">My Account</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-primary" />
              </div>
              <h2 className="text-xl font-display text-white mb-1">{profile.full_name || "Valued Client"}</h2>
              <p className="text-white/40 text-xs mb-6">{profile.email}</p>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs uppercase tracking-widest"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>

              {['super_admin', 'order_manager', 'inventory_manager', 'content_manager', 'admin'].includes(profile.role) && (
              <div className="glass-effect p-6 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={18} className="text-primary" />
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">Administrator</h3>
                </div>
                <p className="text-white/40 text-xs mb-4">You have access to the dashboard.</p>
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full bg-primary text-black py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all"
                >
                  Admin Dashboard
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-effect p-8 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <Package size={20} className="text-white/60" />
                <h3 className="text-lg font-display text-white">Order History</h3>
              </div>
              <p className="text-white/40 text-sm">Your recent purchases will appear here.</p>
              {/* Order history list would be mapped here */}
            </div>

            <div className="glass-effect p-8 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <MapPin size={20} className="text-white/60" />
                <h3 className="text-lg font-display text-white">Saved Addresses</h3>
              </div>
              <p className="text-white/40 text-sm">No addresses saved yet.</p>
              {/* Addresses list would be mapped here */}
              <button className="mt-4 border border-white/20 text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                Add New Address
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
