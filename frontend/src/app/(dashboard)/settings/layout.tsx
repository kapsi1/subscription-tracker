'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();

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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">{t('settings.title')}</h1>
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href}>
            <Button type="button" variant={pathname === tab.href ? 'secondary' : 'ghost'} size="sm">
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      <div>{children}</div>
    </div>
  );
}
