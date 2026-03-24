'use client';

import type { Settings } from '@subtracker/shared';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import api from '@/lib/api';
import { registerServiceWorker, subscribeToPush } from '@/lib/push';
import { AppearanceSection } from '../_components/AppearanceSection';
import { BudgetSection } from '../_components/BudgetSection';
import { EmailNotificationsSection } from '../_components/EmailNotificationsSection';
import { LocalizationSection } from '../_components/LocalizationSection';
import { ReminderSection } from '../_components/ReminderSection';

export default function PreferencesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { fetchUser } = useAuth();
  const showTestControls = process.env.NODE_ENV !== 'production';
  const [settings, setSettings] = useState<Settings>({
    defaultReminders: [],
    emailNotifications: false,
    dailyDigest: false,
    previousWeekReport: false,
    nextWeekReport: false,
    monthlyBudget: null,
    currency: 'USD',
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [testEmailLanguage, setTestEmailLanguage] = useState<'en' | 'pl'>('en');
  const [testBudgetEmailLanguage, setTestBudgetEmailLanguage] = useState<'en' | 'pl'>('en');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingBudgetTestEmail, setIsSendingBudgetTestEmail] = useState(false);
  const [isSendingDailyTest, setIsSendingDailyTest] = useState(false);
  const [isSendingPreviousWeeklyTest, setIsSendingPreviousWeeklyTest] = useState(false);
  const [isSendingNextWeeklyTest, setIsSendingNextWeeklyTest] = useState(false);
  const hasLoadedSettingsRef = useRef(false);
  const lastSavedPreferencesRef = useRef<string | null>(null);
  const latestSaveAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/users/me');
        const loadedSettings = {
          defaultReminders: response.data.defaultReminders ?? [],
          monthlyBudget: response.data.monthlyBudget
            ? parseFloat(response.data.monthlyBudget)
            : null,
          emailNotifications: response.data.emailNotifications,
          dailyDigest: response.data.dailyDigest,
          previousWeekReport: response.data.previousWeekReport,
          nextWeekReport: response.data.nextWeekReport,
          currency: response.data.currency || 'USD',
        };
        setSettings((prev) => ({
          ...prev,
          ...loadedSettings,
        }));
        lastSavedPreferencesRef.current = JSON.stringify({
          defaultReminders: loadedSettings.defaultReminders.map(
            ({ type, value, unit }: { type: string; value: number; unit: string }) => ({
              type,
              value,
              unit,
            }),
          ),
          monthlyBudget: loadedSettings.monthlyBudget,
          emailNotifications: loadedSettings.emailNotifications,
          dailyDigest: loadedSettings.dailyDigest,
          previousWeekReport: loadedSettings.previousWeekReport,
          nextWeekReport: loadedSettings.nextWeekReport,
          currency: loadedSettings.currency,
        });
        hasLoadedSettingsRef.current = true;
        setSettingsLoaded(true);
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
      defaultReminders: settings.defaultReminders.map(({ type, value, unit }) => ({
        type,
        value,
        unit,
      })),
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
      latestSaveAttemptRef.current = serializedPayload;
      try {
        await api.patch('/users/settings', payload);
        if (latestSaveAttemptRef.current === serializedPayload) {
          lastSavedPreferencesRef.current = serializedPayload;
          await fetchUser();
          // Invalidate queries to refresh data across the app (e.g. currency changes)
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        toast.error(t('settings.saveError', { defaultValue: 'Failed to save settings' }));
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [settings, t, queryClient, fetchUser]);

  const handleRequestPushPermission = async (): Promise<boolean> => {
    try {
      await registerServiceWorker();
      const sub = await subscribeToPush();
      await api.post('/users/push-subscription', sub.toJSON());
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message);
      return false;
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

  const handleTestPreviousWeekReport = async () => {
    setIsSendingPreviousWeeklyTest(true);
    try {
      const res = await api.post('/users/test-previous-week-report', { lang: testEmailLanguage });
      toast.success(res.data.message || 'Test previous week report sent');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send test previous week report');
    } finally {
      setIsSendingPreviousWeeklyTest(false);
    }
  };

  const handleTestNextWeekReport = async () => {
    setIsSendingNextWeeklyTest(true);
    try {
      const res = await api.post('/users/test-next-week-report', { lang: testEmailLanguage });
      toast.success(res.data.message || 'Test next week report sent');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to send test next week report');
    } finally {
      setIsSendingNextWeeklyTest(false);
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

      {isSectionVisible('email', 'preferences') && (
        <EmailNotificationsSection
          emailNotifications={settings.emailNotifications}
          dailyDigest={settings.dailyDigest}
          previousWeekReport={settings.previousWeekReport}
          nextWeekReport={settings.nextWeekReport}
          onSettingsChange={handleSettingsChange}
          showTestControls={showTestControls}
          testEmailLanguage={testEmailLanguage}
          setTestEmailLanguage={setTestEmailLanguage}
          onTestEmail={handleTestEmail}
          onTestDailyDigest={handleTestDailyDigest}
          onTestPreviousWeekReport={handleTestPreviousWeekReport}
          onTestNextWeekReport={handleTestNextWeekReport}
          isLoading={{
            email: isSendingTestEmail,
            daily: isSendingDailyTest,
            previousWeekly: isSendingPreviousWeeklyTest,
            nextWeekly: isSendingNextWeeklyTest,
          }}
        />
      )}

      {isSectionVisible('reminder', 'preferences') && (
        <ReminderSection
          key={settingsLoaded ? 'loaded' : 'loading'}
          defaultReminders={settings.defaultReminders}
          onSettingsChange={handleSettingsChange}
          onRequestPushPermission={handleRequestPushPermission}
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
          {isSectionVisible('categories', 'preferences') && <CategorySection />}
        </>
      )}
    </div>
  );
}

// Wrapper components for Profile sections to handle their own data fetching
import { CategorySection } from '../_components/CategorySection';
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
