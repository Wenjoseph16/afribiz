import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Business, Product, Service, MenuCategory, MenuItem, Room, BusinessEvent, Rental, PortfolioItem, Promotion, Partner, BusinessReview } from '@/types/business';

// ============ NOTIFICATIONS ============
export const notificationKeys = {
  all: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  preferences: ['notifications', 'preferences'] as const,
};

export function useNotifications(params?: { read?: boolean; type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...notificationKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getNotifications(params);
      return res.data.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => {
      const res = await apiClient.getUnreadCount();
      return res.data.data;
    },
    refetchInterval: 300000,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences,
    queryFn: async () => {
      const res = await apiClient.getNotificationPreferences();
      return res.data.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: any[]) => apiClient.updateNotificationPreferences(preferences),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.preferences }),
  });
}

// ============ ORDERS ============
export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', id] as const,
};

export function useOrders(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...orderKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getOrders(params);
      return res.data.data;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getOrder(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateOrder(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: orderKeys.detail(id) });
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

// ============ BUSINESS ORDERS ============
export const bizOrderKeys = {
  all: ['biz-orders'] as const,
  detail: (id: string) => ['biz-orders', id] as const,
  stats: ['biz-orders', 'stats'] as const,
  debts: ['biz-orders', 'debts'] as const,
};

export function useMyBusinessOrders(params?: any) {
  return useQuery({
    queryKey: [...bizOrderKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyBusinessOrders(params);
      return res.data.data;
    },
  });
}

export function useMyBusinessOrder(id: string) {
  return useQuery({
    queryKey: bizOrderKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyBusinessOrder(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBusinessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createBusinessOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.all }),
  });
}

export function useUpdateBusinessOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      apiClient.updateBusinessOrderStatus(id, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizOrderKeys.all });
      qc.invalidateQueries({ queryKey: bizOrderKeys.stats });
    },
  });
}

export function useDeleteBusinessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBusinessOrder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.all }),
  });
}

export function useBusinessOrderStats() {
  return useQuery({
    queryKey: bizOrderKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getBusinessOrderStats();
      return res.data.data;
    },
  });
}

export function useBusinessDebts(params?: any) {
  return useQuery({
    queryKey: [...bizOrderKeys.debts, params],
    queryFn: async () => {
      const res = await apiClient.getBusinessDebts(params);
      return res.data.data;
    },
  });
}

export function usePayBusinessDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => apiClient.payBusinessDebt(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.debts }),
  });
}

export function useSettleBusinessDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.settleBusinessDebt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizOrderKeys.debts }),
  });
}

// ============ BOOKINGS ============
export const bookingKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => ['bookings', id] as const,
};

export function useBookings(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...bookingKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getBookings(params);
      return res.data.data;
    },
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getBooking(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

// ============ PAYMENTS ============
export const paymentKeys = {
  all: ['payments'] as const,
  detail: (id: string) => ['payments', id] as const,
};

export function useWallet() {
  return useQuery({
    queryKey: [...paymentKeys.all, 'wallet'],
    queryFn: async () => {
      const res = await apiClient.getWallet();
      return res.data.data;
    },
  });
}

export function usePayments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...paymentKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getPayments(params);
      return res.data.data;
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getPayment(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

// ============ FAVORITES ============
export const favoriteKeys = {
  all: ['favorites'] as const,
};

export function useFavorites(params?: { type?: string }) {
  return useQuery({
    queryKey: [...favoriteKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getFavorites(params);
      return res.data.data;
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.removeFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
    },
  });
}

// ============ REVIEWS ============
export const reviewKeys = {
  all: ['reviews'] as const,
};

export function useReviews(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...reviewKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getReviews(params);
      return res.data.data;
    },
  });
}

// ============ MESSAGES ============
export const messageKeys = {
  conversations: ['messages', 'conversations'] as const,
  conversation: (id: string) => ['messages', 'conversation', id] as const,
};

export function useConversations(type?: 'business' | 'support') {
  return useQuery({
    queryKey: [...messageKeys.conversations, type],
    queryFn: async () => {
      const res = await apiClient.get('/messages/conversations', { params: { type } });
      return res.data.data;
    },
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: messageKeys.conversation(conversationId),
    queryFn: async () => {
      const res = await apiClient.getMessages(conversationId);
      return res.data.data;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiClient.post('/messages', { conversationId, content }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
      qc.invalidateQueries({ queryKey: messageKeys.conversation(variables.conversationId) });
    },
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subject: string; description: string }) =>
      apiClient.createSupportTicket(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.conversations }),
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { recipientId: string; subject?: string; initialMessage?: string }) =>
      apiClient.createConversation(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.conversations }),
  });
}

// ============ FINANCE (QUOTES & INVOICES) ============
export const financeKeys = {
  stats: ['finance', 'stats'] as const,
  quotes: {
    all: ['finance', 'quotes'] as const,
    detail: (id: string) => ['finance', 'quotes', id] as const,
  },
  invoices: {
    all: ['finance', 'invoices'] as const,
    detail: (id: string) => ['finance', 'invoices', id] as const,
  },
};

