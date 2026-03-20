'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();
  const { logout, user } = useAuth();
  const isGoogleAccount = !!user?.googleId;
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/me', { 
        data: { password },
        _skipAuthRedirect: true
      });
      toast.success(t('settings.deleteAccount.success'));
      setIsOpen(false);
      // Log out and redirect which is handled by logout() in auth-provider
      logout();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error(t('settings.deleteAccount.errorIncorrect'));
      } else {
        toast.error(t('settings.deleteAccount.error'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPassword('');
    }
  };

  return (
    <Card className="shadow-sm border-red-200 dark:border-red-900/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-red-600">
              <SearchHighlight text={t('settings.deleteAccount.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.deleteAccount.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              {t('settings.deleteAccount.button')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-center">
                {t('settings.deleteAccount.confirmTitle')}
              </DialogTitle>
              <DialogDescription className="text-center">
                {t('settings.deleteAccount.confirmDesc')}
              </DialogDescription>
            </DialogHeader>

            {!isGoogleAccount && (
              <div className="py-2 space-y-2">
                <Label htmlFor="delete-account-password">
                  {t('settings.deleteAccount.passwordLabel')}
                </Label>
                <Input
                  id="delete-account-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('settings.deleteAccount.passwordPlaceholder')}
                  disabled={isDeleting}
                />
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="w-full sm:w-auto"
                disabled={isDeleting}
              >
                {t('settings.deleteAccount.cancelButton')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="w-full sm:w-auto"
                disabled={isDeleting || (!isGoogleAccount && !password)}
              >
                {isDeleting ? t('auth.status.pleaseWait') : t('settings.deleteAccount.confirmButton')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
