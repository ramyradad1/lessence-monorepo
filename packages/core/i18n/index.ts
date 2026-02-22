import common_en from './en/common.json';
import common_ar from './ar/common.json';
import auth_en from './en/auth.json';
import auth_ar from './ar/auth.json';
import checkout_en from './en/checkout.json';
import checkout_ar from './ar/checkout.json';
import orders_en from './en/orders.json';
import orders_ar from './ar/orders.json';
import shop_en from './en/shop.json';
import shop_ar from './ar/shop.json';
import admin_en from './en/admin.json';
import admin_ar from './ar/admin.json';
import notifications_en from './en/notifications.json';
import notifications_ar from './ar/notifications.json';
import product_en from './en/product.json';
import product_ar from './ar/product.json';
import validation_en from './en/validation.json';
import validation_ar from './ar/validation.json';
import profile_en from './en/profile.json';
import profile_ar from './ar/profile.json';
import cart_en from './en/cart.json';
import cart_ar from './ar/cart.json';

export const translations = {
  en: {
    common: common_en,
    auth: auth_en,
    profile: profile_en,
    checkout: checkout_en,
    orders: orders_en,
    shop: shop_en,
    admin: admin_en,
    notifications: notifications_en,
    product: product_en,
    validation: validation_en,
    cart: cart_en,
  },
  ar: {
    common: common_ar,
    auth: auth_ar,
    profile: profile_ar,
    checkout: checkout_ar,
    orders: orders_ar,
    shop: shop_ar,
    admin: admin_ar,
    notifications: notifications_ar,
    product: product_ar,
    validation: validation_ar,
    cart: cart_ar,
  },
};

export type TranslationKeys = typeof translations.en;
