'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/context/auth-context';
import type { NotificationDto } from '@/types/notification';

type NotificationsResponse = {
  notifications: NotificationDto[];
  unreadCount: number;
};

type NotificationsContextValue = {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  isMarkingAll: boolean;
  error: string | null;
  fetchNotifications: (silent?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);
const CHANNEL_NAME = 'jobtracker-notifications';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const t = useTranslations('notifications');
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=50&offset=0');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json() as NotificationsResponse;
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch {
      setError(t('loadFailed'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [t, user]);

  const broadcastRefresh = useCallback(() => {
    channelRef.current?.postMessage({ type: 'refresh' });
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    const previousNotifications = notifications;
    const previousCount = unreadCount;
    const target = notifications.find((notification) => notification.id === notificationId);
    if (!target || target.isRead) return;
    setNotifications((current) => current.map((notification) => notification.id === notificationId ? { ...notification, isRead: true } : notification));
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      const data = await response.json() as { unreadCount: number };
      setUnreadCount(data.unreadCount);
      broadcastRefresh();
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      showToast(t('markReadFailed'), 'error');
    }
  }, [broadcastRefresh, notifications, showToast, t, unreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (isMarkingAll || unreadCount === 0) return;
    const previousNotifications = notifications;
    const previousCount = unreadCount;
    setIsMarkingAll(true);
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    setUnreadCount(0);
    try {
      const response = await fetch('/api/notifications/mark-all-as-read', { method: 'PATCH' });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      const data = await response.json() as { unreadCount: number };
      setUnreadCount(data.unreadCount);
      broadcastRefresh();
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      showToast(t('markAllFailed'), 'error');
    } finally {
      setIsMarkingAll(false);
    }
  }, [broadcastRefresh, isMarkingAll, notifications, showToast, t, unreadCount]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const previousNotifications = notifications;
    const previousCount = unreadCount;
    const target = notifications.find((notification) => notification.id === notificationId);
    if (!target) return;
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    if (!target.isRead) setUnreadCount((current) => Math.max(0, current - 1));
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete notification');
      const data = await response.json() as { unreadCount: number };
      setUnreadCount(data.unreadCount);
      broadcastRefresh();
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      showToast(t('deleteFailed'), 'error');
    }
  }, [broadcastRefresh, notifications, showToast, t, unreadCount]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;

    const initialFetchId = window.setTimeout(() => void fetchNotifications(), 0);
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    if (channel) channel.onmessage = () => void fetchNotifications(true);

    const eventSource = new EventSource('/api/notifications/stream');
    eventSource.addEventListener('unreadCount', (event: MessageEvent<string>) => {
      const count = Number.parseInt(event.data, 10);
      if (Number.isFinite(count)) setUnreadCount(count);
    });
    eventSource.addEventListener('notification', (event: MessageEvent<string>) => {
      try {
        const notification = JSON.parse(event.data) as NotificationDto;
        setNotifications((current) => current.some((item) => item.id === notification.id) ? current : [notification, ...current]);
        channel?.postMessage({ type: 'refresh' });
      } catch {
        void fetchNotifications(true);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void fetchNotifications(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(initialFetchId);
      eventSource.close();
      channel?.close();
      channelRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications, isAuthLoading, user]);

  const value = useMemo(() => ({
    notifications: user ? notifications : [],
    unreadCount: user ? unreadCount : 0,
    isLoading: isAuthLoading || (Boolean(user) && isLoading),
    isMarkingAll,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }), [deleteNotification, error, fetchNotifications, isAuthLoading, isLoading, isMarkingAll, markAllAsRead, markAsRead, notifications, unreadCount, user]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
}
