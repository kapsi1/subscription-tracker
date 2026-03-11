'use client';

import axios from 'axios';
import { ArrowLeft, CreditCard, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setIsSent(true);
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

      <Card className="w-full max-w-md shadow-lg border-2">
        {isSent ? (
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Mail className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                {t('auth.status.forgotPasswordEmailSentTitle')}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground whitespace-pre-wrap">
                {t('auth.status.forgotPasswordEmailSent')}
              </CardDescription>
            </div>
            <div className="pt-4">
              <Button variant="outline" asChild>
                <Link href="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('auth.register.switch')}
                </Link>
              </Button>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="space-y-4 text-center pb-8">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-md">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl">{t('auth.title')}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {t('auth.login.forgotPassword')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  {t('auth.register.switch')}
                </Link>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.fields.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.fields.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-11" size="lg" disabled={isLoading}>
                  {isLoading
                    ? t('auth.status.passwordResetRequesting')
                    : t('auth.login.forgotPassword')}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
