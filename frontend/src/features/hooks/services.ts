import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateServiceData, UpdateServiceData } from '@/types';

export const serviceKeys = {
  all: ['my-services'] as const,
  detail: (id: string) => ['my-services', id] as const,
  categories: ['my-services', 'categories'] as const,
  stats: ['my-services', 'stats'] as const,
};

export function useMyServices(params?: QueryParams) {
  return useQuery({
    queryKey: [...serviceKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyServices(params);
      return res.data.data;
    },
  });
}

export function useMyService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyService(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceData) => apiClient.createService(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceData }) =>
      apiClient.updateService(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useToggleServiceActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleServiceActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: serviceKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getServiceCategories();
      return res.data.data;
    },
  });
}

export function useServiceStats() {
  return useQuery({
    queryKey: serviceKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getServiceStats();
      return res.data.data;
    },
  });
}

export function useDuplicateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.duplicateService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useBulkDeleteServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.bulkDeleteServices(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useBulkToggleServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      apiClient.bulkToggleServices(ids, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useCreateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      icon?: string;
      parentId?: string | null;
    }) => apiClient.createServiceCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.categories }),
  });
}

export function useUpdateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; icon?: string; parentId?: string | null };
    }) => apiClient.updateServiceCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.categories }),
  });
}

export function useDeleteServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteServiceCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.categories }),
  });
}
