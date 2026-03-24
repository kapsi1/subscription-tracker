'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface SectionMetadata {
  id: string;
  tab: 'preferences' | 'profile';
  titleKey: string;
  descKey?: string;
  searchKeys?: string[];
}

export const SETTINGS_SECTIONS: SectionMetadata[] = [
  {
    id: 'localization',
    tab: 'preferences',
    titleKey: 'settings.localization.title',
    descKey: 'settings.localization.desc',
    searchKeys: [
      'settings.localization.language',
      'settings.localization.languageDesc',
      'settings.localization.currency',
      'settings.localization.currencyDesc',
    ],
  },
  {
    id: 'appearance',
    tab: 'preferences',
    titleKey: 'settings.appearance.title',
    descKey: 'settings.appearance.desc',
    searchKeys: [
      'settings.appearance.theme',
      'settings.appearance.themeDesc',
      'settings.appearance.accent',
      'settings.appearance.accentDesc',
    ],
  },

  {
    id: 'email',
    tab: 'preferences',
    titleKey: 'settings.notifications.email.title',
    descKey: 'settings.notifications.email.desc',
    searchKeys: [
      'settings.notifications.email.daily',
      'settings.notifications.email.dailyDesc',
      'settings.notifications.email.weekly',
      'settings.notifications.email.weeklyDesc',
    ],
  },
  {
    id: 'reminder',
    tab: 'preferences',
    titleKey: 'settings.notifications.default.title',
    descKey: 'settings.notifications.default.desc',
    searchKeys: ['settings.notifications.default.addReminder'],
  },
  {
    id: 'categories',
    tab: 'preferences',
    titleKey: 'settings.categories.title',
    descKey: 'settings.categories.desc',
    searchKeys: [
      'settings.categories.addCategory',
      'settings.categories.resetToDefaults',
      'settings.categories.categoryName',
      'settings.categories.pickColor',
      'icons',
    ],
  },
  {
    id: 'budget',
    tab: 'preferences',
    titleKey: 'settings.budget.title',
    descKey: 'settings.budget.desc',
    searchKeys: ['settings.budget.label', 'settings.budget.help'],
  },
  {
    id: 'profile',
    tab: 'profile',
    titleKey: 'settings.profile.title',
    descKey: 'settings.profile.desc',
    searchKeys: ['settings.profile.name'],
  },
  {
    id: 'password',
    tab: 'profile',
    titleKey: 'settings.changePassword.title',
    descKey: 'settings.changePassword.desc',
    searchKeys: [
      'settings.changePassword.currentPassword',
      'settings.changePassword.newPassword',
      'settings.changePassword.confirmNewPassword',
    ],
  },
  {
    id: 'change-email',
    tab: 'profile',
    titleKey: 'settings.changeEmail.title',
    descKey: 'settings.changeEmail.desc',
    searchKeys: ['settings.changeEmail.newEmail', 'settings.changeEmail.currentPassword'],
  },
  {
    id: 'delete-account',
    tab: 'profile',
    titleKey: 'settings.deleteAccount.title',
    descKey: 'settings.deleteAccount.desc',
    searchKeys: [
      'settings.deleteAccount.button',
      'settings.deleteAccount.confirmTitle',
      'settings.deleteAccount.confirmDesc',
    ],
  },
];

interface SettingsSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  isSectionVisible: (sectionId: string, currentTab: 'preferences' | 'profile') => boolean;
}

const SettingsSearchContext = createContext<SettingsSearchContextType | undefined>(undefined);

export const SettingsSearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const clearSearch = () => setSearchQuery('');

  const isSectionVisible = (sectionId: string, currentTab: 'preferences' | 'profile') => {
    const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId);
    if (!section) return false;

    if (!searchQuery.trim()) {
      return section.tab === currentTab;
    }

    const query = searchQuery.toLowerCase();
    const title = t(section.titleKey).toLowerCase();
    const desc = section.descKey ? t(section.descKey).toLowerCase() : '';
    const extraMatches =
      section.searchKeys?.some((key) => t(key).toLowerCase().includes(query)) ?? false;

    return title.includes(query) || desc.includes(query) || extraMatches;
  };

  return (
    <SettingsSearchContext.Provider
      value={{ searchQuery, setSearchQuery, clearSearch, isSectionVisible }}
    >
      {children}
    </SettingsSearchContext.Provider>
  );
};

export const useSettingsSearch = () => {
  const context = useContext(SettingsSearchContext);
  if (context === undefined) {
    throw new Error('useSettingsSearch must be used within a SettingsSearchProvider');
  }
  return context;
};

interface HighlightProps {
  text: string;
  query: string;
}

export const SearchHighlight = ({ text, query }: HighlightProps) => {
  if (!query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  // Escape HTML characters to prevent XSS
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const highlightedHtml = escapedText.replace(
    regex,
    (match) =>
      `<mark style="background-color: #fef08a; color: #1a1a1a; padding: 0; margin: 0; border-radius: 2px; font-weight: 500;">${match}</mark>`,
  );

  return (
    <span
      // biome-ignore lint/security/noDangerouslySetInnerHtml: content is manually escaped above
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      style={{ display: 'inline' }}
    />
  );
};
