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
      const res = await apiClient.get('/offers', { params });
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
      const res = await apiClient.get('/offers/' + id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/offers', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.put('/offers/' + id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete('/offers/' + id),
    onSuccess: () => qc.invalidateQueries({ queryKey: offerKeys.all }),
  });
}

export function useClaimOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post('/offers/' + id + '/claim'),
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
      const res = await apiClient.get('/businesses/nearby', { params });
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

