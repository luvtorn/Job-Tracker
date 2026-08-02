export type ChatParticipantDto = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type ChatMessageDto = {
  id: string;
  clientMessageId: string;
  content: string;
  createdAt: string;
  sender: ChatParticipantDto;
  isOwn: boolean;
};

export type ChatSummaryDto = {
  applicationId: string;
  vacancyTitle: string;
  company: string | null;
  status: string;
  participant: ChatParticipantDto;
  lastMessage: ChatMessageDto;
  unreadCount: number;
};

export type ChatThreadDto = {
  applicationId: string;
  vacancyTitle: string;
  company: string | null;
  status: string;
  participant: ChatParticipantDto;
  canSend: boolean;
  peerLastReadCursor: { id: string; createdAt: string } | null;
  messages: ChatMessageDto[];
  nextCursor: string | null;
};
