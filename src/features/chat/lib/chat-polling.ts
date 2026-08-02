export const ACTIVE_THREAD_POLL_MS = 1_000;
export const CHAT_LIST_POLL_MS = 3_000;
export const MAX_CHAT_POLL_MS = 15_000;

export function getChatPollingDelay(baseDelay: number, consecutiveFailures: number) {
  if (consecutiveFailures <= 0) return baseDelay;
  return Math.min(MAX_CHAT_POLL_MS, baseDelay * (2 ** consecutiveFailures));
}
