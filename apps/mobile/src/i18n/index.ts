import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { translations } from '@lessence/core';
import { I18nManager } from 'react-native';

// Handle RTL support
const isRTL = Localization.getLocales()[0].textDirection === 'rtl';
I18nManager.allowRTL(true);
I18nManager.forceRTL(isRTL);

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: Localization.getLocales()[0].languageCode ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    ns: ['common', 'auth', 'profile', 'checkout', 'orders', 'notifications', 'shop', 'admin'],
  });

export default i18n;
