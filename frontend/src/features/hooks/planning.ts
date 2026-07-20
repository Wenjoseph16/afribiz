import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreatePlanningTaskData, UpdatePlanningTaskData } from '@/types';

export const planningKeys = {
  all: ['planning'] as const,
  tasks: ['planning', 'tasks'] as const,
  taskDetail: (id: string) => ['planning', 'tasks', id] as const,
  schedules: ['planning', 'schedules'] as const,
  calendar: ['planning', 'calendar'] as const,
  stats: ['planning', 'stats'] as const,
};

export function usePlanningTasks(params?: QueryParams) {
  return useQuery({
    queryKey: [...planningKeys.tasks, params],
    queryFn: async () => {
      const res = await apiClient.getPlanningTasks(params);
      return res.data.data;
    },
  });
}

export function useCreatePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanningTaskData) => apiClient.createPlanningTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planningKeys.tasks }),
  });
}

export function usePlanningSchedules(params?: QueryParams) {
  return useQuery({
    queryKey: [...planningKeys.schedules, params],
    queryFn: async () => {
      const res = await apiClient.getPlanningSchedules(params);
      return res.data.data;
    },
  });
}

export function usePlanningCalendar(params?: QueryParams) {
  return useQuery({
    queryKey: [...planningKeys.calendar, params],
    queryFn: async () => {
      const res = await apiClient.getPlanningCalendar(params);
      return res.data.data;
    },
  });
}

export function usePlanningTask(id: string) {
  return useQuery({
    queryKey: planningKeys.taskDetail(id),
    queryFn: async () => {
      const res = await apiClient.getPlanningTask(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdatePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanningTaskData }) =>
      apiClient.updatePlanningTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planningKeys.tasks }),
  });
}

export function useDeletePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePlanningTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: planningKeys.tasks }),
  });
}

export function usePlanningStats() {
  return useQuery({
    queryKey: planningKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getPlanningStats();
      return res.data.data;
    },
  });
}
