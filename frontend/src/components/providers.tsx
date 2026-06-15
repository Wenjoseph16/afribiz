'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useAuthStore } from '@/stores/authStore';
import { SocketProvider } from '@/components/SocketProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes pour les données qui changent peu
      gcTime: 1000 * 60 * 10, // 10 minutes dans le cache
      retry: 2,  // 2 tentatives avant d'abandonner
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0, // Ne pas réessayer les mutations
    },
  },
});

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrateFromCookies = useAuthStore((s) => s.hydrateFromCookies);

  useEffect(() => {
    hydrateFromCookies();
  }, [hydrateFromCookies]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthHydrator>
            <SocketProvider>
              {children}
            </SocketProvider>
          </AuthHydrator>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
