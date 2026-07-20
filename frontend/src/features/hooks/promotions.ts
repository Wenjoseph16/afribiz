import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreatePromotionData, UpdatePromotionData } from '@/types';

export const promoKeys = {
  all: ['my-promotions'] as const,
  detail: (id: string) => ['my-promotions', id] as const,
  coupons: ['my-promotions', 'coupons'] as const,
  bundles: ['my-promotions', 'bundles'] as const,
  campaigns: ['my-promotions', 'campaigns'] as const,
  loyalty: ['my-promotions', 'loyalty'] as const,
  stats: ['my-promotions', 'stats'] as const,
};

export function useMyPromotions(params?: QueryParams) {
  return useQuery({
    queryKey: [...promoKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyPromotions(params);
      return res.data.data;
    },
  });
}

export function useMyPromotion(id: string) {
  return useQuery({
    queryKey: [...promoKeys.all, id],
    queryFn: async () => {
      const res = await apiClient.getMyPromotion(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePromotionData) => apiClient.createPromotion(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionData }) =>
      apiClient.updatePromotion(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePromotion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}

export function usePromoCoupons(params?: QueryParams) {
  return useQuery({
    queryKey: [...promoKeys.coupons, params],
    queryFn: async () => {
      const res = await apiClient.getPromoCoupons(params);
      return res.data.data;
    },
  });
}

export function usePromoBundles(params?: QueryParams) {
  return useQuery({
    queryKey: [...promoKeys.bundles, params],
    queryFn: async () => {
      const res = await apiClient.getPromoBundles(params);
      return res.data.data;
    },
  });
}

export function usePromoCampaigns(params?: QueryParams) {
  return useQuery({
    queryKey: [...promoKeys.campaigns, params],
    queryFn: async () => {
      const res = await apiClient.getPromoCampaigns(params);
      return res.data.data;
    },
  });
}

export function useLoyaltyProgram() {
  return useQuery({
    queryKey: promoKeys.loyalty,
    queryFn: async () => {
      const res = await apiClient.getLoyaltyProgram();
      return res.data.data;
    },
  });
}

export function usePromoStats() {
  return useQuery({
    queryKey: promoKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getPromoStats();
      return res.data.data;
    },
  });
}
