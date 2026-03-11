import colors from './colors.json';
import currencies from './currencies.json';
import en from './locales/en.json';
import pl from './locales/pl.json';

export const COLORS = colors;
export const CURRENCIES = currencies as Currency[];
export const LOCALES = { en, pl };

export type AccentColor = {
  lightPrimary: string;
  darkPrimary: string;
  lightAccent: string;
  darkAccent: string;
  lightForeground: string;
  darkForeground: string;
  chartBar: string;
  lightBg: string;
  darkBg: string;
};

export type ColorsConfig = Record<string, AccentColor>;

export type Currency = {
  code: string;
  name: string;
  flag: string;
  countryCode: string;
};

export * from './types';

export const DEFAULT_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: 'Entertainment', color: '#a855f7' },
  { name: 'Productivity', color: '#3b82f6' },
  { name: 'Cloud Services', color: '#06b6d4' },
  { name: 'Development', color: '#22c55e' },
  { name: 'Professional', color: '#f97316' },
  { name: 'Health', color: '#f43f5e' },
  { name: 'Housing', color: '#f59e0b' },
  { name: 'Utilities', color: '#6366f1' },
  { name: 'Services', color: '#14b8a6' },
  { name: 'Education', color: '#eab308' },
  { name: 'Other', color: '#64748b' },
];
