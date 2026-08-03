import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Order } from '@/types';
import type { QueryParams } from '@/types';

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
};

export function useOrders(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...orderKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getOrders(params);
      return res.data.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getOrder(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useOrderTimeline(id: string) {
  return useQuery({
    queryKey: [...orderKeys.detail(id), 'timeline'] as const,
    queryFn: async () => {
      const res = await apiClient.getOrderTimeline(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateOrder(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export const bizOrderKeys = {
  all: ['biz-orders'] as const,
  detail: (id: string) => ['biz-orders', id] as const,
  stats: ['biz-orders', 'stats'] as const,
  debts: ['biz-orders', 'debts'] as const,
};

export function useMyBusinessOrders(params?: QueryParams) {
  return useQuery({
    queryKey: [...bizOrderKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyBusinessOrders(params);
      return res.data.data as { orders: Order[]; total: number; page: number; totalPages: number };
    },
  });
}

export function useMyBusinessOrder(id: string) {
  return useQuery({
    queryKey: bizOrderKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyBusinessOrder(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBusinessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBusinessOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.all }),
  });
}

export function useUpdateBusinessOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      apiClient.updateBusinessOrderStatus(id, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizOrderKeys.all });
      qc.invalidateQueries({ queryKey: bizOrderKeys.stats });
    },
  });
}

export function useDeleteBusinessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBusinessOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.all }),
  });
}

export function useBusinessOrderStats() {
  return useQuery({
    queryKey: bizOrderKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getBusinessOrderStats();
      return res.data.data;
    },
  });
}

export function useBusinessDebts(params?: QueryParams) {
  return useQuery({
    queryKey: [...bizOrderKeys.debts, params],
    queryFn: async () => {
      const res = await apiClient.getBusinessDebts(params);
      return res.data.data;
    },
  });
}

export function usePayBusinessDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      apiClient.payBusinessDebt(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.debts }),
  });
}

export function useSettleBusinessDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.settleBusinessDebt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.debts }),
  });
}
