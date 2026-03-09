"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Mail, Webhook, Save, PiggyBank, Smartphone, SendHorizonal, UserRound } from "lucide-react";
import api from "@/lib/api";
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush } from "@/lib/push";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { fetchUser } = useAuth();
  const showTestControls = process.env.NODE_ENV !== "production";
  const [activeTab, setActiveTab] = useState<"profile" | "preferences">("preferences");
  const [settings, setSettings] = useState({
    defaultReminderEnabled: true,
    defaultReminderDays: "3",
    emailNotifications: true,
    emailAddress: "",
    webhookEnabled: false,
    webhookUrl: "",
    webhookSecret: "",
    dailyDigest: false,
    weeklyReport: true,
    monthlyBudget: "",
    pushEnabled: false,
  });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    createdAt: "",
    updatedAt: "",
  });
  const [testDelay, setTestDelay] = useState("0");
  const [testEmailLanguage, setTestEmailLanguage] = useState<"en" | "pl">("en");
  const [testBudgetEmailLanguage, setTestBudgetEmailLanguage] = useState<"en" | "pl">("en");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingBudgetTestEmail, setIsSendingBudgetTestEmail] = useState(false);
  const [isSendingDailyTest, setIsSendingDailyTest] = useState(false);
  const [isSendingWeeklyTest, setIsSendingWeeklyTest] = useState(false);
  const [isSendingWebhookTest, setIsSendingWebhookTest] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const hasLoadedSettingsRef = useRef(false);
  const lastSavedPreferencesRef = useRef<string | null>(null);
  const latestSaveAttemptRef = useRef<string | null>(null);
  const lastSavedProfileNameRef = useRef<string>("");
  const latestProfileSaveAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/users/me");
          const loadedSettings = {
            defaultReminderEnabled: response.data.defaultReminderEnabled,
            defaultReminderDays: response.data.defaultReminderDays?.toString() || "3",
            emailAddress: response.data.email,
            monthlyBudget: response.data.monthlyBudget?.toString() || "",
            emailNotifications: response.data.emailNotifications,
            webhookEnabled: response.data.webhookEnabled,
            webhookUrl: response.data.webhookUrl || "",
            webhookSecret: response.data.webhookSecret || "",
            dailyDigest: response.data.dailyDigest,
            weeklyReport: response.data.weeklyReport,
            pushEnabled: false,
          };
          setSettings((prev) => ({
            ...prev,
            ...loadedSettings,
          }));
          lastSavedPreferencesRef.current = JSON.stringify({
            defaultReminderEnabled: loadedSettings.defaultReminderEnabled,
            defaultReminderDays: Number.parseInt(loadedSettings.defaultReminderDays, 10),
            monthlyBudget: loadedSettings.monthlyBudget
              ? Number.parseFloat(loadedSettings.monthlyBudget)
              : null,
            emailNotifications: loadedSettings.emailNotifications,
            webhookEnabled: loadedSettings.webhookEnabled,
            webhookUrl: loadedSettings.webhookUrl,
            webhookSecret: loadedSettings.webhookSecret,
            dailyDigest: loadedSettings.dailyDigest,
            weeklyReport: loadedSettings.weeklyReport,
          });
          hasLoadedSettingsRef.current = true;
          setProfile({
            name: response.data.name || "",
            email: response.data.email || "",
            createdAt: response.data.createdAt || "",
            updatedAt: response.data.updatedAt || "",
          });
          lastSavedProfileNameRef.current = (response.data.name || "").trim();
      } catch (error) {
        toast.error(t('settings.loadError'));
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
  }, [t]);

  useEffect(() => {
    if (!hasLoadedSettingsRef.current) return;

    const parsedReminderDays = Number.parseInt(settings.defaultReminderDays, 10);
    if (Number.isNaN(parsedReminderDays)) return;

    let parsedMonthlyBudget: number | null = null;
    if (settings.monthlyBudget.trim() !== "") {
      parsedMonthlyBudget = Number.parseFloat(settings.monthlyBudget);
      if (Number.isNaN(parsedMonthlyBudget)) return;
    }

    const payload = {
      defaultReminderEnabled: settings.defaultReminderEnabled,
      defaultReminderDays: parsedReminderDays,
      monthlyBudget: parsedMonthlyBudget,
      emailNotifications: settings.emailNotifications,
      webhookEnabled: settings.webhookEnabled,
      webhookUrl: settings.webhookUrl,
      webhookSecret: settings.webhookSecret,
      dailyDigest: settings.dailyDigest,
      weeklyReport: settings.weeklyReport,
    };

    const serializedPayload = JSON.stringify(payload);
    if (serializedPayload === lastSavedPreferencesRef.current) return;

    const timer = window.setTimeout(async () => {
      latestSaveAttemptRef.current = serializedPayload;
      try {
        await api.patch("/users/settings", payload);
        if (latestSaveAttemptRef.current === serializedPayload) {
          lastSavedPreferencesRef.current = serializedPayload;
        }
      } catch (_error) {
        toast.error(t("settings.saveError", { defaultValue: "Failed to save settings" }));
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [settings, t]);

  useEffect(() => {
    if (!hasLoadedSettingsRef.current) return;

    const trimmedName = profile.name.trim();
    if (trimmedName === lastSavedProfileNameRef.current) return;

    const timer = window.setTimeout(async () => {
      latestProfileSaveAttemptRef.current = trimmedName;
      try {
        await api.patch("/users/settings", { name: trimmedName });
        if (latestProfileSaveAttemptRef.current === trimmedName) {
          lastSavedProfileNameRef.current = trimmedName;
        }
        await fetchUser();
      } catch (_error) {
        toast.error(t("settings.profile.saveError", { defaultValue: "Failed to save profile" }));
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [profile.name, fetchUser, t]);

  const handlePushToggle = async (checked: boolean) => {
    setIsTogglingPush(true);
    console.log("[Push] handlePushToggle called, checked:", checked);
    try {
      if (checked) {
        console.log("[Push] Step 1: Registering service worker...");
        await registerServiceWorker();
        console.log("[Push] Step 1 done.");

        console.log("[Push] Step 2: Subscribing to push...");
        const sub = await subscribeToPush();
        console.log("[Push] Step 2 done. Posting to backend...");
        await api.post("/users/push-subscription", sub.toJSON());
        setSettings((s) => ({ ...s, pushEnabled: true }));
        toast.success(t('settings.notifications.push.success'));
        console.log("[Push] All steps completed successfully.");
      } else {
        console.log("[Push] Disabling push...");
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            await api.delete(`/users/push-subscription?endpoint=${encodeURIComponent(sub.endpoint)}`);
          }
        }
        await unsubscribeFromPush();
        setSettings((s) => ({ ...s, pushEnabled: false }));
        toast.success(t('settings.notifications.push.disabled'));
      }
    } catch (error: any) {
      console.error("[Push] Error in handlePushToggle:", error);
      toast.error(t('settings.notifications.push.error') + ": " + (error.message || "Unknown error"));
      setSettings((s) => ({ ...s, pushEnabled: false }));
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleResetPush = async () => {
    if (!confirm("Are you sure? This will unregister the service worker and clear push settings.")) return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      setSettings(s => ({ ...s, pushEnabled: false }));
      toast.success("Push settings reset. Please refresh and try again.");
    } catch (e) {
      toast.error("Failed to reset push settings");
    }
  };



  const handleTestPush = async () => {
    setIsSendingTest(true);
    try {
      const delaySeconds = Math.max(0, parseInt(testDelay) || 0);
      const res = await api.post("/users/test-push", { delaySeconds });
      toast.success(res.data.message);
    } catch (error: any) {
      console.error("[Push] Test notification error:", error);
      toast.error(error.response?.data?.message || "Failed to send test notification");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await api.post("/users/test-email", { lang: testEmailLanguage });
      toast.success(res.data.message || t("settings.notifications.email.testSuccess"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("settings.notifications.email.testError", { defaultValue: "Failed to send test email" })
      );
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleTestBudgetEmail = async () => {
    setIsSendingBudgetTestEmail(true);
    try {
      const res = await api.post("/users/test-budget-email", { lang: testBudgetEmailLanguage });
      toast.success(res.data.message || t("settings.notifications.email.testBudgetSuccess"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("settings.notifications.email.testBudgetError", { defaultValue: "Failed to send test budget email" })
      );
    } finally {
      setIsSendingBudgetTestEmail(false);
    }
  };

  const handleTestDailyDigest = async () => {
    setIsSendingDailyTest(true);
    try {
      const res = await api.post("/users/test-daily-digest", { lang: testEmailLanguage });
      toast.success(res.data.message || "Test daily digest sent");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send test daily digest");
    } finally {
      setIsSendingDailyTest(false);
    }
  };

  const handleTestWeeklyReport = async () => {
    setIsSendingWeeklyTest(true);
    try {
      const res = await api.post("/users/test-weekly-report", { lang: testEmailLanguage });
      toast.success(res.data.message || "Test weekly report sent");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send test weekly report");
    } finally {
      setIsSendingWeeklyTest(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsSendingWebhookTest(true);
    try {
      const res = await api.post("/users/test-webhook", { 
        url: settings.webhookUrl,
        secret: settings.webhookSecret 
      });
      toast.success(res.data.message || t("settings.notifications.webhook.testSuccess"));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          t("settings.notifications.webhook.testError", { defaultValue: "Failed to send test webhook" })
      );
    } finally {
      setIsSendingWebhookTest(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">{t('settings.title')}</h1>
      </div>

      <div className="inline-flex items-center gap-1 rounded-lg border bg-muted p-1">
        <Button
          type="button"
          variant={activeTab === "preferences" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("preferences")}
        >
          {t("settings.tabs.preferences", { defaultValue: "Preferences" })}
        </Button>
        <Button
          type="button"
          variant={activeTab === "profile" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("profile")}
        >
          {t("settings.tabs.profile", { defaultValue: "Profile" })}
        </Button>
      </div>

      {activeTab === "profile" && (
        <>
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle>{t("settings.profile.title")}</CardTitle>
                  <CardDescription>{t("settings.profile.desc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileName">{t("settings.profile.name")}</Label>
                <Input
                  id="profileName"
                  value={profile.name}
                  placeholder={t("settings.profile.namePlaceholder")}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profileEmail">{t("settings.notifications.email.address")}</Label>
                <Input id="profileEmail" value={profile.email} disabled />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("settings.profile.memberSince", { defaultValue: "Member since" })}
                  </p>
                  <p className="text-sm font-medium">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("settings.profile.lastUpdated", { defaultValue: "Last updated" })}
                  </p>
                  <p className="text-sm font-medium">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </>
      )}

      {activeTab === "preferences" && (
      <>

      {/* Email Notifications */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>{t('settings.notifications.email.title')}</CardTitle>
              <CardDescription>{t('settings.notifications.email.desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="emailEnabled">{t('settings.notifications.email.enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.email.enableDesc')}
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
                <Label htmlFor="emailAddress">{t('settings.notifications.email.address')}</Label>
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

              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="dailyDigest">{t('settings.notifications.email.daily')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.notifications.email.dailyDesc')}
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
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
                  <div className="space-y-0.5">
                    <Label htmlFor="weeklyReport">{t('settings.notifications.email.weekly')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.notifications.email.weeklyDesc')}
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
              </div>

              {showTestControls && (
              <div className="border-t pt-4 space-y-3">
                <Label>{t("settings.notifications.email.testTitle")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications.email.testDesc")}
                </p>

                <div className="space-y-2">
                  <Label className="text-sm">{t("settings.notifications.email.testLanguage")}</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="testEmailLanguage"
                        value="en"
                        checked={testEmailLanguage === "en"}
                        onChange={() => setTestEmailLanguage("en")}
                      />
                      English
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="testEmailLanguage"
                        value="pl"
                        checked={testEmailLanguage === "pl"}
                        onChange={() => setTestEmailLanguage("pl")}
                      />
                      Polski
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmail}
                    disabled={isSendingTestEmail || isSendingBudgetTestEmail || isSendingDailyTest || isSendingWeeklyTest}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isSendingTestEmail
                      ? t("settings.notifications.email.testSending")
                      : t("settings.notifications.email.testSend")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestDailyDigest}
                    disabled={isSendingTestEmail || isSendingBudgetTestEmail || isSendingDailyTest || isSendingWeeklyTest}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isSendingDailyTest
                      ? t("settings.notifications.email.testSending")
                      : "Test Daily Digest"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWeeklyReport}
                    disabled={isSendingTestEmail || isSendingBudgetTestEmail || isSendingDailyTest || isSendingWeeklyTest}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isSendingWeeklyTest
                      ? t("settings.notifications.email.testSending")
                      : "Test Weekly Report"}
                  </Button>
                </div>
              </div>
              )}
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
              <CardTitle>{t('settings.notifications.push.title')}</CardTitle>
              <CardDescription>{t('settings.notifications.push.desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="pushEnabled">{t('settings.notifications.push.enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.push.enableDesc')}
              </p>
            </div>
            <Switch
              id="pushEnabled"
              checked={settings.pushEnabled}
              onCheckedChange={handlePushToggle}
              disabled={isTogglingPush}
            />
          </div>

          {showTestControls && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Test Notification</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground h-7"
                onClick={handleResetPush}
              >
                Reset & Clear
              </Button>
            </div>
            {!settings.pushEnabled && (
              <p className="text-sm text-muted-foreground">Enable push notifications above if possible, or try sending anyway if you already allowed it.</p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="testDelay" className="text-sm text-muted-foreground whitespace-nowrap">Delay (s)</Label>
                <Input
                  id="testDelay"
                  type="number"
                  min="0"
                  max="300"
                  className="max-w-20"
                  value={testDelay}
                  onChange={(e) => setTestDelay(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestPush}
                disabled={isSendingTest}
                className="gap-1.5"
              >
                <SendHorizonal className="w-4 h-4" />
                {isSendingTest ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </div>
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
              <CardTitle>{t('settings.notifications.webhook.title')}</CardTitle>
              <CardDescription>{t('settings.notifications.webhook.desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="webhookEnabled">{t('settings.notifications.webhook.enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.webhook.enableDesc')}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">{t('settings.notifications.webhook.url')}</Label>
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
                  {t('settings.notifications.webhook.urlDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">{t('settings.notifications.webhook.secret')}</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  placeholder="Secret key"
                  value={settings.webhookSecret}
                  onChange={(e) =>
                    setSettings({ ...settings, webhookSecret: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.notifications.webhook.secretDesc')}
                </p>
              </div>

              {showTestControls && (
                <div className="border-t pt-4 space-y-3">
                  <Label>{t("settings.notifications.webhook.testTitle")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("settings.notifications.webhook.testDesc")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestWebhook}
                    disabled={isSendingWebhookTest || !settings.webhookUrl}
                    className="gap-1.5"
                  >
                    <SendHorizonal className="w-4 h-4" />
                    {isSendingWebhookTest
                      ? t("settings.notifications.webhook.testSending")
                      : t("settings.notifications.webhook.testSend")}
                  </Button>
                </div>
              )}
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
              <CardTitle>{t('settings.notifications.default.title')}</CardTitle>
              <CardDescription>
                {t('settings.notifications.default.desc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between hover:bg-muted/50 p-3 -mx-3 rounded-lg transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="defaultEnabled">{t('settings.notifications.default.enable')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.default.enableDesc')}
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
            <Label htmlFor="defaultDays">{t('settings.notifications.default.days')}</Label>
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
                {t('settings.notifications.default.beforePayment')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('settings.notifications.default.daysDesc')}
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
              <CardTitle>{t('settings.budget.title')}</CardTitle>
              <CardDescription>
                {t('settings.budget.desc')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyBudget">{t('settings.budget.label')}</Label>
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
              {t('settings.budget.help')}
            </p>
          </div>
          {showTestControls && (
            <div className="border-t pt-4 space-y-3">
              <Label>{t("settings.notifications.email.testBudgetTitle")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications.email.testBudgetDesc")}
              </p>

              <div className="space-y-2">
                <Label className="text-sm">{t("settings.notifications.email.testLanguage")}</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="testBudgetEmailLanguage"
                      value="en"
                      checked={testBudgetEmailLanguage === "en"}
                      onChange={() => setTestBudgetEmailLanguage("en")}
                    />
                    English
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="testBudgetEmailLanguage"
                      value="pl"
                      checked={testBudgetEmailLanguage === "pl"}
                      onChange={() => setTestBudgetEmailLanguage("pl")}
                    />
                    Polski
                  </label>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestBudgetEmail}
                disabled={isSendingTestEmail || isSendingBudgetTestEmail}
                className="gap-1.5"
              >
                <SendHorizonal className="w-4 h-4" />
                {isSendingBudgetTestEmail
                  ? t("settings.notifications.email.testSending")
                  : t("settings.notifications.email.testBudgetSend")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      </>
      )}
    </div>
  );
}
