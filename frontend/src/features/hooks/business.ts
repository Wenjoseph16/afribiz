import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  Business,
  Product,
  Service,
  MenuCategory,
  MenuItem,
  Room,
  BusinessEvent,
  Rental,
  PortfolioItem,
  Promotion,
  Partner,
  BusinessReview,
} from '@/types';

export const myBusinessKeys = {
  all: ['my-business'] as const,
};

export function useMyBusiness(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: myBusinessKeys.all,
    queryFn: async () => {
      const res = await apiClient.getMyBusiness();
      return res.data.data as Business | null;
    },
    enabled: options?.enabled ?? true,
    retry: false,
  });
}

export const faqKeys = {
  all: ['faqs'] as const,
  public: (slug: string) => ['faqs', 'public', slug] as const,
};

export function useMyFaqs() {
  return useQuery({
    queryKey: faqKeys.all,
    queryFn: async () => {
      const res = await apiClient.getMyFaqs();
      return res.data.data;
    },
  });
}

export function usePublicBusinessFaqs(slug: string) {
  return useQuery({
    queryKey: faqKeys.public(slug),
    queryFn: async () => {
      const res = await apiClient.getPublicBusinessFaqs(slug);
      return res.data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { question: string; answer: string; category?: string }) =>
      apiClient.createFaq(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: faqKeys.all }),
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      faqId,
      data,
    }: {
      faqId: string;
      data: { question?: string; answer?: string; category?: string };
    }) => apiClient.updateFaq(faqId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: faqKeys.all }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (faqId: string) => apiClient.deleteFaq(faqId),
    onSuccess: () => qc.invalidateQueries({ queryKey: faqKeys.all }),
  });
}

export function useReorderFaqs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (faqIds: string[]) => apiClient.reorderFaqs(faqIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: faqKeys.all }),
  });
}

export const businessKeys = {
  public: (slug: string) => ['business', 'public', slug] as const,
  products: (slug: string) => ['business', 'products', slug] as const,
  services: (slug: string) => ['business', 'services', slug] as const,
  menu: (slug: string) => ['business', 'menu', slug] as const,
  rooms: (slug: string) => ['business', 'rooms', slug] as const,
  events: (slug: string) => ['business', 'events', slug] as const,
  rentals: (slug: string) => ['business', 'rentals', slug] as const,
  portfolio: (slug: string) => ['business', 'portfolio', slug] as const,
  promotions: (slug: string) => ['business', 'promotions', slug] as const,
  partners: (slug: string) => ['business', 'partners', slug] as const,
  bookings: (slug: string) => ['business', 'bookings', slug] as const,
  reviews: (slug: string) => ['business', 'reviews', slug] as const,
};