export function useQuotes(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...financeKeys.quotes.all, params],
    queryFn: async () => {
      const res = await apiClient.getQuotes(params);
      return res.data.data;
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: financeKeys.quotes.detail(id),
    queryFn: async () => {
      const res = await apiClient.getQuote(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createQuote(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateQuote(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateQuoteStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useConvertQuoteToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.convertQuoteToInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.quotes.all });
      qc.invalidateQueries({ queryKey: financeKeys.invoices.all });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteQuote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.quotes.all }),
  });
}

export function useInvoices(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...financeKeys.invoices.all, params],
    queryFn: async () => {
      const res = await apiClient.getInvoices(params);
      return res.data.data;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: financeKeys.invoices.detail(id),
    queryFn: async () => {
      const res = await apiClient.getInvoice(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createInvoice(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateInvoiceStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useUpdateInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateInvoicePayment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteInvoice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.invoices.all }),
  });
}

export function useFinanceStats() {
  return useQuery({
    queryKey: financeKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getFinanceStats();
      return res.data.data;
    },
  });
}

// ============ MY BUSINESS ============
export const myBusinessKeys = {
  all: ['my-business'] as const,
};

export function useMyBusiness() {
  return useQuery({
    queryKey: myBusinessKeys.all,
    queryFn: async () => {
      const res = await apiClient.getMyBusiness();
      return res.data.data as Business | null;
    },
    retry: false,
  });
}

// ============ BUSINESS PUBLIC ============
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

export function useBusinessPublic(slug: string, options?: Partial<UseQueryOptions<Business>>): UseQueryResult<Business> {
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

export function useBusinessProducts(slug: string, options?: Partial<UseQueryOptions<Product[]>>): UseQueryResult<Product[]> {
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

export function useBusinessServices(slug: string, options?: Partial<UseQueryOptions<Service[]>>): UseQueryResult<Service[]> {
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

export function useBusinessMenu(slug: string, options?: Partial<UseQueryOptions<{ categories: MenuCategory[]; uncategorized: MenuItem[] }>>): UseQueryResult<{ categories: MenuCategory[]; uncategorized: MenuItem[] }> {
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

export function useBusinessRooms(slug: string, options?: Partial<UseQueryOptions<Room[]>>): UseQueryResult<Room[]> {
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

export function useBusinessEvents(slug: string, options?: Partial<UseQueryOptions<BusinessEvent[]>>): UseQueryResult<BusinessEvent[]> {
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

export function useBusinessRentals(slug: string, options?: Partial<UseQueryOptions<Rental[]>>): UseQueryResult<Rental[]> {
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

export function useBusinessPortfolio(slug: string, options?: Partial<UseQueryOptions<PortfolioItem[]>>): UseQueryResult<PortfolioItem[]> {
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

export function useBusinessPromotions(slug: string, options?: Partial<UseQueryOptions<Promotion[]>>): UseQueryResult<Promotion[]> {
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

export function useBusinessPartners(slug: string, options?: Partial<UseQueryOptions<Partner[]>>): UseQueryResult<Partner[]> {
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

export function useBusinessReviews(slug: string, options?: Partial<UseQueryOptions<BusinessReview[]>>): UseQueryResult<BusinessReview[]> {
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

export function useBusinessBookings(slug: string, options?: Partial<UseQueryOptions<any[]>>): UseQueryResult<any[]> {
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

export function useBusinessTrainings(slug: string, options?: Partial<UseQueryOptions<any[]>>): UseQueryResult<any[]> {
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

// ============ PROFILE ============
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
    mutationFn: async (data: any) => {
      const res = await apiClient.updateProfile(data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ============ BUSINESS CLIENTS ============
export const clientKeys = {
  all: ['business-clients'] as const,
  detail: (id: string) => ['business-clients', id] as const,
};

export function useBusinessClients(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [...clientKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.get('/business/clients', { params });
      return res.data.data;
    },
  });
}

// ============ BUSINESS STATS ============
export const statsKeys = {
  all: ['business-stats'] as const,
};

export function useBusinessStats() {
  return useQuery({
    queryKey: statsKeys.all,
    queryFn: async () => {
      const res = await apiClient.get('/business/stats');
      return res.data.data;
    },
    refetchInterval: 60000,
  });
}

// ============ BUSINESS CONVERSATIONS ============
export const conversationKeys = {
  all: ['business-conversations'] as const,
  detail: (id: string) => ['business-conversations', id] as const,
};

export function useBusinessConversations() {
  return useQuery({
    queryKey: conversationKeys.all,
    queryFn: async () => {
      const res = await apiClient.get('/business/conversations');
      return res.data.data;
    },
  });
}

// ============ PRODUCTS (Dashboard) ============
export const productKeys = {
  all: ['my-products'] as const,
  detail: (id: string) => ['my-products', id] as const,
  categories: ['my-products', 'categories'] as const,
  stats: ['my-products', 'stats'] as const,
  alerts: ['my-products', 'alerts'] as const,
};

export function useMyProducts(params?: any) {
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
    mutationFn: (data: any) => apiClient.createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateProduct(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: productKeys.all }); qc.invalidateQueries({ queryKey: productKeys.stats }); },
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
    mutationFn: (data: any) => apiClient.createProductCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.categories }),
  });
}

export function useUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateProductCategory(id, data),
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

// ============ SERVICES (Dashboard) ============
export const serviceKeys = {
  all: ['my-services'] as const,
  detail: (id: string) => ['my-services', id] as const,
  categories: ['my-services', 'categories'] as const,
  stats: ['my-services', 'stats'] as const,
};

export function useMyServices(params?: any) {
  return useQuery({
    queryKey: [...serviceKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyServices(params);
      return res.data.data;
    },
  });
}

export function useMyService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyService(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createService(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateService(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useToggleServiceActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleServiceActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useServiceCategories() {
  return useQuery({
    queryKey: serviceKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getServiceCategories();
      return res.data.data;
    },
  });
}

export function useServiceStats() {
  return useQuery({
    queryKey: serviceKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getServiceStats();
      return res.data.data;
    },
  });
}

export function useDuplicateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.duplicateService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useBulkDeleteServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.bulkDeleteServices(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useBulkToggleServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) => apiClient.bulkToggleServices(ids, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.all }),
  });
}

export function useCreateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createServiceCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.categories }),
  });
}

