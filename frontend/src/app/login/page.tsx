'use client';

import axios from 'axios';
import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email, password });
        toast.success(t('auth.status.loginSuccess'));
      } else {
        await register({ name, email, password });
        toast.success(t('auth.status.registerSuccess'));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiMessage = (err.response?.data as { message?: string } | undefined)?.message;
        toast.error(apiMessage || err.message || t('auth.status.failed'));
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t('auth.status.failed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-secondary px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector showLabel />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">{t('auth.title')}</CardTitle>
            <CardDescription className="text-base mt-2">
              {isLogin ? t('auth.login.subtitle') : t('auth.register.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.fields.name')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.fields.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.fields.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.fields.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.fields.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.fields.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" size="lg" disabled={isLoading}>
              {isLoading
                ? t('auth.status.pleaseWait')
                : isLogin
                  ? t('auth.login.submit')
                  : t('auth.register.submit')}
            </Button>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('auth.social.title')}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                window.location.href = `${apiUrl}/auth/google`;
              }}
              disabled={isLoading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              {t('auth.social.google')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? t('auth.login.switch') : t('auth.register.switch')}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
