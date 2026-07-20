import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const favoriteKeys = {
  all: ['favorites'] as const,
};

export function useFavorites(params?: { type?: string }) {
  return useQuery({
    queryKey: [...favoriteKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getFavorites(params);
      return res.data.data;
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.removeFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}
