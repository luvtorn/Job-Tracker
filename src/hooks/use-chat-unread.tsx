'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';

type ChatUnreadContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextValue | null>(null);
const POLL_INTERVAL_MS = 5_000;
const CHANNEL_NAME = 'jobtracker-chat';
export const CHAT_REFRESH_EVENT = 'jobtracker-chat-refresh';

export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!user || !['SEEKER', 'RECRUITER'].includes(user.role)) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const response = await fetch('/api/chats/unread-count', { signal: controller.signal });
      if (!response.ok) return;
      const data = await response.json() as { unreadCount: number };
      setUnreadCount(data.unreadCount);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }, [user]);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !['SEEKER', 'RECRUITER'].includes(user.role)) return;

    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);
    const refresh = () => { if (document.visibilityState === 'visible') void refreshUnreadCount(); };
    channel?.addEventListener('message', refresh);
    window.addEventListener(CHAT_REFRESH_EVENT, refresh);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', refresh);
    refresh();

    return () => {
      controllerRef.current?.abort();
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener(CHAT_REFRESH_EVENT, refresh);
      channel?.close();
    };
  }, [isLoading, refreshUnreadCount, user]);

  const visibleUnreadCount = user && ['SEEKER', 'RECRUITER'].includes(user.role) ? unreadCount : 0;
  const value = useMemo(() => ({ unreadCount: visibleUnreadCount, refreshUnreadCount }), [refreshUnreadCount, visibleUnreadCount]);
  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}

export function notifyChatChanged() {
  window.dispatchEvent(new Event(CHAT_REFRESH_EVENT));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'refresh' });
    channel.close();
  }
}

export function useChatUnread() {
  const context = useContext(ChatUnreadContext);
  if (!context) throw new Error('useChatUnread must be used within ChatUnreadProvider');
  return context;
}
