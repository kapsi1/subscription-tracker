'use client';

import { COLORS, type ColorsConfig, getAccentColor } from '@subscription-tracker/shared';
import type { TFunction } from 'i18next';
import { Monitor, Moon, Palette, Pipette, RotateCcw, Save, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import api from '@/lib/api';
import { ACCENT_COLORS, type AccentColorType, applyAccentColor } from '@/lib/appearance-utils';

// Memoized Theme Selector
const ThemeSelector = React.memo(
  ({
    currentTheme,
    onChange,
    t,
  }: {
    currentTheme: string | undefined;
    onChange: (id: string) => void;
    t: TFunction;
  }) => {
    const themes = useMemo(
      () => [
        { id: 'light', icon: Sun, label: t('settings.appearance.themes.light') },
        { id: 'dark', icon: Moon, label: t('settings.appearance.themes.dark') },
        { id: 'system', icon: Monitor, label: t('settings.appearance.themes.system') },
      ],
      [t],
    );

    return (
      <div className="grid grid-cols-3 gap-3 mt-2">
        {themes.map((tMode) => (
          <button
            key={tMode.id}
            type="button"
            onClick={() => onChange(tMode.id)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all group',
              currentTheme === tMode.id
                ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-sm'
                : 'bg-card hover:bg-muted hover:border-muted-foreground/30',
            )}
          >
            <tMode.icon
              className={cn(
                'w-5 h-5 transition-colors',
                currentTheme === tMode.id
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            />
            <span
              className={cn(
                'text-xs font-medium transition-colors',
                currentTheme === tMode.id
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground',
              )}
            >
              {tMode.label}
            </span>
          </button>
        ))}
      </div>
    );
  },
);

ThemeSelector.displayName = 'ThemeSelector';

// Memoized Preset Selector
const PresetSelector = React.memo(
  ({
    currentAccentName,
    onSelect,
    t,
    resolvedTheme,
  }: {
    currentAccentName: string | undefined;
    onSelect: (accent: AccentColorType) => void;
    t: TFunction;
    resolvedTheme: string | undefined;
  }) => {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mt-2">
        {ACCENT_COLORS.map((accent) => (
          <button
            key={accent.name}
            type="button"
            onClick={() => onSelect(accent)}
            title={t(`colors.${accent.name}`, { defaultValue: accent.name })}
            className={cn(
              'aspect-square rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border-2',
              currentAccentName === accent.name
                ? 'border-primary ring-2 ring-primary ring-offset-2 scale-110'
                : 'border-transparent hover:border-muted-foreground/30',
            )}
            style={{
              backgroundColor: resolvedTheme === 'dark' ? accent.darkPrimary : accent.lightPrimary,
            }}
          >
            {currentAccentName === accent.name && (
              <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
            )}
          </button>
        ))}
      </div>
    );
  },
);

PresetSelector.displayName = 'PresetSelector';

import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

export function AppearanceSection() {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentAccent, setCurrentAccent] = useState<AccentColorType>(ACCENT_COLORS[0]);
  const [lastSavedAccentName, setLastSavedAccentName] = useState<string>('Indigo');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const cached = localStorage.getItem('app-accent-color');
    const history = localStorage.getItem('app-accent-history');
    if (history) {
      try {
        setRecentColors(JSON.parse(history).slice(0, 4));
      } catch (e) {
        console.error('Failed to parse color history', e);
      }
    }
    if (cached) {
      setLastSavedAccentName(cached);
      if (cached.startsWith('#')) {
        const custom = { ...getAccentColor(cached, COLORS as ColorsConfig), name: cached };
        setCurrentAccent(custom);
        applyAccentColor(custom);
      } else {
        const found = ACCENT_COLORS.find((c) => c.name === cached);
        if (found) {
          setCurrentAccent(found);
          applyAccentColor(found);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || !user || isInitializedRef.current) return;

    if (user.recentAccentColors && user.recentAccentColors.length > 0) {
      setRecentColors(user.recentAccentColors.slice(0, 4));
    }

    if (user.accentColor) {
      if (user.accentColor.startsWith('#')) {
        const custom = {
          ...getAccentColor(user.accentColor, COLORS as ColorsConfig),
          name: user.accentColor,
        };
        setCurrentAccent(custom);
        applyAccentColor(custom);
        localStorage.setItem('app-accent-color', user.accentColor);
      } else {
        const found = ACCENT_COLORS.find((c) => c.name === user.accentColor);
        if (found) {
          setCurrentAccent(found);
          applyAccentColor(found);
          localStorage.setItem('app-accent-color', found.name);
        }
      }
    }

    isInitializedRef.current = true;
  }, [mounted, user]);

  const handleThemeChange = useCallback(
    async (newTheme: string) => {
      setTheme(newTheme);
      try {
        await api.patch('/users/settings', { theme: newTheme });
      } catch (error) {
        console.error('Failed to save theme setting', error);
      }
    },
    [setTheme],
  );

  const handleAccentSelect = useCallback(async (accent: AccentColorType) => {
    if (!accent.name) return;
    setCurrentAccent(accent);
    applyAccentColor(accent);
    setLastSavedAccentName(accent.name);
    setIsDirty(false);
    localStorage.setItem('app-accent-color', accent.name);
    try {
      await api.patch('/users/settings', { accentColor: accent.name });
    } catch (error) {
      console.error('Failed to save accent color', error);
    }
  }, []);

  const handleRevert = useCallback(() => {
    if (lastSavedAccentName.startsWith('#')) {
      const custom = {
        ...getAccentColor(lastSavedAccentName, COLORS as ColorsConfig),
        name: lastSavedAccentName,
      };
      setCurrentAccent(custom);
      applyAccentColor(custom);
    } else {
      const found = ACCENT_COLORS.find((c) => c.name === lastSavedAccentName);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
      }
    }
    setIsDirty(false);
  }, [lastSavedAccentName]);

  const lastUpdateRef = useRef<number>(0);
  const handleCustomColorChange = useCallback(
    (hex: string) => {
      // 1. Always update the browser styles immediately (direct DOM manipulation is fast)
      const accent = getAccentColor(hex, COLORS as ColorsConfig);
      applyAccentColor({ ...accent, name: hex });

      // 2. Throttle the React state updates to avoid heavy re-renders
      const now = Date.now();
      if (now - lastUpdateRef.current > 60) {
        // 60ms = ~16fps state updates
        setCurrentAccent({ ...accent, name: hex });
        setIsDirty(hex !== lastSavedAccentName);
        lastUpdateRef.current = now;
      }
    },
    [lastSavedAccentName],
  );

  const handleSaveCustomColor = useCallback(async () => {
    if (!currentAccent.name) return;
    const hex = currentAccent.name;

    // Update history
    let updatedHistory: string[] = [];
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== hex);
      updatedHistory = [hex, ...filtered].slice(0, 4);
      localStorage.setItem('app-accent-history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });

    setLastSavedAccentName(hex);
    setIsDirty(false);
    localStorage.setItem('app-accent-color', hex);
    try {
      await api.patch('/users/settings', {
        accentColor: hex,
        recentAccentColors: updatedHistory,
      });
      toast.success(t('settings.appearance.saveSuccess'));
    } catch (error) {
      console.error('Failed to save custom accent color', error);
      toast.error(t('settings.appearance.saveError'));
    }
  }, [currentAccent.name, t]);

  if (!mounted)
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>
                <SearchHighlight text={t('settings.appearance.title')} query={searchQuery} />
              </CardTitle>
              <CardDescription>
                <SearchHighlight text={t('settings.appearance.desc')} query={searchQuery} />
              </CardDescription>
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
            <CardTitle>
              <SearchHighlight text={t('settings.appearance.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.appearance.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              <SearchHighlight text={t('settings.appearance.theme')} query={searchQuery} />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight text={t('settings.appearance.themeDesc')} query={searchQuery} />
            </p>
            <ThemeSelector currentTheme={theme} onChange={handleThemeChange} t={t} />
          </div>

          <div className="h-px bg-border/50 my-2" />

          <div className="space-y-2">
            <Label>
              <SearchHighlight text={t('settings.appearance.accent')} query={searchQuery} />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight text={t('settings.appearance.accentDesc')} query={searchQuery} />
            </p>
            <PresetSelector
              currentAccentName={currentAccent.name}
              onSelect={handleAccentSelect}
              t={t}
              resolvedTheme={resolvedTheme}
            />
          </div>

          <div className="h-px bg-border/50 my-2" />

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-8">
              {/* Custom Picker Group */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Pipette className="w-4 h-4 text-muted-foreground" />
                  <Label>{t('settings.appearance.customColor')}</Label>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <input
                      type="color"
                      value={
                        currentAccent.name?.startsWith('#')
                          ? currentAccent.name
                          : resolvedTheme === 'dark'
                            ? currentAccent.darkPrimary
                            : currentAccent.lightPrimary
                      }
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      className="w-12 h-12 rounded-full cursor-pointer border-2 border-border bg-card p-0 overflow-hidden transition-all hover:border-primary/50 shadow-sm [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full"
                      title={t('settings.appearance.pickCustomColor')}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {currentAccent.name?.startsWith('#')
                        ? currentAccent.name
                        : t(`colors.${currentAccent.name}`, {
                            defaultValue: currentAccent.name,
                          })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('settings.appearance.customColorHint')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Colors Group */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Label>{t('settings.appearance.recentColors')}</Label>
                </div>
                <div className="flex items-center gap-3">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const hex = recentColors[i] || '#000000';
                    const key = `recent-${i}-${hex}`;
                    const hasColor = !!recentColors[i];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => hasColor && handleCustomColorChange(hex)}
                        disabled={!hasColor}
                        className={cn(
                          'w-12 h-12 rounded-full border-2 border-border/50 shadow-sm transition-all',
                          hasColor
                            ? 'hover:scale-110 active:scale-95 cursor-pointer hover:border-muted-foreground/30'
                            : 'cursor-default opacity-20',
                        )}
                        style={{ backgroundColor: hex }}
                        title={hasColor ? hex : undefined}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end h-12 min-w-[170px] mt-auto">
                {isDirty ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveCustomColor}
                      className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {t('common.save')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRevert}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('common.reset')}
                    </Button>
                  </div>
                ) : (
                  <div className="h-9" /> /* Maintain vertical space */
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
