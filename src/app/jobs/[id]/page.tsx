'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import Link from 'next/link';
import { Menu, X, MapPin, DollarSign, Briefcase, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [job, setJob] = useState<Vacancy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      setJob(data.vacancy);
    } catch (err) {
      console.error('Failed to fetch job:', err);
      setError('Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      setIsApplying(true);
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: jobId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to apply');
      }

      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Failed to apply:', err);
      alert('Failed to submit application. ' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-neutral-200 sticky top-0 bg-white z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/jobs" className="flex items-center gap-2 hover:opacity-80">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
              <span className="font-semibold text-neutral-900">JobTracker</span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error || 'Job not found'}</p>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            Back to jobs
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/jobs" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <span className="font-semibold text-neutral-900">JobTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
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
          <div className="md:hidden border-t border-neutral-200 px-6 py-4 space-y-4">
            {user ? (
              <Link
                href="/dashboard"
                className="block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-6 py-2 text-blue-600 border border-blue-600 rounded-lg font-medium text-center hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft size={18} />
          Back to jobs
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">{job.title}</h1>
            <p className="text-xl text-neutral-600">{job.company}</p>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {job.position && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-600 mb-1">
                  <Briefcase size={18} />
                  <span className="text-sm font-medium">Position</span>
                </div>
                <p className="text-neutral-900 font-semibold">{job.position}</p>
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-600 mb-1">
                <MapPin size={18} />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-neutral-900 font-semibold">{job.location}</p>
            </div>
            {job.salaryMin && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-600 mb-1">
                  <DollarSign size={18} />
                  <span className="text-sm font-medium">Salary</span>
                </div>
                <p className="text-neutral-900 font-semibold">
                  {job.salaryMin.toLocaleString()} - {job.salaryMax?.toLocaleString()} {job.currency}
                </p>
              </div>
            )}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-600 mb-1">
                <Calendar size={18} />
                <span className="text-sm font-medium">Posted</span>
              </div>
              <p className="text-neutral-900 font-semibold">
                {new Date(job.publishedAt || job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {job.description && (
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">About the Role</h2>
                  <div className="prose prose-sm max-w-none text-neutral-600 space-y-3">
                    {job.description.split('\n').map((line, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && (
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-4">Requirements</h2>
                  <div className="prose prose-sm max-w-none text-neutral-600 space-y-3">
                    {job.requirements.split('\n').map((line, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Apply Button */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 rounded-lg p-6 sticky top-24 space-y-4">
                <button
                  onClick={handleApply}
                  disabled={isApplying || hasApplied}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    hasApplied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  }`}
                >
                  {isApplying ? 'Applying...' : hasApplied ? '✓ Applied' : 'Apply Now'}
                </button>

                {!user && (
                  <p className="text-center text-sm text-neutral-600">
                    Sign in to apply for this position
                  </p>
                )}

                <div className="border-t border-neutral-200 pt-4 space-y-3 text-sm text-neutral-600">
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">Company</p>
                    <p>{job.company}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 mb-1">Location</p>
                    <p>{job.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
