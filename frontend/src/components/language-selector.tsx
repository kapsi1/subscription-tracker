"use client";

import { useTranslation } from "react-i18next";
import { UKFlag, PolandFlag } from "@/components/flags";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/components/ui/utils";

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export function LanguageSelector({ className, showLabel = false }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const currentLanguage = i18n.language || "en";

  const handleLanguageChange = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      // Only sync with backend if user is logged in
      if (isAuthenticated) {
        await api.patch('/users/settings', { language: lang });
      }
    } catch (error) {
      // Don't toast error if it's just a guest changing language
      if (isAuthenticated) {
        toast.error(t('common.error'));
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size={showLabel ? "default" : "icon"} 
          className={cn("h-9", showLabel ? "gap-2 px-3" : "w-9", className)} 
          aria-label={t('language.switch')}
        >
          {currentLanguage.startsWith("en") ? <UKFlag /> : <PolandFlag />}
          {showLabel && <span>{currentLanguage.startsWith("en") ? t('language.en') : t('language.pl')}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('language.switch')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleLanguageChange("en")} className="gap-2 cursor-pointer">
          <UKFlag /> <span>{t('language.en')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("pl")} className="gap-2 cursor-pointer">
          <PolandFlag /> <span>{t('language.pl')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
