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

export const getAccentColor = (nameOrHex: string, definitions: ColorsConfig): AccentColor => {
  if (definitions[nameOrHex]) {
    return definitions[nameOrHex];
  }

  // Handle hex codes
  if (nameOrHex.startsWith('#')) {
    const hex = nameOrHex.trim();

    const hexToRgb = (h: string) => {
      const sanitized = h.replace('#', '');
      const fullHex =
        sanitized.length === 3
          ? sanitized
              .split('')
              .map((c) => c + c)
              .join('')
          : sanitized;
      const r = parseInt(fullHex.slice(0, 2), 16);
      const g = parseInt(fullHex.slice(2, 4), 16);
      const b = parseInt(fullHex.slice(4, 6), 16);
      return { r, g, b };
    };

    const mix = (hA: string, hB: string, ratioB: number) => {
      const a = hexToRgb(hA);
      const b = hexToRgb(hB);
      const ratioA = 1 - ratioB;
      const m = (x: number, y: number) => Math.round(x * ratioA + y * ratioB);
      const toH = (v: number) => v.toString(16).padStart(2, '0');
      return `#${toH(m(a.r, b.r))}${toH(m(a.g, b.g))}${toH(m(a.b, b.b))}`;
    };

    return {
      lightPrimary: hex,
      darkPrimary: hex,
      lightAccent: mix(hex, '#ffffff', 0.9),
      darkAccent: mix(hex, '#000000', 0.7),
      lightForeground: hex,
      darkForeground: mix(hex, '#ffffff', 0.6),
      chartBar: hex,
      lightBg: mix(hex, '#ffffff', 0.96),
      darkBg: mix(hex, '#000000', 0.94),
    };
  }

  return definitions.Indigo; // Default
};

export type Currency = {
  code: string;
  name: string;
  flag: string;
  countryCode: string;
};

export * from './types';

export const DEFAULT_CATEGORIES: Array<{ name: string; color: string; icon: string }> = [
  { name: 'Entertainment', color: '#a855f7', icon: 'Play' },
  { name: 'Productivity', color: '#3b82f6', icon: 'CheckSquare' },
  { name: 'Cloud Services', color: '#06b6d4', icon: 'Cloud' },
  { name: 'Development', color: '#22c55e', icon: 'Code' },
  { name: 'Professional', color: '#f97316', icon: 'Briefcase' },
  { name: 'Health', color: '#f43f5e', icon: 'Heart' },
  { name: 'Housing', color: '#f59e0b', icon: 'Home' },
  { name: 'Utilities', color: '#6366f1', icon: 'Zap' },
  { name: 'Services', color: '#14b8a6', icon: 'Wrench' },
  { name: 'Education', color: '#eab308', icon: 'GraduationCap' },
  { name: 'Other', color: '#64748b', icon: 'MoreHorizontal' },
];

export const CATEGORY_ICONS = [
  'Play',
  'CheckSquare',
  'Cloud',
  'Code',
  'Briefcase',
  'Heart',
  'Home',
  'Zap',
  'Wrench',
  'GraduationCap',
  'MoreHorizontal',
  'ShoppingCart',
  'Music',
  'Video',
  'Gamepad2',
  'Plane',
  'Car',
  'Coffee',
  'Utensils',
  'Dumbbell',
  'Book',
  'Gift',
  'Smartphone',
  'Cpu',
  'Database',
  'Hash',
  'Tag',
  'Calendar',
  'Bell',
  'Star',
  'Heart',
  'User',
  'Users',
  'Globe',
  'Wallet',
  'CreditCard',
  'Ticket',
  'LifeBuoy',
  'Shield',
  'Lock',
  'Key',
  'Mail',
  'Phone',
  'Search',
  'Settings',
  'Layout',
  'Layers',
  'Box',
  'Package',
  'FileText',
  'Image',
  'Mic',
  'Camera',
];
