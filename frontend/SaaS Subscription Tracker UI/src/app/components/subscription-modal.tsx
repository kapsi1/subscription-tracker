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

interface Subscription {
  id: number;
  service: string;
  amount: number;
  currency: string;
  billingCycle: string;
  nextBilling: string;
  category: string;
  alertEnabled: boolean;
  alertDays: number;
}

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
  onSave: (subscription: Subscription) => void;
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

const billingCycles = ["Monthly", "Yearly", "Quarterly"];
const currencies = ["USD", "EUR", "GBP"];

export function SubscriptionModal({
  open,
  onOpenChange,
  subscription,
  onSave,
}: SubscriptionModalProps) {
  const [formData, setFormData] = useState({
    service: "",
    amount: "",
    currency: "USD",
    billingCycle: "Monthly",
    nextBilling: "",
    category: "Other",
    alertEnabled: false,
    alertDays: "3",
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        service: subscription.service,
        amount: subscription.amount.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        nextBilling: subscription.nextBilling,
        category: subscription.category,
        alertEnabled: subscription.alertEnabled,
        alertDays: subscription.alertDays.toString(),
      });
    } else {
      setFormData({
        service: "",
        amount: "",
        currency: "USD",
        billingCycle: "Monthly",
        nextBilling: "",
        category: "Other",
        alertEnabled: false,
        alertDays: "3",
      });
    }
  }, [subscription, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: subscription?.id || 0,
      service: formData.service,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      billingCycle: formData.billingCycle,
      nextBilling: formData.nextBilling,
      category: formData.category,
      alertEnabled: formData.alertEnabled,
      alertDays: parseInt(formData.alertDays),
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
              <Label htmlFor="service">Service Name</Label>
              <Input
                id="service"
                placeholder="e.g. Netflix, Spotify"
                value={formData.service}
                onChange={(e) =>
                  setFormData({ ...formData, service: e.target.value })
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
                    <SelectItem key={cycle} value={cycle}>
                      {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextBilling">Next Billing Date</Label>
              <Input
                id="nextBilling"
                type="date"
                value={formData.nextBilling}
                onChange={(e) =>
                  setFormData({ ...formData, nextBilling: e.target.value })
                }
                required
              />
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

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-0.5">
                  <Label htmlFor="alertEnabled">Payment Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified before payment is due
                  </p>
                </div>
                <Switch
                  id="alertEnabled"
                  checked={formData.alertEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, alertEnabled: checked })
                  }
                />
              </div>

              {formData.alertEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="alertDays">Days Before Reminder</Label>
                  <Input
                    id="alertDays"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.alertDays}
                    onChange={(e) =>
                      setFormData({ ...formData, alertDays: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
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
