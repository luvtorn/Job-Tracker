"use client";

import { useState, useEffect } from "react";
import { Camera, Mail, User, Loader } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/features/auth/context/auth-context";
import Image from "next/image";
import { CareerDocuments } from "./career-documents";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";

type UserRole = "SEEKER" | "RECRUITER" | "ADMIN";

export function ProfileCard() {
  const t = useTranslations("profileUi");
  const common = useTranslations("common");
  const feedback = useTranslations("profileFeedback");
  const { showToast } = useToast();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    role: "SEEKER",
  });

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronizing editable form state with the authenticated user.
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role,
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (!response.ok) throw new Error(feedback("updateFailed"));

      const data = await response.json();
      updateUser(data.user);
      setIsEditing(false);
      showToast(feedback("updated"), "success");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showToast(feedback("updateFailed"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError(t("imageOnly"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t("imageSize"));
      return;
    }

    setIsUploadingAvatar(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.user);
      } else {
        setUploadError(t("avatarUploadFailed"));
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setUploadError(t("avatarUploadFailed"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader className="animate-spin text-primary-600" size={24} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Avatar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={t("avatar")}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {getInitials()}
                </span>
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              aria-label={t("uploadAvatar")}
              className="absolute bottom-0 right-0 bg-white border-2 border-neutral-200 rounded-full p-2 hover:bg-neutral-50 transition-colors cursor-pointer group-hover:border-primary-500"
            >
              {isUploadingAvatar ? (
                <Loader size={18} className="text-neutral-600 animate-spin" />
              ) : (
                <Camera size={18} className="text-neutral-600" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-neutral-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-neutral-600 flex items-center gap-2 mt-2">
              <Mail size={16} />
              {user.email}
            </p>
            <p className="text-neutral-600 flex items-center gap-2 mt-1">
              <User size={16} />
              {user.role === "SEEKER" ? t("seeker") : t("recruiter")}
            </p>
            {uploadError && (
              <p className="text-red-600 text-sm mt-2">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">
            {t("personalInformation")}
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {isEditing ? common("cancel") : common("edit")}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t("firstName")}
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {t("lastName")}
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                {t("email")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {t("emailFixed")}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSaving ? t("saving") : t("saveChanges")}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                {common("cancel")}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-neutral-600">{t("firstName")}</span>
              <span className="font-medium text-neutral-900">
                {user.firstName}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-neutral-600">{t("lastName")}</span>
              <span className="font-medium text-neutral-900">
                {user.lastName}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-neutral-600">{t("email")}</span>
              <span className="font-medium text-neutral-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">{t("accountType")}</span>
              <span className="font-medium text-neutral-900">
                {user.role === "SEEKER" ? t("seeker") : t("recruiter")}
              </span>
            </div>
          </div>
        )}
      </div>

      {user.role === "SEEKER" && <CareerDocuments />}

      {/* Security Section */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <h3 className="text-lg font-semibold text-neutral-900 mb-6">
          {t("security")}
        </h3>
        <div className="space-y-3">
          <button disabled className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-left font-medium text-neutral-400 cursor-not-allowed">
            {t("changePassword")}
          </button>
          <button disabled className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-left font-medium text-neutral-400 cursor-not-allowed">
            {t("activeSessions")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
