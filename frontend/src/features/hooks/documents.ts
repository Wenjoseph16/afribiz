import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateDocumentData, UpdateDocumentData } from '@/types';

export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
  stats: ['documents', 'stats'] as const,
};

export function useDocuments(params?: QueryParams) {
  return useQuery({
    queryKey: [...documentKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getDocuments(params);
      return res.data.data;
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getDocument(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentData) => apiClient.createDocument(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentData }) =>
      apiClient.updateDocument(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: documentKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getDocumentStats();
      return res.data.data;
    },
  });
}
