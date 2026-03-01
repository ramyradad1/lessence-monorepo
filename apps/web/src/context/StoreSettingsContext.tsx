"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StoreSettings {
  identity: {
    store_name: string;
    support_email: string;
    support_phone: string;
    social_links: {
      facebook?: string;
      instagram?: string;
      tiktok?: string;
      [key: string]: string | undefined;
    };
  };
  business: {
    currency_display: string;
    low_stock_threshold: number;
    guest_checkout_enabled: boolean;
    pickup_availability: boolean;
  };
  content: {
    homepage_sections: {
      hero: boolean;
      featured_categories: boolean;
      new_arrivals: boolean;
      bestsellers: boolean;
    };
    featured_collections: string[];
  };
  features: {
    recently_viewed: boolean;
    related_products: boolean;
    wishlist: boolean;
    reviews: boolean;
    back_in_stock_alerts: boolean;
  };
  localization: {
    default_language: string;
    enabled_languages: string[];
  };
  policies: {
    terms: string;
    privacy: string;
    refund: string;
  };
  // Optional legacy preservation if needed, but we keep variant normalizations out of store settings in new RPC?
  // Actually variant normalizations are in a separate table, let's keep them if they are needed here.
  variant_normalizations: { original_value: string; normalized_en: string; normalized_ar: string }[];
}

const defaultSettings: StoreSettings = {
  identity: { store_name: 'LESSENCE', support_email: '', support_phone: '', social_links: {} },
  business: { currency_display: 'EGP', low_stock_threshold: 5, guest_checkout_enabled: true, pickup_availability: true },
  content: { homepage_sections: { hero: true, featured_categories: true, new_arrivals: true, bestsellers: true }, featured_collections: [] },
  features: { recently_viewed: true, related_products: true, wishlist: true, reviews: true, back_in_stock_alerts: true },
  localization: { default_language: 'en', enabled_languages: ['en', 'ar'] },
  policies: { terms: '', privacy: '', refund: '' },
  variant_normalizations: [],
};

const StoreSettingsContext = createContext<{ settings: StoreSettings; loading: boolean }>({
  settings: defaultSettings,
  loading: true,
});

export const useStoreSettings = () => useContext(StoreSettingsContext);

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const loadedSettings = { ...defaultSettings };

      // Fetch settings from RPC (may not exist yet)
      try {
        const settingsRes = await supabase.rpc('get_store_settings');
        if (settingsRes.data && typeof settingsRes.data === 'object') {
          const data = settingsRes.data as Partial<StoreSettings>;
          if (data.identity) loadedSettings.identity = { ...defaultSettings.identity, ...data.identity };
          if (data.business) loadedSettings.business = { ...defaultSettings.business, ...data.business };
          if (data.content) loadedSettings.content = { ...defaultSettings.content, ...data.content };
          if (data.features) loadedSettings.features = { ...defaultSettings.features, ...data.features };
          if (data.localization) loadedSettings.localization = { ...defaultSettings.localization, ...data.localization };
          if (data.policies) loadedSettings.policies = { ...defaultSettings.policies, ...data.policies };
        }
      } catch {
        // RPC may not exist yet — use defaults
      }

      try {
        const normalsRes = await supabase.from('variant_normalizations').select('original_value, normalized_en, normalized_ar');
        if (!normalsRes.error && normalsRes.data) {
          loadedSettings.variant_normalizations = normalsRes.data as { original_value: string; normalized_en: string; normalized_ar: string }[];
        }
      } catch {
        // Table may not exist yet — use defaults
      }
      
      setSettings(loadedSettings);
    } catch (error) {
      // Fallback to defaults silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}
