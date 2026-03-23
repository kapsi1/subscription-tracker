import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { DeferredAnalytics } from '@/components/deferred-analytics';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SubTracker',
  description: 'Manage and forecast your subscriptions cost efficiently',
  manifest: '/site.webmanifest',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const gaId = process.env.NEXT_PUBLIC_GA_ID || '';
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || '';

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialToken={token}>{children}</Providers>
        <DeferredAnalytics gaId={gaId} gtmId={gtmId} />
      </body>
    </html>
  );
}
