'use client';

import { CURRENCIES } from '@subscription-tracker/shared';
import { ChevronDown, Globe, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag } from '@/components/flags';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/components/ui/utils';

interface LocalizationSectionProps {
  currency: string;
  setCurrency: (currency: string) => void;
}

export function LocalizationSection({ currency, setCurrency }: LocalizationSectionProps) {
  const { t } = useTranslation();
  const [searchCurrency, setSearchCurrency] = useState('');
  const [isCurrencyPopoverOpen, setIsCurrencyPopoverOpen] = useState(false);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle>{t('settings.localization.title')}</CardTitle>
            <CardDescription>{t('settings.localization.desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">{t('settings.localization.currency')}</Label>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.localization.currencyDesc')}
          </p>

          <Popover open={isCurrencyPopoverOpen} onOpenChange={setIsCurrencyPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isCurrencyPopoverOpen}
                className="w-full justify-between dark:bg-input/30"
              >
                <span className="flex items-center gap-2">
                  {currency ? (
                    <>
                      <Flag
                        countryCode={
                          CURRENCIES.find((c) => c.code === currency)?.countryCode || 'US'
                        }
                      />
                      <span>{currency}</span>
                      <span className="text-muted-foreground font-normal">
                        - {CURRENCIES.find((c) => c.code === currency)?.name}
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
                  >
                    <Flag countryCode={c.countryCode} />
                    <span className="font-medium">{c.code}</span>
                    <span className="text-muted-foreground text-xs truncate">- {c.name}</span>
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
      </CardContent>
    </Card>
  );
}
