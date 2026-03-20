'use client';

import { UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchHighlight, useSettingsSearch } from './SettingsSearchContext';

export interface ProfileData {
  name: string;
  email?: string;
  createdAt?: string;
  updatedAt: string;
}

interface ProfileSectionProps {
  profile: ProfileData;
  setProfile: (profile: ProfileData) => void;
}

export function ProfileSection({ profile, setProfile }: ProfileSectionProps) {
  const { t } = useTranslation();
  const { searchQuery } = useSettingsSearch();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <UserRound className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <CardTitle>
              <SearchHighlight text={t('settings.profile.title')} query={searchQuery} />
            </CardTitle>
            <CardDescription>
              <SearchHighlight text={t('settings.profile.desc')} query={searchQuery} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profileName">
            <SearchHighlight text={t('settings.profile.name')} query={searchQuery} />
          </Label>
          <Input
            id="profileName"
            name="profileName"
            value={profile.name}
            placeholder={t('settings.profile.namePlaceholder')}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
