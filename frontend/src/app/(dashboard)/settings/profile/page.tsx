'use client';

import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import api from '@/lib/api';
import { ChangeEmailSection } from '../_components/ChangeEmailSection';
import { ChangePasswordSection } from '../_components/ChangePasswordSection';
import { DeleteAccountSection } from '../_components/DeleteAccountSection';
import { type ProfileData, ProfileSection } from '../_components/ProfileSection';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { fetchUser, user } = useAuth();
  const isGoogleAccount = !!user?.googleId;
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
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

      {isSectionVisible('delete-account', 'profile') && <DeleteAccountSection />}

      {/* Show Preferences sections when searching in Profile */}
      {searchQuery.trim() && (
        <>
          {isSectionVisible('localization', 'profile') && <LocalizationSearchWrapper />}
          {isSectionVisible('appearance', 'profile') && <AppearanceSection />}
          {isSectionVisible('categories', 'profile') && <CategorySection />}
          {isSectionVisible('email', 'profile') && <EmailNotificationsSearchWrapper />}
          {isSectionVisible('reminder', 'profile') && <ReminderSearchWrapper />}
          {isSectionVisible('budget', 'profile') && <BudgetSearchWrapper />}
        </>
      )}
    </div>
  );
}

// Wrapper components for Preferences sections to handle their own data fetching
import type { Settings } from '@subtracker/shared';
import { registerServiceWorker, subscribeToPush } from '@/lib/push';
import { AppearanceSection } from '../_components/AppearanceSection';
import { BudgetSection } from '../_components/BudgetSection';
import { CategorySection } from '../_components/CategorySection';
import { EmailNotificationsSection } from '../_components/EmailNotificationsSection';
import { LocalizationSection } from '../_components/LocalizationSection';
import { ReminderSection } from '../_components/ReminderSection';
import { SETTINGS_SECTIONS, useSettingsSearch } from '../_components/SettingsSearchContext';

// Helper to use preferences state in wrappers
function usePreferencesState() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>({
    defaultReminderEnabled: false,
    defaultReminders: [],
    emailNotifications: true,
    emailAddress: '',
    dailyDigest: false,
    previousWeekReport: false,
    nextWeekReport: false,
    monthlyBudget: null,
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
          defaultReminders: response.data.defaultReminders ?? [],
          emailAddress: response.data.email,
          monthlyBudget: response.data.monthlyBudget
            ? parseFloat(response.data.monthlyBudget)
            : null,
          emailNotifications: response.data.emailNotifications,
          dailyDigest: response.data.dailyDigest,
          previousWeekReport: response.data.previousWeekReport,
          nextWeekReport: response.data.nextWeekReport,
          currency: response.data.currency || 'USD',
        };
        setSettings((prev) => ({ ...prev, ...loadedSettings }));
        lastSavedPreferencesRef.current = JSON.stringify({
          defaultReminderEnabled: loadedSettings.defaultReminderEnabled,
          defaultReminders: loadedSettings.defaultReminders,
          monthlyBudget: loadedSettings.monthlyBudget,
          emailNotifications: loadedSettings.emailNotifications,
          dailyDigest: loadedSettings.dailyDigest,
          previousWeekReport: loadedSettings.previousWeekReport,
          nextWeekReport: loadedSettings.nextWeekReport,
          currency: loadedSettings.currency,
        });
        hasLoadedSettingsRef.current = true;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        toast.error(t('settings.loadError'));
      }
    };
    fetchSettings();
  }, [t]);

  useEffect(() => {
    if (!hasLoadedSettingsRef.current) return;
    const payload = {
      defaultReminderEnabled: settings.defaultReminderEnabled,
      defaultReminders: settings.defaultReminders,
      monthlyBudget: settings.monthlyBudget,
      emailNotifications: settings.emailNotifications,
      dailyDigest: settings.dailyDigest,
      previousWeekReport: settings.previousWeekReport,
      nextWeekReport: settings.nextWeekReport,
      currency: settings.currency,
    };
    const serializedPayload = JSON.stringify(payload);
    if (serializedPayload === lastSavedPreferencesRef.current) return;
    const timer = window.setTimeout(async () => {
      try {
        await api.patch('/users/settings', payload);
        lastSavedPreferencesRef.current = serializedPayload;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
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
      previousWeekReport={settings.previousWeekReport}
      nextWeekReport={settings.nextWeekReport}
      onSettingsChange={handleSettingsChange}
      showTestControls={showTestControls}
      testEmailLanguage={testEmailLanguage}
      setTestEmailLanguage={setTestEmailLanguage}
      onTestEmail={handleTestEmail}
      onTestDailyDigest={async () => {}}
      onTestPreviousWeekReport={async () => {}}
      onTestNextWeekReport={async () => {}}
      isLoading={{
        email: isSendingTestEmail,
        daily: false,
        previousWeekly: false,
        nextWeekly: false,
      }}
    />
  );
}

function ReminderSearchWrapper() {
  const { settings, handleSettingsChange } = usePreferencesState();
  const handleRequestPushPermission = async (): Promise<boolean> => {
    try {
      await registerServiceWorker();
      const sub = await subscribeToPush();
      await api.post('/users/push-subscription', sub.toJSON());
      return true;
    } catch {
      return false;
    }
  };
  return (
    <ReminderSection
      defaultReminderEnabled={settings.defaultReminderEnabled}
      defaultReminders={settings.defaultReminders}
      onSettingsChange={handleSettingsChange}
      onRequestPushPermission={handleRequestPushPermission}
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
