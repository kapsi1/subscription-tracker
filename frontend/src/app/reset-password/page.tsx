'use client';

import axios from 'axios';
import { CheckCircle2, CreditCard, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <p className="text-lg font-medium">{t('auth.status.passwordResetFailed')}</p>
          <Button asChild>
            <Link href="/forgot-password">{t('auth.login.forgotPassword')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('auth.status.passwordsDoNotMatch'));
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(token, password);
      setStatus('success');
      toast.success(t('auth.status.passwordResetSuccess'));
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setStatus('error');
      if (axios.isAxiosError(err)) {
        const apiMessage = (err.response?.data as { message?: string } | undefined)?.message;
        toast.error(apiMessage || err.message || t('auth.status.passwordResetFailed'));
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(t('auth.status.passwordResetFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center pb-12 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <p className="text-lg font-medium">{t('auth.status.passwordResetSuccess')}</p>
          <p className="text-sm text-muted-foreground">{t('common.redirectingToLogin')}</p>
          <Button onClick={() => router.push('/login')}>
            {t('auth.login.submit')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-12 pb-12 text-center space-y-4">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <p className="text-lg font-medium">{t('auth.status.passwordResetFailed')}</p>
          <Button asChild>
            <Link href="/forgot-password">{t('auth.login.forgotPassword')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-2">
      <CardHeader className="space-y-4 text-center pb-8">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">{t('auth.title')}</CardTitle>
          <CardDescription className="text-base mt-2">
            {t('emails.passwordReset.title')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.fields.newPassword')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth.fields.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('auth.fields.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder={t('auth.fields.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full h-11" size="lg" disabled={isLoading}>
            {isLoading ? t('auth.status.pleaseWait') : t('emails.passwordReset.button')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-secondary px-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector showLabel />
      </div>
      <Suspense
        fallback={
          <Card className="w-full max-w-md shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
