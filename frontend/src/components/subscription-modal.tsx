import type { Category, Subscription } from '@subtracker/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { useAuth } from './auth-provider';
import { CustomBillingModal } from './custom-billing-modal';
import { PaymentHistoryTab } from './payment-history-tab';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSave: (subscription: Partial<Subscription>) => Promise<void>;
}

const billingCycles = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom', value: 'custom' },
];

export function SubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSave,
}: SubscriptionModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    category: 'Other',
    nextBillingDate: new Date().toISOString().split('T')[0],
    reminderEnabled: true,
    reminderDays: '3',
    billingDays: [] as number[],
    billingMonthShortageOffset: 1,
    billingMonthShortageDirection: 'before' as 'before' | 'after' | 'skip',
  });
  const [customBillingOpen, setCustomBillingOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (subscription && open) {
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        billingCycle: subscription.billingCycle,
        category: subscription.category,
        nextBillingDate: subscription.nextBillingDate
          ? new Date(subscription.nextBillingDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        reminderEnabled: subscription.reminderEnabled ?? true,
        reminderDays: (subscription.reminderDays ?? 3).toString(),
        billingDays: subscription.billingDays ?? [],
        billingMonthShortageOffset: subscription.billingMonthShortageOffset || 1,
        billingMonthShortageDirection:
          (subscription.billingMonthShortageDirection as 'before' | 'after' | 'skip') ?? 'before',
      });
    } else if (!subscription && open) {
      setFormData({
        name: '',
        amount: '',
        billingCycle: 'monthly',
        category: 'Other',
        nextBillingDate: new Date().toISOString().split('T')[0],
        reminderEnabled: user?.defaultReminderEnabled ?? true,
        reminderDays: (user?.defaultReminderDays ?? 3).toString(),
        billingDays: [],
        billingMonthShortageOffset: 1,
        billingMonthShortageDirection: 'before',
      });
      setIsSubmitted(false);
      setErrors({});
    }
    setActiveTab('details');
  }, [subscription, open, user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'nameRequired';
    if (
      !formData.amount ||
      Number.isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = 'amountRequired';
    }
    if (!formData.nextBillingDate) {
      newErrors.nextBillingDate = 'nextBillingDateRequired';
    }
    if (formData.reminderEnabled) {
      const days = parseInt(formData.reminderDays, 10);
      if (Number.isNaN(days) || days < 0 || days > 30) {
        newErrors.reminderDays = 'reminderDaysRequired';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...(subscription?.id ? { id: subscription.id } : {}),
        name: formData.name,
        amount: parseFloat(formData.amount),
        billingCycle: formData.billingCycle,
        category: formData.category,
        nextBillingDate: formData.nextBillingDate,
        reminderEnabled: formData.reminderEnabled,
        reminderDays: parseInt(formData.reminderDays, 10),
        billingDays: formData.billingDays,
        billingMonthShortageOffset: formData.billingMonthShortageOffset,
        billingMonthShortageDirection: formData.billingMonthShortageDirection,
      });
    } catch (_err: unknown) {
      // Backend handles currency
    } finally {
      setIsSaving(false);
    }
  };

  const isEditing = !!subscription;

  const detailsForm = (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('subscriptions.modal.serviceName')}</Label>
          <Input
            id="name"
            name="name"
            placeholder={t('subscriptions.modal.servicePlaceholder')}
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) {
                const newErrors = { ...errors };
                delete newErrors.name;
                setErrors(newErrors);
              }
            }}
            aria-invalid={isSubmitted && !!errors.name}
          />
          {isSubmitted && errors.name && (
            <p className="text-xs font-medium text-destructive">
              {t(`subscriptions.modal.errors.${errors.name}`)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('subscriptions.modal.amount')}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                if (errors.amount) {
                  const newErrors = { ...errors };
                  delete newErrors.amount;
                  setErrors(newErrors);
                }
              }}
              aria-invalid={isSubmitted && !!errors.amount}
            />
            {isSubmitted && errors.amount && (
              <p className="text-xs font-medium text-destructive">
                {t(`subscriptions.modal.errors.${errors.amount}`)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextBillingDate">{t('subscriptions.modal.nextBillingDate')}</Label>
            <Input
              id="nextBillingDate"
              name="nextBillingDate"
              type="date"
              value={formData.nextBillingDate}
              onChange={(e) => {
                setFormData({ ...formData, nextBillingDate: e.target.value });
                if (errors.nextBillingDate) {
                  const newErrors = { ...errors };
                  delete newErrors.nextBillingDate;
                  setErrors(newErrors);
                }
              }}
              aria-invalid={isSubmitted && !!errors.nextBillingDate}
            />
            {isSubmitted && errors.nextBillingDate && (
              <p className="text-xs font-medium text-destructive">
                {t(`subscriptions.modal.errors.${errors.nextBillingDate}`)}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billingCycle">{t('subscriptions.modal.billingCycle')}</Label>
            <TooltipProvider>
              <Tooltip
                open={
                  formData.billingCycle === 'custom' && formData.billingDays.length > 0
                    ? undefined
                    : false
                }
              >
                <TooltipTrigger asChild>
                  <div>
                    <Select
                      name="billingCycle"
                      value={formData.billingCycle}
                      onValueChange={(value) => {
                        setFormData({ ...formData, billingCycle: value });
                        if (value === 'custom') {
                          setCustomBillingOpen(true);
                        }
                      }}
                    >
                      <SelectTrigger id="billingCycle">
                        <SelectValue>
                          {formData.billingCycle === 'custom' && formData.billingDays.length > 0
                            ? t('subscriptions.customBilling.label', {
                                count: formData.billingDays.length,
                              })
                            : t(`subscriptions.modal.billingCycles.${formData.billingCycle}`)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {billingCycles.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {t(`subscriptions.modal.billingCycles.${cycle.value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t('subscriptions.customBilling.tooltip', {
                      days: formData.billingDays.join(', '),
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {formData.billingCycle === 'custom' && (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={() => setCustomBillingOpen(true)}
              >
                {t('subscriptions.customBilling.title')}
              </Button>
            )}
          </div>

          <div className="space-y-2 col-span-1 sm:col-span-2">
            <Label htmlFor="category">{t('subscriptions.modal.category')}</Label>
            <Select
              name="category"
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue>
                  {(() => {
                    const cat = categories.find((c) => c.name === formData.category);
                    return (
                      <span className="flex items-center gap-2">
                        {cat && (
                          <span
                            className="inline-block w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                        {t(`subscriptions.modal.categories.${formData.category}`, {
                          defaultValue: formData.category,
                        })}
                      </span>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      {t(`subscriptions.modal.categories.${category.name}`, {
                        defaultValue: category.name,
                      })}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t pt-4">
          <div className="flex items-center gap-4">
          <Switch
            id="reminderEnabled"
            name="reminderEnabled"
            checked={formData.reminderEnabled}
            onCheckedChange={(checked) => setFormData({ ...formData, reminderEnabled: checked })}
          />
          <Label htmlFor="reminderEnabled" className="cursor-pointer">
            {t('subscriptions.modal.reminders')}
          </Label>
        </div>
          {formData.reminderEnabled && (
            <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto sm:justify-end">
              <Label htmlFor="reminderDays" className="text-sm whitespace-nowrap">
                {t('subscriptions.modal.reminderDays')}
              </Label>
              <Input
                id="reminderDays"
                name="reminderDays"
                type="number"
                min="0"
                max="30"
                className="w-20"
                value={formData.reminderDays}
                onChange={(e) => {
                  setFormData({ ...formData, reminderDays: e.target.value });
                  if (errors.reminderDays) {
                    const newErrors = { ...errors };
                    delete newErrors.reminderDays;
                    setErrors(newErrors);
                  }
                }}
                aria-invalid={isSubmitted && !!errors.reminderDays}
              />
            </div>
          )}
        </div>
        {isSubmitted && errors.reminderDays && (
          <p className="text-xs font-medium text-destructive">
            {t(`subscriptions.modal.errors.${errors.reminderDays}`)}
          </p>
        )}
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          {t('subscriptions.modal.cancel')}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? t('common.loading')
            : subscription
              ? t('subscriptions.modal.update')
              : t('subscriptions.modal.add')}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-screen p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {subscription ? t('subscriptions.modal.editTitle') : t('subscriptions.modal.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {subscription ? t('subscriptions.modal.editDesc') : t('subscriptions.modal.addDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {isEditing ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  {t('subscriptions.modal.tabs.details')}
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex-1">
                  {t('subscriptions.modal.tabs.payments')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">{detailsForm}</TabsContent>
              <TabsContent value="payments">
                {subscription && (
                  <PaymentHistoryTab
                    subscriptionId={subscription.id}
                    currency={subscription.currency}
                  />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            detailsForm
          )}
        </div>
      </DialogContent>
      <CustomBillingModal
        open={customBillingOpen}
        onOpenChange={(open) => {
          setCustomBillingOpen(open);
          if (!open) {
            setFormData((prev) => {
              if (prev.billingDays.length === 0) {
                return { ...prev, billingCycle: 'monthly' };
              }
              return prev;
            });
          }
        }}
        days={formData.billingDays}
        shortageOffset={formData.billingMonthShortageOffset}
        shortageDirection={formData.billingMonthShortageDirection}
        onSave={(days, offset, direction) =>
          setFormData((prev) => ({
            ...prev,
            billingDays: days,
            billingMonthShortageOffset: offset,
            billingMonthShortageDirection: direction,
          }))
        }
      />
    </Dialog>
  );
}
