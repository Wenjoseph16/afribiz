import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateExpenseData, UpdateExpenseData } from '@/types';

export const accountingKeys = {
  all: ['accounting'] as const,
  list: (params?: any) => ['accounting', 'list', params] as const,
  detail: (id: string) => ['accounting', id] as const,
  stats: ['accounting', 'stats'] as const,
  report: (year: number, month: number) => ['accounting', 'report', year, month] as const,
  balanceSheet: (year?: number) => ['accounting', 'balance-sheet', year] as const,
  incomeStatement: (year?: number) => ['accounting', 'income-statement', year] as const,
};

export function useExpenses(params?: QueryParams) {
  return useQuery({
    queryKey: accountingKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.getExpenses(params);
      return res.data.data;
    },
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: accountingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getExpense(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseData) => apiClient.createExpense(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountingKeys.all }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      apiClient.updateExpense(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountingKeys.all }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: accountingKeys.all }),
  });
}

export function useAccountingStats() {
  return useQuery({
    queryKey: accountingKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getAccountingStats();
      return res.data.data;
    },
  });
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: accountingKeys.report(year, month),
    queryFn: async () => {
      const res = await apiClient.getMonthlyReport(year!, month!);
      return res.data.data;
    },
    enabled: !!year && !!month,
  });
}

export function useBalanceSheet(year?: number) {
  return useQuery({
    queryKey: accountingKeys.balanceSheet(year),
    queryFn: async () => {
      const res = await apiClient.getBalanceSheet(year!);
      return res.data.data;
    },
  });
}

export function useIncomeStatement(year?: number) {
  return useQuery({
    queryKey: accountingKeys.incomeStatement(year),
    queryFn: async () => {
      const res = await apiClient.getIncomeStatement(year!);
      return res.data.data;
    },
  });
}
