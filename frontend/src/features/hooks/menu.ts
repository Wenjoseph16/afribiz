import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type {
  QueryParams,
  CreateMenuItemData,
  UpdateMenuItemData,
  CreateMenuCategoryData,
  UpdateMenuCategoryData,
} from '@/types';

export const menuKeys = {
  all: ['my-menu-items'] as const,
  detail: (id: string) => ['my-menu-items', id] as const,
  categories: ['my-menu', 'categories'] as const,
  orders: ['my-menu', 'orders'] as const,
  orderDetail: (id: string) => ['my-menu', 'orders', id] as const,
  orderStats: ['my-menu', 'orders', 'stats'] as const,
  tables: ['my-menu', 'tables'] as const,
  ingredients: ['my-menu', 'ingredients'] as const,
  ingredientStats: ['my-menu', 'ingredients', 'stats'] as const,
  stats: ['my-menu', 'stats'] as const,
};

export function useMyMenuItems(params?: QueryParams) {
  return useQuery({
    queryKey: [...menuKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyMenuItems(params);
      return res.data.data;
    },
  });
}

export function useMyMenuItem(id: string) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyMenuItem(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuItemData) => apiClient.createMenuItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuItemData }) =>
      apiClient.updateMenuItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMenuItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
  });
}

export function useMenuCategories() {
  return useQuery({
    queryKey: menuKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getMenuCategories();
      return res.data.data;
    },
  });
}

export function useCreateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuCategoryData) => apiClient.createMenuCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.categories }),
  });
}

export function useUpdateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuCategoryData }) =>
      apiClient.updateMenuCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.categories }),
  });
}

export function useDeleteMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMenuCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.categories }),
  });
}

export function useToggleMenuItemActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleMenuItemActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
  });
}

export function useMenuOrders(params?: QueryParams) {
  return useQuery({
    queryKey: [...menuKeys.orders, params],
    queryFn: async () => {
      const res = await apiClient.getMenuOrders(params);
      return res.data.data;
    },
  });
}

export function useMenuOrder(id: string) {
  return useQuery({
    queryKey: menuKeys.orderDetail(id),
    queryFn: async () => {
      const res = await apiClient.getMenuOrder(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMenuOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createMenuOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.orders }),
  });
}

export function useUpdateMenuOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateMenuOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.orders }),
  });
}

export function useMenuOrderStats() {
  return useQuery({
    queryKey: menuKeys.orderStats,
    queryFn: async () => {
      const res = await apiClient.getMenuOrderStats();
      return res.data.data;
    },
  });
}

export function useMenuTables() {
  return useQuery({
    queryKey: menuKeys.tables,
    queryFn: async () => {
      const res = await apiClient.getMenuTables();
      return res.data.data;
    },
  });
}

export function useCreateMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createMenuTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.tables }),
  });
}

export function useUpdateMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateMenuTable(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.tables }),
  });
}

export function useUpdateMenuTableStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.updateMenuTableStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.tables }),
  });
}

export function useDeleteMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMenuTable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.tables }),
  });
}

export function useMenuIngredients(params?: QueryParams) {
  return useQuery({
    queryKey: [...menuKeys.ingredients, params],
    queryFn: async () => {
      const res = await apiClient.getMenuIngredients(params);
      return res.data.data;
    },
  });
}

export function useCreateMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.createMenuIngredient(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.ingredients }),
  });
}

export function useUpdateMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.updateMenuIngredient(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.ingredients }),
  });
}

export function useDeleteMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMenuIngredient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.ingredients }),
  });
}

export function useAdjustIngredientStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiClient.adjustIngredientStock(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.ingredients }),
  });
}

export function useMenuStats() {
  return useQuery({
    queryKey: menuKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getMenuStats();
      return res.data.data;
    },
  });
}
