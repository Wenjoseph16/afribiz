import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const trackingAnalyticsKeys = {
  all: ['tracking-analytics'] as const,
  summary: ['tracking-analytics', 'summary'] as const,
  byType: (type: string) => ['tracking-analytics', type] as const,
};

export interface TrackingAnalyticsSummary {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  pending: number;
  byType: {
    type: string;
    count: number;
    active: number;
    completed: number;
  }[];
  avgCompletionTime: number | null;
  completionRate: number;
}

export function useTrackingAnalyticsSummary() {
  return useQuery({
    queryKey: trackingAnalyticsKeys.summary,
    queryFn: async () => {
      const res = await apiClient.get('/transactions/stats');
      return res.data.data as TrackingAnalyticsSummary;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrackingAnalyticsByType(type: string) {
  return useQuery({
    queryKey: trackingAnalyticsKeys.byType(type),
    queryFn: async () => {
      const res = await apiClient.get(`/transactions/stats?type=${type}`);
      return res.data.data;
    },
    enabled: !!type,
    staleTime: 5 * 60 * 1000,
  });
}
