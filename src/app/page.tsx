'use client';

import { useAuth } from '@/features/auth/context/auth-context';
import { JobsList } from '@/features/jobs/components/jobs-list';
import Link from 'next/link';
import { Menu, X, Briefcase, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function Home() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('public');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl text-neutral-900">JobTracker</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/jobs" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">
              {t('browseJobs')}
            </Link>
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
            aria-label={mobileMenuOpen ? t('closeMenu') : t('menu')}
            aria-expanded={mobileMenuOpen}
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
              className="block text-neutral-600 hover:text-primary-600 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('browseJobs')}
            </Link>
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

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              ✨ {t('welcome')}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6 leading-tight">
            {t('heroPrefix')}{' '}<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">{t('heroHighlight')}</span>
          </h1>

          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/jobs"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:shadow-xl transition-all transform hover:scale-105"
            >
              {t('browseJobs')}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {!user && (
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {t('getStarted')}
              </Link>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
            <p className="text-neutral-600 font-medium">{t('opportunities')}</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
            <p className="text-neutral-600 font-medium">{t('activeUsers')}</p>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-neutral-200 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl font-bold text-primary-600 mb-2">50+</div>
            <p className="text-neutral-600 font-medium">{t('companies')}</p>
          </div>
        </motion.div>

        {/* Featured Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-neutral-900 mb-3">{t('latest')}</h2>
            <p className="text-lg text-neutral-600">
              {t('latestDescription')}
            </p>
          </div>

          <JobsList />
        </motion.div>
      </main>
    </div>
  );
}
