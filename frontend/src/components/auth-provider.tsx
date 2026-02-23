"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) setIsAuthenticated(true);
    setIsLoading(false);

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      router.push('/login');
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [router]);

  const login = async (data: any) => {
    const res = await api.post('/auth/login', data);
    localStorage.setItem('accessToken', res.data.accessToken);
    if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
    setIsAuthenticated(true);
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', res.data.accessToken);
    if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
    setIsAuthenticated(true);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
