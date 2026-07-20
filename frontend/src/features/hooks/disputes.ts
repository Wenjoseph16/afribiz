import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const disputeKeys = {
  all: ['disputes'] as const,
  detail: (id: string) => ['disputes', id] as const,
};

export function useDisputes() {
  return useQuery({
    queryKey: disputeKeys.all,
    queryFn: async () => {
      const res = await apiClient.getDisputes();
      return res.data.data;
    },
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: disputeKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getDisputeDetail(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createDispute(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: disputeKeys.all }),
  });
}

export function useUpdateDisputeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateDisputeStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: disputeKeys.all }),
  });
}
