'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import api from '@/lib/api';
import { ChangeEmailSection } from '../_components/ChangeEmailSection';
import { ChangePasswordSection } from '../_components/ChangePasswordSection';
import { type ProfileData, ProfileSection } from '../_components/ProfileSection';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { fetchUser, user } = useAuth();
  const isGoogleAccount = !!user?.googleId;
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
      } catch (_error) {
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
      } catch (_error) {
        toast.error(t('settings.profile.saveError', { defaultValue: 'Failed to save profile' }));
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [profile.name, fetchUser, t]);

  const { searchQuery, isSectionVisible } = useSettingsSearch();

  const hasProfileMatches =
    SETTINGS_SECTIONS.filter((s) => s.tab === 'profile' && isSectionVisible(s.id, 'profile'))
      .length > 0;
  const hasPreferencesMatches = searchQuery.trim()
    ? SETTINGS_SECTIONS.filter((s) => s.tab === 'preferences' && isSectionVisible(s.id, 'profile'))
        .length > 0
    : false;
  const noMatches = searchQuery.trim() && !hasProfileMatches && !hasPreferencesMatches;

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

      {isSectionVisible('profile', 'profile') && (
        <ProfileSection profile={profile} setProfile={setProfile} />
      )}

      {isSectionVisible('password', 'profile') && !isGoogleAccount && <ChangePasswordSection />}

      {isSectionVisible('change-email', 'profile') && !isGoogleAccount && <ChangeEmailSection />}

      {/* Show Preferences sections when searching in Profile */}
      {searchQuery.trim() && (
        <>
          {isSectionVisible('localization', 'profile') && <LocalizationSearchWrapper />}
          {isSectionVisible('appearance', 'profile') && <AppearanceSection />}
          {isSectionVisible('categories', 'profile') && <CategorySection />}
          {isSectionVisible('email', 'profile') && <EmailNotificationsSearchWrapper />}
          {isSectionVisible('push', 'profile') && <PushNotificationsSearchWrapper />}
          {isSectionVisible('webhook', 'profile') && <WebhookSearchWrapper />}
          {isSectionVisible('reminder', 'profile') && <ReminderSearchWrapper />}
          {isSectionVisible('budget', 'profile') && <BudgetSearchWrapper />}
        </>
      )}
    </div>
  );
}

// Wrapper components for Preferences sections to handle their own data fetching
import type { Settings } from '@subtracker/shared';
import { registerServiceWorker, subscribeToPush, unsubscribeFromPush } from '@/lib/push';
import { AppearanceSection } from '../_components/AppearanceSection';
import { BudgetSection } from '../_components/BudgetSection';
import { CategorySection } from '../_components/CategorySection';
import { EmailNotificationsSection } from '../_components/EmailNotificationsSection';
import { LocalizationSection } from '../_components/LocalizationSection';
import { PushNotificationsSection } from '../_components/PushNotificationsSection';
import { ReminderSection } from '../_components/ReminderSection';
import { SETTINGS_SECTIONS, useSettingsSearch } from '../_components/SettingsSearchContext';
import { WebhookSection } from '../_components/WebhookSection';

// Helper to use preferences state in wrappers
function usePreferencesState() {
  const { t } = useTranslation();
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
  const hasLoadedSettingsRef = useRef(false);
  const lastSavedPreferencesRef = useRef<string | null>(null);

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
        setSettings((prev) => ({ ...prev, ...loadedSettings }));
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
      } catch (_error) {
        toast.error(t('settings.loadError'));
      }
    };
    fetchSettings();
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
      try {
        await api.patch('/users/settings', payload);
        lastSavedPreferencesRef.current = serializedPayload;
      } catch (_error) {
        toast.error(t('settings.saveError'));
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [settings, t]);

  const handleSettingsChange = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return { settings, setSettings, handleSettingsChange };
}

function LocalizationSearchWrapper() {
  const { settings, setSettings } = usePreferencesState();
  return (
    <LocalizationSection
      currency={settings.currency}
      setCurrency={(currency) => setSettings({ ...settings, currency })}
    />
  );
}

function EmailNotificationsSearchWrapper() {
  const { settings, handleSettingsChange } = usePreferencesState();
  const showTestControls = process.env.NODE_ENV !== 'production';
  const [testEmailLanguage, setTestEmailLanguage] = useState<'en' | 'pl'>('en');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const handleTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      await api.post('/users/test-email', { lang: testEmailLanguage });
      toast.success('Test email sent');
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
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
      onTestDailyDigest={async () => {}}
      onTestWeeklyReport={async () => {}}
      isLoading={{ email: isSendingTestEmail, daily: false, weekly: false }}
    />
  );
}

function PushNotificationsSearchWrapper() {
  const { settings, setSettings } = usePreferencesState();
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const showTestControls = process.env.NODE_ENV !== 'production';

  const handlePushToggle = async (checked: boolean) => {
    setIsTogglingPush(true);
    try {
      if (checked) {
        await registerServiceWorker();
        const sub = await subscribeToPush();
        await api.post('/users/push-subscription', sub.toJSON());
        setSettings((s) => ({ ...s, pushEnabled: true }));
      } else {
        await unsubscribeFromPush();
        setSettings((s) => ({ ...s, pushEnabled: false }));
      }
    } finally {
      setIsTogglingPush(false);
    }
  };

  return (
    <PushNotificationsSection
      pushEnabled={settings.pushEnabled ?? false}
      onPushToggle={handlePushToggle}
      isTogglingPush={isTogglingPush}
      showTestControls={showTestControls}
      testDelay="0"
      setTestDelay={() => {}}
      onTestPush={async () => {}}
      isSendingTest={false}
      onResetPush={async () => {}}
    />
  );
}

function WebhookSearchWrapper() {
  const { settings, handleSettingsChange } = usePreferencesState();
  const showTestControls = process.env.NODE_ENV !== 'production';
  return (
    <WebhookSection
      webhookEnabled={settings.webhookEnabled}
      webhookUrl={settings.webhookUrl ?? ''}
      webhookSecret={settings.webhookSecret ?? ''}
      onSettingsChange={handleSettingsChange}
      showTestControls={showTestControls}
      onTestWebhook={async () => {}}
      isSendingWebhookTest={false}
    />
  );
}

function ReminderSearchWrapper() {
  const { settings, handleSettingsChange } = usePreferencesState();
  return (
    <ReminderSection
      defaultReminderEnabled={settings.defaultReminderEnabled}
      defaultReminderDays={settings.defaultReminderDays}
      onSettingsChange={handleSettingsChange}
    />
  );
}

function BudgetSearchWrapper() {
  const { settings, handleSettingsChange } = usePreferencesState();
  const showTestControls = process.env.NODE_ENV !== 'production';
  return (
    <BudgetSection
      monthlyBudget={settings.monthlyBudget}
      currency={settings.currency}
      onSettingsChange={handleSettingsChange}
      showTestControls={showTestControls}
      testBudgetEmailLanguage="en"
      setTestBudgetEmailLanguage={() => {}}
      onTestBudgetEmail={async () => {}}
      isSendingBudgetTestEmail={false}
      isSendingTestEmail={false}
    />
  );
}
