import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams } from '@/types';

export const rentalKeys = {
  all: ['my-rentals'] as const,
  detail: (id: string) => ['my-rentals', id] as const,
  stats: ['my-rentals', 'stats'] as const,
};

export function useMyRentals(params?: QueryParams) {
  return useQuery({
    queryKey: [...rentalKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyRentals(params);
      return res.data.data ?? [];
    },
  });
}

export function useMyRental(id: string) {
  return useQuery({
    queryKey: rentalKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyRental(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createRental(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useUpdateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateRental(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useDeleteRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRental(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useToggleRentalActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleRentalActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useRentalStats() {
  return useQuery({
    queryKey: rentalKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getRentalStats();
      return res.data.data;
    },
  });
}

export function useCreateRentalBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rentalId: string; startDate: string; endDate: string; notes?: string }) =>
      apiClient.createRentalBooking(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useProlongRentalBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; newEndDate: string; additionalNotes?: string }) =>
      apiClient.prolongRentalBooking(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}
