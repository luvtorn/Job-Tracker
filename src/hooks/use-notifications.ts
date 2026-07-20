'use client';

import { useEffect, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  applicationId?: string;
  vacancyId?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (limit = 50, offset = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-as-read', {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch is synchronized with the SSE subscription lifecycle.
    fetchNotifications();

    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.addEventListener('unreadCount', (e: MessageEvent) => {
      try {
        const count = parseInt(e.data, 10);
        setUnreadCount(count);
      } catch (err) {
        console.error('Error parsing unreadCount:', err);
      }
    });

    eventSource.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notification: Notification = JSON.parse(e.data);
        console.log('[SSE] Received notification:', notification);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } catch (err) {
        console.error('Error parsing notification:', err);
      }
    });

    eventSource.addEventListener('error', () => {
      console.error('[SSE] Connection error, will reconnect');
      eventSource.close();
    });

    return () => {
      console.log('[SSE] Closing connection');
      eventSource.close();
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
