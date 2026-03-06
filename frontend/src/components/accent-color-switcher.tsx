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
  { name: "Crimson", lightPrimary: "#BE123C", darkPrimary: "#f43f5e", lightAccent: "#ffe4e6", darkAccent: "#4c0519", lightForeground: "#BE123C", darkForeground: "#fecdd3", chartBar: "#BE123C", lightBg: "#FFF1F2", darkBg: "#1C040E" },
  { name: "Rose", lightPrimary: "#DB2777", darkPrimary: "#f472b6", lightAccent: "#fce7f3", darkAccent: "#500724", lightForeground: "#DB2777", darkForeground: "#fbcfe8", chartBar: "#DB2777", lightBg: "#FFF0F6", darkBg: "#1C040D" },
  { name: "Lavender", lightPrimary: "#7C3AED", darkPrimary: "#a78bfa", lightAccent: "#f3e8ff", darkAccent: "#2e1065", lightForeground: "#7C3AED", darkForeground: "#e9d5ff", chartBar: "#7C3AED", lightBg: "#F9F5FF", darkBg: "#0F081C" },
  { name: "Indigo", lightPrimary: "#4F46E5", darkPrimary: "#6366f1", lightAccent: "#e0e7ff", darkAccent: "#312e81", lightForeground: "#4F46E5", darkForeground: "#c7d2fe", chartBar: "#4F46E5", lightBg: "#F5F7FF", darkBg: "#0B0E2E" },
  { name: "Cobalt", lightPrimary: "#1D4ED8", darkPrimary: "#3b82f6", lightAccent: "#dbeafe", darkAccent: "#172554", lightForeground: "#1D4ED8", darkForeground: "#bfdbfe", chartBar: "#1D4ED8", lightBg: "#F0F7FF", darkBg: "#050B1C" },
  { name: "Navy", lightPrimary: "#1E3A8A", darkPrimary: "#2563eb", lightAccent: "#eff6ff", darkAccent: "#172554", lightForeground: "#1E3A8A", darkForeground: "#dbeafe", chartBar: "#1E3A8A", lightBg: "#F0F4FF", darkBg: "#05081A" },
  { name: "Mint", lightPrimary: "#059669", darkPrimary: "#10b981", lightAccent: "#ecfdf5", darkAccent: "#064e3b", lightForeground: "#059669", darkForeground: "#a7f3d0", chartBar: "#059669", lightBg: "#F0FDF9", darkBg: "#02120D" },
  { name: "Forest", lightPrimary: "#15803D", darkPrimary: "#22c55e", lightAccent: "#dcfce7", darkAccent: "#052e16", lightForeground: "#15803D", darkForeground: "#bbf7d0", chartBar: "#15803D", lightBg: "#F0FDF4", darkBg: "#041408" },
  { name: "Sage", lightPrimary: "#4D7C0F", darkPrimary: "#84cc16", lightAccent: "#f7fee7", darkAccent: "#1a2e05", lightForeground: "#4D7C0F", darkForeground: "#d9f99d", chartBar: "#4D7C0F", lightBg: "#FAFEF0", darkBg: "#0D1405" },
  { name: "Amber", lightPrimary: "#D97706", darkPrimary: "#f59e0b", lightAccent: "#fef3c7", darkAccent: "#451a03", lightForeground: "#D97706", darkForeground: "#fde68a", chartBar: "#D97706", lightBg: "#FFFBEB", darkBg: "#170F04" },
  { name: "Gold", lightPrimary: "#B45309", darkPrimary: "#fbbf24", lightAccent: "#fef3c7", darkAccent: "#451a03", lightForeground: "#B45309", darkForeground: "#fde68a", chartBar: "#B45309", lightBg: "#FFFCEB", darkBg: "#150D04" },
  { name: "Terracotta", lightPrimary: "#9A3412", darkPrimary: "#ea580c", lightAccent: "#ffedd5", darkAccent: "#431407", lightForeground: "#9A3412", darkForeground: "#fed7aa", chartBar: "#9A3412", lightBg: "#FFF5F0", darkBg: "#1A0904" },
  { name: "Coffee", lightPrimary: "#78350F", darkPrimary: "#a16207", lightAccent: "#fef3c7", darkAccent: "#271605", lightForeground: "#78350F", darkForeground: "#fde68a", chartBar: "#78350F", lightBg: "#FFF9F0", darkBg: "#140D04" },
  { name: "Sand", lightPrimary: "#A16207", darkPrimary: "#d97706", lightAccent: "#fefce8", darkAccent: "#422006", lightForeground: "#A16207", darkForeground: "#fef08a", chartBar: "#A16207", lightBg: "#FFFBF0", darkBg: "#140F04" },
  { name: "Slate", lightPrimary: "#475569", darkPrimary: "#94a3b8", lightAccent: "#f1f5f9", darkAccent: "#0f172a", lightForeground: "#475569", darkForeground: "#e2e8f0", chartBar: "#475569", lightBg: "#F8FAFC", darkBg: "#0A0C10" },
  { name: "Charcoal", lightPrimary: "#334155", darkPrimary: "#64748b", lightAccent: "#f8fafc", darkAccent: "#1e293b", lightForeground: "#334155", darkForeground: "#cbd5e1", chartBar: "#334155", lightBg: "#F1F5F9", darkBg: "#0C1014" },
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
