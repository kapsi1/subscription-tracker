'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '@/lib/query-client';

export function Providers({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthProvider initialToken={initialToken}>
          <I18nProvider>
            {children}
            <Toaster />
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
