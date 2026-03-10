'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { ACCENT_COLORS, applyAccentColor } from '@/lib/appearance-utils';

export function AppearanceInitializer() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isInitializedRef = useRef(false);

  // Initial load from localStorage for zero-flicker
  useEffect(() => {
    const cached = localStorage.getItem('app-accent-color');
    if (cached) {
      const found = ACCENT_COLORS.find((c) => c.name === cached);
      if (found) {
        applyAccentColor(found);
      }
    }
  }, []);

  // Synchronize with user settings from backend
  useEffect(() => {
    if (!user || isInitializedRef.current) return;

    if (user.theme && (theme === 'system' || !theme)) {
      if (theme !== user.theme) {
        setTheme(user.theme);
      }
    }

    if (user.accentColor) {
      const found = ACCENT_COLORS.find((c) => c.name === user.accentColor);
      if (found) {
        applyAccentColor(found);
        localStorage.setItem('app-accent-color', found.name);
      }
    }

    isInitializedRef.current = true;
  }, [user, theme, setTheme]);

  return null;
}
