'use client';

import axios from 'axios';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

export function ChangePasswordSection() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error(t('settings.changePassword.errorMismatch'));
      return;
    }
    setIsLoading(true);
    try {
      await api.patch('/users/change-password', { currentPassword, newPassword }, { _skipAuthRedirect: true });
      toast.success(t('settings.changePassword.success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiMessage = (err.response?.data as { message?: string } | undefined)?.message;
        if (status === 401) {
          toast.error(t('settings.changePassword.errorCurrent'));
        } else if (apiMessage?.toLowerCase().includes('social')) {
          toast.error(t('settings.changePassword.errorSocial'));
        } else {
          toast.error(apiMessage || t('settings.changePassword.error'));
        }
      } else {
        toast.error(t('settings.changePassword.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>{t('settings.changePassword.title')}</CardTitle>
            <CardDescription>{t('settings.changePassword.desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('settings.changePassword.currentPassword')}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.changePassword.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">{t('settings.changePassword.confirmNewPassword')}</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('auth.status.pleaseWait') : t('settings.changePassword.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
