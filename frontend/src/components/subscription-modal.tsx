import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import api from "@/lib/api";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBillingDate?: string;
  category: string;
  isActive?: boolean;
  reminderEnabled?: boolean;
  reminderDays?: number;
}

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSave: (subscription: Partial<Subscription>) => Promise<void>;
}

const categories = [
  "Entertainment",
  "Productivity",
  "Cloud Services",
  "Development",
  "Professional",
  "Health & Fitness",
  "Education",
  "Other",
];

const billingCycles = [
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "Custom", value: "custom" },
];
const LAST_CURRENCY_KEY = "last_subscription_currency";

export function SubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSave,
}: SubscriptionModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    currency: "USD", // Will be updated in useEffect
    billingCycle: "monthly",
    category: "Other",
    nextBillingDate: new Date().toISOString().split("T")[0],
    reminderEnabled: true,
    reminderDays: "3",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const response = await api.get("/users/me");
        setFormData(prev => ({
          ...prev,
          reminderEnabled: response.data.defaultReminderEnabled,
          reminderDays: response.data.defaultReminderDays.toString(),
        }));
      } catch (error) {
        console.error("Failed to fetch user defaults", error);
      }
    };

    if (subscription && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        category: subscription.category,
        nextBillingDate: subscription.nextBillingDate 
          ? new Date(subscription.nextBillingDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        reminderEnabled: subscription.reminderEnabled ?? true,
        reminderDays: (subscription.reminderDays ?? 3).toString(),
      });
    } else if (!subscription && open) {
      const lastCurrency = localStorage.getItem(LAST_CURRENCY_KEY) || "USD";
      setFormData({
        name: "",
        amount: "",
        currency: lastCurrency,
        billingCycle: "monthly",
        category: "Other",
        nextBillingDate: new Date().toISOString().split("T")[0],
        reminderEnabled: true,
        reminderDays: "3",
      });
      setIsSubmitted(false);
      setErrors({});
      fetchDefaults();
    }
  }, [subscription, open]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "nameRequired";
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "amountRequired";
    }
    if (!formData.currency.trim()) {
      newErrors.currency = "currencyRequired";
    } else if (formData.currency.length !== 3) {
      newErrors.currency = "invalidCurrency";
    }
    if (!formData.nextBillingDate) {
      newErrors.nextBillingDate = "nextBillingDateRequired";
    }
    if (formData.reminderEnabled) {
      const days = parseInt(formData.reminderDays);
      if (isNaN(days) || days < 0 || days > 30) {
        newErrors.reminderDays = "reminderDaysRequired";
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
      localStorage.setItem(LAST_CURRENCY_KEY, formData.currency);
      await onSave({
        ...(subscription?.id ? { id: subscription.id } : {}),
        name: formData.name,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        category: formData.category,
        nextBillingDate: formData.nextBillingDate,
        reminderEnabled: formData.reminderEnabled,
        reminderDays: parseInt(formData.reminderDays),
      });
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      const isCurrencyError = Array.isArray(backendMessage) 
        ? backendMessage.some((m: string) => m.toLowerCase().includes('currency'))
        : typeof backendMessage === 'string' && backendMessage.toLowerCase().includes('currency');

      if (isCurrencyError) {
        setErrors(prev => ({ ...prev, currency: "invalidCurrency" }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? t("subscriptions.modal.editTitle") : t("subscriptions.modal.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {subscription
              ? t("subscriptions.modal.editDesc")
              : t("subscriptions.modal.addDesc")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("subscriptions.modal.serviceName")}</Label>
              <Input
                id="name"
                placeholder={t("subscriptions.modal.servicePlaceholder")}
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
                <Label htmlFor="amount">{t("subscriptions.modal.amount")}</Label>
                <Input
                  id="amount"
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
                <Label htmlFor="currency">{t("subscriptions.modal.currency")}</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  value={formData.currency}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData({ ...formData, currency: value });
                    if (errors.currency) {
                      const newErrors = { ...errors };
                      delete newErrors.currency;
                      setErrors(newErrors);
                    }
                  }}
                  aria-invalid={isSubmitted && !!errors.currency}
                  maxLength={3}
                  className="uppercase"
                />
                {isSubmitted && errors.currency && (
                  <p className="text-xs font-medium text-destructive">
                    {t(`subscriptions.modal.errors.${errors.currency}`)}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCycle">{t("subscriptions.modal.billingCycle")}</Label>
                <Select
                  value={formData.billingCycle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, billingCycle: value })
                  }
                >
                  <SelectTrigger id="billingCycle">
                    <SelectValue />
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

              <div className="space-y-2">
                <Label htmlFor="category">{t("subscriptions.modal.category")}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(`subscriptions.modal.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">{t("subscriptions.modal.nextBillingDate")}</Label>
              <Input
                id="nextBillingDate"
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

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="reminderEnabled">{t("subscriptions.modal.reminders")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("subscriptions.modal.remindersDesc")}
                </p>
              </div>
              <Switch
                id="reminderEnabled"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminderEnabled: checked })
                }
              />
            </div>

            {formData.reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminderDays">{t("subscriptions.modal.reminderDays")}</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="0"
                  max="30"
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
                {isSubmitted && errors.reminderDays && (
                  <p className="text-xs font-medium text-destructive">
                    {t(`subscriptions.modal.errors.${errors.reminderDays}`)}
                  </p>
                )}
              </div>
            )}

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("subscriptions.modal.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("common.loading") : (subscription ? t("subscriptions.modal.update") : t("subscriptions.modal.add"))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
