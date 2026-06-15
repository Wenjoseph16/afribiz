import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const liveKeys = {
  all: ['lives'] as const,
  active: (params?: any) => ['lives', 'active', params] as const,
  detail: (id: string) => ['lives', id] as const,
  chats: (id: string) => ['lives', id, 'chats'] as const,
  stats: ['lives', 'stats'] as const,
};

export function useActiveLives(params?: { status?: string; businessId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: liveKeys.active(params),
    queryFn: async () => {
      const res = await apiClient.get('/lives', { params });
      return res.data.data as { items: any[]; total: number; page: number; limit: number; totalPages: number };
    },
    refetchInterval: 10000,
  });
}

export function useLive(id: string) {
  return useQuery({
    queryKey: liveKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get('/lives/' + id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateLive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/lives', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKeys.all }),
  });
}

export function useStartLive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, streamUrl }: { id: string; streamUrl?: string }) => apiClient.post('/lives/' + id + '/start', { streamUrl }),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKeys.all }),
  });
}

export function useEndLive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post('/lives/' + id + '/end'),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKeys.all }),
  });
}

export function useDeleteLive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete('/lives/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKeys.all }),
  });
}

export function useAddLiveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ liveId, data }: { liveId: string; data: any }) => apiClient.post('/lives/' + liveId + '/products', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: liveKeys.all }),
  });
}

export function useLiveChats(liveId: string) {
  return useQuery({
    queryKey: liveKeys.chats(liveId),
    queryFn: async () => {
      const res = await apiClient.get('/lives/' + liveId + '/chats');
      return (res.data.data || []) as any[];
    },
    enabled: !!liveId,
    refetchInterval: 5000,
  });
}

export function useLiveStats() {
  return useQuery({
    queryKey: liveKeys.stats,
    queryFn: async () => {
      const res = await apiClient.get('/lives/stats');
      return res.data.data as { totalLives: number; activeLives: number; totalViewers: number; totalChats: number };
    },
  });
}