export function useUpdateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateServiceCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.categories }),
  });
}

export function useDeleteServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteServiceCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: serviceKeys.categories }),
  });
}

// ============ MENU (Dashboard) ============
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

export function useMyMenuItems(params?: any) {
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
    mutationFn: (data: any) => apiClient.createMenuItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateMenuItem(id, data),
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
    mutationFn: (data: any) => apiClient.createMenuCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.categories }),
  });
}

export function useMenuOrders(params?: any) {
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
    mutationFn: (data: any) => apiClient.createMenuOrder(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.orders }),
  });
}

export function useUpdateMenuOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateMenuOrderStatus(id, status),
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
    mutationFn: (data: any) => apiClient.createMenuTable(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.tables }),
  });
}

export function useUpdateMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateMenuTable(id, data),
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

export function useMenuIngredients(params?: any) {
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
    mutationFn: (data: any) => apiClient.createMenuIngredient(data),
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

// ============ ROOMS (Dashboard) ============
export const roomKeys = {
  all: ['my-rooms'] as const,
  detail: (id: string) => ['my-rooms', id] as const,
  stats: ['my-rooms', 'stats'] as const,
};

export function useMyRooms(params?: any) {
  return useQuery({
    queryKey: [...roomKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyRooms(params);
      return res.data.data ?? [];
    },
  });
}

export function useMyRoom(id: string) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyRoom(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createRoom(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateRoom(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useToggleRoomActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleRoomActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useRoomStats() {
  return useQuery({
    queryKey: roomKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getRoomStats();
      return res.data.data;
    },
  });
}

export function useDuplicateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.duplicateRoom(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useBulkDeleteRooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.bulkDeleteRooms(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

export function useBulkToggleRooms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) => apiClient.bulkToggleRooms(ids, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: roomKeys.all }),
  });
}

// ============ PLANNING ============
export const planningKeys = {
  all: ['planning'] as const,
  tasks: ['planning', 'tasks'] as const,
  taskDetail: (id: string) => ['planning', 'tasks', id] as const,
  schedules: ['planning', 'schedules'] as const,
  calendar: ['planning', 'calendar'] as const,
  stats: ['planning', 'stats'] as const,
};

export function usePlanningTasks(params?: any) {
  return useQuery({
    queryKey: [...planningKeys.tasks, params],
    queryFn: async () => {
      const res = await apiClient.getPlanningTasks(params);
      return res.data.data;
    },
  });
}

export function useCreatePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createPlanningTask(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planningKeys.tasks }),
  });
}

export function usePlanningSchedules(params?: any) {
  return useQuery({
    queryKey: [...planningKeys.schedules, params],
    queryFn: async () => {
      const res = await apiClient.getPlanningSchedules(params);
      return res.data.data;
    },
  });
}

export function usePlanningCalendar(params?: any) {
  return useQuery({
    queryKey: [...planningKeys.calendar, params],
    queryFn: async () => {
      const res = await apiClient.getPlanningCalendar(params);
      return res.data.data;
    },
  });
}

export function usePlanningTask(id: string) {
  return useQuery({
    queryKey: planningKeys.taskDetail(id),
    queryFn: async () => {
      const res = await apiClient.getPlanningTask(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useUpdatePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePlanningTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: planningKeys.tasks }),
  });
}

export function useDeletePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deletePlanningTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: planningKeys.tasks }),
  });
}

export function usePlanningStats() {
  return useQuery({
    queryKey: planningKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getPlanningStats();
      return res.data.data;
    },
  });
}

// ============ PROMOTIONS ============
export const promoKeys = {
  all: ['my-promotions'] as const,
  detail: (id: string) => ['my-promotions', id] as const,
  coupons: ['my-promotions', 'coupons'] as const,
  bundles: ['my-promotions', 'bundles'] as const,
  campaigns: ['my-promotions', 'campaigns'] as const,
  loyalty: ['my-promotions', 'loyalty'] as const,
  stats: ['my-promotions', 'stats'] as const,
};

export function useMyPromotions(params?: any) {
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
    mutationFn: (data: any) => apiClient.createPromotion(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: promoKeys.all }),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePromotion(id, data),
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

export function usePromoCoupons(params?: any) {
  return useQuery({
    queryKey: [...promoKeys.coupons, params],
    queryFn: async () => {
      const res = await apiClient.getPromoCoupons(params);
      return res.data.data;
    },
  });
}

