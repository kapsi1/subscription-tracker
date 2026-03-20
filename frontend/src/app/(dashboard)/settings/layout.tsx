'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsSearchProvider, useSettingsSearch } from './_components/SettingsSearchContext';

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { searchQuery, setSearchQuery, clearSearch } = useSettingsSearch();

  const tabs = [
    {
      id: 'preferences',
      label: t('settings.tabs.preferences', { defaultValue: 'Preferences' }),
      href: '/settings/preferences',
    },
    {
      id: 'profile',
      label: t('settings.tabs.profile', { defaultValue: 'Profile' }),
      href: '/settings/profile',
    },
  ];

  return (
    <div className="w-full max-w-[1055px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold">{t('settings.title')}</h1>

        <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1 self-start sm:self-auto">
          {tabs.map((tab) => (
            <Link key={tab.id} href={tab.href}>
              <Button
                type="button"
                variant={pathname === tab.href ? 'secondary' : 'ghost'}
                size="sm"
              >
                {tab.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('settings.searchPlaceholder', { defaultValue: 'Search settings...' })}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 w-full h-11"
          id="settings-search-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            title={t('settings.clearSearch', { defaultValue: 'Clear search' })}
            id="clear-settings-search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div>{children}</div>
    </div>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsSearchProvider>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </SettingsSearchProvider>
  );
}
