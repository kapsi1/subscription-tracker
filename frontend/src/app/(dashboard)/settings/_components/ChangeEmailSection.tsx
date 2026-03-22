'use client';

import axios from 'axios';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

export function ChangeEmailSection() {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();
  const { fetchUser } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.patch(
        '/users/change-email',
        { newEmail, currentPassword },
        {
          _skipAuthRedirect: true,
        },
      );
      toast.success(t('settings.changeEmail.success'));
      setNewEmail('');
      setCurrentPassword('');
      await fetchUser();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const apiMessage = (err.response?.data as { message?: string } | undefined)?.message;
        if (status === 401) {
          toast.error(t('settings.changeEmail.errorCurrent'));
        } else if (status === 409) {
          toast.error(t('settings.changeEmail.errorInUse'));
        } else if (apiMessage?.toLowerCase().includes('social')) {
          toast.error(t('settings.changeEmail.errorSocial'));
        } else {
          toast.error(apiMessage || t('settings.changeEmail.error'));
        }
      } else {
        toast.error(t('settings.changeEmail.error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight text={t('settings.changeEmail.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.changeEmail.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">
                <SearchHighlight text={t('settings.changeEmail.newEmail')} query={searchQuery} />
              </Label>
              <Input
                id="newEmail"
                name="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="changeEmailPassword">
                <SearchHighlight
                  text={t('settings.changeEmail.currentPassword')}
                  query={searchQuery}
                />
              </Label>
              <Input
                id="changeEmailPassword"
                name="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewEmail('');
                setCurrentPassword('');
              }}
              disabled={isLoading}
            >
              {t('subscriptions.modal.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('auth.status.pleaseWait') : t('settings.changeEmail.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
