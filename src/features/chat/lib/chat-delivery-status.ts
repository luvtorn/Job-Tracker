import type { ChatMessageDto, ChatThreadDto } from '@/types/chat';

export type ChatDeliveryStatus = 'sending' | 'delivered' | 'read';

export function getChatDeliveryStatus(
  message: ChatMessageDto,
  peerLastReadCursor: ChatThreadDto['peerLastReadCursor'],
): ChatDeliveryStatus {
  if (message.id.startsWith('pending-')) return 'sending';
  if (!peerLastReadCursor) return 'delivered';

  const messageTime = new Date(message.createdAt).getTime();
  const readTime = new Date(peerLastReadCursor.createdAt).getTime();
  if (messageTime < readTime) return 'read';
  if (messageTime > readTime) return 'delivered';
  return message.id <= peerLastReadCursor.id ? 'read' : 'delivered';
}