export function usePromoBundles(params?: any) {
  return useQuery({
    queryKey: [...promoKeys.bundles, params],
    queryFn: async () => {
      const res = await apiClient.getPromoBundles(params);
      return res.data.data;
    },
  });
}

export function usePromoCampaigns(params?: any) {
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

// ============ EMPLOYEES ============
export const employeeKeys = {
  all: ['my-employees'] as const,
  detail: (id: string) => ['my-employees', id] as const,
  roles: ['my-employees', 'roles'] as const,
  attendances: ['my-employees', 'attendances'] as const,
  stats: ['my-employees', 'stats'] as const,
};

export function useMyEmployees(params?: any) {
  return useQuery({
    queryKey: [...employeeKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyEmployees(params);
      return res.data.data;
    },
  });
}

export function useMyEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyEmployee(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createEmployee(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateEmployee(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEmployee(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useEmployeeRoles() {
  return useQuery({
    queryKey: employeeKeys.roles,
    queryFn: async () => {
      const res = await apiClient.getEmployeeRoles();
      return res.data.data;
    },
  });
}

export function useEmployeeAttendances(params?: any) {
  return useQuery({
    queryKey: [...employeeKeys.attendances, params],
    queryFn: async () => {
      const res = await apiClient.getEmployeeAttendances(params);
      return res.data.data;
    },
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: employeeKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getEmployeeStats();
      return res.data.data;
    },
  });
}

// ============ PORTFOLIO ============
export const portfolioKeys = {
  all: ['my-portfolio'] as const,
  detail: (id: string) => ['my-portfolio', id] as const,
  categories: ['my-portfolio', 'categories'] as const,
  testimonials: ['my-portfolio', 'testimonials'] as const,
  stats: ['my-portfolio', 'stats'] as const,
};

export function useMyPortfolioItems(params?: any) {
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
    mutationFn: (data: any) => apiClient.createPortfolioItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}

export function useUpdatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updatePortfolioItem(id, data),
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

// ============ SUBSCRIPTIONS ============
export const subscriptionKeys = {
  plans: ['subscriptions', 'plans'] as const,
  planDetail: (id: string) => ['subscriptions', 'plans', id] as const,
  subscribers: ['subscriptions', 'subscribers'] as const,
  payments: ['subscriptions', 'payments'] as const,
  stats: ['subscriptions', 'stats'] as const,
  logs: ['subscriptions', 'logs'] as const,
};

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans,
    queryFn: async () => {
      const res = await apiClient.getSubscriptionPlans();
      return res.data.data;
    },
  });
}

export function useSubscribers(params?: any) {
  return useQuery({
    queryKey: [...subscriptionKeys.subscribers, params],
    queryFn: async () => {
      const res = await apiClient.getSubscribers(params);
      return res.data.data;
    },
  });
}

export function useSubscriptionPlan(id: string) {
  return useQuery({
    queryKey: subscriptionKeys.planDetail(id),
    queryFn: async () => {
      const res = await apiClient.getSubscriptionPlan(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createSubscriptionPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.plans }),
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateSubscriptionPlan(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.plans }),
  });
}

export function useDeleteSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteSubscriptionPlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys.plans }),
  });
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: subscriptionKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getSubscriptionStats();
      return res.data.data;
    },
  });
}

// ============ BUSINESS TRAININGS ============
export const bizTrainingKeys = {
  all: ["biz-trainings"] as const,
  detail: (id: string) => ["biz-trainings", id] as const,
  lessons: (id: string) => ["biz-trainings", id, "lessons"] as const,
  students: (id: string) => ["biz-trainings", id, "students"] as const,
  stats: ["biz-trainings", "stats"] as const,
};
// ============ DELIVERY ============
export const deliveryKeys = {
  all: ['deliveries'] as const,
  detail: (id: string) => ['deliveries', id] as const,
  zones: ['deliveries', 'zones'] as const,
  drivers: ['deliveries', 'drivers'] as const,
  stats: ['deliveries', 'stats'] as const,
};

export function useDeliveries(params?: any) {
  return useQuery({
    queryKey: [...deliveryKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getDeliveries(params);
      return res.data.data;
    },
  });
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getDelivery(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDelivery(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useDeliveryZones() {
  return useQuery({
    queryKey: deliveryKeys.zones,
    queryFn: async () => {
      const res = await apiClient.getDeliveryZones();
      return res.data.data;
    },
  });
}

export function useDrivers(params?: any) {
  return useQuery({
    queryKey: [...deliveryKeys.drivers, params],
    queryFn: async () => {
      const res = await apiClient.getDrivers(params);
      return res.data.data;
    },
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateDelivery(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useDeliveryStats() {
  return useQuery({
    queryKey: deliveryKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getDeliveryStats();
      return res.data.data;
    },
  });
}

// ============ EVENTS ============
export const eventKeys = {
  all: ['my-events'] as const,
  detail: (id: string) => ['my-events', id] as const,
  tickets: (eventId: string) => ['my-events', eventId, 'tickets'] as const,
  participants: (eventId: string) => ['my-events', eventId, 'participants'] as const,
  stats: (id: string) => ['my-events', id, 'stats'] as const,
  dashboardStats: ['my-events', 'dashboard', 'stats'] as const,
};

export function useMyEvents(params?: any) {
  return useQuery({
    queryKey: [...eventKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyEvents(params);
      return res.data.data;
    },
  });
}

export function useMyEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyEvent(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateEvent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.all }),
  });
}

export function useEventDashboardStats() {
  return useQuery({
    queryKey: eventKeys.dashboardStats,
    queryFn: async () => {
      const res = await apiClient.getEventDashboardStats();
      return res.data.data;
    },
  });
}

// ===== Event Tickets =====
export function useEventTickets(eventId: string) {
  return useQuery({
    queryKey: eventKeys.tickets(eventId),
    queryFn: async () => {
      const res = await apiClient.getEventTickets(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useCreateEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => apiClient.createEventTicket(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.tickets(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

export function useUpdateEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ticketId, data }: { eventId: string; ticketId: string; data: any }) =>
      apiClient.updateEventTicket(eventId, ticketId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.tickets(variables.eventId) });
    },
  });
}

export function useDeleteEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ticketId }: { eventId: string; ticketId: string }) =>
      apiClient.deleteEventTicket(eventId, ticketId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.tickets(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.all });
    },
  });
}

