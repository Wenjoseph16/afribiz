import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const reviewKeys = {
  all: ['reviews'] as const,
};

export function useReviews(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...reviewKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getReviews(params);
      const d = res.data as unknown as { reviews?: unknown[]; data?: unknown[] };
      return (d.reviews || d.data || []) as any;
    },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => apiClient.createReview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { rating?: number; comment?: string } }) =>
      apiClient.patch(`/reviews/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/reviews/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useProductReviews(productId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['reviews', 'product', productId, params],
    queryFn: async () => {
      const res = await apiClient.get(`/reviews/product/${productId}`, { params });
      const d = res.data as unknown as { reviews?: unknown[]; data?: unknown[] };
      return (d.reviews || d.data || []) as any;
    },
    enabled: !!productId,
  });
}

export function useServiceReviews(serviceId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['reviews', 'service', serviceId, params],
    queryFn: async () => {
      const res = await apiClient.get(`/reviews/service/${serviceId}`, { params });
      const d = res.data as unknown as { reviews?: unknown[]; data?: unknown[] };
      return (d.reviews || d.data || []) as any;
    },
    enabled: !!serviceId,
  });
}
