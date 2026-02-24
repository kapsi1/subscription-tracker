"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  CreditCard, 
  LayoutDashboard, 
  ListChecks, 
  Bell, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User,
  Palette,
  Moon,
  Sun
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth-provider";
import { Loader2, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "@/lib/api";
import { toast } from "sonner";

const sidebarItems = [
  { icon: LayoutDashboard, translationKey: "nav.dashboard", path: "/dashboard" },
  { icon: ListChecks, translationKey: "nav.subscriptions", path: "/subscriptions" },
  { icon: Bell, translationKey: "nav.alerts", path: "/alerts" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-16 items-center px-4 gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline">SubTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard')}
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button
                variant={pathname === "/subscriptions" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <ListChecks className="w-4 h-4" />
                {t('nav.subscriptions')}
              </Button>
            </Link>
            <Link href="/alerts">
              <Button
                variant={pathname === "/alerts" ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {t('nav.settings')}
              </Button>
            </Link>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title={t('language.switch')} aria-label={t('language.switch')} className="text-xl">
                  {currentLanguage.startsWith("en") ? "🇬🇧" : "🇵🇱"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('language.switch')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("en")}
                  className={`gap-2 ${currentLanguage.startsWith("en") ? "font-bold bg-muted" : ""}`}
                >
                  <span>🇬🇧</span> {t('language.en')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange("pl")}
                  className={`gap-2 ${currentLanguage === "pl" ? "font-bold bg-muted" : ""}`}
                >
                  <span>🇵🇱</span> {t('language.pl')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              title={theme === "dark" ? t('theme.light') : t('theme.dark')}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-white">US</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{t('nav.profile')}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-64 border-r bg-card min-h-[calc(100vh-4rem)] flex-col">
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} className="block w-full">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                  >
                    <Icon className="w-5 h-5" />
                    {t(item.translationKey)}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          >
            <aside
              className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="p-4 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className="block w-full"
                    >
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3"
                      >
                        <Icon className="w-5 h-5" />
                        {t(item.translationKey)}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
