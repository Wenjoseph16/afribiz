import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const offerKeys = {
  all: ['offers'] as const,
  active: (params?: any) => ['offers', 'active', params] as const,
  detail: (id: string) => ['offers', id] as const,
  nearby: (params: any) => ['businesses', 'nearby', params] as const,
};

export function useActiveOffers(params?: {
  page?: number;
  limit?: number;
  businessId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: offerKeys.active(params),
    queryFn: async () => {
      const res = await apiClient.getActiveOffers(params);
      return res.data.data as {
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    refetchInterval: 30000,
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: offerKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getOffer(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createOffer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateOffer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useClaimOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.claimOffer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useNearbyBusinesses(params: {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  type?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: offerKeys.nearby(params),
    queryFn: async () => {
      const res = await apiClient.getNearbyBusinesses(params);
      return res.data.data as {
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    },
    enabled: !!params.latitude && !!params.longitude,
  });
}
