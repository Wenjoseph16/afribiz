import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const paymentKeys = {
  all: ['payments'] as const,
  detail: (id: string) => ['payments', id] as const,
};

export function useWallet() {
  return useQuery({
    queryKey: [...paymentKeys.all, 'wallet'],
    queryFn: async () => {
      const res = await apiClient.getWallet();
      return res.data.data;
    },
  });
}

export function usePayments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...paymentKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getPayments(params);
      return res.data.data;
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getPayment(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.initiatePayment>[0]) =>
      apiClient.initiatePayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
