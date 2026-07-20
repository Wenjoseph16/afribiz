'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export function useAutomationRules() {
  return useQuery({
    queryKey: ['crm', 'automation'],
    queryFn: async () => {
      const res = await apiClient.getAutomationRules();
      return res.data.data;
    },
  });
}

export function useAutomationRule(id: string) {
  return useQuery({
    queryKey: ['crm', 'automation', id],
    queryFn: async () => {
      const res = await apiClient.getAutomationRule(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createAutomationRule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'automation'] }),
  });
}

export function useUpdateAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updateAutomationRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'automation'] }),
  });
}

export function useToggleAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleAutomationRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'automation'] }),
  });
}

export function useDeleteAutomationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAutomationRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'automation'] }),
  });
}
