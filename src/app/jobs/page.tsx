"use client";

import { useAuth } from "@/features/auth/context/auth-context";
import { JobsList } from "@/features/jobs/components/jobs-list";
import Link from "next/link";
import { Menu, X, Briefcase } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function JobsPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('public');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl text-neutral-900">
              JobTracker
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/jobs" className="text-primary-600 font-medium">
              {t('browseJobs')}
            </Link>
            {user && user.role !== "RECRUITER" && (
              <Link
                href="/applications"
                className="text-neutral-600 hover:text-primary-600 font-medium transition-colors"
              >
                {t('myApplications')}
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3"><LanguageSwitcher />
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                {t('dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-2.5 text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                >
                  {t('signUp')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-neutral-600" />
            ) : (
              <Menu size={24} className="text-neutral-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-neutral-200 px-6 py-4 space-y-4 bg-white"
          >
            <Link
              href="/jobs"
              className="block text-primary-600 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('browseJobs')}
            </Link>
            {user && (
              <Link
                href="/applications"
                className="block text-neutral-600 hover:text-primary-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('myApplications')}
              </Link>
            )}
            {user ? (
              <Link
                href="/dashboard"
                className="block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-center hover:bg-primary-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-6 py-2.5 text-primary-600 border-2 border-primary-600 rounded-lg font-medium text-center hover:bg-primary-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-center hover:bg-primary-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signUp')}
                </Link>
              </>
            )}
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold text-neutral-900 mb-4">
            Browse{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">
              Job Opportunities
            </span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl">
            Search and apply to positions from top companies around the world.
            Track your applications and manage your job search in one place.
          </p>
        </motion.div>

        <JobsList />
      </main>
    </div>
  );
}