// ===== Event Participants =====
export function useEventParticipants(eventId: string) {
  return useQuery({
    queryKey: eventKeys.participants(eventId),
    queryFn: async () => {
      const res = await apiClient.getEventParticipants(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useRegisterEventParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => apiClient.registerEventParticipant(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.participants(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.stats(variables.eventId) });
    },
  });
}

export function useUpdateParticipantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, participantId, status }: { eventId: string; participantId: string; status: string }) =>
      apiClient.updateEventParticipantStatus(eventId, participantId, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: eventKeys.participants(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.stats(variables.eventId) });
    },
  });
}

// ===== Event Scans =====
export function useEventScans(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'scans'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventScans(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useScanTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, ticketRef }: { eventId: string; ticketRef: string }) =>
      apiClient.scanEventTicket(eventId, ticketRef),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'scans'] });
      qc.invalidateQueries({ queryKey: eventKeys.participants(variables.eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.stats(variables.eventId) });
    },
  });
}

// ===== Event Promotions =====
export function useEventPromotions(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'promotions'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventPromotions(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useCreateEventPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => apiClient.createEventPromotion(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'promotions'] });
    },
  });
}

export function useDeleteEventPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, promoId }: { eventId: string; promoId: string }) =>
      apiClient.deleteEventPromotion(eventId, promoId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'promotions'] });
    },
  });
}

// ===== Event Gallery =====
export function useEventGallery(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'gallery'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventGallery(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useAddEventGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => apiClient.addEventGalleryItem(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'gallery'] });
    },
  });
}

export function useDeleteEventGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, itemId }: { eventId: string; itemId: string }) =>
      apiClient.deleteEventGalleryItem(eventId, itemId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'gallery'] });
    },
  });
}

// ===== Event Partners =====
export function useEventPartners(eventId: string) {
  return useQuery({
    queryKey: [...eventKeys.all, eventId, 'partners'] as const,
    queryFn: async () => {
      const res = await apiClient.getEventPartners(eventId);
      return res.data.data;
    },
    enabled: !!eventId,
  });
}

export function useAddEventPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) => apiClient.addEventPartner(eventId, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'partners'] });
    },
  });
}

export function useRemoveEventPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, partnerId }: { eventId: string; partnerId: string }) =>
      apiClient.removeEventPartner(eventId, partnerId),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...eventKeys.all, variables.eventId, 'partners'] });
    },
  });
}

// ===== Event Stats =====
export function useEventStats(id: string) {
  return useQuery({
    queryKey: eventKeys.stats(id),
    queryFn: async () => {
      const res = await apiClient.getEventStats(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

// ============ RENTALS ============
export const rentalKeys = {
  all: ['my-rentals'] as const,
  detail: (id: string) => ['my-rentals', id] as const,
  stats: ['my-rentals', 'stats'] as const,
};

export function useMyRentals(params?: any) {
  return useQuery({
    queryKey: [...rentalKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyRentals(params);
      return res.data.data ?? [];
    },
  });
}

export function useMyRental(id: string) {
  return useQuery({
    queryKey: rentalKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyRental(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createRental(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useUpdateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateRental(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useDeleteRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteRental(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useToggleRentalActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.toggleRentalActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: rentalKeys.all }),
  });
}

export function useRentalStats() {
  return useQuery({
    queryKey: rentalKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getRentalStats();
      return res.data.data;
    },
  });
}

// ============ DEBTS & FINANCE ============
export const debtKeys = {
  all: ['debts'] as const,
  detail: (id: string) => ['debts', id] as const,
  escrows: ['debts', 'escrows'] as const,
  clientRisks: ['debts', 'client-risks'] as const,
  logs: ['debts', 'logs'] as const,
  stats: ['debts', 'stats'] as const,
};

export function useDebts(params?: any) {
  return useQuery({
    queryKey: [...debtKeys.all, params],
    queryFn: async () => {
      try {
        const res = await apiClient.getDebts(params);
        return res.data.data;
      } catch {
        return [];
      }
    },
  });
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: debtKeys.detail(id),
    queryFn: async () => {
      try {
        const res = await apiClient.getDebt(id);
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/business/finance/debts', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateDebt(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useCreateEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createEscrow(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useEscrows(params?: any) {
  return useQuery({
    queryKey: [...debtKeys.escrows, params],
    queryFn: async () => {
      try {
        const res = await apiClient.getEscrows(params);
        return res.data.data;
      } catch {
        return [];
      }
    },
  });
}

export function useClientEscrows() {
  return useQuery({
    queryKey: ['client-escrows'],
    queryFn: async () => {
      const res = await apiClient.getClientEscrows();
      return res.data.data;
    },
  });
}

export function useConfirmClientEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.confirmClientEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-escrows'] }),
  });
}

export function useDisputeClientEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => apiClient.disputeClientEscrow(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-escrows'] }),
  });
}

export function useClientDebts() {
  return useQuery({
    queryKey: ['client-debts'],
    queryFn: async () => {
      const res = await apiClient.getClientDebts();
      return res.data.data;
    },
  });
}

export function usePayClientDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; amount: number; paymentMethod?: string; notes?: string }) =>
      apiClient.payClientDebt(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-debts'] }),
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: debtKeys.stats,
    queryFn: async () => {
      try {
        const res = await apiClient.getPaymentStats();
        return res.data.data;
      } catch {
        return {
          totalDebts: 0, totalDebtAmount: 0, activeDebts: 0, activeDebtAmount: 0,
          overdueDebts: 0, criticalDebts: 0, settledDebts: 0, totalRecovered: 0,
          recoveryRate: 0, escrowHeld: 0, escrowReleased: 0, highRiskClients: 0,
        };
      }
    },
  });
}

