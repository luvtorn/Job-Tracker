'use client';

import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth/context/auth-context';
import { notifyChatChanged, useChatUnread } from '@/hooks/use-chat-unread';
import {
  ACTIVE_THREAD_POLL_MS,
  CHAT_LIST_POLL_MS,
  getChatPollingDelay,
} from '@/features/chat/lib/chat-polling';
import type { ChatMessageDto, ChatSummaryDto, ChatThreadDto } from '@/types/chat';
import { ConversationList } from './conversation-list';
import { ConversationThread } from './conversation-thread';

type RetryMessage = { clientMessageId: string; content: string };

const mergeMessages = (current: ChatMessageDto[], incoming: ChatMessageDto[]) => {
  const messages = new Map(current.map((message) => [message.id, message]));
  incoming.forEach((message) => messages.set(message.id, message));
  return [...messages.values()].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
};

export function MessagesWorkspace() {
  const t = useTranslations('chatUi');
  const { user } = useAuth();
  const { refreshUnreadCount } = useChatUnread();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('applicationId'));
  const [chats, setChats] = useState<ChatSummaryDto[]>([]);
  const [thread, setThread] = useState<ChatThreadDto | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [retryMessage, setRetryMessage] = useState<RetryMessage | null>(null);
  const threadController = useRef<AbortController | null>(null);
  const chatsController = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef(new Map<string, string>());

  const loadChats = useCallback(async (silent = false) => {
    chatsController.current?.abort();
    const controller = new AbortController();
    chatsController.current = controller;
    if (!silent) setIsLoadingChats(true);
    try {
      const response = await fetch('/api/chats?limit=50', { signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json() as { chats: ChatSummaryDto[] };
      setChats(data.chats);
      setError(null);
      return true;
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return true;
      setError(t('loadFailed'));
      return false;
    } finally {
      if (!silent) setIsLoadingChats(false);
    }
  }, [t]);

  const markRead = useCallback(async (applicationId: string, lastMessageId: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}/messages/read`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lastMessageId }) });
      if (!response.ok) throw new Error();
      setChats((current) => current.map((chat) => chat.applicationId === applicationId ? { ...chat, unreadCount: 0 } : chat));
      await refreshUnreadCount();
      notifyChatChanged();
      return true;
    } catch { setError(t('readFailed')); return false; }
  }, [refreshUnreadCount, t]);

  const loadThread = useCallback(async (applicationId: string, silent = false) => {
    threadController.current?.abort();
    const controller = new AbortController();
    threadController.current = controller;
    if (!silent) setIsLoadingThread(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/messages?limit=30`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json() as { thread: ChatThreadDto };
      setThread((current) => current?.applicationId === applicationId ? { ...data.thread, messages: mergeMessages(current.messages, data.thread.messages) } : data.thread);
      setError(null);
      const lastMessage = data.thread.messages.at(-1);
      if (lastMessage && !lastMessage.isOwn && markedReadRef.current.get(applicationId) !== lastMessage.id) {
        if (await markRead(applicationId, lastMessage.id)) markedReadRef.current.set(applicationId, lastMessage.id);
      }
      return true;
    } catch (loadError) {
      if (loadError instanceof DOMException && loadError.name === 'AbortError') return true;
      setError(t('loadFailed'));
      return false;
    } finally { if (!silent) setIsLoadingThread(false); }
  }, [markRead, t]);

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;
    let consecutiveFailures = 0;
    let firstRequest = true;

    const poll = async () => {
      if (cancelled || document.visibilityState !== 'visible' || !navigator.onLine) return;
      const successful = await loadChats(!firstRequest);
      firstRequest = false;
      consecutiveFailures = successful ? 0 : consecutiveFailures + 1;
      if (!cancelled) timerId = window.setTimeout(
        () => void poll(),
        getChatPollingDelay(CHAT_LIST_POLL_MS, consecutiveFailures),
      );
    };
    const resume = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      if (timerId !== null) window.clearTimeout(timerId);
      consecutiveFailures = 0;
      timerId = window.setTimeout(() => void poll(), 0);
    };

    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    resume();
    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      chatsController.current?.abort();
    };
  }, [loadChats]);
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    let timerId: number | null = null;
    let consecutiveFailures = 0;
    let firstRequest = true;

    const poll = async () => {
      if (cancelled || document.visibilityState !== 'visible' || !navigator.onLine) return;
      const successful = await loadThread(selectedId, !firstRequest);
      firstRequest = false;
      consecutiveFailures = successful ? 0 : consecutiveFailures + 1;
      if (!cancelled) timerId = window.setTimeout(
        () => void poll(),
        getChatPollingDelay(ACTIVE_THREAD_POLL_MS, consecutiveFailures),
      );
    };
    const resume = () => {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return;
      if (timerId !== null) window.clearTimeout(timerId);
      consecutiveFailures = 0;
      timerId = window.setTimeout(() => void poll(), 0);
    };

    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    resume();
    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      threadController.current?.abort();
    };
  }, [loadThread, selectedId]);

  const activeThreadId = thread?.applicationId;
  useEffect(() => {
    if (activeThreadId && !isLoadingThread) messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [activeThreadId, isLoadingThread]);

  const selectConversation = (applicationId: string | null) => {
    if (applicationId !== selectedId) setThread(null);
    setSelectedId(applicationId);
    router.replace(applicationId ? `/messages?applicationId=${applicationId}` : '/messages', { scroll: false });
  };

  const send = async (content: string, clientMessageId = crypto.randomUUID()) => {
    if (!thread || !user || isSending) return;
    const normalized = content.trim();
    if (!normalized) return;
    const optimisticId = `pending-${clientMessageId}`;
    const optimistic: ChatMessageDto = { id: optimisticId, clientMessageId, content: normalized, createdAt: new Date().toISOString(), isOwn: true, sender: { id: user.id, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl ?? null } };
    setThread((current) => current ? { ...current, messages: [...current.messages, optimistic] } : current);
    setDraft(''); setRetryMessage(null); setIsSending(true); setError(null);
    requestAnimationFrame(() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' }));
    try {
      const response = await fetch(`/api/applications/${thread.applicationId}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientMessageId, content: normalized }) });
      if (!response.ok) throw new Error();
      const data = await response.json() as { message: ChatMessageDto };
      setThread((current) => current ? { ...current, messages: current.messages.map((message) => message.id === optimisticId ? data.message : message) } : current);
      await loadChats(true); notifyChatChanged();
    } catch {
      setThread((current) => current ? { ...current, messages: current.messages.filter((message) => message.id !== optimisticId) } : current);
      setRetryMessage({ clientMessageId, content: normalized }); setError(t('sendFailed'));
    } finally { setIsSending(false); }
  };

  const loadOlder = async () => {
    if (!thread?.nextCursor || isLoadingOlder) return;
    const previousHeight = messagesRef.current?.scrollHeight ?? 0;
    setIsLoadingOlder(true);
    try {
      const response = await fetch(`/api/applications/${thread.applicationId}/messages?limit=30&before=${thread.nextCursor}`);
      if (!response.ok) throw new Error();
      const data = await response.json() as { thread: ChatThreadDto };
      setThread((current) => current ? { ...current, messages: mergeMessages(data.thread.messages, current.messages), nextCursor: data.thread.nextCursor } : current);
      requestAnimationFrame(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight - previousHeight; });
    } catch { setError(t('loadFailed')); }
    finally { setIsLoadingOlder(false); }
  };

  const onSubmit = (event: FormEvent) => { event.preventDefault(); void send(draft); };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(draft); } };

  return <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:grid lg:h-[calc(100vh-13rem)] lg:min-h-[560px] lg:grid-cols-[340px_minmax(0,1fr)]">
    <aside className={selectedId ? 'hidden border-r border-neutral-200 lg:block' : 'min-h-[520px] border-r border-neutral-200 lg:block'}><h2 className="border-b border-neutral-200 px-4 py-4 font-semibold text-neutral-900">{t('conversations')}</h2>{error && !thread && <ErrorState message={error} retry={() => void loadChats()} retryLabel={t('retry')} />}<ConversationList chats={chats} selectedId={selectedId} isLoading={isLoadingChats} onSelect={selectConversation} /></aside>
    <section className={selectedId ? 'h-[calc(100vh-10rem)] min-h-[520px] lg:h-auto' : 'hidden lg:block'}>{error && thread && <div className="flex items-center justify-between bg-red-50 px-4 py-2 text-sm text-red-700"><span>{error}</span>{retryMessage && <button type="button" className="font-semibold underline" onClick={() => void send(retryMessage.content, retryMessage.clientMessageId)}>{t('retry')}</button>}</div>}{isLoadingThread && !thread ? <div className="h-full animate-pulse bg-neutral-50" /> : thread ? <ConversationThread thread={thread} draft={draft} isSending={isSending} isLoadingOlder={isLoadingOlder} messagesRef={messagesRef} onDraftChange={setDraft} onSubmit={onSubmit} onKeyDown={onKeyDown} onLoadOlder={() => void loadOlder()} onBack={() => selectConversation(null)} /> : <div className="flex h-full flex-col items-center justify-center p-8 text-center text-neutral-500"><MessageCircle size={42} className="mb-3 text-neutral-300" /><p>{t('chooseConversation')}</p></div>}</section>
  </div>;
}

function ErrorState({ message, retry, retryLabel }: { message: string; retry: () => void; retryLabel: string }) {
  return <div className="m-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"><p>{message}</p><button type="button" onClick={retry} className="mt-2 font-semibold underline">{retryLabel}</button></div>;
}
