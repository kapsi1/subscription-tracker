import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/components/i18n-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Subscription Tracker',
  description: 'Manage and forecast your subscriptions cost efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <I18nProvider>
              {children}
              <Toaster />
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-XYZ" />
      </body>
    </html>
  );
}
