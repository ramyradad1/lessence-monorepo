"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, CheckCircle2 } from 'lucide-react';

export default function AdminPoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [policies, setPolicies] = useState({ terms: '', privacy: '', refund: '' });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data } = await supabase.from('store_settings').select('value').eq('key', 'policies').single();
    if (data && data.value) {
      setPolicies(data.value);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    await supabase.from('store_settings').upsert([
      { key: 'policies', value: policies }
    ]);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        action: 'UPDATE_POLICIES',
        entity_type: 'store_settings',
        new_data: { policies }
      });
    }

    setMessage('Policies saved successfully');
    setSaving(false);
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
          <h1 className="text-3xl font-sans text-white mb-2">Store Policies</h1>
          <p className="text-fg-muted">Manage legal and store policy text presented on the storefront.</p>
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
          Save Policies
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <div className="space-y-6">
        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Refund Policy</h2>
          <textarea
            value={policies.refund}
            onChange={e => setPolicies({ ...policies, refund: e.target.value })}
            className="w-full h-48 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors resize-y leading-relaxed"
            placeholder="Enter your refund policy here..."
          />
        </section>

        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Terms of Service</h2>
          <textarea
            value={policies.terms}
            onChange={e => setPolicies({ ...policies, terms: e.target.value })}
            className="w-full h-48 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors resize-y leading-relaxed"
            placeholder="Enter your terms of service here..."
          />
        </section>

        <section className="bg-surface-dark border border-white/5 rounded-2xl p-6">
          <h2 className="text-xl font-sans text-white mb-4">Privacy Policy</h2>
          <textarea
            value={policies.privacy}
            onChange={e => setPolicies({ ...policies, privacy: e.target.value })}
            className="w-full h-48 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors resize-y leading-relaxed"
            placeholder="Enter your privacy policy here..."
          />
        </section>
      </div>
    </div>
  );
}
