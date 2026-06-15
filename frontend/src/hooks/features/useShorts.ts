import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const shortKeys = {
  all: ['shorts'] as const,
  list: (params?: any) => ['shorts', 'list', params] as const,
  detail: (id: string) => ['shorts', id] as const,
  comments: (id: string, page?: number) => ['shorts', id, 'comments', page] as const,
};

export function useShorts(params?: { businessId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: shortKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get('/shorts', { params });
      return res.data.data as {
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
  });
}

export function useShort(id: string) {
  return useQuery({
    queryKey: shortKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get('/shorts/' + id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateShort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/shorts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shortKeys.all }),
  });
}

export function useUpdateShort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put('/shorts/' + id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: shortKeys.all }),
  });
}

export function useDeleteShort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete('/shorts/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: shortKeys.all }),
  });
}

export function useLikeShort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post('/shorts/' + id + '/like'),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: shortKeys.detail(id) });
      qc.invalidateQueries({ queryKey: shortKeys.list() });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => apiClient.post('/shorts/' + id + '/comments', { content }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: shortKeys.comments(id) });
    },
  });
}

export function useShortComments(id: string) {
  return useQuery({
    queryKey: shortKeys.comments(id),
    queryFn: async () => {
      const res = await apiClient.get('/shorts/' + id + '/comments');
      return res.data.data as { items: any[]; total: number };
    },
    enabled: !!id,
  });
}

export function useViewShort() {
  return useMutation({
    mutationFn: (id: string) => apiClient.post('/shorts/' + id + '/view'),
  });
}

export function useShareShort() {
  return useMutation({
    mutationFn: (id: string) => apiClient.post('/shorts/' + id + '/share'),
  });
}

export function useSaveShort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post('/shorts/' + id + '/save'),
    onSuccess: () => qc.invalidateQueries({ queryKey: shortKeys.all }),
  });
}
