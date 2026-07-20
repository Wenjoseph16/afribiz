import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateDeliveryData, UpdateDeliveryData } from '@/types';

export const deliveryKeys = {
  all: ['deliveries'] as const,
  detail: (id: string) => ['deliveries', id] as const,
  zones: ['deliveries', 'zones'] as const,
  drivers: ['deliveries', 'drivers'] as const,
  stats: ['deliveries', 'stats'] as const,
};

export function useDeliveries(params?: QueryParams) {
  return useQuery({
    queryKey: [...deliveryKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getDeliveries(params);
      return res.data.data;
    },
  });
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getDelivery(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDeliveryData) => apiClient.createDelivery(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeliveryData }) =>
      apiClient.updateDelivery(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateDeliveryStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useDeliveryStats() {
  return useQuery({
    queryKey: deliveryKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getDeliveryStats();
      return res.data.data;
    },
  });
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: deliveryKeys.zones,
    queryFn: async () => {
      const res = await apiClient.getDeliveryZones();
      return res.data.data;
    },
  });
}

export function useCreateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createDeliveryZone(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.zones }),
  });
}

export function useUpdateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateDeliveryZone(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.zones }),
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDeliveryZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.zones }),
  });
}

export function useDrivers(params?: QueryParams) {
  return useQuery({
    queryKey: [...deliveryKeys.drivers, params],
    queryFn: async () => {
      const res = await apiClient.getDrivers(params);
      return res.data.data;
    },
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createDriver(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.drivers }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateDriver(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.drivers }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDriver(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.drivers }),
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.assignDriver(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useAddTrackingEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.addTrackingEvent(id, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: deliveryKeys.detail(vars.id) }),
  });
}

export function useAddDeliveryProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.addDeliveryProof(id, data),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: deliveryKeys.detail(vars.id) }),
  });
}
