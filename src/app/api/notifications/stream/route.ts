import { NextRequest } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';
import { sseSubscriptionService } from '@/server/services/sse-subscription-service';

export async function GET(_request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }


    const response = new ReadableStream({
      async start(controller) {
        try {
          const unreadCount = await notificationService.getUnreadCount(user.id);

          const initialEvent = `event: unreadCount\ndata: ${unreadCount}\n\n`;
          controller.enqueue(initialEvent);

          const unsubscribe = sseSubscriptionService.subscribe(user.id, controller);

          const cleanup = () => {
            unsubscribe();
            try {
              controller.close();
            } catch {}
          };

          _request.signal.addEventListener('abort', cleanup);
        } catch {
          console.error('Notification stream initialization failed');
          controller.error(new Error('Notification stream unavailable'));
        }
      },
    });

    return new Response(response, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch {
    console.error('Notification stream failed');
    return new Response('Internal server error', { status: 500 });
  }
}
