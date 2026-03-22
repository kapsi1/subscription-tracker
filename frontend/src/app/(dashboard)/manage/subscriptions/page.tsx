'use client';

import { sendGAEvent } from '@next/third-parties/google';
import type { Category, Subscription } from '@subtracker/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus, Search, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { LoadingState } from '@/components/loading-state';
import { PaymentDetailsModal } from '@/components/payment-details-modal';
import { SubscriptionModal } from '@/components/subscription-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { SubscriptionsTable } from '../_components/SubscriptionsTable';
import { ImportPreviewModal } from './_components/ImportPreviewModal';

const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  paidAt: z.string(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().optional().nullable(),
});

const standalonePaymentSchema = z.object({
  subscriptionName: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  paidAt: z.string(),
});

const subscriptionImportSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3),
  billingCycle: z.enum(['monthly', 'yearly', 'custom']),
  intervalDays: z.number().positive().optional().nullable(),
  category: z.string().min(1),
  nextBillingDate: z.string().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderDays: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  payments: z.array(paymentSchema).optional(),
});

const importDataSchema = z.object({
  subscriptions: z.array(subscriptionImportSchema).optional(),
  categories: z.array(categorySchema).optional(),
  payments: z.array(standalonePaymentSchema).optional(),
});

export default function ManageSubscriptionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<z.infer<
    typeof importDataSchema
  > | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subscriptions = [], isLoading: isFetchLoading } = useQuery<Subscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const res = await api.get('/subscriptions');
      return res.data;
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const [isImportLoading, setIsImportLoading] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(t('subscriptions.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('subscriptions.deleteError'));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (subscription: Partial<Subscription>) => {
      if (subscription.id) {
        const { id, ...updateData } = subscription;
        const res = await api.patch(`/subscriptions/${id}`, updateData);
        return res.data;
      } else {
        const res = await api.post('/subscriptions', subscription);
        return res.data;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      if (variables.id) {
        toast.success(t('subscriptions.updateSuccess'));
      } else {
        toast.success(t('subscriptions.saveSuccess'));
        sendGAEvent({ event: 'add_subscription', value: 'success' });
      }
      setModalOpen(false);
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const backendMessage = error.response?.data?.message;
      const isCurrencyError = Array.isArray(backendMessage)
        ? backendMessage.some((m: string) => m.toLowerCase().includes('currency'))
        : typeof backendMessage === 'string' && backendMessage.toLowerCase().includes('currency');

      if (!isCurrencyError) {
        toast.error(t('subscriptions.saveError', { defaultValue: 'Failed to save subscription' }));
      }
      sendGAEvent({ event: 'add_subscription', value: 'failed' });
    },
  });

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddNew = () => {
    setEditingSubscription(null);
    setModalOpen(true);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('subscriptions.deleteConfirm'))) return;
    deleteMutation.mutate(id);
  };

  const handleSave = async (subscription: Partial<Subscription>) => {
    saveMutation.mutate(subscription);
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/subscriptions/export');
      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(res.data, null, 2),
      )}`;
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', 'subtracker_data.json');
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success(t('subscriptions.exportSuccess'));
      sendGAEvent({ event: 'export_subscriptions', value: 'success' });
    } catch (_err: unknown) {
      toast.error(t('subscriptions.exportError'));
      sendGAEvent({ event: 'export_subscriptions', value: 'failed' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);

        let importData: z.infer<typeof importDataSchema>;
        if (Array.isArray(json)) {
          importData = { subscriptions: json };
        } else if (json.subscriptions || json.categories || json.payments) {
          importData = json;
        } else {
          importData = { subscriptions: [json] };
        }

        const validData = importDataSchema.parse(importData);
        setImportPreviewData(validData);
        setPreviewModalOpen(true);
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          toast.error(`${t('subscriptions.importError')}: Invalid file format`);
        } else {
          toast.error(t('subscriptions.importError'));
        }
        sendGAEvent({ event: 'import_subscriptions', value: 'failed' });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = async (replace: boolean) => {
    if (!importPreviewData) return;

    setIsImportLoading(true);
    try {
      await api.post('/subscriptions/import', {
        ...importPreviewData,
        replace,
      });
      toast.success(t('subscriptions.importSuccess'));
      sendGAEvent({ event: 'import_subscriptions', value: 'success' });

      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPreviewModalOpen(false);
    } catch (_err: unknown) {
      toast.error(t('subscriptions.importError'));
      sendGAEvent({ event: 'import_subscriptions', value: 'failed' });
    } finally {
      setIsImportLoading(false);
    }
  };

  if (isFetchLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  return (
    <>
      {/* Actions + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="subscription-search"
            name="search"
            placeholder={t('subscriptions.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label={t('subscriptions.search')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="subscription-import"
            name="subscription-import"
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
            aria-label="Import subscriptions from JSON"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            {t('subscriptions.import')}
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
            <Download className="w-4 h-4" />
            {t('subscriptions.export')}
          </Button>
          <Button variant="outline" onClick={() => setAddPaymentOpen(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            {t('subscriptions.addPayment')}
          </Button>
          <Button onClick={handleAddNew} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            {t('subscriptions.add')}
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{t('subscriptions.all')}</CardTitle>
          <CardDescription>
            {t('subscriptions.foundCount', { count: filteredSubscriptions.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionsTable
            filteredSubscriptions={filteredSubscriptions}
            categories={categories}
            searchQuery={searchQuery}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAddNew}
          />
        </CardContent>
      </Card>

      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subscription={editingSubscription}
        onSave={handleSave}
      />

      <PaymentDetailsModal
        open={addPaymentOpen}
        onOpenChange={setAddPaymentOpen}
        payment={null}
      />

      <ImportPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        data={importPreviewData}
        onConfirm={confirmImport}
        isLoading={isImportLoading}
      />
    </>
  );
}
