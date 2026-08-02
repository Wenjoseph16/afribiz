'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SocketProvider } from '@/components/SocketProvider';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';

const queryClient = new QueryClient();

function MessageNotificationInit() {
  useMessageNotifications();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SocketProvider>
            <MessageNotificationInit />
            {children}
          </SocketProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
