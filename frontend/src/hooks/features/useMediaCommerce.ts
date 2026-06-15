import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

export const mediaCommerceKeys = {
  commerceData: (type: string, id: string) => ['mediaCommerce', type, id] as const,
};

export function useMediaCommerceData(type: 'STORY' | 'SHORT', id: string | undefined) {
  return useQuery({
    queryKey: mediaCommerceKeys.commerceData(type, id || ''),
    queryFn: async () => {
      const res = await apiClient.get('/media/' + type + '/' + id + '/commerce');
      return res.data.data as {
        media: any;
        commerce: { type: string; data: any; action: string; label: string } | null;
      };
    },
    enabled: !!id,
    staleTime: 10000,
  });
}

export function useMediaAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; quantity?: number }) =>
      apiClient.post('/media/add-to-cart', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useMediaCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: string; businessId: string }) =>
      apiClient.post('/media/order', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useMediaBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { serviceId: string; businessId: string; scheduledAt?: string }) =>
      apiClient.post('/media/book', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useMediaInstallModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { moduleId: string; businessId: string }) =>
      apiClient.post('/media/install-module', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['developer', 'modules'] }),
  });
}

export interface CommerceActionStyle {
  icon: string;
  color: string;
  label: string;
  action: 'add_to_cart' | 'order' | 'book' | 'purchase' | 'rent' | 'visit' | 'view' | 'link' | 'install';
}

export const COMMERCE_ACTIONS: Record<string, CommerceActionStyle> = {
  add_to_cart: { icon: '🛒', color: 'from-brand-500 to-brand-600', label: 'Ajouter au panier', action: 'add_to_cart' },
  order: { icon: '📦', color: 'from-emerald-500 to-emerald-600', label: 'Commander', action: 'order' },
  book: { icon: '📅', color: 'from-blue-500 to-blue-600', label: 'Réserver', action: 'book' },
  purchase: { icon: '🎟️', color: 'from-purple-500 to-purple-600', label: 'Acheter un billet', action: 'purchase' },
  rent: { icon: '🏠', color: 'from-amber-500 to-amber-600', label: 'Louer', action: 'rent' },
  visit: { icon: '🏪', color: 'from-rose-500 to-rose-600', label: 'Voir le commerce', action: 'visit' },
  view: { icon: '🔥', color: 'from-orange-500 to-orange-600', label: "Voir l'offre", action: 'view' },
  link: { icon: '🔗', color: 'from-gray-500 to-gray-600', label: 'En savoir plus', action: 'link' },
  install: { icon: '📥', color: 'from-violet-500 to-violet-600', label: 'Installer le module', action: 'install' },
};

