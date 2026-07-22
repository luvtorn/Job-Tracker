'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ToastProvider } from '@/components/ui/toast';
import { NotificationsProvider } from '@/hooks/use-notifications';

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
