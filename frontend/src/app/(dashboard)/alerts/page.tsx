"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Mail, Webhook, Save, PiggyBank, Smartphone } from "lucide-react";
import api from "@/lib/api";
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush } from "@/lib/push";

export default function AlertsSettingsPage() {
  const [settings, setSettings] = useState({
    defaultReminderEnabled: true,
    defaultReminderDays: "3",
    emailNotifications: true,
    emailAddress: "",
    webhookEnabled: false,
    webhookUrl: "",
    dailyDigest: false,
    weeklyReport: true,
    monthlyBudget: "",
    pushEnabled: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/users/me");
        setSettings({
          ...settings,
          defaultReminderEnabled: response.data.defaultReminderEnabled,
          defaultReminderDays: response.data.defaultReminderDays.toString(),
          emailAddress: response.data.email,
          monthlyBudget: response.data.monthlyBudget?.toString() || "",
        });
      } catch (error) {
        toast.error("Failed to load settings");
      }
    };

    const checkPushSubscription = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.getRegistration('/sw.js');
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              setSettings(s => ({ ...s, pushEnabled: true }));
            }
          }
        } catch (e) {
          console.error("Failed to check push subscription", e);
        }
      }
    };

    fetchSettings();
    checkPushSubscription();
  }, []);

  const handleSave = async () => {
    try {
      await api.patch("/users/settings", {
        defaultReminderEnabled: settings.defaultReminderEnabled,
        defaultReminderDays: parseInt(settings.defaultReminderDays),
        monthlyBudget: settings.monthlyBudget ? parseFloat(settings.monthlyBudget) : null,
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await registerServiceWorker();
        const sub = await subscribeToPush();
        await api.post("/users/push-subscription", sub.toJSON());
        setSettings({ ...settings, pushEnabled: true });
        toast.success("Push notifications enabled");
      } else {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            await api.delete(`/users/push-subscription?endpoint=${encodeURIComponent(sub.endpoint)}`);
          }
        }
        await unsubscribeFromPush();
        setSettings({ ...settings, pushEnabled: false });
        toast.success("Push notifications disabled");
      }
    } catch (error: any) {
      toast.error("Failed to toggle push notifications: " + (error.message || "Unknown error"));
      setSettings({ ...settings, pushEnabled: false });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Alerts & Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Configure how you want to be notified about upcoming payments
        </p>
      </div>

      {/* Email Notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Receive alerts via email</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailEnabled">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send payment reminders to your email
              </p>
            </div>
            <Switch
              id="emailEnabled"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          {settings.emailNotifications && (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailAddress">Email Address</Label>
                <Input
                  id="emailAddress"
                  type="email"
                  placeholder="you@example.com"
                  value={settings.emailAddress}
                  onChange={(e) =>
                    setSettings({ ...settings, emailAddress: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="dailyDigest">Daily Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a summary of today's payments
                  </p>
                </div>
                <Switch
                  id="dailyDigest"
                  checked={settings.dailyDigest}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, dailyDigest: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyReport">Weekly Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your subscriptions
                  </p>
                </div>
                <Switch
                  id="weeklyReport"
                  checked={settings.weeklyReport}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, weeklyReport: checked })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Browser Push Notifications</CardTitle>
              <CardDescription>Receive alerts directly in your browser</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushEnabled">Enable Browser Push</Label>
              <p className="text-sm text-muted-foreground">
                Get notified even when you're not on the app
              </p>
            </div>
            <Switch
              id="pushEnabled"
              checked={settings.pushEnabled}
              onCheckedChange={handlePushToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Webhook Integration */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Webhook Integration</CardTitle>
              <CardDescription>Send alerts to external services</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="webhookEnabled">Enable Webhooks</Label>
              <p className="text-sm text-muted-foreground">
                POST payment data to your webhook URL
              </p>
            </div>
            <Switch
              id="webhookEnabled"
              checked={settings.webhookEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, webhookEnabled: checked })
              }
            />
          </div>

          {settings.webhookEnabled && (
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={settings.webhookUrl}
                onChange={(e) =>
                  setSettings({ ...settings, webhookUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                We'll send a POST request with payment details to this URL
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <CardTitle>Default Reminder Settings</CardTitle>
              <CardDescription>
                Default settings for new subscriptions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="defaultEnabled">Default Payment Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Enable reminders by default for new subscriptions
              </p>
            </div>
            <Switch
              id="defaultEnabled"
              checked={settings.defaultReminderEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, defaultReminderEnabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultDays">Default Reminder Days</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="defaultDays"
                type="number"
                min="1"
                max="30"
                className="max-w-24"
                value={settings.defaultReminderDays}
                onChange={(e) =>
                  setSettings({ ...settings, defaultReminderDays: e.target.value })
                }
              />
              <span className="text-sm text-muted-foreground">
                days before payment
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              New subscriptions will be set to remind you this many days before the payment is due
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle>Budget Limits</CardTitle>
              <CardDescription>
                Set a monthly budget to get notified if you exceed it
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyBudget">Monthly Budget</Label>
            <div className="flex gap-2 items-center">
              <span className="text-muted-foreground">$</span>
              <Input
                id="monthlyBudget"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50.00"
                className="max-w-32"
                value={settings.monthlyBudget}
                onChange={(e) =>
                  setSettings({ ...settings, monthlyBudget: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank if you don't want budget alerts
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2" size="lg">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
