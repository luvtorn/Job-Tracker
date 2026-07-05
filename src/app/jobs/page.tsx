'use client';

import { useAuth } from '@/features/auth/context/auth-context';
import { JobsList } from '@/features/jobs/components/jobs-list';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function JobsPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">J</span>
            </div>
            <span className="font-semibold text-neutral-900">JobTracker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/jobs" className="text-blue-600 font-medium">
              Browse Jobs
            </Link>
            {user && (
              <Link href="/applications" className="text-neutral-600 hover:text-neutral-900 font-medium">
                My Applications
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
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
            <Link
              href="/jobs"
              className="block text-blue-600 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse Jobs
            </Link>
            {user && (
              <Link
                href="/applications"
                className="block text-neutral-600 hover:text-neutral-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Applications
              </Link>
            )}
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
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Browse Job Opportunities</h1>
          <p className="text-xl text-neutral-600">
            Search and apply to positions from top companies around the world.
          </p>
        </div>

        <JobsList />
      </main>
    </div>
  );
}
