'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useAuth } from '@/components/auth-provider';
import i18n, { initializeI18n } from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    initializeI18n(isAuthenticated ? user?.language : undefined)
      .then(() => {
        if (isActive) {
          setIsReady(true);
        }
      })
      .catch(() => {
        if (isActive) {
          setIsReady(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, [isAuthenticated, user?.language]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const handleLanguageChange = (lang: string) => {
      document.documentElement.lang = lang.split('-')[0];
    };

    i18n.on('languageChanged', handleLanguageChange);

    if (i18n.language) {
      handleLanguageChange(i18n.language);
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
