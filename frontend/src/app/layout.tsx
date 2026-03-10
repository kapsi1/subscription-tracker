import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from "@/components/providers";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Subscription Tracker',
  description: 'Manage and forecast your subscriptions cost efficiently',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers initialToken={token}>
          {children}
        </Providers>
        <GoogleAnalytics gaId="G-XYZ" />
      </body>
    </html>
  );
}