export function useBusinessPublic(
  slug: string,
  options?: Partial<UseQueryOptions<Business>>
): UseQueryResult<Business> {
  return useQuery<Business>({
    queryKey: businessKeys.public(slug),
    queryFn: async () => {
      const res = await apiClient.getPublicBusiness(slug);
      return res.data.data as Business;
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessProducts(
  slug: string,
  options?: Partial<UseQueryOptions<Product[]>>
): UseQueryResult<Product[]> {
  return useQuery<Product[]>({
    queryKey: businessKeys.products(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessProducts(slug);
      return res.data.data as Product[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessServices(
  slug: string,
  options?: Partial<UseQueryOptions<Service[]>>
): UseQueryResult<Service[]> {
  return useQuery<Service[]>({
    queryKey: businessKeys.services(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessServices(slug);
      return res.data.data as Service[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessMenu(
  slug: string,
  options?: Partial<UseQueryOptions<{ categories: MenuCategory[]; uncategorized: MenuItem[] }>>
): UseQueryResult<{ categories: MenuCategory[]; uncategorized: MenuItem[] }> {
  return useQuery<{ categories: MenuCategory[]; uncategorized: MenuItem[] }>({
    queryKey: businessKeys.menu(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessMenu(slug);
      return res.data.data as { categories: MenuCategory[]; uncategorized: MenuItem[] };
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessRooms(
  slug: string,
  options?: Partial<UseQueryOptions<Room[]>>
): UseQueryResult<Room[]> {
  return useQuery<Room[]>({
    queryKey: businessKeys.rooms(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessRooms(slug);
      return res.data.data as Room[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessEvents(
  slug: string,
  options?: Partial<UseQueryOptions<BusinessEvent[]>>
): UseQueryResult<BusinessEvent[]> {
  return useQuery<BusinessEvent[]>({
    queryKey: businessKeys.events(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessEvents(slug);
      return res.data.data as BusinessEvent[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessRentals(
  slug: string,
  options?: Partial<UseQueryOptions<Rental[]>>
): UseQueryResult<Rental[]> {
  return useQuery<Rental[]>({
    queryKey: businessKeys.rentals(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessRentals(slug);
      return res.data.data as Rental[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessPortfolio(
  slug: string,
  options?: Partial<UseQueryOptions<PortfolioItem[]>>
): UseQueryResult<PortfolioItem[]> {
  return useQuery<PortfolioItem[]>({
    queryKey: businessKeys.portfolio(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessPortfolio(slug);
      return res.data.data as PortfolioItem[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessPromotions(
  slug: string,
  options?: Partial<UseQueryOptions<Promotion[]>>
): UseQueryResult<Promotion[]> {
  return useQuery<Promotion[]>({
    queryKey: businessKeys.promotions(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessPromotions(slug);
      return res.data.data as Promotion[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessPartners(
  slug: string,
  options?: Partial<UseQueryOptions<Partner[]>>
): UseQueryResult<Partner[]> {
  return useQuery<Partner[]>({
    queryKey: businessKeys.partners(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessPartners(slug);
      return res.data.data as Partner[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessReviews(
  slug: string,
  options?: Partial<UseQueryOptions<BusinessReview[]>>
): UseQueryResult<BusinessReview[]> {
  return useQuery<BusinessReview[]>({
    queryKey: businessKeys.reviews(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessReviews(slug);
      return res.data.data as BusinessReview[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessBookings(
  slug: string,
  options?: Partial<UseQueryOptions<any[]>>
): UseQueryResult<any[]> {
  return useQuery<any[]>({
    queryKey: businessKeys.bookings(slug),
    queryFn: async () => {
      const res = await apiClient.getBusinessBookings(slug);
      return res.data.data as any[];
    },
    enabled: !!slug,
    ...options,
  });
}

export function useBusinessTrainings(
  slug: string,
  options?: Partial<UseQueryOptions<any[]>>
): UseQueryResult<any[]> {
  return useQuery<any[]>({
    queryKey: [...businessKeys.public(slug), 'trainings'],
    queryFn: async () => {
      const res = await apiClient.getBizTrainings({ slug });
      return res.data.data as any[];
    },
    enabled: !!slug,
    ...options,
  });
}

export const profileKeys = {
  all: ['profile'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: async () => {
      const res = await apiClient.getProfile();
      return res.data.data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiClient.updateProfile(data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export const clientKeys = {
  all: ['business-clients'] as const,
  detail: (id: string) => ['business-clients', id] as const,
};

export function useBusinessClients(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...clientKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getBusinessClients(params);
      return res.data.data;
    },
  });
}

export const statsKeys = {
  all: ['business-stats'] as const,
};

export function useBusinessStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: async () => {
      const res = await apiClient.getBusinessStats();
      return res.data.data;
    },
    refetchInterval: 60000,
  });
}

export const conversationKeys = {
  all: ['business-conversations'] as const,
  detail: (id: string) => ['business-conversations', id] as const,
};

export function useBusinessConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: async () => {
      const res = await apiClient.getBusinessConversations();
      return res.data.data;
    },
  });
}
