'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    {
      id: 'subscriptions',
      label: t('subscriptions.pageTabs.subscriptions'),
      href: '/manage/subscriptions',
    },
    {
      id: 'history',
      label: t('subscriptions.pageTabs.paymentHistory'),
      href: '/manage/history',
    },
  ];

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold">
          {tabs.find((tab) => pathname === tab.href)?.label ?? tabs[0].label}
        </h1>

        <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1 self-start sm:self-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              asChild
              type="button"
              variant="ghost"
              size="sm"
              className={
                pathname === tab.href
                  ? 'bg-background text-foreground border border-border shadow-sm hover:bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }
            >
              <Link href={tab.href} aria-current={pathname === tab.href ? 'page' : undefined}>
                {tab.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
}
