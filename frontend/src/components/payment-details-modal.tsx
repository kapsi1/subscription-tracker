'use client';

import type { PaymentHistory } from '@subtracker/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from './auth-provider';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PaymentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode, provided = view/edit mode */
  payment: PaymentHistory | null;
  onSuccess?: () => void;
}

export function PaymentDetailsModal({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: PaymentDetailsModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isCreateMode = payment === null;

  const [formData, setFormData] = useState({
    subscriptionName: '',
    amount: '',
    currency: '',
    paidAt: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open) {
      if (payment) {
        setFormData({
          subscriptionName: payment.subscriptionName,
          amount: payment.amount.toString(),
          currency: payment.currency,
          paidAt: new Date(payment.paidAt).toISOString().split('T')[0],
        });
      } else {
        setFormData({
          subscriptionName: '',
          amount: '',
          currency: user?.currency ?? 'USD',
          paidAt: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [open, payment, user?.currency]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: {
      subscriptionName: string;
      amount: number;
      currency: string;
      paidAt: string;
    }) => api.post('/payments', data),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.addSuccess'));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => toast.error(t('subscriptions.modal.payments.addError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { subscriptionName: string; amount: number; paidAt: string }) =>
      api.patch(`/payments/${payment?.id}`, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.updateSuccess'));
      onSuccess?.();
    },
    onError: () => toast.error(t('subscriptions.modal.payments.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/payments/${payment?.id}`),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.deleteSuccess'));
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => toast.error(t('subscriptions.modal.payments.deleteError')),
  });

  const handleDelete = () => {
    if (!confirm(t('subscriptions.modal.payments.deleteConfirm'))) return;
    deleteMutation.mutate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    if (isCreateMode) {
      createMutation.mutate({
        subscriptionName: formData.subscriptionName,
        amount,
        currency: formData.currency || 'USD',
        paidAt: formData.paidAt,
      });
    } else {
      updateMutation.mutate({
        subscriptionName: formData.subscriptionName,
        amount,
        paidAt: formData.paidAt,
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isCreateMode
              ? t('subscriptions.paymentDetails.addTitle')
              : t('subscriptions.paymentDetails.title')}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? t('subscriptions.paymentDetails.addDesc')
              : t('subscriptions.paymentDetails.viewDesc')}
          </DialogDescription>
        </DialogHeader>

        {/* Edit mode (always shown when not creating) */}
        {!isCreateMode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t('subscriptions.paymentDetails.serviceName')}</Label>
              <Input
                id="edit-name"
                value={formData.subscriptionName}
                onChange={(e) => setFormData({ ...formData, subscriptionName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-paidAt">{t('subscriptions.modal.payments.date')}</Label>
                <Input
                  id="edit-paidAt"
                  type="date"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">{t('subscriptions.modal.payments.amount')}</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSaving}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('common.delete', { defaultValue: 'Delete' })}
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {t('subscriptions.modal.payments.save')}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Create mode */}
        {isCreateMode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">{t('subscriptions.paymentDetails.serviceName')}</Label>
              <Input
                id="create-name"
                placeholder={t('subscriptions.modal.servicePlaceholder')}
                value={formData.subscriptionName}
                onChange={(e) => setFormData({ ...formData, subscriptionName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-paidAt">{t('subscriptions.modal.payments.date')}</Label>
                <Input
                  id="create-paidAt"
                  type="date"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-amount">{t('subscriptions.modal.payments.amount')}</Label>
                <Input
                  id="create-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('subscriptions.modal.cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {t('subscriptions.modal.payments.addPayment')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
