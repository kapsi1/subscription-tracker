import type { PaymentHistory } from '@subtracker/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface PaymentHistoryTabProps {
  subscriptionId: string;
  currency: string;
}

interface EditState {
  amount: string;
  paidAt: string;
}

type SortKey = 'paidAt' | 'amount';
type SortDir = 'asc' | 'desc';

export function PaymentHistoryTab({ subscriptionId, currency }: PaymentHistoryTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDir }>({
    key: 'paidAt',
    direction: 'asc',
  });
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null) {
      amountRef.current?.focus();
    }
  }, [editingId]);

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
      setEditingId(null);
    },
    onError: () => toast.error(t('subscriptions.modal.payments.addError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount?: number; paidAt?: string } }) =>
      api.patch(`/subscriptions/${subscriptionId}/payments/${id}`, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('subscriptions.modal.payments.updateSuccess'));
      setEditingId(null);
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

  const handleAdd = () => {
    setEditState({ amount: '', paidAt: new Date().toISOString().split('T')[0] });
    setEditingId('new');
  };

  const handleEdit = (payment: PaymentHistory) => {
    setEditState({
      amount: payment.amount.toString(),
      paidAt: new Date(payment.paidAt).toISOString().split('T')[0],
    });
    setEditingId(payment.id);
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('subscriptions.modal.payments.deleteConfirm'))) return;
    deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(editState.amount);
    if (Number.isNaN(amount) || amount <= 0) return;

    if (editingId === 'new') {
      createMutation.mutate({ amount, currency, paidAt: editState.paidAt });
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, data: { amount, paidAt: editState.paidAt } });
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
    );
  };

  const sortedPayments = [...payments].sort((a, b) => {
    const dir = sortConfig.direction === 'asc' ? 1 : -1;
    if (sortConfig.key === 'amount') {
      return (Number(a.amount) - Number(b.amount)) * dir;
    }
    return (new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime()) * dir;
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
    );
  }

  const showTable = payments.length > 0 || editingId === 'new';

  const inlineEditRow = (
    <TableRow key="edit-row">
      <TableCell colSpan={3} className="p-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            type="date"
            className="h-8 text-sm w-[130px]"
            value={editState.paidAt}
            onChange={(e) => setEditState({ ...editState, paidAt: e.target.value })}
            required
          />
          <Input
            ref={amountRef}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="h-8 text-sm w-[70px]"
            value={editState.amount}
            onChange={(e) => setEditState({ ...editState, amount: e.target.value })}
            required
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={() => setEditingId(null)}
          >
            {t('subscriptions.modal.payments.cancel')}
          </Button>
          <Button type="submit" size="sm" className="h-8 shrink-0" disabled={isSaving}>
            {t('subscriptions.modal.payments.save')}
          </Button>
        </form>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('subscriptions.modal.payments.title')}</h3>
        {editingId === null && (
          <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t('subscriptions.modal.payments.addPayment')}
          </Button>
        )}
      </div>

      {!showTable && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('subscriptions.modal.payments.noPayments')}
        </div>
      )}

      {showTable && (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('paidAt')}
                >
                  <div className="flex items-center">
                    {t('subscriptions.modal.payments.date')}
                    {getSortIcon('paidAt')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    {t('subscriptions.modal.payments.amount')}
                    {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead className="w-[56px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) =>
                editingId === payment.id ? (
                  inlineEditRow
                ) : (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer group hover:bg-accent/50"
                    onClick={() => handleEdit(payment)}
                  >
                    <TableCell className="text-sm">{formatDate(payment.paidAt)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(payment.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}

              {/* New row at bottom when adding */}
              {editingId === 'new' && inlineEditRow}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
