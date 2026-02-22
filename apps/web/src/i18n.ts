import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// Can be imported from a shared config
export const locales = ['en', 'ar'];

export default getRequestConfig(async (params) => {
  const locale = params.locale as string;
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale)) notFound();

  return {
    locale,
    messages: {
      common: (await import(`../../../packages/core/i18n/${locale}/common.json`)).default,
      auth: (await import(`../../../packages/core/i18n/${locale}/auth.json`)).default,
      product: (await import(`../../../packages/core/i18n/${locale}/product.json`)).default,
      shop: (await import(`../../../packages/core/i18n/${locale}/shop.json`)).default,
      cart: (await import(`../../../packages/core/i18n/${locale}/cart.json`)).default,
      checkout: (await import(`../../../packages/core/i18n/${locale}/checkout.json`)).default,
      profile: (await import(`../../../packages/core/i18n/${locale}/profile.json`)).default,
      admin: (await import(`../../../packages/core/i18n/${locale}/admin.json`)).default,
      validation: (await import(`../../../packages/core/i18n/${locale}/validation.json`)).default,
    }
  };
});
