import { Notification } from '@prisma/client';

interface SSEClient {
  response: ReadableStreamDefaultController<string>;
  userId: string;
}

class SSESubscriptionService {
  private clients: Map<string, Set<SSEClient>> = new Map();

  subscribe(userId: string, controller: ReadableStreamDefaultController<string>): () => void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }

    const client: SSEClient = { response: controller, userId };
    this.clients.get(userId)!.add(client);

    console.log(`[SSE] User ${userId} subscribed. Active: ${this.clients.get(userId)!.size}`);

    return () => this.unsubscribe(userId, client);
  }

  private unsubscribe(userId: string, client: SSEClient): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(client);
      console.log(`[SSE] User ${userId} unsubscribed. Active: ${userClients.size}`);

      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  notifyUser(userId: string, notification: Notification, unreadCount: number): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      console.log(`[SSE] No active clients for user ${userId}`);
      return;
    }

    const unreadCountEvent = `event: unreadCount\ndata: ${unreadCount}\n\n`;
    const notificationEvent = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;

    userClients.forEach((client) => {
      try {
        client.response.enqueue(unreadCountEvent);
        client.response.enqueue(notificationEvent);
        console.log(`[SSE] Sent notification to ${userId}`);
      } catch (error) {
        console.error(`[SSE] Error sending to client: ${error}`);
        this.unsubscribe(userId, client);
      }
    });
  }

  sendUnreadCount(userId: string, count: number): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return;
    }

    const event = `event: unreadCount\ndata: ${count}\n\n`;

    userClients.forEach((client) => {
      try {
        client.response.enqueue(event);
      } catch (error) {
        console.error(`[SSE] Error sending unread count: ${error}`);
        this.unsubscribe(userId, client);
      }
    });
  }

  getActiveConnections(userId?: string): number {
    if (userId) {
      return this.clients.get(userId)?.size ?? 0;
    }
    return Array.from(this.clients.values()).reduce((sum, set) => sum + set.size, 0);
  }
}

export const sseSubscriptionService = new SSESubscriptionService();
