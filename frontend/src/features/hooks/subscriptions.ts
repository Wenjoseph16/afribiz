import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams } from '@/types';

export const subscriptionKeys = {
  plans: ['subscriptions', 'plans'] as const,
  planDetail: (id: string) => ['subscriptions', 'plans', id] as const,
  subscribers: ['subscriptions', 'subscribers'] as const,
  payments: ['subscriptions', 'payments'] as const,
  stats: ['subscriptions', 'stats'] as const,
  logs: ['subscriptions', 'logs'] as const,
};

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans,
    queryFn: async () => {
      const res = await apiClient.getSubscriptionPlans();
      return res.data.data;
    },
  });
}

export function useSubscribers(params?: QueryParams) {
  return useQuery({
    queryKey: [...subscriptionKeys.subscribers, params],
    queryFn: async () => {
      const res = await apiClient.getSubscribers(params);
      return res.data.data;
    },
  });
}

export function useSubscriptionPlan(id: string) {
  return useQuery({
    queryKey: subscriptionKeys.planDetail(id),
    queryFn: async () => {
      const res = await apiClient.getSubscriptionPlan(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createSubscriptionPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.plans }),
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateSubscriptionPlan(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.plans }),
  });
}

export function useDeleteSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteSubscriptionPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.plans }),
  });
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: subscriptionKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getSubscriptionStats();
      return res.data.data;
    },
  });
}

// ============================================================
// CÔTÉ CLIENT (self-service)
// ============================================================

export const mySubscriptionKeys = {
  current: ['my-subscription'] as const,
};

export function useMySubscription() {
  return useQuery({
    queryKey: mySubscriptionKeys.current,
    queryFn: async () => {
      const res = await apiClient.getMySubscription();
      return res.data.data;
    },
    retry: false,
  });
}

export function useSubscribeToPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      opts,
    }: {
      planId: string;
      opts?: { provider?: string; phone?: string; autoRenew?: boolean };
    }) => apiClient.subscribeToPlan(planId, opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mySubscriptionKeys.current });
    },
  });
}

export function useConfirmSubscriptionPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerRef: string) => apiClient.confirmSubscriptionPayment(providerRef),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mySubscriptionKeys.current });
    },
  });
}

export function useCancelMySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.cancelMySubscription(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: mySubscriptionKeys.current });
    },
  });
}
