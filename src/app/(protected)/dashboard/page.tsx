'use client';

import { TopBar } from "@/components/TopBar";
import { SeekerDashboard } from "@/features/dashboard/components/seeker/dashboard";
import { RecruiterDashboard } from "@/features/dashboard/components/recruiter/dashboard";
import { useAuth } from "@/features/auth/context/auth-context";
import { Loader } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const navigation = useTranslations('navigation');
  const dashboard = useTranslations('dashboard');

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{navigation('dashboard')}</h1>
          <p className="text-neutral-600">{dashboard('welcome')}</p>
        </div>

        {user?.role === 'RECRUITER' ? <RecruiterDashboard /> : <SeekerDashboard />}
      </main>
    </div>
  );
}
