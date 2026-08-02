'use client';

import { Search, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationsDropdown } from '@/features/notifications/components/notifications-dropdown';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useToast } from '@/components/ui/toast';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

export function TopBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();
  const t = useTranslations();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.replace('/auth/login');
    } catch {
      showToast(t('topbar.logoutFailed'), 'error');
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase();
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="hidden max-w-md flex-1 lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder={t('common.search')}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="ml-auto flex w-full items-center justify-end gap-2 sm:gap-4 lg:w-auto lg:gap-6">
          <LanguageSwitcher />
          <div className="hidden lg:block"><ThemeSwitcher /></div>
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label={t('topbar.notifications')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative"
            >
              <Bell size={20} className="text-neutral-600" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsDropdown isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-neutral-100 sm:px-3 sm:py-2"
            >
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={t('topbar.avatar')}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{getInitials()}</span>
                </div>
              )}
              <span className="text-sm font-medium text-neutral-900 hidden sm:inline">
                {displayName}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-2">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  {t('topbar.profileSettings')}
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  {t('topbar.settings')}
                </Link>
                <div className="border-t border-neutral-200 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  {t('topbar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
