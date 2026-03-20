import type { PaymentHistory } from '@subtracker/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface PaymentHistoryTabProps {
  subscriptionId: string;
  currency: string;
}

interface PaymentFormData {
  amount: string;
  paidAt: string;
}

export function PaymentHistoryTab({ subscriptionId, currency }: PaymentHistoryTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
  });

  const { data: payments = [], isLoading } = useQuery<PaymentHistory[]>({
    queryKey: ['payments', subscriptionId],
    queryFn: async () => {
      const res = await api.get(`/subscriptions/${subscriptionId}/payments`);
      return res.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payments', subscriptionId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (data: { amount: number; currency: string; paidAt: string }) =>
      api.post(`/subscriptions/${subscriptionId}/payments`, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.addSuccess'));
      resetForm();
    },
    onError: () => toast.error(t('subscriptions.modal.payments.addError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount?: number; paidAt?: string } }) =>
      api.patch(`/subscriptions/${subscriptionId}/payments/${id}`, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.updateSuccess'));
      resetForm();
    },
    onError: () => toast.error(t('subscriptions.modal.payments.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/${subscriptionId}/payments/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.deleteSuccess'));
    },
    onError: () => toast.error(t('subscriptions.modal.payments.deleteError')),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ amount: '', paidAt: new Date().toISOString().split('T')[0] });
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ amount: '', paidAt: new Date().toISOString().split('T')[0] });
    setShowForm(true);
  };

  const handleEdit = (payment: PaymentHistory) => {
    setEditingId(payment.id);
    setFormData({
      amount: payment.amount.toString(),
      paidAt: new Date(payment.paidAt).toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('subscriptions.modal.payments.deleteConfirm'))) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { amount, paidAt: formData.paidAt } });
    } else {
      createMutation.mutate({ amount, currency, paidAt: formData.paidAt });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('subscriptions.modal.payments.title')}</h3>
        {!showForm && (
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t('subscriptions.modal.payments.addPayment')}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paymentDate" className="text-xs">
                {t('subscriptions.modal.payments.date')}
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paidAt}
                onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentAmount" className="text-xs">
                {t('subscriptions.modal.payments.amount')}
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              {t('subscriptions.modal.payments.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {t('subscriptions.modal.payments.save')}
            </Button>
          </div>
        </form>
      )}

      {payments.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('subscriptions.modal.payments.noPayments')}
        </div>
      ) : (
        <div className="max-h-[350px] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('subscriptions.modal.payments.date')}</TableHead>
                <TableHead className="text-right">
                  {t('subscriptions.modal.payments.amount')}
                </TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">{formatDate(payment.paidAt)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(payment)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
