"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Mail, Webhook, Save } from "lucide-react";

export default function AlertsSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    emailAddress: "",
    webhookEnabled: false,
    webhookUrl: "",
    defaultReminderDays: "3",
    dailyDigest: false,
    weeklyReport: true,
  });

  useEffect(() => {
    // Load from local storage acting as a mock backend for global settings
    const saved = localStorage.getItem("subtracker_alert_settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    // Persist to local storage
    localStorage.setItem("subtracker_alert_settings", JSON.stringify(settings));
    toast.success("Settings saved successfully");
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
