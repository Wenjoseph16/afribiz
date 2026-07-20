'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export function useStages() {
  return useQuery({
    queryKey: ['pipeline', 'stages'],
    queryFn: async () => {
      const res = await apiClient.getPipelineStages();
      return res.data.data;
    },
  });
}

export function useCreateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPipelineStage(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline', 'stages'] }),
  });
}

export function useUpdateStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.updatePipelineStage(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline', 'stages'] }),
  });
}

export function useDeleteStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePipelineStage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline', 'stages'] }),
  });
}

export function useDeals(params?: any) {
  return useQuery({
    queryKey: ['pipeline', 'deals', params],
    queryFn: async () => {
      const res = await apiClient.getPipelineDeals(params);
      return res.data.data;
    },
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['pipeline', 'deal', id],
    queryFn: async () => {
      const res = await apiClient.getPipelineDeal(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPipelineDeal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePipelineDeal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

export function useMoveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { stageId: string } }) =>
      apiClient.movePipelineDeal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePipelineDeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['pipeline', 'stats'],
    queryFn: async () => {
      const res = await apiClient.getPipelineStats();
      return res.data.data;
    },
  });
}

export function useSeedStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.seedPipelineStages(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}
