'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationsProvider } from '@/hooks/use-notifications';
import { ChatUnreadProvider } from '@/hooks/use-chat-unread';
import { ThemeProvider } from '@/features/theme/theme-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider><QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <NotificationsProvider><ChatUnreadProvider>{children}</ChatUnreadProvider></NotificationsProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider></ThemeProvider>
  );
}
