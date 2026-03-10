"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { ProfileSection, type ProfileData } from "../_components/ProfileSection";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { fetchUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    createdAt: "",
    updatedAt: "",
  });
  const hasLoadedProfileRef = useRef(false);
  const lastSavedProfileNameRef = useRef<string>("");
  const latestProfileSaveAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/me");
        setProfile({
          name: response.data.name || "",
          email: response.data.email || "",
          createdAt: response.data.createdAt || "",
          updatedAt: response.data.updatedAt || "",
        });
        lastSavedProfileNameRef.current = (response.data.name || "").trim();
        hasLoadedProfileRef.current = true;
      } catch (error) {
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

  return (
    <div className="space-y-6">
      <ProfileSection profile={profile} setProfile={setProfile} />
    </div>
  );
}
