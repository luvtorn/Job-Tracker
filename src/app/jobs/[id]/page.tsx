'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import Link from 'next/link';
import { Menu, X, MapPin, DollarSign, Briefcase, Calendar, ArrowLeft, CheckCircle2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface Vacancy {
  id: string;
  title: string;
  company: string;
  position?: string;
  location: string;
  description: string;
  requirements?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  createdAt: string;
  publishedAt?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { user } = useAuth();
  const t = useTranslations('jobDetail');
  const publicT = useTranslations('public');
  const locale = useLocale();
  const [job, setJob] = useState<Vacancy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [applyError, setApplyError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadJobDetail = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const response = await fetch(`/api/jobs/${jobId}`);

        if (!response.ok) throw new Error(t('loadFailed'));

        const data = await response.json();
        setJob(data.vacancy);
      } catch (err) {
        console.error('Failed to fetch job:', err);
        setLoadError(t('loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadJobDetail();
  }, [jobId, t]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Application state belongs to the authenticated user.
      setHasApplied(false);
      return;
    }

    const loadApplicationState = async () => {
      try {
        const response = await fetch('/api/applications');
        if (!response.ok) return;

        const data = await response.json();
        const applications: Array<{ vacancyId: string }> = data.applications || [];
        setHasApplied(applications.some((application) => application.vacancyId === jobId));
      } catch (err) {
        console.error('Failed to check if applied:', err);
      }
    };

    void loadApplicationState();
  }, [jobId, user]);

  const handleApply = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      setIsApplying(true);
      setApplyError('');
      setSuccessMessage('');

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApplyError(data.message || t('submitFailed'));
        return;
      }

      setHasApplied(true);
      setSuccessMessage(t('submitted'));
    } catch (err) {
      console.error('Failed to apply:', err);
      setApplyError(t('submitError'));
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600"></div>
        </motion.div>
      </div>
    );
  }

  if (loadError || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
        <header className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/jobs" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl text-neutral-900">JobTracker</span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-red-600 mb-4 text-lg">{loadError || t('notFound')}</p>
          <Link href="/jobs" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
            <ArrowLeft size={18} />
            {t('back')}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white/80 backdrop-blur-sm z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Briefcase className="text-white" size={24} />
            </div>
            <span className="font-bold text-xl text-neutral-900">JobTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                {publicT('dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-2.5 text-primary-600 border-2 border-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                >
                  {publicT('signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                >
                  {publicT('signUp')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? publicT('closeMenu') : publicT('menu')}
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
            {user ? (
              <Link
                href="/dashboard"
                className="block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-center hover:bg-primary-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {publicT('dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-6 py-2.5 text-primary-600 border-2 border-primary-600 rounded-lg font-medium text-center hover:bg-primary-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {publicT('signIn')}
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium text-center hover:bg-primary-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {publicT('signUp')}
                </Link>
              </>
            )}
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Back Link */}
          <Link href="/jobs" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-8 group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            {t('back')}
          </Link>

          {/* Header Section */}
          <div className="bg-white rounded-2xl p-8 md:p-10 mb-8 border border-neutral-200 shadow-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-3">{job.title}</h1>
              <p className="text-2xl text-primary-600 font-semibold mb-6">{job.company}</p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <div className="flex items-center gap-2 text-primary-600 mb-2">
                    <MapPin size={18} />
                    <span className="text-sm font-medium">{t('location')}</span>
                  </div>
                  <p className="text-neutral-900 font-semibold">{job.location}</p>
                </div>

                {job.salaryMin && (
                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                    <div className="flex items-center gap-2 text-primary-600 mb-2">
                      <DollarSign size={18} />
                      <span className="text-sm font-medium">{t('salary')}</span>
                    </div>
                    <p className="text-neutral-900 font-semibold text-sm">
                      {job.salaryMin.toLocaleString(locale)} - {job.salaryMax?.toLocaleString(locale)} {job.currency}
                    </p>
                  </div>
                )}

                {job.position && (
                  <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                    <div className="flex items-center gap-2 text-primary-600 mb-2">
                      <Briefcase size={18} />
                      <span className="text-sm font-medium">{t('type')}</span>
                    </div>
                    <p className="text-neutral-900 font-semibold">{job.position}</p>
                  </div>
                )}

                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <div className="flex items-center gap-2 text-primary-600 mb-2">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">{t('posted')}</span>
                  </div>
                  <p className="text-neutral-900 font-semibold text-sm">
                    {new Date(job.publishedAt || job.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Content Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {job.description && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">{t('about')}</h2>
                  <div className="space-y-4 text-neutral-700 leading-relaxed">
                    {job.description.split('\n').map((line, idx) => (
                      <p key={idx} className="text-lg">
                        {line}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm"
                >
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">{t('requirements')}</h2>
                  <div className="space-y-3">
                    {job.requirements.split('\n').map((line, idx) => (
                      <div key={idx} className="flex gap-3">
                        <CheckCircle2 size={20} className="text-primary-600 flex-shrink-0 mt-1" />
                        <p className="text-neutral-700 text-lg">{line}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-sm sticky top-24 space-y-6"
              >
                {/* Error Message */}
                {applyError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                  >
                    {applyError}
                  </motion.div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
                  >
                    {successMessage}
                  </motion.div>
                )}

                {/* Apply Section */}
                {user?.role === 'RECRUITER' ? (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-center">
                    <Briefcase size={32} className="text-neutral-500 mx-auto mb-3" />
                    <p className="text-neutral-700 font-semibold text-lg">
                      {t('recruiterBlocked')}
                    </p>
                  </div>
                ) : hasApplied ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle2 size={32} className="text-green-600 mx-auto mb-3" />
                    <p className="text-green-700 font-semibold text-lg">{t('sent')}</p>
                    <p className="text-green-600 text-sm mt-2">{t('review')}</p>
                  </div>
                ) : user ? (
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-lg"
                  >
                    {isApplying ? t('applying') : t('apply')}
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all text-lg"
                  >
                    <LogIn size={20} />
                    {t('signInApply')}
                  </Link>
                )}

                {!user && !hasApplied && (
                  <>
                    <div className="pt-6 border-t border-neutral-200 space-y-3">
                      <p className="text-neutral-600 text-sm font-medium">{t('noAccount')}</p>
                      <Link
                        href="/auth/register"
                        className="block w-full py-2.5 px-6 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors text-center"
                      >
                        {t('createAccount')}
                      </Link>
                    </div>
                  </>
                )}

                {/* Company Info */}
                <div className="pt-6 border-t border-neutral-200 space-y-4">
                  <h3 className="font-semibold text-neutral-900">{t('companyDetails')}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-neutral-500 text-xs font-medium mb-1">{t('company').toUpperCase()}</p>
                      <p className="text-neutral-900 font-medium">{job.company}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-xs font-medium mb-1">{t('location').toUpperCase()}</p>
                      <p className="text-neutral-900 font-medium">{job.location}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
