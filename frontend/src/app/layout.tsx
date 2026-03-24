import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cookies } from 'next/headers';
import { DeferredAnalytics } from '@/components/deferred-analytics';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://subtracker.cc'),
  title: {
    default: 'SubTracker',
    template: '%s | SubTracker',
  },
  description: 'Manage and forecast your subscriptions cost efficiently',
  applicationName: 'SubTracker',
  authors: [{ name: 'Kamil Kapsiak', url: 'https://github.com/kapsi1' }],
  generator: 'Next.js',
  keywords: ['subscription', 'tracker', 'finance', 'cost', 'management', 'forecast'],
  referrer: 'origin-when-cross-origin',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'SubTracker',
    description: 'Manage and forecast your subscriptions cost efficiently',
    url: 'https://subtracker.cc',
    siteName: 'SubTracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SubTracker Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SubTracker',
    description: 'Manage and forecast your subscriptions cost efficiently',
    images: ['/og-image.png'],
    creator: '@kapsi1',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
