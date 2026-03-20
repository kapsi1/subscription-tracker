'use client';

import type { Settings } from '@subtracker/shared';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '@/lib/api';
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush } from '@/lib/push';
import { AppearanceSection } from '../_components/AppearanceSection';
import { BudgetSection } from '../_components/BudgetSection';
import { CategorySection } from '../_components/CategorySection';
import { EmailNotificationsSection } from '../_components/EmailNotificationsSection';
import { LocalizationSection } from '../_components/LocalizationSection';
import { PushNotificationsSection } from '../_components/PushNotificationsSection';
import { ReminderSection } from '../_components/ReminderSection';
import { WebhookSection } from '../_components/WebhookSection';

export default function PreferencesPage() {
  const { t } = useTranslation();
  const showTestControls = process.env.NODE_ENV !== 'production';
  const [settings, setSettings] = useState<Settings>({
    defaultReminderEnabled: true,
    defaultReminderDays: 3,
    emailNotifications: true,
    emailAddress: '',
    webhookEnabled: false,
    webhookUrl: '',
    webhookSecret: '',
    dailyDigest: false,
    weeklyReport: true,
    monthlyBudget: null,
    pushEnabled: false,
    currency: 'USD',
  });
  const [testDelay, setTestDelay] = useState('0');
  const [testEmailLanguage, setTestEmailLanguage] = useState<'en' | 'pl'>('en');
  const [testBudgetEmailLanguage, setTestBudgetEmailLanguage] = useState<'en' | 'pl'>('en');
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

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/users/me');
        const loadedSettings = {
          defaultReminderEnabled: response.data.defaultReminderEnabled,
          defaultReminderDays: parseInt(response.data.defaultReminderDays, 10) || 3,
          emailAddress: response.data.email,
          monthlyBudget: response.data.monthlyBudget
            ? parseFloat(response.data.monthlyBudget)
            : null,
          emailNotifications: response.data.emailNotifications,
          webhookEnabled: response.data.webhookEnabled,
          webhookUrl: response.data.webhookUrl || '',
          webhookSecret: response.data.webhookSecret || '',
          dailyDigest: response.data.dailyDigest,
          weeklyReport: response.data.weeklyReport,
          pushEnabled: false,
          currency: response.data.currency || 'USD',
        };
        setSettings((prev) => ({
          ...prev,
          ...loadedSettings,
        }));
        lastSavedPreferencesRef.current = JSON.stringify({
          defaultReminderEnabled: loadedSettings.defaultReminderEnabled,
          defaultReminderDays: loadedSettings.defaultReminderDays,
          monthlyBudget: loadedSettings.monthlyBudget,
          emailNotifications: loadedSettings.emailNotifications,
          webhookEnabled: loadedSettings.webhookEnabled,
          webhookUrl: loadedSettings.webhookUrl,
          webhookSecret: loadedSettings.webhookSecret,
          dailyDigest: loadedSettings.dailyDigest,
          weeklyReport: loadedSettings.weeklyReport,
          currency: loadedSettings.currency,
        });
        hasLoadedSettingsRef.current = true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
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
              setSettings((s) => ({ ...s, pushEnabled: true }));
            }
          }
        } catch (e) {
          console.error('Failed to check push subscription', e);
        }
      }
    };

    fetchSettings();
    checkPushSubscription();
  }, [t]);

  useEffect(() => {
    if (!hasLoadedSettingsRef.current) return;

    const payload = {
      defaultReminderEnabled: settings.defaultReminderEnabled,
      defaultReminderDays: settings.defaultReminderDays,
      monthlyBudget: settings.monthlyBudget,
      emailNotifications: settings.emailNotifications,
      webhookEnabled: settings.webhookEnabled,
      webhookUrl: settings.webhookUrl,
      webhookSecret: settings.webhookSecret,
      dailyDigest: settings.dailyDigest,
      weeklyReport: settings.weeklyReport,
      currency: settings.currency,
    };

    const serializedPayload = JSON.stringify(payload);
    if (serializedPayload === lastSavedPreferencesRef.current) return;

    const timer = window.setTimeout(async () => {
      latestSaveAttemptRef.current = serializedPayload;
      try {
        await api.patch('/users/settings', payload);
        if (latestSaveAttemptRef.current === serializedPayload) {
          lastSavedPreferencesRef.current = serializedPayload;
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        toast.error(t('settings.saveError', { defaultValue: 'Failed to save settings' }));
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [settings, t]);

  const handlePushToggle = async (checked: boolean) => {
    setIsTogglingPush(true);
    try {
      if (checked) {
        await registerServiceWorker();
        const sub = await subscribeToPush();
        await api.post('/users/push-subscription', sub.toJSON());
        setSettings((s) => ({ ...s, pushEnabled: true }));
        toast.success(t('settings.notifications.push.success'));
      } else {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            await api.delete(
              `/users/push-subscription?endpoint=${encodeURIComponent(sub.endpoint)}`,
            );
          }
        }
        await unsubscribeFromPush();
        setSettings((s) => ({ ...s, pushEnabled: false }));
        toast.success(t('settings.notifications.push.disabled'));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`${t('settings.notifications.push.error')}: ${message}`);
      setSettings((s) => ({ ...s, pushEnabled: false }));
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleResetPush = async () => {
    if (!confirm('Are you sure? This will unregister the service worker and clear push settings.'))
      return;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      setSettings((s) => ({ ...s, pushEnabled: false }));
      toast.success('Push settings reset. Please refresh and try again.');
    } catch (_e) {
      toast.error('Failed to reset push settings');
    }
  };

  const handleTestPush = async () => {
    setIsSendingTest(true);
    try {
      const delaySeconds = Math.max(0, parseInt(testDelay, 10) || 0);
      const res = await api.post('/users/test-push', { delaySeconds });
      toast.success(res.data.message);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send test notification');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const res = await api.post('/users/test-email', { lang: testEmailLanguage });
      toast.success(res.data.message || t('settings.notifications.email.testSuccess'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('settings.notifications.email.testError'));
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleTestBudgetEmail = async () => {
    setIsSendingBudgetTestEmail(true);
    try {
      const res = await api.post('/users/test-budget-email', { lang: testBudgetEmailLanguage });
      toast.success(res.data.message || t('settings.notifications.email.testBudgetSuccess'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('settings.notifications.email.testBudgetError'));
    } finally {
      setIsSendingBudgetTestEmail(false);
    }
  };

  const handleTestDailyDigest = async () => {
    setIsSendingDailyTest(true);
    try {
      const res = await api.post('/users/test-daily-digest', { lang: testEmailLanguage });
      toast.success(res.data.message || 'Test daily digest sent');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send test daily digest');
    } finally {
      setIsSendingDailyTest(false);
    }
  };

  const handleTestWeeklyReport = async () => {
    setIsSendingWeeklyTest(true);
    try {
      const res = await api.post('/users/test-weekly-report', { lang: testEmailLanguage });
      toast.success(res.data.message || 'Test weekly report sent');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send test weekly report');
    } finally {
      setIsSendingWeeklyTest(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsSendingWebhookTest(true);
    try {
      const res = await api.post('/users/test-webhook', {
        url: settings.webhookUrl || '',
        secret: settings.webhookSecret || '',
      });
      toast.success(res.data.message || t('settings.notifications.webhook.testSuccess'));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('settings.notifications.webhook.testError'));
    } finally {
      setIsSendingWebhookTest(false);
    }
  };

  const handleSettingsChange = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const { searchQuery, isSectionVisible } = useSettingsSearch();

  const hasPreferencesMatches =
    SETTINGS_SECTIONS.filter(
      (s) => s.tab === 'preferences' && isSectionVisible(s.id, 'preferences'),
    ).length > 0;
  const hasProfileMatches = searchQuery.trim()
    ? SETTINGS_SECTIONS.filter((s) => s.tab === 'profile' && isSectionVisible(s.id, 'preferences'))
        .length > 0
    : false;
  const noMatches = searchQuery.trim() && !hasPreferencesMatches && !hasProfileMatches;

  return (
    <div className="space-y-6">
      {noMatches && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground">
            {t('settings.noResults', {
              query: searchQuery,
              defaultValue: `No results found for "${searchQuery}"`,
            })}
          </p>
        </div>
      )}

      {isSectionVisible('localization', 'preferences') && (
        <LocalizationSection
          currency={settings.currency}
          setCurrency={(currency) => setSettings({ ...settings, currency })}
        />
      )}

      {isSectionVisible('appearance', 'preferences') && <AppearanceSection />}

      {isSectionVisible('categories', 'preferences') && <CategorySection />}

      {isSectionVisible('email', 'preferences') && (
        <EmailNotificationsSection
          emailNotifications={settings.emailNotifications}
          emailAddress={settings.emailAddress ?? ''}
          dailyDigest={settings.dailyDigest}
          weeklyReport={settings.weeklyReport}
          onSettingsChange={handleSettingsChange}
          showTestControls={showTestControls}
          testEmailLanguage={testEmailLanguage}
          setTestEmailLanguage={setTestEmailLanguage}
          onTestEmail={handleTestEmail}
          onTestDailyDigest={handleTestDailyDigest}
          onTestWeeklyReport={handleTestWeeklyReport}
          isLoading={{
            email: isSendingTestEmail,
            daily: isSendingDailyTest,
            weekly: isSendingWeeklyTest,
          }}
        />
      )}

      {isSectionVisible('push', 'preferences') && (
        <PushNotificationsSection
          pushEnabled={settings.pushEnabled ?? false}
          onPushToggle={handlePushToggle}
          isTogglingPush={isTogglingPush}
          showTestControls={showTestControls}
          testDelay={testDelay}
          setTestDelay={setTestDelay}
          onTestPush={handleTestPush}
          isSendingTest={isSendingTest}
          onResetPush={handleResetPush}
        />
      )}

      {isSectionVisible('webhook', 'preferences') && (
        <WebhookSection
          webhookEnabled={settings.webhookEnabled}
          webhookUrl={settings.webhookUrl ?? ''}
          webhookSecret={settings.webhookSecret ?? ''}
          onSettingsChange={handleSettingsChange}
          showTestControls={showTestControls}
          onTestWebhook={handleTestWebhook}
          isSendingWebhookTest={isSendingWebhookTest}
        />
      )}

      {isSectionVisible('reminder', 'preferences') && (
        <ReminderSection
          defaultReminderEnabled={settings.defaultReminderEnabled}
          defaultReminderDays={settings.defaultReminderDays}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {isSectionVisible('budget', 'preferences') && (
        <BudgetSection
          monthlyBudget={settings.monthlyBudget}
          currency={settings.currency}
          onSettingsChange={handleSettingsChange}
          showTestControls={showTestControls}
          testBudgetEmailLanguage={testBudgetEmailLanguage}
          setTestBudgetEmailLanguage={setTestBudgetEmailLanguage}
          onTestBudgetEmail={handleTestBudgetEmail}
          isSendingBudgetTestEmail={isSendingBudgetTestEmail}
          isSendingTestEmail={isSendingTestEmail}
        />
      )}

      {/* Show Profile sections when searching in Preferences */}
      {searchQuery.trim() && (
        <>
          {isSectionVisible('profile', 'preferences') && <ProfilePageSearchWrapper />}
          {isSectionVisible('password', 'preferences') && <ChangePasswordSearchWrapper />}
          {isSectionVisible('change-email', 'preferences') && <ChangeEmailSearchWrapper />}
        </>
      )}
    </div>
  );
}

import { useAuth } from '@/components/auth-provider';
// Wrapper components for Profile sections to handle their own data fetching
import { ChangeEmailSection } from '../_components/ChangeEmailSection';
import { ChangePasswordSection } from '../_components/ChangePasswordSection';
import { type ProfileData, ProfileSection } from '../_components/ProfileSection';
import { SETTINGS_SECTIONS, useSettingsSearch } from '../_components/SettingsSearchContext';

function ProfilePageSearchWrapper() {
  const { t } = useTranslation();
  const { fetchUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    createdAt: '',
    updatedAt: '',
  });
  const hasLoadedProfileRef = useRef(false);
  const lastSavedProfileNameRef = useRef<string>('');
  const latestProfileSaveAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/me');
        setProfile({
          name: response.data.name || '',
          email: response.data.email || '',
          createdAt: response.data.createdAt || '',
          updatedAt: response.data.updatedAt || '',
        });
        lastSavedProfileNameRef.current = (response.data.name || '').trim();
        hasLoadedProfileRef.current = true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        toast.error(t('settings.loadError'));
      }
    };
    fetchProfile();
  }, [t]);

  useEffect(() => {
    if (!hasLoadedProfileRef.current) return;
    const trimmedName = profile.name.trim();
    if (trimmedName === lastSavedProfileNameRef.current) return;
    const timer = window.setTimeout(async () => {
      latestProfileSaveAttemptRef.current = trimmedName;
      try {
        await api.patch('/users/settings', { name: trimmedName });
        if (latestProfileSaveAttemptRef.current === trimmedName) {
          lastSavedProfileNameRef.current = trimmedName;
        }
        await fetchUser();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        toast.error(t('settings.profile.saveError', { defaultValue: 'Failed to save profile' }));
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [profile.name, fetchUser, t]);

  return <ProfileSection profile={profile} setProfile={setProfile} />;
}

function ChangePasswordSearchWrapper() {
  const { user } = useAuth();
  const isGoogleAccount = !!user?.googleId;
  if (isGoogleAccount) return null;
  return <ChangePasswordSection />;
}

function ChangeEmailSearchWrapper() {
  const { user } = useAuth();
  const isGoogleAccount = !!user?.googleId;
  if (isGoogleAccount) return null;
  return <ChangeEmailSection />;
}
