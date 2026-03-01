"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@lessence/supabase";
import { supabase } from "@/lib/supabase";
import { getUserOrders } from "@/services/orders.service";
import SectionTitle from "@/components/v2/SectionTitle";
import LuxuryButton from "@/components/v2/LuxuryButton";
import AddressBook from "@/components/AddressBook";
import { formatCurrency } from "@lessence/core";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname, Link } from "@/navigation";
import { signOutAction } from "../../auth/actions";
import { User, LogOut, Package, Shield, Heart, Globe, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ProfileTab = "orders" | "details" | "addresses";

export default function V2ProfilePage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("orders");
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const locale = useLocale();
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const rtl = locale === "ar";

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) setEditName(profile.full_name || "");
  }, [profile]);

  useEffect(() => {
    async function loadOrders() {
      if (user) {
        try {
          const data = await getUserOrders(supabase, user.id);
          setOrders(data || []);
        } catch (error) {
          console.error(error);
        }
      }
      setLoading(false);
    }
    loadOrders();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      setIsSignOutLoading(true);
      await signOut();
      await signOutAction();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSignOutLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.from("profiles").update({ full_name: editName }).eq("id", user.id);
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleLanguageChange = async (newLocale: string) => {
    if (!user) {
      router.replace(pathname, { locale: newLocale });
      return;
    }
    setIsSaving(true);
    try {
      await supabase.from("profiles").update({ preferred_language: newLocale }).eq("id", user.id);
      router.replace(pathname, { locale: newLocale });
    } finally {
      setIsSaving(false);
    }
  };

  // Sign out loading screen
  if (isSignOutLoading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-t-2 border-r-2 border-primary rounded-full animate-spin" />
        <p className="text-white/40 uppercase tracking-[0.3em] text-[10px]">
          {t("signing_out") || "Signing out..."}
        </p>
      </div>
    );
  }

  // Loading
  if (isLoading || loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-r-2 border-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-serif text-white uppercase tracking-widest">
          {t("please_sign_in") || "Please Sign In"}
        </h2>
        <LuxuryButton variant="outline" onClick={() => router.push("/login")}>
          {t("sign_in_to_account") || "Sign In to Account"}
        </LuxuryButton>
      </div>
    );
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || (t("valued_client") || "Valued Client");
  const displayEmail = profile?.email || user.email || "";
  const displayRole = profile?.role || "user";
  const isAdmin = ["super_admin", "order_manager", "inventory_manager", "content_manager", "admin"].includes(displayRole);

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: t("order_history") || "Order History", icon: <Package size={14} /> },
    { id: "details", label: t("personal_info") || "Account Details", icon: <User size={14} /> },
    { id: "addresses", label: t("saved_addresses") || "Addresses", icon: <MapPin size={14} /> },
  ];

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full min-h-[85vh] ${rtl ? "rtl" : "ltr"}`}>
      <SectionTitle
        title={t("my_account") || "My Account"}
        subtitle={`${tc("discover") || "Welcome Back"}, ${displayName}`}
      />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mt-8 sm:mt-12">
        {/* ── Sidebar ── */}
        <div className="w-full lg:w-72 shrink-0">
          {/* User card */}
          <div className="bg-[var(--v2-bg-elevated)] border border-[var(--v2-border)] p-6 mb-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-serif text-sm truncate text-[var(--v2-text)]">{displayName}</p>
                <p className="text-[10px] tracking-wider truncate text-[var(--v2-text-faint)]">{displayEmail}</p>
              </div>
            </div>

            {/* Tab nav */}
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                      activeTab === tab.id
                        ? "text-primary bg-primary/[0.06] border-l-2 border-primary"
                        : "hover:bg-white/[0.03] border-l-2 border-transparent"
                    }`}
                    style={activeTab !== tab.id ? { color: 'var(--v2-text-faint)' } : {}}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Favorites link */}
          <Link
            href="/profile/favorites"
            className="flex items-center gap-3 px-4 py-3 bg-[var(--v2-bg-elevated)] border border-[var(--v2-border)] hover:text-primary hover:border-primary/20 transition-all duration-300 text-[10px] uppercase tracking-[0.2em] mb-4 text-[var(--v2-text-faint)]"
          >
            <Heart size={14} />
            <span>{t("my_favorites") || "My Favorites"}</span>
          </Link>

          {/* Admin panel */}
          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-primary/[0.06] border border-primary/20 text-primary hover:bg-primary hover:text-black transition-all duration-300 text-[10px] uppercase tracking-[0.2em] font-bold mb-4"
            >
              <Shield size={14} />
              <span>{t("admin_dashboard_btn") || "Admin Dashboard"}</span>
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            disabled={isSignOutLoading}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--v2-bg-elevated)] border border-[var(--v2-border)] text-red-500/50 hover:text-red-500 hover:border-red-500/20 transition-all duration-300 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50"
          >
            <LogOut size={14} className={rtl ? "rotate-180" : ""} />
            <span>{isSignOutLoading ? (t("exiting") || "Signing out...") : (t("log_out") || "Sign Out")}</span>
          </button>
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {/* ─── Orders Tab ─── */}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-serif text-2xl mb-8 border-b pb-4" style={{ color: 'var(--v2-text)', borderColor: 'var(--v2-border)' }}>
                  {t("order_history") || "Order History"}
                </h3>

                {orders.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center border border-dashed" style={{ borderColor: 'var(--v2-border)', backgroundColor: 'var(--v2-bg-card)' }}>
                    <Package size={40} className="text-white/10 mb-4" />
                    <p className="tracking-widest uppercase text-xs text-[var(--v2-text-faint)]">
                      {t("order_history_empty") || "You haven't placed any orders yet."}
                    </p>
                    <LuxuryButton variant="outline" className="mt-6" onClick={() => router.push("/v2/shop")}>
                      {tc("shop_now") || "Shop Now"}
                    </LuxuryButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-[var(--v2-bg-elevated)] border border-[var(--v2-border)] hover:border-primary/20 transition-all duration-300 p-5 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <p className="text-primary text-[10px] uppercase tracking-[0.2em] font-bold mb-1">
                              {tc("order_no", { number: order.id.slice(0, 8).toUpperCase() }) || `Order #${order.id.slice(0, 8)}`}
                            </p>
                            <p className="text-white/30 text-xs tracking-wider">
                              {new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-6 sm:gap-8">
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.2em] mb-0.5 text-[var(--v2-text-faint)]">Status</p>
                              <span
                                className={`text-[10px] uppercase tracking-widest font-bold ${
                                  order.status === "delivered"
                                    ? "text-green-400"
                                    : order.status === "cancelled"
                                    ? "text-red-400"
                                    : "text-primary"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.2em] mb-0.5 text-[var(--v2-text-faint)]">Total</p>
                              <p className="text-sm font-serif text-[var(--v2-text)]">{formatCurrency(order.total_amount, locale)}</p>
                            </div>
                            <Link href={`/profile/orders/${order.id}`}>
                              <LuxuryButton variant="outline" size="sm">
                                {tc("view_details") || "View Details"}
                              </LuxuryButton>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Account Details Tab ─── */}
            {activeTab === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Personal Info */}
                <div className="bg-[var(--v2-bg-elevated)] border border-[var(--v2-border)] p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <User size={18} style={{ color: 'var(--v2-text-faint)' }} />
                    <h3 className="font-serif text-lg text-[var(--v2-text)]">{t("personal_info") || "Personal Information"}</h3>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] block mb-2 text-[var(--v2-text-faint)]">
                          {t("full_name") || "Full Name"}
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={t("full_name") || "Full Name"}
                          className="w-full border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                          style={{ backgroundColor: 'var(--v2-bg-card)', borderColor: 'var(--v2-border-hover)', color: 'var(--v2-text)' }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <LuxuryButton onClick={handleSaveProfile} disabled={isSaving}>
                          {isSaving ? (t("saving") || "Saving...") : (t("save_changes") || "Save Changes")}
                        </LuxuryButton>
                        <LuxuryButton
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(profile?.full_name || "");
                          }}
                        >
                          {tc("cancel") || "Cancel"}
                        </LuxuryButton>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] mb-1 text-[var(--v2-text-faint)]">{t("full_name") || "Full Name"}</p>
                        <p className="font-serif text-[var(--v2-text)]">{profile?.full_name || (t("valued_client") || "Valued Client")}</p>
                      </div>
                      <LuxuryButton variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        {t("edit_profile") || "Edit"}
                      </LuxuryButton>
                    </div>
                  )}
                </div>

                {/* Language Preferences */}
                <div className="bg-[var(--v2-bg-elevated)] border border-[var(--v2-border)] p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Globe size={18} style={{ color: 'var(--v2-text-faint)' }} />
                    <h3 className="font-serif text-lg text-[var(--v2-text)]">{t("preferences") || "Preferences"}</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] mb-1 text-[var(--v2-text-faint)]">
                        {t("preferred_language") || "Preferred Language"}
                      </p>
                      <p className="font-serif text-[var(--v2-text)]">{locale === "ar" ? "العربية" : "English"}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleLanguageChange("en")}
                        disabled={isSaving || locale === "en"}
                        className={`px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 border ${
                          locale === "en"
                            ? "bg-primary text-black border-primary"
                            : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
                        } disabled:opacity-50`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange("ar")}
                        disabled={isSaving || locale === "ar"}
                        className={`px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 border ${
                          locale === "ar"
                            ? "bg-primary text-black border-primary"
                            : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
                        } disabled:opacity-50`}
                      >
                        العربية
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── Addresses Tab ─── */}
            {activeTab === "addresses" && (
              <motion.div
                key="addresses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <AddressBook />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
