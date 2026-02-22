import common_en from './en/common.json';
import common_ar from './ar/common.json';
import auth_en from './en/auth.json';
import auth_ar from './ar/auth.json';
import profile_en from './en/profile.json';
import profile_ar from './ar/profile.json';
import checkout_en from './en/checkout.json';
import checkout_ar from './ar/checkout.json';
import orders_en from './en/orders.json';
import orders_ar from './ar/orders.json';

export const translations = {
  en: {
    common: common_en,
    auth: auth_en,
    profile: profile_en,
    checkout: checkout_en,
    orders: orders_en,
  },
  ar: {
    common: common_ar,
    auth: auth_ar,
    profile: profile_ar,
    checkout: checkout_ar,
    orders: orders_ar,
  },
};

export type TranslationKeys = typeof translations.en;
