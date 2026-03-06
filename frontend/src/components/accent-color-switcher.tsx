"use client";

import { useEffect, useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface AccentColor {
  name: string;
  lightPrimary: string;
  darkPrimary: string;
  lightAccent: string;
  darkAccent: string;
  lightForeground: string;
  darkForeground: string;
  chartBar: string;
  // Background intensities
  lightBg: string; // Very subtle background
  darkBg: string;  // Very dark themed background
}

const ACCENT_COLORS: AccentColor[] = [
  { name: "Indigo", lightPrimary: "#4F46E5", darkPrimary: "#6366f1", lightAccent: "#e0e7ff", darkAccent: "#312e81", lightForeground: "#4F46E5", darkForeground: "#c7d2fe", chartBar: "#4F46E5", lightBg: "#F5F7FF", darkBg: "#0B0E2E" },
  { name: "Violet", lightPrimary: "#7c3aed", darkPrimary: "#a78bfa", lightAccent: "#ede9fe", darkAccent: "#4c1d95", lightForeground: "#7c3aed", darkForeground: "#ddd6fe", chartBar: "#7c3aed", lightBg: "#F9F5FF", darkBg: "#110931" },
  { name: "Purple", lightPrimary: "#9333ea", darkPrimary: "#c084fc", lightAccent: "#f3e8ff", darkAccent: "#581c87", lightForeground: "#9333ea", darkForeground: "#e9d5ff", chartBar: "#9333ea", lightBg: "#FAF5FF", darkBg: "#160A2C" },
  { name: "Fuchsia", lightPrimary: "#c026d3", darkPrimary: "#e879f9", lightAccent: "#fae8ff", darkAccent: "#701a75", lightForeground: "#c026d3", darkForeground: "#f5d0fe", chartBar: "#c026d3", lightBg: "#FDF4FF", darkBg: "#1A082D" },
  { name: "Rose", lightPrimary: "#e11d48", darkPrimary: "#fb7185", lightAccent: "#ffe4e6", darkAccent: "#881337", lightForeground: "#e11d48", darkForeground: "#fecdd3", chartBar: "#e11d48", lightBg: "#FFF1F2", darkBg: "#220412" },
  { name: "Pink", lightPrimary: "#db2777", darkPrimary: "#f472b6", lightAccent: "#fce7f3", darkAccent: "#831843", lightForeground: "#db2777", darkForeground: "#fbcfe8", chartBar: "#db2777", lightBg: "#FDF2F8", darkBg: "#210515" },
  { name: "Red", lightPrimary: "#dc2626", darkPrimary: "#f87171", lightAccent: "#fee2e2", darkAccent: "#7f1d1d", lightForeground: "#dc2626", darkForeground: "#fecaca", chartBar: "#dc2626", lightBg: "#FEF2F2", darkBg: "#220707" },
  { name: "Orange", lightPrimary: "#ea580c", darkPrimary: "#fb923c", lightAccent: "#ffedd5", darkAccent: "#7c2d12", lightForeground: "#ea580c", darkForeground: "#fed7aa", chartBar: "#ea580c", lightBg: "#FFF7ED", darkBg: "#1C0D08" },
  { name: "Amber", lightPrimary: "#d97706", darkPrimary: "#fbbf24", lightAccent: "#fef3c7", darkAccent: "#78350f", lightForeground: "#d97706", darkForeground: "#fde68a", chartBar: "#d97706", lightBg: "#FFFBEB", darkBg: "#1B0F06" },
  { name: "Yellow", lightPrimary: "#ca8a04", darkPrimary: "#facc15", lightAccent: "#fef9c3", darkAccent: "#713f12", lightForeground: "#ca8a04", darkForeground: "#fef08a", chartBar: "#ca8a04", lightBg: "#FEFCE8", darkBg: "#171206" },
  { name: "Lime", lightPrimary: "#65a30d", darkPrimary: "#a3e635", lightAccent: "#f7fee7", darkAccent: "#365314", lightForeground: "#65a30d", darkForeground: "#bef264", chartBar: "#65a30d", lightBg: "#F7FEE7", darkBg: "#0E1505" },
  { name: "Green", lightPrimary: "#16a34a", darkPrimary: "#4ade80", lightAccent: "#f0fdf4", darkAccent: "#14532d", lightForeground: "#16a34a", darkForeground: "#bbf7d0", chartBar: "#16a34a", lightBg: "#F0FDF4", darkBg: "#051508" },
  { name: "Emerald", lightPrimary: "#059669", darkPrimary: "#34d399", lightAccent: "#ecfdf5", darkAccent: "#064e3b", lightForeground: "#059669", darkForeground: "#a7f3d0", chartBar: "#059669", lightBg: "#ECFDF5", darkBg: "#02150E" },
  { name: "Teal", lightPrimary: "#0d9488", darkPrimary: "#2dd4bf", lightAccent: "#f0fdfa", darkAccent: "#134e4a", lightForeground: "#0d9488", darkForeground: "#99f6e4", chartBar: "#0d9488", lightBg: "#F0FDFA", darkBg: "#041513" },
  { name: "Cyan", lightPrimary: "#0891b2", darkPrimary: "#22d3ee", lightAccent: "#ecfeff", darkAccent: "#164e63", lightForeground: "#0891b2", darkForeground: "#a5f3fc", chartBar: "#0891b2", lightBg: "#ECFEFF", darkBg: "#04141A" },
  { name: "Sky", lightPrimary: "#0284c7", darkPrimary: "#38bdf8", lightAccent: "#f0f9ff", darkAccent: "#0c4a6e", lightForeground: "#0284c7", darkForeground: "#bae6fd", chartBar: "#0284c7", lightBg: "#F0F9FF", darkBg: "#03111A" },
];

export function AccentColorSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [currentAccent, setCurrentAccent] = useState<AccentColor>(ACCENT_COLORS[0]);

  useEffect(() => {
    const saved = localStorage.getItem("app-accent-color");
    if (saved) {
      const found = ACCENT_COLORS.find(c => c.name === saved);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
      }
    }
  }, []);

  const applyAccentColor = (accent: AccentColor) => {
    let styleTag = document.getElementById("accent-color-styles");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "accent-color-styles";
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
        --card: #ffffff;
        --secondary: ${accent.lightBg};
        --border: ${accent.lightPrimary}20;
      }
      .dark {
        --primary: ${accent.darkPrimary};
        --accent: ${accent.darkAccent};
        --accent-foreground: ${accent.darkForeground};
        --ring: ${accent.darkPrimary};
        --chart-bar: ${accent.chartBar}aa;
        --chart-1: #3b82f6; /* Fixed Blue */
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

  const handleSelect = (accent: AccentColor) => {
    setCurrentAccent(accent);
    localStorage.setItem("app-accent-color", accent.name);
    applyAccentColor(accent);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          title={t('language.accentColor')} 
          className="h-9 w-9 flex items-center justify-center translate-y-px"
        >
          <div 
            className="w-4 h-4 rounded-full shadow-inner border border-white/20 transition-transform active:scale-90" 
            style={{ backgroundColor: (theme === "dark" ? currentAccent.darkPrimary : currentAccent.lightPrimary) }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-3 w-56">
        <div className="flex items-center justify-between mb-2">
          <DropdownMenuLabel className="p-0">{t('language.selectAccentColor')}</DropdownMenuLabel>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-8 w-8 rounded-lg"
            title={theme === "dark" ? t('theme.light') : t('theme.dark')}
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
        <DropdownMenuSeparator className="mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {ACCENT_COLORS.map((accent) => (
            <button
              key={accent.name}
              onClick={() => handleSelect(accent)}
              title={accent.name}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border border-transparent",
                currentAccent.name === accent.name ? "ring-2 ring-primary ring-offset-2 scale-110 border-white/20" : "hover:shadow-md"
              )}
              style={{ backgroundColor: (theme === "dark" ? accent.darkPrimary : accent.lightPrimary) }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
