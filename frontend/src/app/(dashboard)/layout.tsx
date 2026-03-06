"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  CreditCard, 
  LayoutDashboard, 
  ListChecks, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { toast } from "sonner";
import { UKFlag, PolandFlag } from "@/components/flags";
import { cn } from "@/components/ui/utils";
import { AccentColorSwitcher } from "@/components/accent-color-switcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const currentLanguage = i18n.language || "en";

  const handleLanguageChange = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      await api.patch('/users/settings', { language: lang });
    } catch (error) {
      toast.error(t('common.error'));
      console.error("Failed to save language preference:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-16 items-center px-4 sm:px-6 gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">SubTracker</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 ml-2 sm:ml-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 px-2 sm:px-3 transition-colors",
                  pathname === "/dashboard" 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                size="sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.dashboard')}</span>
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 px-2 sm:px-3 transition-colors",
                  pathname === "/subscriptions" 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                size="sm"
              >
                <ListChecks className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.subscriptions')}</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button
                variant="ghost"
                className={cn(
                  "gap-2 px-2 sm:px-3 transition-colors",
                  pathname === "/settings" 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                size="sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.settings')}</span>
              </Button>
            </Link>
          </nav>

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            
            <AccentColorSwitcher />

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t('language.switch')} aria-label={t('language.switch')} className="h-9 w-9">
                  {currentLanguage.startsWith("en") ? <UKFlag /> : <PolandFlag />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('language.switch')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("en")}
                  className={`gap-2 ${currentLanguage.startsWith("en") ? "font-bold bg-muted" : ""}`}
                >
                  <UKFlag /> <span>{t('language.en')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("pl")}
                  className={`gap-2 ${currentLanguage === "pl" ? "font-bold bg-muted" : ""}`}
                >
                  <PolandFlag /> <span>{t('language.pl')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>


            
            {/* Log Out */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              title={t('nav.logout')}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
