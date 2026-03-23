import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

const SUPPORTED_LANGUAGES = ['en', 'pl', 'de', 'es', 'fr', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
type TranslationMessages = Record<string, unknown>;

const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
const LANGUAGE_STORAGE_KEY = 'i18nextLng';
const i18n = i18next.createInstance();

const localeLoaders: Record<SupportedLanguage, () => Promise<{ default: TranslationMessages }>> = {
  en: () => import('../../../packages/shared/src/locales/en.json'),
  pl: () => import('../../../packages/shared/src/locales/pl.json'),
  de: () => import('../../../packages/shared/src/locales/de.json'),
  es: () => import('../../../packages/shared/src/locales/es.json'),
  fr: () => import('../../../packages/shared/src/locales/fr.json'),
  it: () => import('../../../packages/shared/src/locales/it.json'),
  pt: () => import('../../../packages/shared/src/locales/pt.json'),
  ru: () => import('../../../packages/shared/src/locales/ru.json'),
  zh: () => import('../../../packages/shared/src/locales/zh.json'),
  ja: () => import('../../../packages/shared/src/locales/ja.json'),
  ko: () => import('../../../packages/shared/src/locales/ko.json'),
};

const loadedLanguages = new Set<SupportedLanguage>();
let initializationPromise: Promise<typeof i18n> | null = null;

function normalizeLanguage(language?: string | null): SupportedLanguage {
  const lang = (language || '').split('-')[0].toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
    return lang as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

function detectPreferredLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const storage = window.localStorage;
  const storedLanguage =
    storage && typeof storage.getItem === 'function'
      ? storage.getItem(LANGUAGE_STORAGE_KEY)
      : null;
  if (storedLanguage) {
    return normalizeLanguage(storedLanguage);
  }

  const navigatorLanguages = window.navigator.languages ?? [window.navigator.language];
  for (const language of navigatorLanguages) {
    const normalized = normalizeLanguage(language);
    if (normalized) {
      return normalized;
    }
  }

  return DEFAULT_LANGUAGE;
}

function persistLanguage(language: SupportedLanguage) {
  if (typeof window === 'undefined') {
    return;
  }

  const storage = window.localStorage;
  if (!storage || typeof storage.setItem !== 'function') {
    return;
  }

  storage.setItem(LANGUAGE_STORAGE_KEY, language);
}

async function ensureLanguageResources(language: SupportedLanguage) {
  if (loadedLanguages.has(language)) {
    return;
  }

  const module = await localeLoaders[language]();
  const resources = module.default ?? module;
  i18n.addResourceBundle(language, 'translation', resources, true, true);
  loadedLanguages.add(language);
}

async function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await i18n.use(initReactI18next).init({
        resources: {},
        lng: DEFAULT_LANGUAGE,
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES,
        load: 'languageOnly',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });

      return i18n;
    })();
  }

  return initializationPromise;
}

export async function initializeI18n(preferredLanguage?: string | null) {
  const targetLanguage = normalizeLanguage(preferredLanguage ?? detectPreferredLanguage());

  await ensureInitialized();
  await Promise.all([
    ensureLanguageResources(targetLanguage),
    targetLanguage === DEFAULT_LANGUAGE ? Promise.resolve() : ensureLanguageResources(DEFAULT_LANGUAGE),
  ]);

  if (i18n.language !== targetLanguage) {
    await i18n.changeLanguage(targetLanguage);
  }

  persistLanguage(targetLanguage);
  return i18n;
}

export async function changeI18nLanguage(language: string) {
  const targetLanguage = normalizeLanguage(language);

  await ensureInitialized();
  await Promise.all([
    ensureLanguageResources(targetLanguage),
    targetLanguage === DEFAULT_LANGUAGE ? Promise.resolve() : ensureLanguageResources(DEFAULT_LANGUAGE),
  ]);

  if (i18n.language !== targetLanguage) {
    await i18n.changeLanguage(targetLanguage);
  }

  persistLanguage(targetLanguage);
  return targetLanguage;
}

export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, normalizeLanguage };
void ensureInitialized();
export default i18n;
