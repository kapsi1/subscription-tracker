"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfileSectionProps {
  profile: {
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  setProfile: (profile: any) => void;
}

export function ProfileSection({ profile, setProfile }: ProfileSectionProps) {
  const { t } = useTranslation();

  return (
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
  );
}
