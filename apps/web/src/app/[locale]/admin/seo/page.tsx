'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, CheckCircle2, Globe, Search, BarChart3 } from 'lucide-react';

interface SeoEntry {
  id: string;
  page_key: string;
  title_en: string | null;
  title_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  keywords_en: string | null;
  keywords_ar: string | null;
  og_image_url: string | null;
  google_verification: string | null;
  bing_verification: string | null;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  custom_head_tags: string | null;
}

const PAGE_LABELS: Record<string, { label: string; icon: string }> = {
  global: { label: 'Global Settings', icon: '🌐' },
  home: { label: 'Home Page', icon: '🏠' },
  shop: { label: 'Shop Page', icon: '🛍️' },
};

export default function AdminSeoPage() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('seo_settings')
      .select('*')
      .order('page_key');
    if (data) setEntries(data);
    setLoading(false);
  };

  const updateField = (pageKey: string, field: string, value: string) => {
    setEntries(prev =>
      prev.map(e =>
        e.page_key === pageKey ? { ...e, [field]: value } : e
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = entries.map(entry =>
        supabase.from('seo_settings').update({
          title_en: entry.title_en,
          title_ar: entry.title_ar,
          description_en: entry.description_en,
          description_ar: entry.description_ar,
          keywords_en: entry.keywords_en,
          keywords_ar: entry.keywords_ar,
          og_image_url: entry.og_image_url,
          google_verification: entry.google_verification,
          bing_verification: entry.bing_verification,
          google_analytics_id: entry.google_analytics_id,
          facebook_pixel_id: entry.facebook_pixel_id,
          tiktok_pixel_id: entry.tiktok_pixel_id,
          custom_head_tags: entry.custom_head_tags,
        }).eq('id', entry.id)
      );
      await Promise.all(promises);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save SEO settings:', err);
      alert('Failed to save');
    }
    setSaving(false);
  };

  const activeEntry = entries.find(e => e.page_key === activeTab);
  const inputClass = "w-full bg-[#181611] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#f4c025]/40 transition-colors";
  const labelClass = "text-xs font-semibold text-fg-muted uppercase tracking-widest mb-1.5 block";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 border-2 border-[#f4c025] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search size={22} className="text-[#f4c025]" />
            SEO & GEO Settings
          </h1>
          <p className="text-fg-muted text-sm mt-1">
            Manage meta tags, keywords, tracking codes, and structured data for search engine optimization.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#f4c025] text-black hover:bg-[#f4c025]/90'
          }`}
        >
          {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={16} /> {saving ? 'Saving...' : 'Save All'}</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-0">
        {entries.map(entry => {
          const meta = PAGE_LABELS[entry.page_key] || { label: entry.page_key, icon: '📄' };
          return (
            <button
              key={entry.page_key}
              onClick={() => setActiveTab(entry.page_key)}
              className={`px-4 py-3 text-sm font-medium rounded-t-xl transition-all ${
                activeTab === entry.page_key
                  ? 'bg-[#1e1b16] text-[#f4c025] border border-white/5 border-b-transparent -mb-[1px]'
                  : 'text-fg-muted hover:text-white'
              }`}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      {activeEntry && (
        <div className="space-y-6">
          {/* Meta Tags Section */}
          <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <Globe size={14} className="text-[#f4c025]" />
              Meta Tags
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Title (English)</label>
                <input className={inputClass} placeholder="Page title in English"
                  value={activeEntry.title_en || ''} onChange={e => updateField(activeTab, 'title_en', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Title (Arabic)</label>
                <input className={inputClass} dir="rtl" placeholder="عنوان الصفحة"
                  value={activeEntry.title_ar || ''} onChange={e => updateField(activeTab, 'title_ar', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Description (English)</label>
                <textarea rows={3} className={inputClass} placeholder="Meta description in English (150-160 chars recommended)"
                  value={activeEntry.description_en || ''} onChange={e => updateField(activeTab, 'description_en', e.target.value)} />
                <span className="text-[10px] text-fg-faint mt-1 block">{(activeEntry.description_en || '').length}/160</span>
              </div>
              <div>
                <label className={labelClass}>Description (Arabic)</label>
                <textarea rows={3} className={inputClass} dir="rtl" placeholder="وصف الصفحة"
                  value={activeEntry.description_ar || ''} onChange={e => updateField(activeTab, 'description_ar', e.target.value)} />
                <span className="text-[10px] text-fg-faint mt-1 block">{(activeEntry.description_ar || '').length}/160</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Keywords (English)</label>
                <input className={inputClass} placeholder="keyword1, keyword2, keyword3"
                  value={activeEntry.keywords_en || ''} onChange={e => updateField(activeTab, 'keywords_en', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Keywords (Arabic)</label>
                <input className={inputClass} dir="rtl" placeholder="كلمة1, كلمة2, كلمة3"
                  value={activeEntry.keywords_ar || ''} onChange={e => updateField(activeTab, 'keywords_ar', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelClass}>OG Image URL</label>
              <input className={inputClass} placeholder="https://example.com/og-image.png"
                value={activeEntry.og_image_url || ''} onChange={e => updateField(activeTab, 'og_image_url', e.target.value)} />
            </div>
          </div>

          {/* Tracking & Verification — only for global */}
          {activeTab === 'global' && (
            <div className="bg-[#1e1b16] border border-white/5 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                <BarChart3 size={14} className="text-[#f4c025]" />
                Tracking & Verification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Google Search Console Verification</label>
                  <input className={inputClass} placeholder="google-site-verification code"
                    value={activeEntry.google_verification || ''} onChange={e => updateField(activeTab, 'google_verification', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Bing Webmaster Verification</label>
                  <input className={inputClass} placeholder="bing verification code"
                    value={activeEntry.bing_verification || ''} onChange={e => updateField(activeTab, 'bing_verification', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Google Analytics ID</label>
                  <input className={inputClass} placeholder="G-XXXXXXXXXX"
                    value={activeEntry.google_analytics_id || ''} onChange={e => updateField(activeTab, 'google_analytics_id', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Facebook Pixel ID</label>
                  <input className={inputClass} placeholder="Pixel ID"
                    value={activeEntry.facebook_pixel_id || ''} onChange={e => updateField(activeTab, 'facebook_pixel_id', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>TikTok Pixel ID</label>
                  <input className={inputClass} placeholder="Pixel ID"
                    value={activeEntry.tiktok_pixel_id || ''} onChange={e => updateField(activeTab, 'tiktok_pixel_id', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Custom Head Tags (HTML)</label>
                <textarea rows={4} className={`${inputClass} font-mono text-xs`} placeholder="<!-- Custom HTML to inject in <head> -->"
                  value={activeEntry.custom_head_tags || ''} onChange={e => updateField(activeTab, 'custom_head_tags', e.target.value)} />
                <span className="text-[10px] text-fg-faint mt-1 block">Raw HTML injected into the &lt;head&gt; tag of every page</span>
              </div>
            </div>
          )}

          {/* SEO Tips */}
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">💡 SEO Tips</h4>
            <ul className="text-xs text-fg-muted space-y-1.5">
              <li>• Keep titles under 60 characters for best display in search results</li>
              <li>• Descriptions should be 150-160 characters — compelling and keyword-rich</li>
              <li>• Include location keywords (Egypt, Cairo) for local SEO ranking</li>
              <li>• OG images should be 1200×630px for optimal social media sharing</li>
              <li>• Add Google Search Console verification to monitor search performance</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
