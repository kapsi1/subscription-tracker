'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { useAuth } from '@/components/auth-provider';
import i18n from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.language) {
      if (i18n.language !== user.language) {
        i18n.changeLanguage(user.language);
      }
    }
  }, [isAuthenticated, user?.language]);

  useEffect(() => {
    const handleLanguageChange = (lang: string) => {
      document.documentElement.lang = lang.split('-')[0];
    };

    i18n.on('languageChanged', handleLanguageChange);
    // Set initial lang
    if (i18n.language) {
      handleLanguageChange(i18n.language);
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  if (!mounted) {
    // Prevent hydration differences by not rendering until client is mounted
    return null;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
