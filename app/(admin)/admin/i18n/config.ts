'use client';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import lo from './locales/lo.json';

export const ADMIN_LOCALE_STORAGE_KEY = 'mcins_admin_locale';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { admin: en },
        lo: { admin: lo },
      },
      fallbackLng: 'lo',
      supportedLngs: ['en', 'lo'],
      defaultNS: 'admin',
      ns: ['admin'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: ADMIN_LOCALE_STORAGE_KEY,
        caches: ['localStorage'],
      },
      react: { useSuspense: false },
    });
}

export default i18n;
