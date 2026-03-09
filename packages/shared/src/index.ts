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
