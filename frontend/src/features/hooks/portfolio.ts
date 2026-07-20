import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreatePortfolioItemData, UpdatePortfolioItemData } from '@/types';

export const portfolioKeys = {
  all: ['my-portfolio'] as const,
  detail: (id: string) => ['my-portfolio', id] as const,
  categories: ['my-portfolio', 'categories'] as const,
  testimonials: ['my-portfolio', 'testimonials'] as const,
  stats: ['my-portfolio', 'stats'] as const,
};

export function useMyPortfolioItems(params?: QueryParams) {
  return useQuery({
    queryKey: [...portfolioKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyPortfolioItems(params);
      return res.data.data;
    },
  });
}

export function useMyPortfolioItem(id: string) {
  return useQuery({
    queryKey: portfolioKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyPortfolioItem(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePortfolioItemData) => apiClient.createPortfolioItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}

export function useUpdatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortfolioItemData }) =>
      apiClient.updatePortfolioItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePortfolioItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}

export function usePortfolioCategories() {
  return useQuery({
    queryKey: portfolioKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getPortfolioCategories();
      return res.data.data;
    },
  });
}

export function usePortfolioStats() {
  return useQuery({
    queryKey: portfolioKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getPortfolioStats();
      return res.data.data;
    },
  });
}
