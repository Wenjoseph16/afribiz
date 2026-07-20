import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateEmployeeData, UpdateEmployeeData } from '@/types';

export const employeeKeys = {
  all: ['my-employees'] as const,
  detail: (id: string) => ['my-employees', id] as const,
  roles: ['my-employees', 'roles'] as const,
  attendances: ['my-employees', 'attendances'] as const,
  stats: ['my-employees', 'stats'] as const,
};

export function useMyEmployees(params?: QueryParams) {
  return useQuery({
    queryKey: [...employeeKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyEmployees(params);
      return res.data.data;
    },
  });
}

export function useMyEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyEmployee(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => apiClient.createEmployee(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeData }) =>
      apiClient.updateEmployee(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useEmployeeRoles() {
  return useQuery({
    queryKey: employeeKeys.roles,
    queryFn: async () => {
      const res = await apiClient.getEmployeeRoles();
      return res.data.data;
    },
  });
}

export function useEmployeeAttendances(params?: QueryParams) {
  return useQuery({
    queryKey: [...employeeKeys.attendances, params],
    queryFn: async () => {
      const res = await apiClient.getEmployeeAttendances(params);
      return res.data.data;
    },
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: employeeKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getEmployeeStats();
      return res.data.data;
    },
  });
}
