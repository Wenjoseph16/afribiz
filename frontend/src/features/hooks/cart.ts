import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const cartKeys = {
  all: ['cart'] as const,
};

export function useCart() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: async () => {
      const res = await apiClient.getCart();
      return res.data.data;
    },
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.addToCart>[0]) => apiClient.addToCart(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: { quantity: number; notes?: string };
    }) => apiClient.updateCartItem(itemId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => apiClient.removeFromCart(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.clearCart(),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiClient.applyCoupon(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.removeCoupon(),
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof apiClient.checkout>[0]) => apiClient.checkout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartKeys.all });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
