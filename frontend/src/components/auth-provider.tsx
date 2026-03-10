'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
  defaultReminderEnabled: boolean;
  defaultReminderDays: number;
  monthlyBudget: number | string | null;
  lastBudgetAlertSentAt: string | null;
  theme: string;
  accentColor: string;
  emailNotifications: boolean;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  dailyDigest: boolean;
  weeklyReport: boolean;
  dashboardSortBy: string;
  dashboardSortOrder: string;
  showPaidPayments: boolean;
  avatarUrl: string | null;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterCredentials {
  email: string;
  name: string;
  password?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterCredentials) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  fetchUser: async () => {},
});

export const AuthProvider = ({
  children,
  initialToken,
}: {
  children: React.ReactNode;
  initialToken?: string;
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (initialToken) return true;
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState(!initialToken);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (_error) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // biome-ignore lint/suspicious/noDocumentCookie: intentional SSR auth cookie
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      // biome-ignore lint/suspicious/noDocumentCookie: intentional SSR auth cookie
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [router, fetchUser]);

  const login = async (data: LoginCredentials) => {
    const res = await api.post('/auth/login', data);
    const token = res.data.accessToken;
    localStorage.setItem('accessToken', token);
    // biome-ignore lint/suspicious/noDocumentCookie: intentional SSR auth cookie
    document.cookie = `accessToken=${token}; path=/; max-age=31536000; SameSite=Lax`;
    if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
    await fetchUser();
    router.push('/dashboard');
  };

  const register = async (data: RegisterCredentials) => {
    const res = await api.post('/auth/register', data);
    const token = res.data.accessToken;
    localStorage.setItem('accessToken', token);
    // biome-ignore lint/suspicious/noDocumentCookie: intentional SSR auth cookie
    document.cookie = `accessToken=${token}; path=/; max-age=31536000; SameSite=Lax`;
    if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
    await fetchUser();
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // biome-ignore lint/suspicious/noDocumentCookie: intentional SSR auth cookie
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, register, logout, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
