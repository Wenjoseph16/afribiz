import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const financeKeys = {
  stats: ['finance', 'stats'] as const,
  quotes: {
    all: ['finance', 'quotes'] as const,
    detail: (id: string) => ['finance', 'quotes', id] as const,
  },
  invoices: {
    all: ['finance', 'invoices'] as const,
    detail: (id: string) => ['finance', 'invoices', id] as const,
  },
};

export function useQuotes(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...financeKeys.quotes.all, params],
    queryFn: async () => {
      const res = await apiClient.getQuotes(params);
      return res.data.data;
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: financeKeys.quotes.detail(id),
    queryFn: async () => {
      const res = await apiClient.getQuote(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createQuote(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateQuote(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateQuoteStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useConvertQuoteToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.convertQuoteToInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.quotes.all });
      qc.invalidateQueries({ queryKey: financeKeys.invoices.all });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteQuote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useInvoices(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...financeKeys.invoices.all, params],
    queryFn: async () => {
      const res = await apiClient.getInvoices(params);
      return res.data.data;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: financeKeys.invoices.detail(id),
    queryFn: async () => {
      const res = await apiClient.getInvoice(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createInvoice(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateInvoiceStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useUpdateInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateInvoicePayment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteInvoice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useFinanceStats() {
  return useQuery({
    queryKey: financeKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getFinanceStats();
      return res.data.data;
    },
  });
}

// Client-facing invoices & quotes hooks
export const clientFinanceKeys = {
  quotes: {
    all: ['client', 'finance', 'quotes'] as const,
    detail: (id: string) => ['client', 'finance', 'quotes', id] as const,
  },
  invoices: {
    all: ['client', 'finance', 'invoices'] as const,
    detail: (id: string) => ['client', 'finance', 'invoices', id] as const,
    stats: ['client', 'finance', 'invoices-stats'] as const,
  },
};

export function useClientQuotes(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...clientFinanceKeys.quotes.all, params],
    queryFn: async () => {
      const res = await apiClient.getClientQuotes(params);
      return res.data.data;
    },
  });
}

export function useClientQuote(id: string) {
  return useQuery({
    queryKey: clientFinanceKeys.quotes.detail(id),
    queryFn: async () => {
      const res = await apiClient.getClientQuote(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useClientInvoices(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...clientFinanceKeys.invoices.all, params],
    queryFn: async () => {
      const res = await apiClient.getClientInvoices(params);
      return res.data.data;
    },
  });
}

export function useClientInvoice(id: string) {
  return useQuery({
    queryKey: clientFinanceKeys.invoices.detail(id),
    queryFn: async () => {
      const res = await apiClient.getClientInvoice(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useClientInvoiceStats() {
  return useQuery({
    queryKey: clientFinanceKeys.invoices.stats,
    queryFn: async () => {
      const res = await apiClient.getClientInvoiceStats();
      return res.data.data;
    },
  });
}
