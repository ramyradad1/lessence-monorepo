"use client";
import { useAuth } from "@lessence/supabase";
import { usePathname, useRouter } from "@/navigation";
import { useEffect, useState } from "react";
import { User, LogOut, Package, Shield, Heart, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import AddressBook from "@/components/AddressBook";
import { useTranslations, useLocale } from "next-intl";

import { supabase } from "@/lib/supabase";
import { Link } from "@/navigation";
import { signOutAction } from "../auth/actions";

export default function ProfilePage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const t = useTranslations('profile');
  const locale = useLocale();
  const rtl = locale === 'ar';

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) setEditName(profile.full_name || "");
  }, [profile]);

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
      await supabase
        .from('profiles')
        .update({ preferred_language: newLocale })
        .eq('id', user.id);

      router.replace(pathname, { locale: newLocale });
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect to login if not loading and no user
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleSignOut = async () => {
    try {
      setIsSignOutLoading(true);
    // 1. Clear local state
      await signOut();
      // 2. Call server action to clear cookies
      await signOutAction();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSignOutLoading(false);
    }
  };

  // Sign out in progress
  if (isSignOutLoading) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center p-4 gap-4">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-white/40 uppercase tracking-widest text-[10px]">
          {t('signing_out')}
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center p-4 gap-4">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-white/40 uppercase tracking-widest text-[10px]">
          {t('connecting')}
        </p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#181611] flex flex-col items-center justify-center p-4 gap-4">
        <div className="h-8 w-8 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-white/40 uppercase tracking-widest text-[10px]">
          {t('redirecting')}
        </p>
      </div>
    );
  }

  // User exists but profile not loaded yet — show the profile page with user info from auth
  const displayName = profile?.full_name || user.user_metadata?.full_name || t('valued_client');
  const displayEmail = profile?.email || user.email || "";
  const displayRole = profile?.role || "user";

  return (
    <>
      <Navbar />
      <div className={`min-h-screen bg-background-dark pt-32 pb-20 px-4 ${rtl ? 'rtl' : 'ltr'}`}>
        <div className="max-w-4xl mx-auto">
        <h1 className={`font-display text-4xl text-white mb-10 ${rtl ? 'text-right' : 'text-left'}`}>
          {t('my_account')}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="glass-effect p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-primary" />
              </div>
                <h2 className="text-xl font-display text-white mb-1">{displayName}</h2>
                <p className="text-white/40 text-xs mb-6">{displayEmail}</p>

                <div className="w-full h-px bg-white/10 my-6"></div>

                <div className="w-full flex flex-col gap-4 text-left">
                  <Link
                    href="/profile/favorites"
                    className={`flex items-center gap-3 text-white/60 hover:text-white transition-colors text-xs uppercase tracking-widest ${rtl ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <Heart size={16} />
                    <span>{t('my_favorites')}</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    disabled={isSignOutLoading}
                    className={`flex items-center gap-3 text-white/60 hover:text-white transition-colors text-xs uppercase tracking-widest disabled:opacity-50 ${rtl ? 'flex-row-reverse text-right' : ''}`}
                  >
                    <LogOut size={16} className={rtl ? 'rotate-180' : ''} />
                    <span>{isSignOutLoading ? t('exiting') : t('log_out')}</span>
                  </button>
                </div>
              </div>

              {['super_admin', 'order_manager', 'inventory_manager', 'content_manager', 'admin'].includes(displayRole) && (
              <div className="glass-effect p-6 rounded-2xl border border-primary/20 bg-primary/5">
                <div className={`flex items-center gap-3 mb-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <Shield size={18} className="text-primary" />
                  <h3 className="font-bold text-white uppercase text-xs tracking-widest">{t('administrator')}</h3>
                </div>
                <p className={`text-white/40 text-xs mb-4 ${rtl ? 'text-right' : 'text-left'}`}>{t('admin_dashboard_desc')}</p>
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full bg-primary text-black py-3 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white transition-all"
                >
                  {t('admin_dashboard_btn')}
                </button>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
              <div className="glass-effect p-8 rounded-2xl border border-white/5">
                <div className={`flex items-center gap-3 mb-6 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <User size={20} className="text-white/60" />
                  <h3 className="text-lg font-display text-white">{t('personal_info')}</h3>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="editFullName" className={`text-[10px] text-white/40 uppercase tracking-widest block mb-2 ${rtl ? 'text-right' : 'text-left'}`}>{t('full_name')}</label>
                      <input
                        id="editFullName"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={`w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all ${rtl ? 'text-right' : 'text-left'}`}
                      />
                    </div>
                    <div className={`flex gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-primary text-black px-6 py-2 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
                      >
                        {isSaving ? t('saving') : t('save_changes')}
                      </button>
                      <button
                        onClick={() => { setIsEditing(false); setEditName(profile?.full_name || ""); }}
                        disabled={isSaving}
                        className="border border-white/20 text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`flex justify-between items-center ${rtl ? 'flex-row-reverse' : ''}`}>
                    <div className={rtl ? 'text-right' : 'text-left'}>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{t('full_name')}</p>
                      <p className="text-white">{profile?.full_name || t('valued_client')}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="border border-white/20 text-white px-6 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                    >
                      {t('edit_profile')}
                    </button>
                  </div>
                )}
              </div>

            <div className="glass-effect p-8 rounded-2xl border border-white/5">
              <div className={`flex items-center gap-3 mb-6 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <Globe size={20} className="text-white/60" />
                  <h3 className="text-lg font-display text-white">{t('preferences')}</h3>
                </div>

                <div className={`flex justify-between items-center ${rtl ? 'flex-row-reverse' : ''}`}>
                  <div className={rtl ? 'text-right' : 'text-left'}>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{t('preferred_language')}</p>
                    <p className="text-white">{locale === 'ar' ? t('arabic') : t('english')}</p>
                  </div>

                  <div className={`flex gap-3 ${rtl ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => handleLanguageChange('en')}
                      disabled={isSaving || locale === 'en'}
                      className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${locale === 'en' ? 'bg-primary text-black font-bold' : 'border border-white/20 text-white hover:bg-white hover:text-black'}`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('ar')}
                      disabled={isSaving || locale === 'ar'}
                      className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${locale === 'ar' ? 'bg-primary text-black font-bold' : 'border border-white/20 text-white hover:bg-white hover:text-black'}`}
                    >
                      العربية
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-effect p-8 rounded-2xl border border-white/5">
                <div className={`flex items-center gap-3 mb-6 ${rtl ? 'flex-row-reverse' : ''}`}>
                  <Package size={20} className="text-white/60" />
                  <h3 className="text-lg font-display text-white">{t('order_history')}</h3>
                </div>
                <p className={`text-white/40 text-sm ${rtl ? 'text-right' : 'text-left'}`}>{t('order_history_empty')}</p>
              </div>

              <AddressBook />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
