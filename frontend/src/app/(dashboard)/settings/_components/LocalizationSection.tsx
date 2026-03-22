'use client';

import { CURRENCIES } from '@subtracker/shared';
import { ChevronDown, Globe, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import {
  ChineseFlag,
  Flag,
  FrenchFlag,
  GermanFlag,
  ItalianFlag,
  JapaneseFlag,
  KoreanFlag,
  PolandFlag,
  PortugalFlag,
  RussianFlag,
  SpanishFlag,
  UKFlag,
} from '@/components/flags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/components/ui/utils';
import api from '@/lib/api';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

interface LocalizationSectionProps {
  currency: string;
  setCurrency: (currency: string) => void;
}

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en', Flag: UKFlag },
  { code: 'pl', labelKey: 'language.pl', Flag: PolandFlag },
  { code: 'de', labelKey: 'language.de', Flag: GermanFlag },
  { code: 'es', labelKey: 'language.es', Flag: SpanishFlag },
  { code: 'fr', labelKey: 'language.fr', Flag: FrenchFlag },
  { code: 'it', labelKey: 'language.it', Flag: ItalianFlag },
  { code: 'pt', labelKey: 'language.pt', Flag: PortugalFlag },
  { code: 'ru', labelKey: 'language.ru', Flag: RussianFlag },
  { code: 'zh', labelKey: 'language.zh', Flag: ChineseFlag },
  { code: 'ja', labelKey: 'language.ja', Flag: JapaneseFlag },
  { code: 'ko', labelKey: 'language.ko', Flag: KoreanFlag },
];

export function LocalizationSection({ currency, setCurrency }: LocalizationSectionProps) {
  const { t, i18n } = useTranslation();
  const { searchQuery } = useSettingsSearch();
  const { isAuthenticated } = useAuth();
  const [searchCurrency, setSearchCurrency] = useState('');
  const [isCurrencyPopoverOpen, setIsCurrencyPopoverOpen] = useState(false);

  const currentLanguageCode = (i18n.language || 'en').split('-')[0];

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
            <Label htmlFor="language-select">
              <SearchHighlight text={t('settings.localization.language')} query={searchQuery} />
            </Label>
            <p className="text-sm text-muted-foreground">
              <SearchHighlight text={t('settings.localization.languageDesc')} query={searchQuery} />
            </p>
            <div className="pt-1">
              <Select value={currentLanguageCode} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-full h-11 dark:bg-input/30">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-3">
                        <lang.Flag className="w-5 h-5 rounded-[1px]" />
                        <span className="text-sm">{t(lang.labelKey)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
