'use client';

import { useAuth } from "@/features/auth/context/auth-context";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { RecruiterSidebar } from "@/components/RecruiterSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { useState } from "react";
import { redirect } from "next/navigation";
import { useTranslations } from 'next-intl';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const t = useTranslations('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  const isRecruiter = user.role === "RECRUITER";

  return (
    <>
      <MobileHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        {isRecruiter ? (
          <RecruiterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        ) : (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
