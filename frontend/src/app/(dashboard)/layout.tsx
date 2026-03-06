"use client";

import { useState, useEffect, useCallback } from "react";
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
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isPolishBrowser =
    typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("pl");
  const initText = {
    title: "Subscription Tracker",
    loading: isPolishBrowser
      ? t("common.loading", { defaultValue: "Ładowanie..." })
      : t("common.loading", { defaultValue: "Loading..." }),
    initializing: isPolishBrowser
      ? t("common.initializingApp", { defaultValue: "Inicjalizowanie aplikacji..." })
      : t("common.initializingApp", { defaultValue: "Initializing application..." }),
    connectionError: isPolishBrowser
      ? t("common.connectionError", { defaultValue: "Błąd połączenia" })
      : t("common.connectionError", { defaultValue: "Connection Error" }),
    backendTimeout: isPolishBrowser
      ? t("common.backendTimeout", {
          defaultValue: "Backend nie odpowiedział w ciągu 15 sekund. Spróbuj ponownie.",
        })
      : t("common.backendTimeout", {
          defaultValue: "The backend did not respond within 15 seconds. Please try again.",
        }),
    tryAgain: isPolishBrowser
      ? t("common.tryAgain", { defaultValue: "Spróbuj ponownie" })
      : t("common.tryAgain", { defaultValue: "Try Again" }),
    redirecting: isPolishBrowser
      ? t("common.redirectingToLogin", { defaultValue: "Przekierowywanie do logowania..." })
      : t("common.redirectingToLogin", { defaultValue: "Redirecting to login..." }),
  };
  const [backendInitStatus, setBackendInitStatus] = useState<"checking" | "ready" | "timeout">("checking");

  const runBackendInitializationCheck = useCallback(() => {
    setBackendInitStatus("checking");

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      if (isActive) {
        setBackendInitStatus("timeout");
      }
    }, 15000);

    api
      .get("/health")
      .then(() => {
        if (isActive) {
          window.clearTimeout(timeoutId);
          setBackendInitStatus("ready");
        }
      })
      .catch(() => {
        if (isActive) {
          window.clearTimeout(timeoutId);
          setBackendInitStatus("timeout");
        }
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const cleanup = runBackendInitializationCheck();
    return cleanup;
  }, [runBackendInitializationCheck]);

  useEffect(() => {
    if (backendInitStatus !== "ready" || isLoading || isAuthenticated) {
      return;
    }

    router.replace("/login");

    const fallbackId = window.setTimeout(() => {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }, 400);

    return () => {
      window.clearTimeout(fallbackId);
    };
  }, [backendInitStatus, isLoading, isAuthenticated, router]);

  if (backendInitStatus === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight">{initText.title}</h1>
          <LoadingState
            message={initText.initializing}
          />
        </div>
      </div>
    );
  }

  if (backendInitStatus === "timeout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight">{initText.title}</h1>
          <ErrorState
            title={initText.connectionError}
            message={initText.backendTimeout}
            onRetry={runBackendInitializationCheck}
            retryLabel={initText.tryAgain}
            retryButtonClassName="bg-[#4F46E5] text-white border-transparent shadow-sm transition-shadow hover:bg-[#4338CA] hover:text-white hover:shadow-md"
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight mb-8">{initText.title}</h1>
          <LoadingState
            message={initText.loading}
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight mb-8">{initText.title}</h1>
          <LoadingState
            message={initText.redirecting}
          />
        </div>
      </div>
    );
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
