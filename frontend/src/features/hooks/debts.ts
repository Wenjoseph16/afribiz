import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams } from '@/types';

export const debtKeys = {
  all: ['debts'] as const,
  detail: (id: string) => ['debts', id] as const,
  escrows: ['debts', 'escrows'] as const,
  clientRisks: ['debts', 'client-risks'] as const,
  logs: ['debts', 'logs'] as const,
  stats: ['debts', 'stats'] as const,
};

export function useDebts(params?: QueryParams) {
  return useQuery({
    queryKey: [...debtKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getDebts(params);
      return res.data.data;
    },
  });
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: debtKeys.detail(id),
    queryFn: async () => {
      try {
        const res = await apiClient.getDebt(id);
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createDebt(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateDebt(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDebt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useUpdateDebtPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      apiClient.updateDebtPriority(id, priority),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useRegisterDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.registerDebtPayment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useSendDebtReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (debtId: string) => apiClient.sendDebtReminder(debtId),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useCreateEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createEscrow(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useEscrows(params?: QueryParams) {
  return useQuery({
    queryKey: [...debtKeys.escrows, params],
    queryFn: async () => {
      const res = await apiClient.getEscrows(params);
      return res.data.data;
    },
  });
}

export function useEscrowById(id: string) {
  return useQuery({
    queryKey: ['escrow', id],
    queryFn: async () => {
      const res = await apiClient.getEscrowById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useEscrowStats() {
  return useQuery({
    queryKey: ['escrow-stats'],
    queryFn: async () => {
      const res = await apiClient.getEscrowStats();
      return res.data.data;
    },
  });
}

export function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.releaseEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.refundEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useBusinessDisputeEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.disputeEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useClientEscrows() {
  return useQuery({
    queryKey: ['client-escrows'],
    queryFn: async () => {
      const res = await apiClient.getClientEscrows();
      return res.data.data;
    },
  });
}

export function useClientEscrowById(id: string) {
  return useQuery({
    queryKey: ['client-escrow', id],
    queryFn: async () => {
      const res = await apiClient.getClientEscrowById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useConfirmClientEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.confirmClientEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-escrows'] }),
  });
}

export function useDisputeClientEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.disputeClientEscrow(id, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-escrows'] }),
  });
}

export function useClientDebts() {
  return useQuery({
    queryKey: ['client-debts'],
    queryFn: async () => {
      const res = await apiClient.getClientDebts();
      return res.data.data;
    },
  });
}

export function usePayClientDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      amount: number;
      paymentMethod?: string;
      notes?: string;
    }) => apiClient.payClientDebt(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-debts'] }),
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: debtKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getPaymentStats();
      return res.data.data;
    },
  });
}

export function useClientRisks(params?: QueryParams) {
  return useQuery({
    queryKey: [...debtKeys.clientRisks, params],
    queryFn: async () => {
      const res = await apiClient.getClientRisks(params);
      return res.data.data;
    },
  });
}

export function useUpdateClientRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, riskLevel }: { clientId: string; riskLevel: string }) =>
      apiClient.updateClientRiskLevel(clientId, riskLevel),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.clientRisks }),
  });
}

export function useDebtReminders(params?: QueryParams) {
  return useQuery({
    queryKey: [...['debts', 'reminders'], params],
    queryFn: async () => {
      const res = await apiClient.getReminders(params);
      return res.data.data;
    },
  });
}

export function useDebtLogs(params?: QueryParams) {
  return useQuery({
    queryKey: [...['debts', 'logs'], params],
    queryFn: async () => {
      const res = await apiClient.getLogs(params);
      return res.data.data;
    },
  });
}
