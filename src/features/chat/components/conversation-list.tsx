'use client';

import { MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import type { ChatSummaryDto } from '@/types/chat';

type Props = {
  chats: ChatSummaryDto[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (applicationId: string) => void;
};

const participantName = (chat: ChatSummaryDto, fallback: string) =>
  `${chat.participant.firstName ?? ''} ${chat.participant.lastName ?? ''}`.trim() || fallback;

export function ConversationList({ chats, selectedId, isLoading, onSelect }: Props) {
  const t = useTranslations('chatUi');
  const locale = useLocale();

  if (isLoading && chats.length === 0) {
    return <div className="space-y-3 p-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-neutral-100" />)}</div>;
  }
  if (chats.length === 0) {
    return <div className="flex h-full flex-col items-center justify-center p-8 text-center"><MessageCircle className="mb-3 text-neutral-300" size={36} /><p className="font-medium text-neutral-800">{t('empty')}</p><p className="mt-1 text-sm text-neutral-500">{t('emptyHint')}</p></div>;
  }

  return <div className="divide-y divide-neutral-100">{chats.map((chat) => (
    <button key={chat.applicationId} type="button" onClick={() => onSelect(chat.applicationId)} className={clsx('w-full p-4 text-left transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500', selectedId === chat.applicationId && 'bg-primary-50')}>
      <div className="flex items-start justify-between gap-3"><p className="truncate font-semibold text-neutral-900">{participantName(chat, t('participantFallback'))}</p><time className="shrink-0 text-xs text-neutral-500">{new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(chat.lastMessage.createdAt))}</time></div>
      <p className="mt-0.5 truncate text-xs font-medium text-primary-700">{chat.vacancyTitle}</p>
      <div className="mt-1 flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-sm text-neutral-500">{chat.lastMessage.content}</p>{chat.unreadCount > 0 && <span aria-label={t('unreadLabel', { count: chat.unreadCount })} className="min-w-5 rounded-full bg-primary-600 px-1.5 text-center text-xs font-semibold text-white">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span>}</div>
    </button>
  ))}</div>;
}
