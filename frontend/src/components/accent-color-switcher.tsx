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
import api from "@/lib/api";

import { COLORS, ColorsConfig, AccentColor as SharedAccentColor } from "@subscription-tracker/shared";

interface AccentColor extends SharedAccentColor {
  name: string;
}

const ACCENT_COLORS: AccentColor[] = Object.entries(COLORS as ColorsConfig).map(([name, values]) => ({
  name,
  ...values,
}));


export function AccentColorSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [currentAccent, setCurrentAccent] = useState<AccentColor>(ACCENT_COLORS[0]);

  useEffect(() => {
    // Check cache first for zero-flicker load
    const cached = localStorage.getItem("app-accent-color");
    if (cached) {
      const found = ACCENT_COLORS.find(c => c.name === cached);
      if (found) {
        setCurrentAccent(found);
        applyAccentColor(found);
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await api.get("/users/me");
        if (response.data.theme) {
          setTheme(response.data.theme);
        }
        if (response.data.accentColor) {
          const found = ACCENT_COLORS.find(c => c.name === response.data.accentColor);
          if (found) {
            setCurrentAccent(found);
            applyAccentColor(found);
            localStorage.setItem("app-accent-color", found.name);
          }
        } else if (!cached) {
          // Apply default if nothing found and no cache
          applyAccentColor(ACCENT_COLORS[0]);
        }
      } catch (error) {
        console.error("Failed to fetch user settings", error);
        if (!cached) applyAccentColor(ACCENT_COLORS[0]);
      }
    };

    fetchSettings();
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

  const handleSelect = async (accent: AccentColor) => {
    setCurrentAccent(accent);
    applyAccentColor(accent);
    localStorage.setItem("app-accent-color", accent.name);
    try {
      await api.patch("/users/settings", { accentColor: accent.name });
    } catch (error) {
      console.error("Failed to save accent color", error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      await api.patch("/users/settings", { theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme setting", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          title={t('language.accentColor')} 
          aria-label={t('language.accentColor')}
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
            aria-label={theme === "dark" ? t('theme.light') : t('theme.dark')}
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
              aria-label={accent.name}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm border border-transparent",
                currentAccent.name === accent.name ? "ring-2 ring-slate-950 ring-offset-2 scale-110 shadow-md" : "hover:shadow-md"
              )}
              style={{ 
                backgroundColor: (theme === "dark" ? accent.darkPrimary : accent.lightPrimary)
              }}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