// ============ BUSINESS BOOKINGS (Dashboard) ============
export const bizBookingKeys = {
  all: ['biz-bookings'] as const,
  detail: (id: string) => ['biz-bookings', id] as const,
  calendar: ['biz-bookings', 'calendar'] as const,
  resources: ['biz-bookings', 'resources'] as const,
  slots: ['biz-bookings', 'slots'] as const,
};

export function useMyBusinessBookings(params?: any) {
  return useQuery({
    queryKey: [...bizBookingKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getMyBusinessBookings(params);
      return res.data.data;
    },
  });
}

export function useMyBusinessBooking(id: string) {
  return useQuery({
    queryKey: bizBookingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getMyBusinessBooking(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useBookingResources() {
  return useQuery({
    queryKey: bizBookingKeys.resources,
    queryFn: async () => {
      const res = await apiClient.getBookingResources();
      return res.data.data;
    },
  });
}

export function useBookingSlots() {
  return useQuery({
    queryKey: bizBookingKeys.slots,
    queryFn: async () => {
      const res = await apiClient.getBookingSlots();
      return res.data.data;
    },
  });
}

export function useBookingsCalendar(params?: any) {
  return useQuery({
    queryKey: [...bizBookingKeys.calendar, params],
    queryFn: async () => {
      const res = await apiClient.getBookingCalendar(params);
      return res.data.data;
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createBusinessBooking(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useRoomPlanning(params?: any) {
  return useQuery({
    queryKey: ['room-planning', params],
    queryFn: async () => {
      const [roomsRes, bookingsRes] = await Promise.all([
        apiClient.getMyRooms({ status: 'ACTIVE' }),
        apiClient.getMyBusinessBookings({ status: 'CONFIRMED,ARRIVED,OCCUPIED' }),
      ]);
      return {
        rooms: roomsRes.data.data?.items || roomsRes.data.data || [],
        bookings: bookingsRes.data.data?.items || bookingsRes.data.data || [],
        blocks: [],
      };
    },
  });
}

export function useBookingCalendar(params?: any) {
  return useQuery({
    queryKey: [...bizBookingKeys.calendar, params],
    queryFn: async () => {
      const res = await apiClient.getBookingCalendar(params);
      return res.data.data;
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => apiClient.cancelMyBooking(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
    },
  });
}

export function useRescheduleBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startDate, endDate }: { id: string; startDate: string; endDate?: string }) =>
      apiClient.rescheduleMyBooking(id, startDate, endDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useUpdateBusinessBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateBusinessBooking(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useDeleteBusinessBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBusinessBooking(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.all });
      qc.invalidateQueries({ queryKey: bizBookingKeys.calendar });
    },
  });
}

export function useSendBookingReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, channel }: { id: string; type: string; channel: string }) =>
      apiClient.sendBookingReminder(id, type, channel),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: bizBookingKeys.detail(variables.id) });
    },
  });
}

// ============ ADVANCED TASKS ============
export const advancedTaskKeys = {
  all: ['advanced-tasks'] as const,
  list: (params?: any) => ['advanced-tasks', 'list', params] as const,
  detail: (id: string) => ['advanced-tasks', id] as const,
  kanban: (params?: any) => ['advanced-tasks', 'kanban', params] as const,
  categories: ['advanced-tasks', 'categories'] as const,
  stats: ['advanced-tasks', 'stats'] as const,
  history: (id: string) => ['advanced-tasks', id, 'history'] as const,
  comments: (id: string) => ['advanced-tasks', id, 'comments'] as const,
  timers: (id: string) => ['advanced-tasks', id, 'timers'] as const,
};

export function useAdvancedTasks(params?: any) {
  return useQuery({
    queryKey: advancedTaskKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.getAdvancedTasks(params);
      return res.data.data;
    },
  });
}

export function useAdvancedTask(id: string) {
  return useQuery({
    queryKey: advancedTaskKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getAdvancedTask(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createAdvancedTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancedTaskKeys.all });
      qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() });
    },
  });
}

