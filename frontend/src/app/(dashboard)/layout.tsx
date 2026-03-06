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
import { useAuth } from "@/components/auth-provider";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { toast } from "sonner";
import { UKFlag, PolandFlag } from "@/components/flags";
import { cn } from "@/components/ui/utils";
import { AccentColorSwitcher } from "@/components/accent-color-switcher";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state"; // Assuming this path
import { useTheme } from "next-themes"; // Assuming this path

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [backendInitStatus, setBackendInitStatus] = useState<"checking" | "ready" | "timeout">("ready");
  const [isRedirecting, setIsRedirecting] = useState(false);

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
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('backend_ready', 'true');
          }
        }
      })
      .catch((err) => {
        console.error("Health check failed", err);
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
    if (typeof window !== 'undefined' && !sessionStorage.getItem('backend_ready')) {
      const cleanup = runBackendInitializationCheck();
      return cleanup;
    }
  }, [runBackendInitializationCheck]);

  // Safety check: if we are somehow rendering this layout on the login page,
  // do nothing to prevent redirect loops.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  useEffect(() => {
    // Only attempt one redirect per mount
    if (backendInitStatus === "ready" && !isLoading && !isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      router.replace("/login");
    }
  }, [backendInitStatus, isLoading, isAuthenticated, isRedirecting, router]);

  const handleLogout = () => logout();

  const handleLanguageChange = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      await api.patch('/users/settings', { language: lang });
    } catch (error) {
      toast.error(t('common.error'));
    }
  };

  const title = "Subscription Tracker";
  const currentLanguage = i18n.language || "en";

  // 1. Initial health check failed
  if (backendInitStatus === "timeout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight">{title}</h1>
          <ErrorState
            title={t("common.connectionError")}
            message={t("common.backendTimeout")}
            onRetry={runBackendInitializationCheck}
            retryLabel={t("common.tryAgain")}
            retryButtonClassName="bg-[#4F46E5] text-white border-transparent shadow-sm transition-shadow hover:bg-[#4338CA] hover:text-white hover:shadow-md"
          />
        </div>
      </div>
    );
  }

  // 2. Not Authenticated (show full screen loading)
  if (!isAuthenticated && !isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight mb-8">{title}</h1>
          {backendInitStatus === "checking" ? (
             <LoadingState message={t("common.initializingApp")} />
          ) : (
            <>
              <LoadingState message={t("common.redirectingToLogin")} />
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/login" prefetch={false}>Go to login</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // 4. Authenticated UI
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-16 items-center px-4 sm:px-6 gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">SubTracker</span>
          </Link>

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

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <AccentColorSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {currentLanguage.startsWith("en") ? <UKFlag /> : <PolandFlag />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('language.switch')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLanguageChange("en")} className="gap-2">
                  <UKFlag /> <span>{t('language.en')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("pl")} className="gap-2">
                  <PolandFlag /> <span>{t('language.pl')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingState message={t("common.loading")} />
          </div>
        ) : children}
      </main>
    </div>
  );
}
