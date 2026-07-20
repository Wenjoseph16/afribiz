import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const feedKeys = {
  all: ['feed'] as const,
  trending: ['feed', 'trending'] as const,
};

export function useFeed(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...feedKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getFeedItems(params);
      return res.data.data;
    },
  });
}

export function useTrendingFeed(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...feedKeys.trending, params],
    queryFn: async () => {
      const res = await apiClient.get('/feed/trending', { params });
      return res.data.data;
    },
  });
}