export function useUpdateAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateAdvancedTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancedTaskKeys.all });
      qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() });
    },
  });
}

export function useDeleteAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAdvancedTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advancedTaskKeys.all });
      qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() });
    },
  });
}

export function useKanbanBoard(params?: any) {
  return useQuery({
    queryKey: advancedTaskKeys.kanban(params),
    queryFn: async () => {
      try {
        const res = await apiClient.getKanbanBoard(params);
        return res.data.data || { columns: {}, totalTasks: 0 };
      } catch {
        return { columns: {}, totalTasks: 0 };
      }
    },
  });
}

export function useReorderTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, status, sortOrder }: { taskId: string; status: string; sortOrder: number }) =>
      apiClient.reorderTask(taskId, status, sortOrder),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.kanban() }),
  });
}

export function useTaskCategories() {
  return useQuery({
    queryKey: advancedTaskKeys.categories,
    queryFn: async () => {
      const res = await apiClient.getTaskCategories();
      return res.data.data;
    },
  });
}

export function useCreateTaskCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createTaskCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.categories }),
  });
}

export function useAddTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => apiClient.addTaskChecklistItem(taskId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.all }),
  });
}

export function useToggleTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) => apiClient.toggleTaskChecklistItem(taskId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.all }),
  });
}

export function useDeleteTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, itemId }: { taskId: string; itemId: string }) => apiClient.deleteTaskChecklistItem(taskId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: advancedTaskKeys.all }),
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => apiClient.addTaskComment(taskId, data),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useDeleteTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) => apiClient.deleteTaskComment(taskId, commentId),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useStartTaskTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.startTaskTimer(taskId),
    onSuccess: (_data, taskId) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(taskId) }),
  });
}

export function useStopTaskTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.stopTaskTimer(taskId),
    onSuccess: (_data, taskId) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(taskId) }),
  });
}

export function useAddTaskResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => apiClient.addTaskResource(taskId, data),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useDeleteTaskResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, resourceId }: { taskId: string; resourceId: string }) => apiClient.deleteTaskResource(taskId, resourceId),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useRequestTaskValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) => apiClient.requestTaskValidation(taskId, data),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useApproveTaskValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, validationId, data }: { taskId: string; validationId: string; data: any }) =>
      apiClient.approveTaskValidation(taskId, validationId, data),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: advancedTaskKeys.detail(variables.taskId) }),
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: advancedTaskKeys.stats,
    queryFn: async () => {
      try {
        const res = await apiClient.getTaskStats();
        return res.data.data;
      } catch {
        return {
          totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0,
          overdueTasks: 0, completionRate: 0, checklistProgress: 0,
          totalTimeHours: 0, overduePercentage: 0,
        };
      }
    },
  });
}

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: advancedTaskKeys.history(taskId),
    queryFn: async () => {
      const res = await apiClient.getTaskHistory(taskId);
      return res.data.data;
    },
    enabled: !!taskId,
  });
}

// ============ CART ============
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
    mutationFn: ({ itemId, data }: { itemId: string; data: { quantity: number; notes?: string } }) => apiClient.updateCartItem(itemId, data),
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

// ============ REFERRALS ============
export const referralKeys = {
  all: ['referrals'] as const,
  stats: ['referrals', 'stats'] as const,
};

export function useMyReferralCode() {
  return useQuery({
    queryKey: referralKeys.all,
    queryFn: async () => {
      const res = await apiClient.getMyReferralCode();
      return res.data.data;
    },
  });
}

export function useInviteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => apiClient.inviteReferral(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
}

export function useMyReferrals() {
  return useQuery({
    queryKey: [...referralKeys.all, 'list'],
    queryFn: async () => {
      const res = await apiClient.getMyReferrals();
      return res.data.data;
    },
  });
}

export function useMyReferralRewards() {
  return useQuery({
    queryKey: [...referralKeys.all, 'rewards'],
    queryFn: async () => {
      const res = await apiClient.getMyReferralRewards();
      return res.data.data;
    },
  });
}

export function useReferralStats() {
  return useQuery({
    queryKey: referralKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getReferralStats();
      return res.data.data;
    },
  });
}

// ============ RENTAL BOOKING ============
export function useCreateRentalBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rentalId: string; startDate: string; endDate: string; notes?: string }) =>
      apiClient.createRentalBooking(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useProlongRentalBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; newEndDate: string; additionalNotes?: string }) =>
      apiClient.prolongRentalBooking(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

// ============ EVENT REGISTRATION ============
export function useRegisterForEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.registerForEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

// ============ TRAINING ENROLLMENT ============
export function useEnrollInTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.enrollInTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-trainings'] }),
  });
}

// ============ REVIEW UPLOAD ============
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => apiClient.createReview(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useBizTrainings(params?: any) {
  return useQuery({
    queryKey: [...bizTrainingKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getBizTrainings(params);
      return res.data.data;
    },
  });
}

export function useBizTraining(id: string) {
  return useQuery({
    queryKey: bizTrainingKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getBizTraining(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createBizTraining(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizTrainingKeys.all }),
  });
}

export function useUpdateBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateBizTraining(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: bizTrainingKeys.all });
      qc.invalidateQueries({ queryKey: bizTrainingKeys.detail(id) });
    },
  });
}

