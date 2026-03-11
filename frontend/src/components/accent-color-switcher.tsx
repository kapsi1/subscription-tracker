'use client';

// Force HMR reload

import {
  COLORS,
  type ColorsConfig,
  type AccentColor as SharedAccentColor,
} from '@subscription-tracker/shared';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/components/ui/utils';
import api from '@/lib/api';

interface AccentColor extends SharedAccentColor {
  name: string;
}

const ACCENT_COLORS: AccentColor[] = Object.entries(COLORS as ColorsConfig).map(
  ([name, values]) => ({
    name,
    ...values,
  }),
);

export function AccentColorSwitcher() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentAccent, setCurrentAccent] = useState<AccentColor>(ACCENT_COLORS[0]);
  const [mounted, setMounted] = useState(false);
  const isInitializedRef = useRef(false);

  const applyAccentColor = useCallback((accent: AccentColor) => {
    let styleTag = document.getElementById('accent-color-styles');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'accent-color-styles';
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
      :root {
        --primary: ${accent.lightPrimary};
        --accent: ${accent.lightAccent};
        --accent-foreground: ${accent.lightForeground};
        --ring: ${accent.lightPrimary};
        --chart-bar: ${accent.chartBar}80;
        --chart-1: #3b82f6;
        --chart-2: #8b5cf6;
        --chart-3: #ec4899;
        --chart-4: #06b6d4;
        --chart-5: #10b981;
        --sidebar-primary: ${accent.lightPrimary};
        --sidebar-ring: ${accent.lightPrimary};
        --background: ${accent.lightBg};
        --card: color-mix(in srgb, white, ${accent.lightPrimary} 2%);
        --secondary: color-mix(in srgb, white, ${accent.lightPrimary} 5%);
        --border: ${accent.lightPrimary}20;
      }
      .dark {
        --primary: ${accent.darkPrimary};
        --accent: ${accent.darkAccent};
        --accent-foreground: ${accent.darkForeground};
        --ring: ${accent.darkPrimary};
        --chart-bar: ${accent.chartBar}aa;
        --chart-1: #3b82f6; /* Fixed Blue */
        --chart-2: #8b5cf6;
        --chart-3: #ec4899;
        --chart-4: #06b6d4;
        --chart-5: #10b981;
        --sidebar-primary: ${accent.darkPrimary};
        --sidebar-ring: ${accent.darkPrimary};
        --background: ${accent.darkBg};
        --card: color-mix(in srgb, ${accent.darkBg}, white 4%);
        --muted: color-mix(in srgb, ${accent.darkBg}, white 8%);
        --secondary: ${accent.darkBg};
        --border: ${accent.darkPrimary}30;
      }
    `;
  }, []);

  useEffect(() => {
    setMounted(true);

    // Initial load from localStorage for zero-flicker (accent color only)
    const cached = localStorage.getItem('app-accent-color');
    if (cached) {
      const found = ACCENT_COLORS.find((c) => c.name === cached);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
      }
    }
  }, [applyAccentColor]);

  // Synchronize with user settings from backend ONCE
  useEffect(() => {
    if (!mounted || !user || isInitializedRef.current) return;

    if (user.theme && (theme === 'system' || !theme)) {
      // Only override if we are at default or uninitialized
      // This prevents flickering if next-themes already loaded from localStorage
      if (theme !== user.theme) {
        setTheme(user.theme);
      }
    }

    if (user.accentColor) {
      const found = ACCENT_COLORS.find((c) => c.name === user.accentColor);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
        localStorage.setItem('app-accent-color', found.name);
      }
    }

    isInitializedRef.current = true;
  }, [mounted, user, theme, setTheme, applyAccentColor]);

  const handleSelect = async (accent: AccentColor) => {
    setCurrentAccent(accent);
    applyAccentColor(accent);
    localStorage.setItem('app-accent-color', accent.name);
    try {
      await api.patch('/users/settings', { accentColor: accent.name });
    } catch (error) {
      console.error('Failed to save accent color', error);
    }
  };

  const toggleTheme = async () => {
    const currentTheme = theme || resolvedTheme || 'light';
    let newTheme: string;

    if (currentTheme === 'light') newTheme = 'dark';
    else if (currentTheme === 'dark') newTheme = 'system';
    else newTheme = 'light';

    setTheme(newTheme);
    try {
      await api.patch('/users/settings', { theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme setting', error);
    }
  };

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t('language.accentColor')}
          aria-label={t('language.accentColor')}
          className="h-9 w-9 flex items-center justify-center translate-y-px"
        >
          <div
            className="w-4 h-4 rounded-full shadow-inner border border-white/20 transition-transform active:scale-90"
            style={{
              backgroundColor:
                resolvedTheme === 'dark' ? currentAccent.darkPrimary : currentAccent.lightPrimary,
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-3 w-56">
        <div className="flex items-center justify-between mb-2">
          <DropdownMenuLabel className="p-0">{t('language.selectAccentColor')}</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg"
            title={
              theme === 'light'
                ? t('theme.dark')
                : theme === 'dark'
                  ? t('theme.system')
                  : t('theme.light')
            }
            aria-label={
              theme === 'light'
                ? t('theme.dark')
                : theme === 'dark'
                  ? t('theme.system')
                  : t('theme.light')
            }
          >
            {theme === 'light' && <Sun className="h-4 w-4" />}
            {theme === 'dark' && <Moon className="h-4 w-4" />}
            {theme === 'system' && <Monitor className="h-4 w-4" />}
          </Button>
        </div>
        <DropdownMenuSeparator className="mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {ACCENT_COLORS.map((accent) => (
            <button
              key={accent.name}
              type="button"
              onClick={() => handleSelect(accent)}
              title={t(`colors.${accent.name}`, { defaultValue: accent.name })}
              aria-label={t(`colors.${accent.name}`, { defaultValue: accent.name })}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border border-transparent',
                currentAccent.name === accent.name
                  ? 'ring-2 ring-slate-950 ring-offset-2 scale-110 shadow-md'
                  : 'hover:shadow-md',
              )}
              style={{
                backgroundColor:
                  resolvedTheme === 'dark' ? accent.darkPrimary : accent.lightPrimary,
              }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
