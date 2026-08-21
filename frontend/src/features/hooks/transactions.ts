import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useEffect, useCallback } from 'react';
import { getSocket } from '@/services/socket';
import type {
  TransactionSnapshot,
  TransactionFilters,
  TransactionListResponse,
} from '@/types/transactions';

export const transactionKeys = {
  all: ['transactions'] as const,
  detail: (type: string, id: string) => ['transactions', type, id] as const,
  list: (filters?: TransactionFilters) => ['transactions', 'list', filters] as const,
};

// Fetch all transactions (unified view)
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.types?.length) params.types = filters.types.join(',');
      if (filters?.statuses?.length) params.statuses = filters.statuses.join(',');
      if (filters?.search) params.search = filters.search;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      const res = await apiClient.get('/transactions', { params });
      return res.data.data as TransactionListResponse;
    },
  });
}

// Fetch single transaction detail
export function useTransactionDetail(type: string, id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(type, id),
    queryFn: async () => {
      const res = await apiClient.get(`/transactions/${type}/${id}`);
      return res.data.data as TransactionSnapshot;
    },
    enabled: !!type && !!id,
  });
}

// Hook to subscribe to real-time transaction updates via Socket.IO
export function useTransactionSocket(
  type: string,
  id: string,
  onUpdate: (event: {
    status: string;
    statusLabel: string;
    progress?: number;
    message?: string;
  }) => void
) {
  const qc = useQueryClient();

  const handleUpdate = useCallback(
    (event: { status: string; statusLabel: string; progress?: number; message?: string }) => {
      onUpdate(event);
      qc.invalidateQueries({ queryKey: transactionKeys.detail(type, id) });
      qc.invalidateQueries({ queryKey: transactionKeys.all });
    },
    [type, id, onUpdate, qc]
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !type || !id) return;

    const room = { type, id };
    socket.emit('transaction:join', room);

    socket.on('transaction:update', handleUpdate);

    return () => {
      socket.emit('transaction:leave', room);
      socket.off('transaction:update', handleUpdate);
    };
  }, [type, id, handleUpdate]);
}
