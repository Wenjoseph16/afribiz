'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export function useSidebarUnreadCount() {
  return useQuery({
    queryKey: ['sidebar-unread-count'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/messages/unread-count');
        const total = res.data?.data?.total ?? 0;
        return { total };
      } catch {
        return { total: 0 };
      }
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
