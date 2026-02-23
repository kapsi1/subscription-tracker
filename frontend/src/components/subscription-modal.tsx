import { useState, useEffect } from "react";
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
  onSave: (subscription: Partial<Subscription>) => void;
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
const currencies = ["USD", "EUR", "GBP"];

export function SubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSave,
}: SubscriptionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    currency: "USD",
    billingCycle: "monthly",
    category: "Other",
    nextBillingDate: new Date().toISOString().split("T")[0],
    reminderEnabled: true,
    reminderDays: "3",
  });

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
      setFormData({
        name: "",
        amount: "",
        currency: "USD",
        billingCycle: "monthly",
        category: "Other",
        nextBillingDate: new Date().toISOString().split("T")[0],
        reminderEnabled: true,
        reminderDays: "3",
      });
      fetchDefaults();
    }
  }, [subscription, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
          <DialogDescription>
            {subscription
              ? "Update your subscription details"
              : "Add a new subscription to track"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                placeholder="e.g. Netflix, Spotify"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                     setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingCycle">Billing Cycle</Label>
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
                        {cycle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
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
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextBillingDate">Next Billing Date</Label>
              <Input
                id="nextBillingDate"
                type="date"
                value={formData.nextBillingDate}
                onChange={(e) =>
                  setFormData({ ...formData, nextBillingDate: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="reminderEnabled">Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified before payment is due
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
                <Label htmlFor="reminderDays">Days Before Reminder</Label>
                <Input
                  id="reminderDays"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.reminderDays}
                  onChange={(e) =>
                    setFormData({ ...formData, reminderDays: e.target.value })
                  }
                  required
                />
              </div>
            )}

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {subscription ? "Update" : "Add"} Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
