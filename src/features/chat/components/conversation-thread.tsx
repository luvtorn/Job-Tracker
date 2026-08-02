'use client';

import { ArrowLeft, Check, CheckCheck, Send } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import clsx from 'clsx';
import { getChatDeliveryStatus } from '@/features/chat/lib/chat-delivery-status';
import type { ChatThreadDto } from '@/types/chat';

type Props = {
  thread: ChatThreadDto;
  draft: string;
  isSending: boolean;
  isLoadingOlder: boolean;
  messagesRef: RefObject<HTMLDivElement | null>;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onLoadOlder: () => void;
  onBack: () => void;
};

const nameFor = (thread: ChatThreadDto, fallback: string) => `${thread.participant.firstName ?? ''} ${thread.participant.lastName ?? ''}`.trim() || fallback;

export function ConversationThread({ thread, draft, isSending, isLoadingOlder, messagesRef, onDraftChange, onSubmit, onKeyDown, onLoadOlder, onBack }: Props) {
  const t = useTranslations('chatUi');
  const locale = useLocale();

  return <div className="flex h-full min-h-0 flex-col">
    <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3"><button type="button" onClick={onBack} aria-label={t('back')} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"><ArrowLeft size={20} /></button><div className="min-w-0"><h2 className="truncate font-semibold text-neutral-900">{nameFor(thread, t('participantFallback'))}</h2><p className="truncate text-sm text-neutral-500">{thread.vacancyTitle}{thread.company ? ` · ${thread.company}` : ''}</p></div></header>
    <div ref={messagesRef} className="min-h-0 flex-1 overflow-y-auto bg-neutral-50 p-4" aria-live="polite">
      {thread.nextCursor && <div className="mb-4 text-center"><button type="button" disabled={isLoadingOlder} onClick={onLoadOlder} className="text-sm font-medium text-primary-700 hover:text-primary-800 disabled:opacity-50">{isLoadingOlder ? t('loadingOlder') : t('loadOlder')}</button></div>}
      {thread.messages.length === 0 && <p className="py-16 text-center text-sm text-neutral-500">{t('noMessages')}</p>}
      <div className="space-y-3">{thread.messages.map((message) => {
        const deliveryStatus = message.isOwn
          ? getChatDeliveryStatus(message, thread.peerLastReadCursor)
          : null;
        return <div key={message.id} className={clsx('flex', message.isOwn ? 'justify-end' : 'justify-start')}><div className={clsx('max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm shadow-sm', message.isOwn ? 'rounded-br-md bg-primary-600 text-white' : 'rounded-bl-md border border-neutral-200 bg-white text-neutral-900')}><p>{message.content}</p><div className={clsx('mt-1 flex items-center justify-end gap-1 text-[11px]', message.isOwn ? 'text-primary-100' : 'text-neutral-400')}><time>{new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt))}</time>{deliveryStatus && <MessageDeliveryStatus status={deliveryStatus} label={t(deliveryStatus === 'sending' ? 'statusSending' : deliveryStatus === 'read' ? 'statusRead' : 'statusDelivered')} />}</div></div></div>;
      })}</div>
    </div>
    {thread.canSend ? <form onSubmit={onSubmit} className="border-t border-neutral-200 bg-white p-3"><div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} onKeyDown={onKeyDown} maxLength={2000} rows={1} aria-label={t('composerLabel')} placeholder={t('messagePlaceholder')} className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100" /><button type="submit" disabled={isSending || draft.trim().length === 0} aria-label={t('send')} className="flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"><Send size={18} /><span className="hidden sm:inline">{isSending ? t('sending') : t('send')}</span></button></div><p className="mt-1 text-right text-xs text-neutral-400">{draft.length}/2000</p></form> : <div className="border-t border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('readOnly')}</div>}
  </div>;
}

function MessageDeliveryStatus({ status, label }: { status: 'sending' | 'delivered' | 'read'; label: string }) {
  const Icon = status === 'sending' ? Check : CheckCheck;
  return <span role="img" aria-label={label} title={label} className={status === 'read' ? 'text-sky-300' : 'text-neutral-200'}><Icon size={15} strokeWidth={2.25} aria-hidden="true" /></span>;
}
