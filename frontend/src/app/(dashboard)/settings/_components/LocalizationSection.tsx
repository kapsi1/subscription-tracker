'use client';

import { CURRENCIES } from '@subtracker/shared';
import { ChevronDown, Globe, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Flag, PolandFlag, UKFlag } from '@/components/flags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/components/ui/utils';
import api from '@/lib/api';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface LocalizationSectionProps {
  currency: string;
  setCurrency: (currency: string) => void;
}

export function LocalizationSection({ currency, setCurrency }: LocalizationSectionProps) {
  const { t, i18n } = useTranslation();
  const { searchQuery } = useSettingsSearch();
  const { isAuthenticated } = useAuth();
  const [searchCurrency, setSearchCurrency] = useState('');
  const [isCurrencyPopoverOpen, setIsCurrencyPopoverOpen] = useState(false);

  const currentLanguage = i18n.language || 'en';

  const handleLanguageChange = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      if (isAuthenticated) {
        await api.patch('/users/settings', { language: lang });
      }
    } catch (_error) {
      if (isAuthenticated) {
        toast.error(t('common.error'));
      }
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight text={t('settings.localization.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.localization.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium leading-none">
              <SearchHighlight text={t('settings.localization.language')} query={searchQuery} />
            </div>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight text={t('settings.localization.languageDesc')} query={searchQuery} />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all text-left group',
                  currentLanguage.startsWith('en')
                    ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-sm'
                    : 'bg-card hover:bg-muted hover:border-muted-foreground/30',
                )}
              >
                <div className="shrink-0">
                  <UKFlag className="w-6 h-6 rounded-sm shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      currentLanguage.startsWith('en') ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t('language.en')}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center',
                    currentLanguage.startsWith('en')
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30',
                  )}
                >
                  {currentLanguage.startsWith('en') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLanguageChange('pl')}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all text-left group',
                  currentLanguage.startsWith('pl')
                    ? 'bg-primary/5 border-primary ring-1 ring-primary shadow-sm'
                    : 'bg-card hover:bg-muted hover:border-muted-foreground/30',
                )}
              >
                <div className="shrink-0">
                  <PolandFlag className="w-6 h-6 rounded-sm shadow-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      currentLanguage.startsWith('pl') ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {t('language.pl')}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center',
                    currentLanguage.startsWith('pl')
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/30',
                  )}
                >
                  {currentLanguage.startsWith('pl') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="h-px bg-border/50 my-2" />

          <div className="space-y-2">
            <Label htmlFor="currency-trigger">
              <SearchHighlight text={t('settings.localization.currency')} query={searchQuery} />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight text={t('settings.localization.currencyDesc')} query={searchQuery} />
            </p>

            <Popover open={isCurrencyPopoverOpen} onOpenChange={setIsCurrencyPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isCurrencyPopoverOpen}
                  id="currency-trigger"
                  className="w-full justify-between dark:bg-input/30 h-11"
                >
                  <span className="flex items-center gap-2">
                    {currency ? (
                      <>
                        <Flag
                          countryCode={
                            CURRENCIES.find((c) => c.code === currency)?.countryCode || 'US'
                          }
                        />
                        <span className="text-muted-foreground text-sm font-normal">
                          {currency}
                        </span>
                        <span className="text-muted-foreground font-normal overflow-hidden text-ellipsis whitespace-nowrap ml-1">
                          {CURRENCIES.find((c) => c.code === currency)?.name} (
                          {CURRENCIES.find((c) => c.code === currency)?.symbol})
                        </span>
                      </>
                    ) : (
                      'Select currency...'
                    )}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="currency-search"
                      aria-label={t('settings.localization.searchCurrency')}
                      placeholder={t('settings.localization.searchCurrency')}
                      value={searchCurrency}
                      onChange={(e) => setSearchCurrency(e.target.value)}
                      className="pl-8 h-9 text-sm focus-visible:ring-1"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {CURRENCIES.filter(
                    (c) =>
                      c.code.toLowerCase().includes(searchCurrency.toLowerCase()) ||
                      c.name.toLowerCase().includes(searchCurrency.toLowerCase()),
                  ).map((c) => (
                    <div
                      key={c.code}
                      role="option"
                      tabIndex={0}
                      aria-selected={currency === c.code}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-sm hover:bg-accent cursor-pointer text-sm transition-colors',
                        currency === c.code && 'bg-accent',
                      )}
                      onClick={() => {
                        setCurrency(c.code);
                        setIsCurrencyPopoverOpen(false);
                        setSearchCurrency('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setCurrency(c.code);
                          setIsCurrencyPopoverOpen(false);
                          setSearchCurrency('');
                        }
                      }}
                    >
                      <Flag countryCode={c.countryCode} />
                      <span className="text-muted-foreground text-xs">{c.code}</span>
                      <span className="text-muted-foreground text-xs truncate flex-1">
                        {c.name} ({c.symbol})
                      </span>
                    </div>
                  ))}
                  {CURRENCIES.filter(
                    (c) =>
                      c.code.toLowerCase().includes(searchCurrency.toLowerCase()) ||
                      c.name.toLowerCase().includes(searchCurrency.toLowerCase()),
                  ).length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No currency found.
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
