import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateRoomData, UpdateRoomData } from '@/types';

export const roomKeys = {
  all: ['my-rooms'] as const,
  detail: (id: string) => ['my-rooms', id] as const,
  stats: ['my-rooms', 'stats'] as const,
};

export function useMyRooms(params?: QueryParams) {
  return useQuery({
    queryKey: [...roomKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyRooms(params);
      return res.data.data ?? [];
    },
  });
}

export function useMyRoom(id: string) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyRoom(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomData) => apiClient.createRoom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoomData }) =>
      apiClient.updateRoom(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useToggleRoomActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleRoomActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useRoomStats() {
  return useQuery({
    queryKey: roomKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getRoomStats();
      return res.data.data;
    },
  });
}

export function useDuplicateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.duplicateRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useBulkDeleteRooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.bulkDeleteRooms(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useBulkToggleRooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) =>
      apiClient.bulkToggleRooms(ids, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}
