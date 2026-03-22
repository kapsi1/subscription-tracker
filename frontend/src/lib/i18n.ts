import { LOCALES } from '@subtracker/shared';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: LOCALES.en },
  pl: { translation: LOCALES.pl },
  de: { translation: LOCALES.de },
  es: { translation: LOCALES.es },
  fr: { translation: LOCALES.fr },
  it: { translation: LOCALES.it },
  pt: { translation: LOCALES.pt },
  ru: { translation: LOCALES.ru },
  zh: { translation: LOCALES.zh },
  ja: { translation: LOCALES.ja },
  ko: { translation: LOCALES.ko },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pl', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
