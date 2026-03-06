import colors from './colors.json';
import en from './locales/en.json';
import pl from './locales/pl.json';

export const COLORS = colors;
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
