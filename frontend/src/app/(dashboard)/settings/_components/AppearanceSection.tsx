'use client';

import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import api from '@/lib/api';
import { ACCENT_COLORS, type AccentColorType, applyAccentColor } from '@/lib/appearance-utils';

export function AppearanceSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentAccent, setCurrentAccent] = useState<AccentColorType>(ACCENT_COLORS[0]);
  const [mounted, setMounted] = useState(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const cached = localStorage.getItem('app-accent-color');
    if (cached) {
      const found = ACCENT_COLORS.find((c) => c.name === cached);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || !user || isInitializedRef.current) return;

    if (user.accentColor) {
      const found = ACCENT_COLORS.find((c) => c.name === user.accentColor);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
        localStorage.setItem('app-accent-color', found.name);
      }
    }

    isInitializedRef.current = true;
  }, [mounted, user]);

  const handleAccentSelect = async (accent: AccentColorType) => {
    setCurrentAccent(accent);
    applyAccentColor(accent);
    localStorage.setItem('app-accent-color', accent.name);
    try {
      await api.patch('/users/settings', { accentColor: accent.name });
    } catch (error) {
      console.error('Failed to save accent color', error);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    try {
      await api.patch('/users/settings', { theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme setting', error);
    }
  };

  if (!mounted)
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t('settings.appearance.title')}</CardTitle>
              <CardDescription>{t('settings.appearance.desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-40" />
      </Card>
    );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>{t('settings.appearance.title')}</CardTitle>
            <CardDescription>{t('settings.appearance.desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.appearance.theme')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.appearance.themeDesc')}</p>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { id: 'light', icon: Sun, label: t('settings.appearance.themes.light') },
                { id: 'dark', icon: Moon, label: t('settings.appearance.themes.dark') },
                { id: 'system', icon: Monitor, label: t('settings.appearance.themes.system') },
              ].map((tMode) => (
                <button
                  key={tMode.id}
                  type="button"
                  onClick={() => handleThemeChange(tMode.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all group',
                    theme === tMode.id
                      ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-sm'
                      : 'bg-card hover:bg-muted hover:border-muted-foreground/30',
                  )}
                >
                  <tMode.icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      theme === tMode.id
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors',
                      theme === tMode.id
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {tMode.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/50 my-2" />

          <div className="space-y-2">
            <Label>{t('settings.appearance.accent')}</Label>
            <p className="text-sm text-muted-foreground">{t('settings.appearance.accentDesc')}</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mt-2">
              {ACCENT_COLORS.map((accent) => (
                <button
                  key={accent.name}
                  type="button"
                  onClick={() => handleAccentSelect(accent)}
                  title={t(`colors.${accent.name}`, { defaultValue: accent.name })}
                  className={cn(
                    'aspect-square rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border-2',
                    currentAccent.name === accent.name
                      ? 'border-primary ring-2 ring-primary ring-offset-2 scale-110'
                      : 'border-transparent hover:border-muted-foreground/30',
                  )}
                  style={{
                    backgroundColor:
                      resolvedTheme === 'dark' ? accent.darkPrimary : accent.lightPrimary,
                  }}
                >
                  {currentAccent.name === accent.name && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
