import { LOCALES } from '@subscription-tracker/shared';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: LOCALES.en },
  pl: { translation: LOCALES.pl },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl'],
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
