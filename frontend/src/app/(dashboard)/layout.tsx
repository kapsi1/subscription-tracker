'use client';

import { Download, LayoutDashboard, ListChecks, LogOut, Settings, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/components/auth-provider';
import { ErrorState } from '@/components/error-state'; // Assuming this path
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/components/ui/utils';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { canInstall, install } = useInstallPrompt();

  const [backendInitStatus, setBackendInitStatus] = useState<'checking' | 'ready' | 'timeout'>(
    'ready',
  );
  const [isRedirecting, setIsRedirecting] = useState(false);

  const runBackendInitializationCheck = useCallback(() => {
    setBackendInitStatus('checking');

    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      if (isActive) {
        setBackendInitStatus('timeout');
      }
    }, 15000);

    api
      .get('/health')
      .then(() => {
        if (isActive) {
          window.clearTimeout(timeoutId);
          setBackendInitStatus('ready');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('backend_ready', 'true');
          }
        }
      })
      .catch((err) => {
        console.error('Health check failed', err);
        if (isActive) {
          window.clearTimeout(timeoutId);
          setBackendInitStatus('timeout');
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

  useEffect(() => {
    // Only attempt one redirect per mount; skip if already on login page
    if (
      pathname !== '/login' &&
      backendInitStatus === 'ready' &&
      !isLoading &&
      !isAuthenticated &&
      !isRedirecting
    ) {
      setIsRedirecting(true);
      router.replace('/login');
    }
  }, [backendInitStatus, isLoading, isAuthenticated, isRedirecting, router, pathname]);

  // Safety check: if we are somehow rendering this layout on the login page,
  // do nothing to prevent redirect loops.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = () => logout();

  const getUserInitials = () => {
    const source = user?.name?.trim() || user?.email?.trim() || '';
    if (!source) return 'U';

    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
  };

  const title = 'SubTracker';
  const _currentLanguage = i18n.language || 'en';

  // 1. Initial health check failed
  if (backendInitStatus === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight">{title}</h1>
          <ErrorState
            title={t('common.connectionError')}
            message={t('common.backendTimeout')}
            onRetry={runBackendInitializationCheck}
            retryLabel={t('common.tryAgain')}
            retryButtonClassName="bg-[#4F46E5] text-white border-transparent shadow-sm transition-shadow hover:bg-[#4338CA] hover:text-white hover:shadow-md"
          />
        </div>
      </div>
    );
  }

  // 2. Not Authenticated (show full screen loading)
  if (!isAuthenticated && !isLoading && !isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-2xl px-4 text-center">
          <h1 className="text-5xl font-semibold tracking-tight mb-8">{title}</h1>
          {backendInitStatus === 'checking' ? (
            <LoadingState message={t('common.initializingApp')} />
          ) : (
            <>
              <LoadingState message={t('common.redirectingToLogin')} />
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/login" prefetch={false}>
                    Go to login
                  </Link>
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
    <div className="min-h-screen bg-premium-pattern flex flex-col">
      <header className="sticky flex justify-center top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="flex h-16 min-w-0 items-center gap-2 px-4 sm:px-6 md:gap-4 w-full max-w-[1055px]">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <Image
              src="/logo-transparent.svg"
              alt="SubTracker"
              width={64}
              height={64}
              style={{ width: 64, height: 64 }}
              className="mx-auto"
              priority
            />
            <span className="font-semibold text-lg hidden sm:inline">SubTracker</span>
          </Link>

          <nav className="ml-1 flex min-w-0 items-center gap-1 sm:ml-2 md:ml-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className={cn(
                  'gap-2 px-2 min-[860px]:px-3 transition-colors',
                  pathname === '/dashboard' || pathname.startsWith('/dashboard/')
                    ? 'nav-item-active hover:bg-transparent font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
                size="sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.dashboard')}</span>
              </Button>
            </Link>
            <Link href="/manage">
              <Button
                variant="ghost"
                className={cn(
                  'gap-2 px-2 min-[860px]:px-3 transition-colors',
                  pathname === '/manage' || pathname.startsWith('/manage/')
                    ? 'nav-item-active hover:bg-transparent font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
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
                  'gap-2 px-2 min-[860px]:px-3 transition-colors',
                  pathname === '/settings' || pathname.startsWith('/settings/')
                    ? 'nav-item-active hover:bg-transparent font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
                size="sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.settings')}</span>
              </Button>
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-9 w-9 rounded-full border bg-muted p-0 overflow-hidden"
                  aria-label="User menu"
                >
                  {user?.avatarUrl ? (
                    <Image
                      unoptimized
                      src={user.avatarUrl}
                      alt={user.name || 'User avatar'}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold tracking-wide">{getUserInitials()}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="flex items-center gap-2 cursor-pointer">
                    <UserRound className="h-4 w-4" />
                    <span>{t('settings.tabs.profile')}</span>
                  </Link>
                </DropdownMenuItem>
                {canInstall && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={install} className="gap-2 cursor-pointer">
                      <Download className="h-4 w-4" />
                      <span>{t('nav.installApp')}</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto flex-1 w-full max-w-[1055px] min-w-0 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingState message={t('common.loading')} />
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
