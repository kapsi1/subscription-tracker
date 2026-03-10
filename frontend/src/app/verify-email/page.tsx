'use client';

import { CheckCircle2, CreditCard, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function VerifyEmailContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const { verifyEmail } = useAuth();
  const verifying = useRef(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token || verifying.current) {
      if (!token) setStatus('error');
      return;
    }

    const verify = async () => {
      verifying.current = true;
      try {
        await verifyEmail(token);
        setStatus('success');
        toast.success(t('auth.status.verificationSuccess'));
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (_err) {
        setStatus('error');
        toast.error(t('auth.status.verificationFailed'));
        verifying.current = false;
      }
    };

    verify();
  }, [token, verifyEmail, router, t]);

  return (
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
            {t('emails.verification.title')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="text-center pb-12">
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground">{t('auth.status.pleaseWait')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <p className="text-lg font-medium">{t('auth.status.verificationSuccess')}</p>
            <p className="text-sm text-muted-foreground">{t('common.redirectingToDashboard')}</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              {t('nav.dashboard')}
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="w-16 h-16 text-destructive" />
            <p className="text-lg font-medium">{t('auth.status.verificationFailed')}</p>
            <Button className="mt-4" onClick={() => router.push('/login')}>
              {t('auth.login.switch')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
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
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
