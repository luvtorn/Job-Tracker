'use client';

import { Search, Bell, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/auth-context';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationsDropdown } from '@/features/notifications/components/notifications-dropdown';
import Image from 'next/image';

export function TopBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

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
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase();
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-neutral-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-6 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors relative"
            >
              <Bell size={20} className="text-neutral-600" />
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
              className="flex items-center gap-3 hover:bg-neutral-100 px-3 py-2 rounded-lg transition-colors"
            >
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt="Avatar"
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
                  Profile Settings
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  Settings
                </Link>
                <div className="border-t border-neutral-200 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
