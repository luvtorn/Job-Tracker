import { NextRequest } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';
import { sseSubscriptionService } from '@/server/services/sse-subscription-service';
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { ApplicationError } from '@/server/errors/application-error';

export async function GET(_request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    await enforceAuthRateLimit(_request, 'notifications-stream', user.id);

    const response = new ReadableStream({
      async start(controller) {
        let heartbeat: ReturnType<typeof setInterval> | undefined;
        try {
          const unsubscribe = sseSubscriptionService.subscribe(user.id, controller);
          const unreadCount = await notificationService.getUnreadCount(user.id);

          const initialEvent = `event: unreadCount\ndata: ${unreadCount}\n\n`;
          controller.enqueue(initialEvent);

          heartbeat = setInterval(() => {
            try {
              controller.enqueue(': heartbeat\n\n');
            } catch {
              clearInterval(heartbeat);
            }
          }, 25_000);

          const cleanup = () => {
            clearInterval(heartbeat);
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
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      return new Response(error.message, {
        status: error.status,
        headers: error.headers,
      });
    }
    console.error('Notification stream failed');
    return new Response('Internal server error', { status: 500 });
  }
}