export function useDeleteBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBizTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizTrainingKeys.all }),
  });
}

export function useBizTrainingStudents(trainingId: string, params?: any) {
  return useQuery({
    queryKey: [...bizTrainingKeys.students(trainingId), params],
    queryFn: async () => {
      const res = await apiClient.getBizTrainingStudents(trainingId, params);
      return res.data.data;
    },
    enabled: !!trainingId,
  });
}

export function useBizTrainingStats() {
  return useQuery({
    queryKey: bizTrainingKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getBizTrainingStats();
      return res.data.data;
    },
  });
}

export function useBizTrainingLessons(trainingId: string) {
  return useQuery({
    queryKey: bizTrainingKeys.lessons(trainingId),
    queryFn: async () => {
      const res = await apiClient.getBizTrainingLessons(trainingId);
      return res.data.data;
    },
    enabled: !!trainingId,
  });
}

export function useCreateBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createBizTrainingLesson(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useUpdateBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateBizTrainingLesson(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useDeleteBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteBizTrainingLesson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useCreateBizQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createBizTrainingQuiz(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

export function useDeleteBizQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quizId: string) => apiClient.deleteBizTrainingQuiz(quizId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biz-trainings'] }),
  });
}

// ============ DOCUMENTS ============
export const documentKeys = {
  all: ['documents'] as const,
  detail: (id: string) => ['documents', id] as const,
  stats: ['documents', 'stats'] as const,
};

export function useDocuments(params?: any) {
  return useQuery({
    queryKey: [...documentKeys.all, params],
    queryFn: async () => {
      const res = await apiClient.getDocuments(params);
      return res.data.data;
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.getDocument(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDocument(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateDocument(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: documentKeys.stats,
    queryFn: async () => {
      const res = await apiClient.getDocumentStats();
      return res.data.data;
    },
  });
}

// ============ DISPUTES ============
export const disputeKeys = {
  all: ['disputes'] as const,
  detail: (id: string) => ['disputes', id] as const,
};

export function useDisputes() {
  return useQuery({
    queryKey: disputeKeys.all,
    queryFn: async () => {
      const res = await apiClient.get('/business/disputes');
      return res.data.data;
    },
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: disputeKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get('/business/disputes');
      const items = res.data.data?.items || res.data.data || [];
      return items.find((d: any) => d.id === id) || null;
    },
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/business/disputes', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: disputeKeys.all }),
  });
}

export function useUpdateDisputeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.put(`/business/disputes/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: disputeKeys.all }),
  });
}

// ============ MISSING MENU MUTATIONS ============
export function useUpdateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateMenuCategory(id, data),
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

export function useUpdateMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateMenuIngredient(id, data),
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
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.adjustIngredientStock(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.ingredients }),
  });
}

export function useUpdateMenuTableStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateMenuTableStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.tables }),
  });
}

// ============ MISSING DELIVERY MUTATIONS ============
export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiClient.updateDeliveryStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.all }),
  });
}

export function useCreateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDeliveryZone(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.zones }),
  });
}

export function useUpdateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateDeliveryZone(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.zones }),
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDeliveryZone(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.zones }),
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createDriver(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.drivers }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateDriver(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.drivers }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteDriver(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveryKeys.drivers }),
  });
}

// ============ MISSING DEBT/FINANCE MUTATIONS ============
export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/business/finance/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useUpdateDebtPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) => apiClient.updateDebtPriority(id, priority),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useRegisterDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.registerDebtPayment(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useSendDebtReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (debtId: string) => apiClient.sendDebtReminder(debtId),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.all }),
  });
}

export function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.releaseEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.refundEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useBusinessDisputeEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.disputeEscrow(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.escrows }),
  });
}

export function useClientRisks(params?: any) {
  return useQuery({
    queryKey: [...debtKeys.clientRisks, params],
    queryFn: async () => {
      const res = await apiClient.getClientRisks(params);
      return res.data.data;
    },
  });
}

export function useUpdateClientRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, riskLevel }: { clientId: string; riskLevel: string }) =>
      apiClient.patch(`/business/finance/client-risks/${clientId}`, { riskLevel }),
    onSuccess: () => qc.invalidateQueries({ queryKey: debtKeys.clientRisks }),
  });
}

export function useDebtReminders(params?: any) {
  return useQuery({
    queryKey: [...['debts', 'reminders'], params],
    queryFn: async () => {
      const res = await apiClient.get('/business/finance/reminders', { params });
      return res.data.data;
    },
  });
}

export function useDebtLogs(params?: any) {
  return useQuery({
    queryKey: [...['debts', 'logs'], params],
    queryFn: async () => {
      const res = await apiClient.get('/business/finance/logs', { params });
      return res.data.data;
    },
  });
}

// ============ MISSING BOOKING RESOURCE/SLOT MUTATIONS ============
export function useCreateBookingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/business/bookings/resources', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.resources }),
  });
}

export function useUpdateBookingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.put(`/business/bookings/resources/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.resources }),
  });
}

export function useDeleteBookingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/business/bookings/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.resources }),
  });
}

export function useCreateBookingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/business/bookings/slots', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.slots }),
  });
}

export function useUpdateBookingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.put(`/business/bookings/slots/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.slots }),
  });
}

export function useDeleteBookingSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/business/bookings/slots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: bizBookingKeys.slots }),
  });
}
