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

interface AccentColor {
  name: string;
  lightPrimary: string;
  darkPrimary: string;
  lightAccent: string;
  darkAccent: string;
  lightForeground: string;
  darkForeground: string;
  chartBar: string; // Darker version for chart bars
}

const ACCENT_COLORS: AccentColor[] = [
  { name: "Indigo", lightPrimary: "#4F46E5", darkPrimary: "#6366f1", lightAccent: "#e0e7ff", darkAccent: "#312e81", lightForeground: "#4F46E5", darkForeground: "#c7d2fe", chartBar: "#818cf8" },
  { name: "Violet", lightPrimary: "#7c3aed", darkPrimary: "#a78bfa", lightAccent: "#ede9fe", darkAccent: "#4c1d95", lightForeground: "#7c3aed", darkForeground: "#ddd6fe", chartBar: "#a78bfa" },
  { name: "Purple", lightPrimary: "#9333ea", darkPrimary: "#c084fc", lightAccent: "#f3e8ff", darkAccent: "#581c87", lightForeground: "#9333ea", darkForeground: "#e9d5ff", chartBar: "#c084fc" },
  { name: "Fuchsia", lightPrimary: "#c026d3", darkPrimary: "#e879f9", lightAccent: "#fae8ff", darkAccent: "#701a75", lightForeground: "#c026d3", darkForeground: "#f5d0fe", chartBar: "#e879f9" },
  { name: "Rose", lightPrimary: "#e11d48", darkPrimary: "#fb7185", lightAccent: "#ffe4e6", darkAccent: "#881337", lightForeground: "#e11d48", darkForeground: "#fecdd3", chartBar: "#fb7185" },
  { name: "Pink", lightPrimary: "#db2777", darkPrimary: "#f472b6", lightAccent: "#fce7f3", darkAccent: "#831843", lightForeground: "#db2777", darkForeground: "#fbcfe8", chartBar: "#f472b6" },
  { name: "Red", lightPrimary: "#dc2626", darkPrimary: "#f87171", lightAccent: "#fee2e2", darkAccent: "#7f1d1d", lightForeground: "#dc2626", darkForeground: "#fecaca", chartBar: "#f87171" },
  { name: "Orange", lightPrimary: "#ea580c", darkPrimary: "#fb923c", lightAccent: "#ffedd5", darkAccent: "#7c2d12", lightForeground: "#ea580c", darkForeground: "#fed7aa", chartBar: "#fb923c" },
  { name: "Amber", lightPrimary: "#d97706", darkPrimary: "#fbbf24", lightAccent: "#fef3c7", darkAccent: "#78350f", lightForeground: "#d97706", darkForeground: "#fde68a", chartBar: "#fbbf24" },
  { name: "Yellow", lightPrimary: "#ca8a04", darkPrimary: "#facc15", lightAccent: "#fef9c3", darkAccent: "#713f12", lightForeground: "#ca8a04", darkForeground: "#fef08a", chartBar: "#facc15" },
  { name: "Lime", lightPrimary: "#65a30d", darkPrimary: "#a3e635", lightAccent: "#f7fee7", darkAccent: "#365314", lightForeground: "#65a30d", darkForeground: "#bef264", chartBar: "#a3e635" },
  { name: "Green", lightPrimary: "#16a34a", darkPrimary: "#4ade80", lightAccent: "#f0fdf4", darkAccent: "#14532d", lightForeground: "#16a34a", darkForeground: "#bbf7d0", chartBar: "#4ade80" },
  { name: "Emerald", lightPrimary: "#059669", darkPrimary: "#34d399", lightAccent: "#ecfdf5", darkAccent: "#064e3b", lightForeground: "#059669", darkForeground: "#a7f3d0", chartBar: "#34d399" },
  { name: "Teal", lightPrimary: "#0d9488", darkPrimary: "#2dd4bf", lightAccent: "#f0fdfa", darkAccent: "#134e4a", lightForeground: "#0d9488", darkForeground: "#99f6e4", chartBar: "#2dd4bf" },
  { name: "Cyan", lightPrimary: "#0891b2", darkPrimary: "#22d3ee", lightAccent: "#ecfeff", darkAccent: "#164e63", lightForeground: "#0891b2", darkForeground: "#a5f3fc", chartBar: "#22d3ee" },
  { name: "Sky", lightPrimary: "#0284c7", darkPrimary: "#38bdf8", lightAccent: "#f0f9ff", darkAccent: "#0c4a6e", lightForeground: "#0284c7", darkForeground: "#bae6fd", chartBar: "#38bdf8" },
];

export function AccentColorSwitcher() {
  const { t } = useTranslation();
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
        --chart-bar: ${accent.chartBar}80; /* 50% opacity */
        --chart-1: ${accent.lightPrimary};
        --chart-2: #8b5cf6;
        --chart-3: #ec4899;
        --chart-4: #06b6d4;
        --chart-5: #10b981;
        --sidebar-primary: ${accent.lightPrimary};
        --sidebar-ring: ${accent.lightPrimary};
      }
      .dark {
        --primary: ${accent.darkPrimary};
        --accent: ${accent.darkAccent};
        --accent-foreground: ${accent.darkForeground};
        --ring: ${accent.darkPrimary};
        --chart-bar: ${accent.chartBar}40; /* Lower opacity for dark mode */
        --chart-1: ${accent.darkPrimary};
        --chart-2: #a78bfa;
        --chart-3: #f472b6;
        --chart-4: #22d3ee;
        --chart-5: #34d399;
        --sidebar-primary: ${accent.darkPrimary};
        --sidebar-ring: ${accent.darkPrimary};
      }
    `;
  };

  const handleSelect = (accent: AccentColor) => {
    setCurrentAccent(accent);
    localStorage.setItem("app-accent-color", accent.name);
    applyAccentColor(accent);
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
            style={{ backgroundColor: currentAccent.lightPrimary }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-3 w-56">
        <DropdownMenuLabel className="mb-2">{t('language.selectAccentColor')}</DropdownMenuLabel>
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
              style={{ backgroundColor: accent.lightPrimary }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
