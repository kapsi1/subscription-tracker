import {
  type AccentColor,
  COLORS,
  type ColorsConfig,
  getAccentColor,
} from '@subscription-tracker/shared';

export const ACCENT_COLORS = Object.entries(COLORS as ColorsConfig).map(([name, values]) => ({
  name,
  ...values,
}));

export type AccentColorType = AccentColor & { name?: string };

export const applyAccentColor = (nameOrHex: string | AccentColorType) => {
  if (typeof document === 'undefined') return;

  const accent =
    typeof nameOrHex === 'string' ? getAccentColor(nameOrHex, COLORS as ColorsConfig) : nameOrHex;

  const root = document.documentElement;

  // Clear any old direct inline styles that might interfere with theme switching
  const legacyVars = [
    '--primary', '--accent', '--accent-foreground', '--ring', '--chart-bar',
    '--sidebar-primary', '--sidebar-ring', '--background', '--card', '--secondary', '--border', '--muted'
  ];
  for (const v of legacyVars) {
    root.style.removeProperty(v);
  }

  // Set the "raw" dynamic values as inline properties on the root element.
  // We use intermediate variables so that we don't block the standard CSS selectors 
  // (like .dark) from doing their job via the mapping style tag.
  
  // Light values
  root.style.setProperty('--lp', accent.lightPrimary);
  root.style.setProperty('--la', accent.lightAccent);
  root.style.setProperty('--laf', accent.lightForeground);
  root.style.setProperty('--lbg', accent.lightBg);
  root.style.setProperty('--lc', `color-mix(in srgb, white, ${accent.lightPrimary} 2%)`);
  root.style.setProperty('--ls', `color-mix(in srgb, white, ${accent.lightPrimary} 5%)`);
  root.style.setProperty('--lb', `${accent.lightPrimary}20`);
  root.style.setProperty('--lcb', `${accent.chartBar}80`);

  // Dark values
  root.style.setProperty('--dp', accent.darkPrimary);
  root.style.setProperty('--da', accent.darkAccent);
  root.style.setProperty('--daf', accent.darkForeground);
  root.style.setProperty('--dbg', accent.darkBg);
  root.style.setProperty('--dc', `color-mix(in srgb, ${accent.darkBg}, white 4%)`);
  root.style.setProperty('--dm', `color-mix(in srgb, ${accent.darkBg}, white 8%)`);
  root.style.setProperty('--ds', accent.darkBg);
  root.style.setProperty('--db', `${accent.darkPrimary}30`);
  root.style.setProperty('--dcb', `${accent.chartBar}aa`);

  // Ensure the mapping style tag exists. 
  // This tag maps the standard variables to our dynamic sources.
  let styleTag = document.getElementById('accent-mapping-styles');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'accent-mapping-styles';
    styleTag.innerHTML = `
      :root {
        --primary: var(--lp);
        --accent: var(--la);
        --accent-foreground: var(--laf);
        --ring: var(--lp);
        --chart-bar: var(--lcb);
        --sidebar-primary: var(--lp);
        --sidebar-ring: var(--lp);
        --background: var(--lbg);
        --card: var(--lc);
        --secondary: var(--ls);
        --border: var(--lb);
      }
      .dark {
        --primary: var(--dp);
        --accent: var(--da);
        --accent-foreground: var(--daf);
        --ring: var(--dp);
        --chart-bar: var(--dcb);
        --sidebar-primary: var(--dp);
        --sidebar-ring: var(--dp);
        --background: var(--dbg);
        --card: var(--dc);
        --muted: var(--dm);
        --secondary: var(--ds);
        --border: var(--db);
      }
    `;
    document.head.appendChild(styleTag);
  }
};
