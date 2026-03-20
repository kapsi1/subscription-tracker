'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system', resolvedTheme } = useTheme();
  const isLightTheme = (resolvedTheme ?? theme) === 'light';

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      richColors
      style={
        (isLightTheme
          ? {
              '--normal-bg': 'color-mix(in srgb, var(--card) 88%, var(--foreground) 12%)',
              '--normal-text': 'var(--foreground)',
              '--normal-border': 'color-mix(in srgb, var(--border) 72%, var(--foreground) 28%)',
              '--success-bg': 'color-mix(in srgb, #22c55e 24%, white)',
              '--success-border': 'color-mix(in srgb, #16a34a 38%, white)',
              '--success-text': 'var(--foreground)',
              '--error-bg': 'color-mix(in srgb, #ef4444 22%, white)',
              '--error-border': 'color-mix(in srgb, #dc2626 34%, white)',
              '--error-text': 'var(--foreground)',
              '--info-bg': 'color-mix(in srgb, #3b82f6 22%, white)',
              '--info-border': 'color-mix(in srgb, #2563eb 34%, white)',
              '--info-text': 'var(--foreground)',
              '--warning-bg': 'color-mix(in srgb, #f59e0b 26%, white)',
              '--warning-border': 'color-mix(in srgb, #d97706 38%, white)',
              '--warning-text': 'var(--foreground)',
            }
          : {
              '--normal-bg': 'var(--popover)',
              '--normal-text': 'white',
              '--success-text': 'white',
              '--error-text': 'white',
              '--info-text': 'white',
              '--warning-text': 'white',
              '--normal-border': 'var(--border)',
            }) as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
