"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [identity, setIdentity] = useState({ 
    store_name: 'LESSENCE',
    support_email: '', 
    support_phone: '', 
    social_links: { facebook: '', instagram: '', tiktok: '' } 
  });
  const [business, setBusiness] = useState({
    currency_display: 'EGP',
    low_stock_threshold: 5,
    guest_checkout_enabled: true,
    pickup_availability: true
  });
  const [content, setContent] = useState({
    homepage_sections: { hero: true, featured_categories: true, new_arrivals: true, bestsellers: true },
    featured_collections: [] as string[]
  });
  const [features, setFeatures] = useState({
    recently_viewed: true,
    related_products: true,
    wishlist: true,
    reviews: true,
    back_in_stock_alerts: true
  });
  const [localization, setLocalization] = useState({
    default_language: 'en',
    enabled_languages: ['en', 'ar']
  });
  const [policies, setPolicies] = useState({
    terms: '', privacy: '', refund: ''
  });
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
    admin?: { email: string };
  }>>([]);
  
  const [notifications, setNotifications] = useState({
    email_enabled: true,
    push_enabled: true,
    low_stock_threshold: 5,
    alerts: { order_update: true, back_in_stock: true, low_stock_admin: true, price_drop: false },
    templates: {
      back_in_stock: { en: "Good news! {product_name} is back in stock.", ar: "أخبار سارة! {product_name} متوفر الآن." },
      order_shipped: { en: "Your order {order_number} has been shipped.", ar: "تم شحن طلبك {order_number}." }
    }
  });

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_store_settings');
    if (data) {
      if (data.identity) setIdentity(prev => ({ ...prev, ...data.identity }));
      if (data.business) setBusiness(prev => ({ ...prev, ...data.business }));
      if (data.content) setContent(prev => ({ ...prev, ...data.content }));
      if (data.features) setFeatures(prev => ({ ...prev, ...data.features }));
      if (data.localization) setLocalization(prev => ({ ...prev, ...data.localization }));
      if (data.policies) setPolicies(prev => ({ ...prev, ...data.policies }));
      if (data.notifications) setNotifications(prev => ({ ...prev, ...data.notifications }));
    }

    const { data: logsData } = await supabase.from('admin_audit_logs')
      .select(`id, action, entity_type, created_at, admin:admin_id (email)`)
      .eq('entity_type', 'store_settings')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (logsData) {
      setAuditLogs(logsData.map((log) => {
        const adminData = Array.isArray(log.admin) ? log.admin[0] : log.admin;
        return {
          id: String(log.id),
          action: String(log.action),
          entity_type: String(log.entity_type),
          created_at: String(log.created_at),
          admin: adminData ? { email: String((adminData as { email: string }).email) } : undefined
        };
      }));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    await supabase.rpc('update_store_settings', {
      p_settings: {
        identity,
        business,
        content,
        features,
        localization,
        policies,
        notifications
      }
    });

    setMessage('Settings saved successfully');
    setSaving(false);
    fetchSettings(); // Refresh logs after save
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-sans text-white mb-2">Store Settings</h1>
          <p className="text-fg-muted">Manage identity, business, and store feature configurations.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Settings
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Identity Settings */}
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Identity & Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-fg-muted mb-1.5">Store Name</label>
              <input
                type="text"
                value={identity.store_name}
                onChange={e => setIdentity({ ...identity, store_name: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="Store Name"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted mb-1.5">Support Email</label>
              <input
                type="email"
                value={identity.support_email}
                onChange={e => setIdentity({ ...identity, support_email: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="support@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted mb-1.5">Support Phone</label>
              <input
                type="text"
                value={identity.support_phone}
                onChange={e => setIdentity({ ...identity, support_phone: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="+201..."
              />
            </div>
          </div>
          
          <h3 className="text-sm font-semibold text-fg mt-6 mb-3">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="instagram" className="block text-sm text-fg-muted mb-1.5">Instagram URL</label>
              <input
                id="instagram"
                type="url"
                value={identity.social_links?.instagram || ''}
                onChange={e => setIdentity({ ...identity, social_links: { ...identity.social_links, instagram: e.target.value } })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label htmlFor="facebook" className="block text-sm text-fg-muted mb-1.5">Facebook URL</label>
              <input
                id="facebook"
                type="url"
                value={identity.social_links?.facebook || ''}
                onChange={e => setIdentity({ ...identity, social_links: { ...identity.social_links, facebook: e.target.value } })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label htmlFor="tiktok" className="block text-sm text-fg-muted mb-1.5">TikTok URL</label>
              <input
                id="tiktok"
                type="url"
                value={identity.social_links?.tiktok || ''}
                onChange={e => setIdentity({ ...identity, social_links: { ...identity.social_links, tiktok: e.target.value } })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="https://tiktok.com/..."
              />
            </div>
          </div>
        </section>

        {/* Business Settings */}
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Business Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-fg-muted mb-1.5">Currency Display</label>
              <input
                type="text"
                value={business.currency_display}
                onChange={e => setBusiness({ ...business, currency_display: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                placeholder="EGP"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted mb-1.5">Low Stock Default Threshold</label>
              <input
                title="Low Stock Default Threshold"
                placeholder="0"
                type="number"
                value={business.low_stock_threshold}
                onChange={e => setBusiness({ ...business, low_stock_threshold: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-3 cursor-pointer">
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  title="Enable Guest Checkout"
                  aria-label="Enable Guest Checkout"
                  checked={business.guest_checkout_enabled}
                  onChange={e => setBusiness({ ...business, guest_checkout_enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm text-white">Enable Guest Checkout</span>
              </label>
            </div>
            <div className="flex items-center gap-3 cursor-pointer">
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  title="Enable Store Pickup"
                  aria-label="Enable Store Pickup"
                  checked={business.pickup_availability}
                  onChange={e => setBusiness({ ...business, pickup_availability: e.target.checked })}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span className="ml-3 text-sm text-white">Enable Store Pickup</span>
              </label>
            </div>
          </div>
        </section>

        {/* Feature Toggles */}
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Feature Toggles</h2>
          <div className="space-y-4">
            {[
              { id: 'recently_viewed', label: 'Recently Viewed Section', obj: features, setter: setFeatures },
              { id: 'related_products', label: 'Related Products Section', obj: features, setter: setFeatures },
              { id: 'wishlist', label: 'Wishlist Functionality', obj: features, setter: setFeatures },
              { id: 'reviews', label: 'Product Reviews', obj: features, setter: setFeatures },
              { id: 'back_in_stock_alerts', label: 'Back in Stock Alerts', obj: features, setter: setFeatures },
            ].map(toggle => (
              <label key={toggle.id} htmlFor={toggle.id} className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    id={toggle.id}
                    type="checkbox"
                    className="sr-only peer"
                    title={`Enable ${toggle.label}`}
                    aria-label={`Enable ${toggle.label}`}
                    checked={(toggle.obj as Record<string, boolean>)[toggle.id]}
                    onChange={e => toggle.setter({ ...toggle.obj, [toggle.id]: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="text-sm text-white">{toggle.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Content Settings */}
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Content Settings</h2>
          <h3 className="text-sm font-semibold text-fg mt-6 mb-3">Homepage Sections Visibility</h3>
          <div className="space-y-4">
            {[
              { id: 'hero', label: 'Hero Section' },
              { id: 'featured_categories', label: 'Featured Categories' },
              { id: 'new_arrivals', label: 'New Arrivals' },
              { id: 'bestsellers', label: 'Bestsellers' },
            ].map(toggle => (
              <label key={toggle.id} className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    title={toggle.label}
                    aria-label={toggle.label}
                    checked={(content.homepage_sections as Record<string, boolean>)[toggle.id]}
                    onChange={e => setContent({
                      ...content,
                      homepage_sections: { ...content.homepage_sections, [toggle.id]: e.target.checked }
                    })}
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <span className="text-sm text-white">{toggle.label}</span>
              </label>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-fg mt-6 mb-3">Policies (Markdown)</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-fg-muted mb-2">Terms of Service</label>
              <textarea
                title="Terms of Service"
                placeholder="Enter Terms of Service content here..."
                value={policies.terms}
                onChange={e => setPolicies({ ...policies, terms: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none h-24 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted mb-2">Privacy Policy</label>
              <textarea
                title="Privacy Policy"
                placeholder="Enter Privacy Policy content here..."
                value={policies.privacy}
                onChange={e => setPolicies({ ...policies, privacy: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none h-24 font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-fg-muted mb-2">Refund Policy</label>
              <textarea
                title="Refund Policy"
                placeholder="Enter Refund Policy content here..."
                value={policies.refund}
                onChange={e => setPolicies({ ...policies, refund: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-primary focus:outline-none h-24 font-mono"
              />
            </div>
          </div>
        </section>

        {/* Notifications and Alerts Settings */}
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Notifications & Alerts</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 border-r border-white/5 pr-4">
                <h3 className="text-sm font-semibold text-fg">Channels & Thresholds</h3>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-fg-muted">Email Notifications</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={notifications.email_enabled} 
                      onChange={e => setNotifications({ ...notifications, email_enabled: e.target.checked })} title="Email Settings" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-fg-muted">Push Notifications</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={notifications.push_enabled} 
                      onChange={e => setNotifications({ ...notifications, push_enabled: e.target.checked })} title="Push Settings" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

              </div>

              <div className="space-y-4 pl-2">
                <h3 className="text-sm font-semibold text-fg">Alert Types</h3>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-fg-muted">Order Updates (Customers)</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={notifications.alerts?.order_update} 
                      onChange={e => setNotifications({ ...notifications, alerts: { ...notifications.alerts, order_update: e.target.checked }})} title="Trigger for order updates" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-fg-muted">Back In Stock (Customers)</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={notifications.alerts?.back_in_stock} 
                      onChange={e => setNotifications({ ...notifications, alerts: { ...notifications.alerts, back_in_stock: e.target.checked }})} title="Trigger for back in stock" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-fg-muted">Low Stock (Admin)</span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={notifications.alerts?.low_stock_admin} 
                      onChange={e => setNotifications({ ...notifications, alerts: { ...notifications.alerts, low_stock_admin: e.target.checked }})} title="Trigger for low stock admin" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-4">
              <h3 className="text-sm font-semibold text-fg">Message Templates</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <h4 className="text-sm font-medium text-white mb-3">Back in Stock</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-fg-muted mb-1">English</label>
                      <input type="text" title="Template English" placeholder="Template in English" value={notifications.templates?.back_in_stock?.en || ''} 
                        onChange={e => setNotifications({...notifications, templates: {...notifications.templates, back_in_stock: {...notifications.templates?.back_in_stock, en: e.target.value}}})} 
                        className="w-full bg-black/40 border border-white/10 rounded py-1.5 px-3 text-sm text-white focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-fg-muted mb-1">Arabic</label>
                      <input type="text" title="Template Arabic" placeholder="Template in Arabic" value={notifications.templates?.back_in_stock?.ar || ''} dir="rtl"
                        onChange={e => setNotifications({...notifications, templates: {...notifications.templates, back_in_stock: {...notifications.templates?.back_in_stock, ar: e.target.value}}})} 
                        className="w-full bg-black/40 border border-white/10 rounded py-1.5 px-3 text-sm text-white focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                  <h4 className="text-sm font-medium text-white mb-3">Order Shipped</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-fg-muted mb-1">English</label>
                      <input type="text" title="Template English" placeholder="Template in English" value={notifications.templates?.order_shipped?.en || ''} 
                        onChange={e => setNotifications({...notifications, templates: {...notifications.templates, order_shipped: {...notifications.templates?.order_shipped, en: e.target.value}}})} 
                        className="w-full bg-black/40 border border-white/10 rounded py-1.5 px-3 text-sm text-white focus:border-primary focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-fg-muted mb-1">Arabic</label>
                      <input type="text" title="Template Arabic" placeholder="Template in Arabic" value={notifications.templates?.order_shipped?.ar || ''} dir="rtl"
                        onChange={e => setNotifications({...notifications, templates: {...notifications.templates, order_shipped: {...notifications.templates?.order_shipped, ar: e.target.value}}})} 
                        className="w-full bg-black/40 border border-white/10 rounded py-1.5 px-3 text-sm text-white focus:border-primary focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-fg-muted italic">Available variables: {`{product_name}, {order_number}`}.</p>
            </div>
          </div>
        </section>

        {/* Audit Logs */}
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Audit Logs</h2>
          {auditLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm text-white/70">
                <thead>
                  <tr className="border-b border-white/10 text-fg-muted uppercase tracking-wider text-xs">
                    <th className="font-normal py-3 px-4">Date</th>
                    <th className="font-normal py-3 px-4">Admin</th>
                    <th className="font-normal py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4">{log.admin?.email}</td>
                      <td className="py-3 px-4 text-emerald-400">{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-fg-muted text-sm italic">No settings changes logged yet.</p>
          )}
        </section>

      </div>
    </div>
  );
}
