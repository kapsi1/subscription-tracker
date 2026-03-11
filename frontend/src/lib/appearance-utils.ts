import { COLORS, type ColorsConfig } from '@subscription-tracker/shared';

export const ACCENT_COLORS = Object.entries(COLORS as ColorsConfig).map(([name, values]) => ({
  name,
  ...values,
}));

export type AccentColorType = (typeof ACCENT_COLORS)[0];

export const applyAccentColor = (accent: AccentColorType) => {
  if (typeof document === 'undefined') return;

  let styleTag = document.getElementById('accent-color-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'accent-color-styles';
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    :root {
      --primary: ${accent.lightPrimary};
      --accent: ${accent.lightAccent};
      --accent-foreground: ${accent.lightForeground};
      --ring: ${accent.lightPrimary};
      --chart-bar: ${accent.chartBar}80;
      --chart-1: #3b82f6;
      --chart-2: #8b5cf6;
      --chart-3: #ec4899;
      --chart-4: #06b6d4;
      --chart-5: #10b981;
      --sidebar-primary: ${accent.lightPrimary};
      --sidebar-ring: ${accent.lightPrimary};
      --background: ${accent.lightBg};
      --card: color-mix(in srgb, white, ${accent.lightPrimary} 2%);
      --secondary: color-mix(in srgb, white, ${accent.lightPrimary} 5%);
      --border: ${accent.lightPrimary}20;
    }
    .dark {
      --primary: ${accent.darkPrimary};
      --accent: ${accent.darkAccent};
      --accent-foreground: ${accent.darkForeground};
      --ring: ${accent.darkPrimary};
      --chart-bar: ${accent.chartBar}aa;
      --chart-1: #3b82f6;
      --chart-2: #8b5cf6;
      --chart-3: #ec4899;
      --chart-4: #06b6d4;
      --chart-5: #10b981;
      --sidebar-primary: ${accent.darkPrimary};
      --sidebar-ring: ${accent.darkPrimary};
      --background: ${accent.darkBg};
      --card: color-mix(in srgb, ${accent.darkBg}, white 4%);
      --muted: color-mix(in srgb, ${accent.darkBg}, white 8%);
      --secondary: ${accent.darkBg};
      --border: ${accent.darkPrimary}30;
    }
  `;
};
