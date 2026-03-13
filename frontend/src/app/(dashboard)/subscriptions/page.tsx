'use client';

import { sendGAEvent } from '@next/third-parties/google';
import type { Category, Subscription } from '@subtracker/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { DynamicIcon } from '@/components/DynamicIcon';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { SubscriptionModal } from '@/components/subscription-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/lib/api';
import { formatCurrency, formatDate, getCategoryStyle } from '@/lib/utils';

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
  payments: z
    .array(
      z.object({
        amount: z.number().positive(),
        currency: z.string().length(3),
        paidAt: z.string(),
      }),
    )
    .optional(),
});

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Subscription;
    direction: 'asc' | 'desc';
  }>({ key: 'nextBillingDate' as keyof Subscription, direction: 'asc' });
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

  const getCategoryColor = (name: string) =>
    categories.find((c) => c.name === name)?.color ?? '#64748b';

  const getCategoryIcon = (name: string) => categories.find((c) => c.name === name)?.icon ?? 'Tag';

  const [isImportLoading, setIsImportLoading] = useState(false);
  const isLoading = isFetchLoading || isImportLoading;

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

  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    const key = sortConfig.key;
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    const aValue = a[key];
    const bValue = b[key];

    // Numeric comparison for amount
    if (key === 'amount') {
      const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue as string) || 0;
      const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue as string) || 0;
      return (aNum - bNum) * direction;
    }

    // Handle null/undefined values
    if (aValue === bValue) return 0;
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;

    // String comparison for names and categories
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * direction;
    }

    // Generic comparison for other types
    return (aValue < bValue ? -1 : 1) * direction;
  });

  const handleSort = (key: keyof Subscription) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Subscription) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

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
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(res.data.subscriptions, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', 'subscriptions.json');
      document.body.appendChild(downloadAnchorNode); // required for firefox
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
      setIsImportLoading(true);
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);

        // Ensure it's an array
        const subscriptionsToImport = Array.isArray(json) ? json : json.subscriptions || [json];

        // Validate with Zod before sending to the backend
        const validSubscriptions = z.array(subscriptionImportSchema).parse(subscriptionsToImport);

        await api.post('/subscriptions/import', { subscriptions: validSubscriptions });
        toast.success(t('subscriptions.importSuccess'));
        sendGAEvent({ event: 'import_subscriptions', value: 'success' });

        // Refresh list
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (err: unknown) {
        if (err instanceof z.ZodError) {
          toast.error(`${t('subscriptions.importError')}: Invalid file format`);
        } else {
          toast.error(t('subscriptions.importError'));
        }
        sendGAEvent({ event: 'import_subscriptions', value: 'failed' });
      } finally {
        setIsImportLoading(false);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{t('subscriptions.title')}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
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
          <Button onClick={handleAddNew} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            {t('subscriptions.add')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('subscriptions.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{t('subscriptions.all')}</CardTitle>
          <CardDescription>
            {t('subscriptions.foundCount', { count: filteredSubscriptions.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <EmptyState
              title={t('subscriptions.noFound')}
              description={
                searchQuery ? t('subscriptions.noFoundDesc') : t('subscriptions.getStarted')
              }
              actionLabel={searchQuery ? undefined : t('subscriptions.add')}
              onAction={searchQuery ? undefined : handleAddNew}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        {t('subscriptions.table.service')}
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        {t('subscriptions.table.amount')}
                        {getSortIcon('amount')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('billingCycle')}
                    >
                      <div className="flex items-center">
                        {t('subscriptions.table.cycle')}
                        {getSortIcon('billingCycle')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('nextBillingDate')}
                    >
                      <div className="flex items-center">
                        {t('subscriptions.table.next')}
                        {getSortIcon('nextBillingDate')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground transition-colors select-none"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        {t('subscriptions.table.category')}
                        {getSortIcon('category')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSubscriptions.map((subscription) => (
                    <TableRow
                      key={subscription.id}
                      className="hover:bg-accent/50 cursor-pointer group"
                      onClick={() => handleEdit(subscription)}
                    >
                      <TableCell className="font-medium max-w-[200px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="truncate cursor-pointer">{subscription.name}</div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[300px] wrap-break-word">
                              {subscription.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(subscription.amount, subscription.currency)}
                      </TableCell>
                      <TableCell>
                        {t(`subscriptions.modal.billingCycles.${subscription.billingCycle}`)}
                      </TableCell>
                      <TableCell>
                        {subscription.nextBillingDate
                          ? formatDate(subscription.nextBillingDate)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="gap-1.5"
                          style={getCategoryStyle(getCategoryColor(subscription.category))}
                        >
                          <DynamicIcon
                            name={getCategoryIcon(subscription.category)}
                            fallback={Tag}
                            className="w-3.5 h-3.5"
                          />
                          {t(`subscriptions.modal.categories.${subscription.category}`, {
                            defaultValue: subscription.category,
                          })}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(subscription);
                            }}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(subscription.id);
                            }}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Modal */}
      <SubscriptionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subscription={editingSubscription}
        onSave={handleSave}
      />
    </div>
  );
}
