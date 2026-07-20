import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { QueryParams, CreateProductData, UpdateProductData } from '@/types';

export const productKeys = {
  all: ['my-products'] as const,
  detail: (id: string) => ['my-products', id] as const,
  categories: ['my-products', 'categories'] as const,
  stats: ['my-products', 'stats'] as const,
  alerts: ['my-products', 'alerts'] as const,
};

export function useMyProducts(params?: QueryParams) {
  return useQuery({
    queryKey: [...productKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyProducts(params);
      return res.data.data;
    },
  });
}

export function useMyProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyProduct(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductData) => apiClient.createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      apiClient.updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: productKeys.stats });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useToggleProductActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleProductActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDuplicateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.duplicateProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: productKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getProductCategories();
      return res.data.data;
    },
  });
}

export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; parentId?: string | null }) =>
      apiClient.createProductCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string; parentId?: string | null };
    }) => apiClient.updateProductCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteProductCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useProductStats() {
  return useQuery({
    queryKey: productKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getProductStats();
      return res.data.data;
    },
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: productKeys.alerts,
    queryFn: async () => {
      const res = await apiClient.getStockAlerts();
      return res.data.data;
    },
  });
}
