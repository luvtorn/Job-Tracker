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

    console.log(`[SSE] User ${user.id} connecting to stream`);

    const response = new ReadableStream({
      async start(controller) {
        try {
          const unreadCount = await notificationService.getUnreadCount(user.id);

          const initialEvent = `event: unreadCount\ndata: ${unreadCount}\n\n`;
          controller.enqueue(initialEvent);

          const unsubscribe = sseSubscriptionService.subscribe(user.id, controller);

          const cleanup = () => {
            console.log(`[SSE] User ${user.id} disconnected`);
            unsubscribe();
            try {
              controller.close();
            } catch (error) {
              console.error('[SSE] Error closing controller:', error);
            }
          };

          _request.signal.addEventListener('abort', cleanup);
        } catch (error) {
          console.error('[SSE] Error in stream start:', error);
          controller.error(error);
        }
      },
    });

    return new Response(response, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[SSE] Stream error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
