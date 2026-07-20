import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams } from '@/types';

export const advancedTaskKeys = {
  all: ['advanced-tasks'] as const,
  list: (params?: any) => ['advanced-tasks', 'list', params] as const,
  detail: (id: string) => ['advanced-tasks', id] as const,
  kanban: (params?: any) => ['advanced-tasks', 'kanban', params] as const,
  categories: ['advanced-tasks', 'categories'] as const,
  stats: ['advanced-tasks', 'stats'] as const,
  history: (id: string) => ['advanced-tasks', id, 'history'] as const,
  comments: (id: string) => ['advanced-tasks', id, 'comments'] as const,
  timers: (id: string) => ['advanced-tasks', id, 'timers'] as const,
};

export function useAdvancedTasks(params?: QueryParams) {
  return useQuery({
    queryKey: advancedTaskKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.getAdvancedTasks(params);
      return res.data.data;
    },
  });
}

export function useAdvancedTask(id: string) {
  return useQuery({
    queryKey: advancedTaskKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getAdvancedTask(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createAdvancedTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancedTaskKeys.all });
      qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() });
    },
  });
}

export function useUpdateAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateAdvancedTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancedTaskKeys.all });
      qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() });
    },
  });
}

export function useDeleteAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAdvancedTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancedTaskKeys.all });
      qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() });
    },
  });
}

export function useKanbanBoard(params?: QueryParams) {
  return useQuery({
    queryKey: advancedTaskKeys.kanban(params),
    queryFn: async () => {
      try {
        const res = await apiClient.getKanbanBoard(params);
        return res.data.data || { columns: {}, totalTasks: 0 };
      } catch {
        return { columns: {}, totalTasks: 0 };
      }
    },
  });
}

export function useReorderTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      sortOrder,
    }: {
      taskId: string;
      status: string;
      sortOrder: number;
    }) => apiClient.reorderTask(taskId, status, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() }),
  });
}

export function useTaskCategories() {
  return useQuery({
    queryKey: advancedTaskKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getTaskCategories();
      return res.data.data;
    },
  });
}

export function useCreateTaskCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createTaskCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.categories }),
  });
}

export function useAddTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      apiClient.addTaskChecklistItem(taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.all }),
  });
}

export function useToggleTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      apiClient.toggleTaskChecklistItem(taskId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.all }),
  });
}

export function useDeleteTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) =>
      apiClient.deleteTaskChecklistItem(taskId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.all }),
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      apiClient.addTaskComment(taskId, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useDeleteTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      apiClient.deleteTaskComment(taskId, commentId),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useStartTaskTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.startTaskTimer(taskId),
    onSuccess: (_data, taskId) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(taskId) }),
  });
}

export function useStopTaskTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.stopTaskTimer(taskId),
    onSuccess: (_data, taskId) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(taskId) }),
  });
}

export function useAddTaskResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      apiClient.addTaskResource(taskId, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useDeleteTaskResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, resourceId }: { taskId: string; resourceId: string }) =>
      apiClient.deleteTaskResource(taskId, resourceId),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useRequestTaskValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Record<string, unknown> }) =>
      apiClient.requestTaskValidation(taskId, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useApproveTaskValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      validationId,
      data,
    }: {
      taskId: string;
      validationId: string;
      data: Record<string, unknown>;
    }) => apiClient.approveTaskValidation(taskId, validationId, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: advancedTaskKeys.stats,
    queryFn: async () => {
      try {
        const res = await apiClient.getTaskStats();
        return res.data.data;
      } catch {
        return {
          totalTasks: 0,
          todoTasks: 0,
          inProgressTasks: 0,
          doneTasks: 0,
          overdueTasks: 0,
          completionRate: 0,
          checklistProgress: 0,
          totalTimeHours: 0,
          overduePercentage: 0,
        };
      }
    },
  });
}

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: advancedTaskKeys.history(taskId),
    queryFn: async () => {
      const res = await apiClient.getTaskHistory(taskId);
      return res.data.data;
    },
    enabled: !!taskId,
  });
}
