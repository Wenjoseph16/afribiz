import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams } from '@/types';

export const bizTrainingKeys = {
  all: ['biz-trainings'] as const,
  detail: (id: string) => ['biz-trainings', id] as const,
  lessons: (id: string) => ['biz-trainings', id, 'lessons'] as const,
  students: (id: string) => ['biz-trainings', id, 'students'] as const,
  stats: ['biz-trainings', 'stats'] as const,
};

export function useBizTrainings(params?: QueryParams) {
  return useQuery({
    queryKey: [...bizTrainingKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getBizTrainings(params);
      return res.data.data;
    },
  });
}

export function useBizTraining(id: string) {
  return useQuery({
    queryKey: bizTrainingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getBizTraining(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBizTraining(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizTrainingKeys.all }),
  });
}

export function useUpdateBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateBizTraining(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: bizTrainingKeys.all });
      qc.invalidateQueries({ queryKey: bizTrainingKeys.detail(id) });
    },
  });
}

export function useDeleteBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBizTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizTrainingKeys.all }),
  });
}

export function useBizTrainingStudents(trainingId: string, params?: QueryParams) {
  return useQuery({
    queryKey: [...bizTrainingKeys.students(trainingId), params],
    queryFn: async () => {
      const res = await apiClient.getBizTrainingStudents(trainingId, params);
      return res.data.data;
    },
    enabled: !!trainingId,
  });
}

export function useBizTrainingStats() {
  return useQuery({
    queryKey: bizTrainingKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getBizTrainingStats();
      return res.data.data;
    },
  });
}

export function useBizTrainingLessons(trainingId: string) {
  return useQuery({
    queryKey: bizTrainingKeys.lessons(trainingId),
    queryFn: async () => {
      const res = await apiClient.getBizTrainingLessons(trainingId);
      return res.data.data;
    },
    enabled: !!trainingId,
  });
}

export function useCreateBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBizTrainingLesson(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useUpdateBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateBizTrainingLesson(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useDeleteBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBizTrainingLesson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useCreateBizQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createBizTrainingQuiz(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useDeleteBizQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => apiClient.deleteBizTrainingQuiz(quizId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useEnrollInTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.enrollInTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-trainings'] }),
  });
}
