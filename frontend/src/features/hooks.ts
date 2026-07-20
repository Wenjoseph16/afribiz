import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

// ===== ORDERS & CART (existing) =====

export const ordersKeys = {
  all: ['orders'] as const,
  list: (params?: Record<string, unknown>) => ['orders', 'list', params] as const,
  detail: (id: string) => ['orders', id] as const,
};

export const cartKeys = {
  cart: ['cart'] as const,
};

export function useOrders(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.getOrders(params);
      return res.data.data;
    },
  });
}

export function useCreateBusinessOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.createBusinessOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useCart() {
  return useQuery({
    queryKey: cartKeys.cart,
    queryFn: async () => {
      const res = await apiClient.getCart();
      return res.data.data;
    },
  });
}

// ===== AUTO-GENERATED HOOKS =====

export function useAddEventGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).addEventGalleryItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventGalleryItem'] });
    },
  });
}

export function useAddEventPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).addEventPartner(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventPartner'] });
    },
  });
}

export function useAddTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).addTaskChecklistItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskChecklistItem'] });
    },
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).addTaskComment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskComment'] });
    },
  });
}

export function useAddTaskResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).addTaskResource(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskResource'] });
    },
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).addToCart(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['toCart'] });
    },
  });
}

export function useAdjustIngredientStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).adjustIngredientStock(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredientStock'] });
    },
  });
}

export function useAdvancedTask(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['advancedTask', id],
    queryFn: async () => {
      const res = await (apiClient as any).getAdvancedTask(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).applyCoupon(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupon'] });
    },
  });
}

export function useApproveTaskValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).approveTaskValidation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskValidation'] });
    },
  });
}

export function useAssignDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).assignDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useBizTraining(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['bizTraining', id],
    queryFn: async () => {
      const res = await (apiClient as any).getBizTraining(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useBizTrainingStats(...args: any[]) {
  return useQuery({
    queryKey: ['bizTrainingStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBizTrainingStats(...args);
      return res.data.data as any;
    },
  });
}

export function useBizTrainingStudents(...args: any[]) {
  return useQuery({
    queryKey: ['bizTrainingStudents', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBizTrainingStudents(...args);
      return res.data.data as any;
    },
  });
}

export function useBizTrainings(...args: any[]) {
  return useQuery({
    queryKey: ['bizTrainings', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBizTrainings(...args);
      return res.data.data as any;
    },
  });
}

export function useBooking(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const res = await (apiClient as any).getBooking(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useBookingResources(...args: any[]) {
  return useQuery({
    queryKey: ['bookingResources', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBookingResources(...args);
      return res.data.data as any;
    },
  });
}

export function useBookingSlots(...args: any[]) {
  return useQuery({
    queryKey: ['bookingSlots', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBookingSlots(...args);
      return res.data.data as any;
    },
  });
}

export function useBookings(...args: any[]) {
  return useQuery({
    queryKey: ['bookings', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBookings(...args);
      return res.data.data as any;
    },
  });
}

export function useBulkDeleteServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).bulkDeleteServices(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deleteServices'] });
    },
  });
}

export function useBulkToggleServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).bulkToggleServices(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['toggleServices'] });
    },
  });
}

export function useBusinessBookings(...args: any[]) {
  return useQuery({
    queryKey: ['businessBookings', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessBookings(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessDisputeEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).businessDisputeEscrow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['businessDisputeEscrow'] });
    },
  });
}

export function useBusinessEvents(...args: any[]) {
  return useQuery({
    queryKey: ['businessEvents', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessEvents(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessMenu(...args: any[]) {
  return useQuery({
    queryKey: ['businessMenu', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessMenu(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessOrderStats(...args: any[]) {
  return useQuery({
    queryKey: ['businessOrderStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessOrderStats(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessPartners(...args: any[]) {
  return useQuery({
    queryKey: ['businessPartners', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessPartners(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessPortfolio(...args: any[]) {
  return useQuery({
    queryKey: ['businessPortfolio', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessPortfolio(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessProducts(...args: any[]) {
  return useQuery({
    queryKey: ['businessProducts', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessProducts(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessPromotions(...args: any[]) {
  return useQuery({
    queryKey: ['businessPromotions', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessPromotions(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessPublic(...args: any[]) {
  return useQuery({
    queryKey: ['businessPublic', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessPublic(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessRentals(...args: any[]) {
  return useQuery({
    queryKey: ['businessRentals', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessRentals(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessReviews(...args: any[]) {
  return useQuery({
    queryKey: ['businessReviews', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessReviews(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessRooms(...args: any[]) {
  return useQuery({
    queryKey: ['businessRooms', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessRooms(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessServices(...args: any[]) {
  return useQuery({
    queryKey: ['businessServices', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessServices(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessStats(...args: any[]) {
  return useQuery({
    queryKey: ['businessStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessStats(...args);
      return res.data.data as any;
    },
  });
}

export function useBusinessTrainings(...args: any[]) {
  return useQuery({
    queryKey: ['businessTrainings', args],
    queryFn: async () => {
      const res = await (apiClient as any).getBusinessTrainings(...args);
      return res.data.data as any;
    },
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).checkout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart', 'orders'] });
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).clearCart(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClientDebts(...args: any[]) {
  return useQuery({
    queryKey: ['clientDebts', args],
    queryFn: async () => {
      const res = await (apiClient as any).getClientDebts(...args);
      return res.data.data as any;
    },
  });
}

export function useClientEscrows(...args: any[]) {
  return useQuery({
    queryKey: ['clientEscrows', args],
    queryFn: async () => {
      const res = await (apiClient as any).getClientEscrows(...args);
      return res.data.data as any;
    },
  });
}

export function useClientRisks(...args: any[]) {
  return useQuery({
    queryKey: ['clientRisks', args],
    queryFn: async () => {
      const res = await (apiClient as any).getClientRisks(...args);
      return res.data.data as any;
    },
  });
}

export function useConfirmClientEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).confirmClientEscrow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientEscrow'] });
    },
  });
}

export function useConversations(...args: any[]) {
  return useQuery({
    queryKey: ['conversations', args],
    queryFn: async () => {
      const res = await (apiClient as any).getConversations(...args);
      return res.data.data as any;
    },
  });
}

export function useConvertQuoteToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).convertQuoteToInvoice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['convertQuoteToInvoice'] });
    },
  });
}

export function useCreateAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createAdvancedTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advancedTask'] });
    },
  });
}

export function useCreateBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createBizLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizLesson'] });
    },
  });
}

export function useCreateBizQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createBizQuiz(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizQuiz'] });
    },
  });
}

export function useCreateBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createBizTraining(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizTraining'] });
    },
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createBooking(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['booking'] });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createConversation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createDebt(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debt'] });
    },
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createDelivery(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery'] });
    },
  });
}

export function useCreateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createDeliveryZone(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveryZone'] });
    },
  });
}

export function useCreateDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createDispute(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispute'] });
    },
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createDocument(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document'] });
    },
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useCreateEventPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createEventPromotion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventPromotion'] });
    },
  });
}

export function useCreateEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createEventTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventTicket'] });
    },
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createFaq(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq'] });
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createInvoice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoice'] });
    },
  });
}

export function useCreateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createMenuCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuCategory'] });
    },
  });
}

export function useCreateMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createMenuIngredient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuIngredient'] });
    },
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createMenuItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuItem'] });
    },
  });
}

export function useCreateMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createMenuTable(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuTable'] });
    },
  });
}

export function useCreatePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createPlanningTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planningTask'] });
    },
  });
}

export function useCreatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createPortfolioItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolioItem'] });
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createProductCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productCategory'] });
    },
  });
}

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createPromotion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotion'] });
    },
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createQuote(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote'] });
    },
  });
}

export function useCreateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createRental(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental'] });
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service'] });
    },
  });
}

export function useCreateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createServiceCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceCategory'] });
    },
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).createSubscriptionPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptionPlan'] });
    },
  });
}

export function useDebt(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: async () => {
      const res = await (apiClient as any).getDebt(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useDebtLogs(...args: any[]) {
  return useQuery({
    queryKey: ['debtLogs', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDebtLogs(...args);
      return res.data.data as any;
    },
  });
}

export function useDebtReminders(...args: any[]) {
  return useQuery({
    queryKey: ['debtReminders', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDebtReminders(...args);
      return res.data.data as any;
    },
  });
}

export function useDebts(...args: any[]) {
  return useQuery({
    queryKey: ['debts', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDebts(...args);
      return res.data.data as any;
    },
  });
}

export function useDeleteAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteAdvancedTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advancedTask'] });
    },
  });
}

export function useDeleteBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteBizLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizLesson'] });
    },
  });
}

export function useDeleteBizQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteBizQuiz(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizQuiz'] });
    },
  });
}

export function useDeleteBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteBizTraining(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizTraining'] });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteDebt(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debt'] });
    },
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteDeliveryZone(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveryZone'] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteDocument(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document'] });
    },
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useDeleteEventGalleryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteEventGalleryItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventGalleryItem'] });
    },
  });
}

export function useDeleteEventPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteEventPromotion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventPromotion'] });
    },
  });
}

export function useDeleteEventTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteEventTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventTicket'] });
    },
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteFaq(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq'] });
    },
  });
}

export function useDeleteMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteMenuCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuCategory'] });
    },
  });
}

export function useDeleteMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteMenuIngredient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuIngredient'] });
    },
  });
}

export function useDeleteMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteMenuTable(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuTable'] });
    },
  });
}

export function useDeletePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deletePlanningTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planningTask'] });
    },
  });
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deletePortfolioItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolioItem'] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteProductCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productCategory'] });
    },
  });
}

export function useDeletePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deletePromotion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotion'] });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteQuote(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote'] });
    },
  });
}

export function useDeleteRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteRental(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental'] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service'] });
    },
  });
}

export function useDeleteServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteServiceCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceCategory'] });
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteSubscriptionPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptionPlan'] });
    },
  });
}

export function useDeleteTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteTaskChecklistItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskChecklistItem'] });
    },
  });
}

export function useDeleteTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteTaskComment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskComment'] });
    },
  });
}

export function useDeleteTaskResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).deleteTaskResource(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskResource'] });
    },
  });
}

export function useDeliveries(...args: any[]) {
  return useQuery({
    queryKey: ['deliveries', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDeliveries(...args);
      return res.data.data as any;
    },
  });
}

export function useDelivery(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: async () => {
      const res = await (apiClient as any).getDelivery(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useDeliveryStats(...args: any[]) {
  return useQuery({
    queryKey: ['deliveryStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDeliveryStats(...args);
      return res.data.data as any;
    },
  });
}

export function useDeliveryZones(...args: any[]) {
  return useQuery({
    queryKey: ['deliveryZones', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDeliveryZones(...args);
      return res.data.data as any;
    },
  });
}

export function useDispute(id: string) {
  return useQuery({
    queryKey: ['dispute', id],
    queryFn: async () => {
      const res = await (apiClient as any).getDisputeDetail(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useDisputeClientEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).disputeClientEscrow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientEscrow'] });
    },
  });
}

export function useDisputes(params?: any) {
  return useQuery({
    queryKey: ['disputes', params],
    queryFn: async () => {
      const res = await (apiClient as any).getDisputes(params);
      return res.data.data as any;
    },
  });
}

export function useDocument(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const res = await (apiClient as any).getDocument(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useDocuments(...args: any[]) {
  return useQuery({
    queryKey: ['documents', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDocuments(...args);
      return res.data.data as any;
    },
  });
}

export function useDrivers(...args: any[]) {
  return useQuery({
    queryKey: ['drivers', args],
    queryFn: async () => {
      const res = await (apiClient as any).getDrivers(...args);
      return res.data.data as any;
    },
  });
}

export function useDuplicateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).duplicateProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useDuplicateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).duplicateRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useDuplicateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).duplicateService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service'] });
    },
  });
}

export function useEmployeeAttendances(...args: any[]) {
  return useQuery({
    queryKey: ['employeeAttendances', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEmployeeAttendances(...args);
      return res.data.data as any;
    },
  });
}

export function useEmployeeRoles(...args: any[]) {
  return useQuery({
    queryKey: ['employeeRoles', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEmployeeRoles(...args);
      return res.data.data as any;
    },
  });
}

export function useEmployeeStats(...args: any[]) {
  return useQuery({
    queryKey: ['employeeStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEmployeeStats(...args);
      return res.data.data as any;
    },
  });
}

export function useEscrows(...args: any[]) {
  return useQuery({
    queryKey: ['escrows', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEscrows(...args);
      return res.data.data as any;
    },
  });
}

export function useEventDashboardStats(...args: any[]) {
  return useQuery({
    queryKey: ['eventDashboardStats'],
    queryFn: async () => {
      const res = await (apiClient as any).getEventDashboardStats();
      return res.data.data as any;
    },
  });
}

export function useEventGallery(...args: any[]) {
  return useQuery({
    queryKey: ['eventGallery', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventGallery(...args);
      return res.data.data as any;
    },
  });
}

export function useEventParticipants(...args: any[]) {
  return useQuery({
    queryKey: ['eventParticipants', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventParticipants(...args);
      return res.data.data as any;
    },
  });
}

export function useEventPartners(...args: any[]) {
  return useQuery({
    queryKey: ['eventPartners', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventPartners(...args);
      return res.data.data as any;
    },
  });
}

export function useEventPromotions(...args: any[]) {
  return useQuery({
    queryKey: ['eventPromotions', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventPromotions(...args);
      return res.data.data as any;
    },
  });
}

export function useEventScans(...args: any[]) {
  return useQuery({
    queryKey: ['eventScans', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventScans(...args);
      return res.data.data as any;
    },
  });
}

export function useEventStats(...args: any[]) {
  return useQuery({
    queryKey: ['eventStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventStats(...args);
      return res.data.data as any;
    },
  });
}

export function useEventTickets(...args: any[]) {
  return useQuery({
    queryKey: ['eventTickets', args],
    queryFn: async () => {
      const res = await (apiClient as any).getEventTickets(...args);
      return res.data.data as any;
    },
  });
}

export function useFavorites(...args: any[]) {
  return useQuery({
    queryKey: ['favorites', args],
    queryFn: async () => {
      const res = await (apiClient as any).getFavorites(...args);
      return res.data.data as any;
    },
  });
}

export function useFinanceStats(...args: any[]) {
  return useQuery({
    queryKey: ['financeStats'],
    queryFn: async () => {
      const res = await (apiClient as any).getFinanceStats();
      return res.data.data as any;
    },
  });
}

export function useInitiatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).initiatePayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment'] });
    },
  });
}

export function useInviteReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).inviteReferral(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referral'] });
    },
  });
}

export function useInvoice(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const res = await (apiClient as any).getInvoice(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useInvoices(...args: any[]) {
  return useQuery({
    queryKey: ['invoices', args],
    queryFn: async () => {
      const res = await (apiClient as any).getInvoices(...args);
      return res.data.data as any;
    },
  });
}

export function useKanbanBoard(...args: any[]) {
  return useQuery({
    queryKey: ['kanbanBoard'],
    queryFn: async () => {
      const res = await (apiClient as any).getKanbanBoard();
      return res.data.data as any;
    },
  });
}

export function useLoyaltyProgram(...args: any[]) {
  return useQuery({
    queryKey: ['loyaltyProgram', args],
    queryFn: async () => {
      const res = await (apiClient as any).getLoyaltyProgram(...args);
      return res.data.data as any;
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).markAllNotificationsRead(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificationsRead'] });
    },
  });
}

export function useMenuCategories(...args: any[]) {
  return useQuery({
    queryKey: ['menuCategories', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMenuCategories(...args);
      return res.data.data as any;
    },
  });
}

export function useMenuIngredients(...args: any[]) {
  return useQuery({
    queryKey: ['menuIngredients', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMenuIngredients(...args);
      return res.data.data as any;
    },
  });
}

export function useMenuOrderStats(...args: any[]) {
  return useQuery({
    queryKey: ['menuOrderStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMenuOrderStats(...args);
      return res.data.data as any;
    },
  });
}

export function useMenuStats(...args: any[]) {
  return useQuery({
    queryKey: ['menuStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMenuStats(...args);
      return res.data.data as any;
    },
  });
}

export function useMenuTables(...args: any[]) {
  return useQuery({
    queryKey: ['menuTables', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMenuTables(...args);
      return res.data.data as any;
    },
  });
}

export function useMessages(id: any, params?: any) {
  return useQuery({
    queryKey: ['messages', id, params],
    queryFn: async () => {
      const res = await (apiClient as any).getMessages(id, params);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyBusiness(...args: any[]) {
  return useQuery({
    queryKey: ['myBusiness', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyBusiness(...args);
      return res.data.data as any;
    },
  });
}

export function useMyBusinessBookings(...args: any[]) {
  return useQuery({
    queryKey: ['myBusinessBookings', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyBusinessBookings(...args);
      return res.data.data as any;
    },
  });
}

export function useMyBusinessOrder(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myBusinessOrder', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyBusinessOrder(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyBusinessOrders(...args: any[]) {
  return useQuery({
    queryKey: ['myBusinessOrders', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyBusinessOrders(...args);
      return res.data.data as any;
    },
  });
}

export function useMyEmployee(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myEmployee', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyEmployee(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyEmployees(...args: any[]) {
  return useQuery({
    queryKey: ['myEmployees', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyEmployees(...args);
      return res.data.data as any;
    },
  });
}

export function useMyEvent(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myEvent', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyEvent(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyEvents(...args: any[]) {
  return useQuery({
    queryKey: ['myEvents', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyEvents(...args);
      return res.data.data as any;
    },
  });
}

export function useMyFaqs(...args: any[]) {
  return useQuery({
    queryKey: ['myFaqs', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyFaqs(...args);
      return res.data.data as any;
    },
  });
}

export function useMyMenuItem(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myMenuItem', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyMenuItem(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyMenuItems(...args: any[]) {
  return useQuery({
    queryKey: ['myMenuItems', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyMenuItems(...args);
      return res.data.data as any;
    },
  });
}

export function useMyPortfolioItem(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myPortfolioItem', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyPortfolioItem(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyPortfolioItems(...args: any[]) {
  return useQuery({
    queryKey: ['myPortfolioItems', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyPortfolioItems(...args);
      return res.data.data as any;
    },
  });
}

export function useMyProduct(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myProduct', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyProduct(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyProducts(...args: any[]) {
  return useQuery({
    queryKey: ['myProducts', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyProducts(...args);
      return res.data.data as any;
    },
  });
}

export function useMyPromotion(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myPromotion', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyPromotion(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyPromotions(...args: any[]) {
  return useQuery({
    queryKey: ['myPromotions', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyPromotions(...args);
      return res.data.data as any;
    },
  });
}

export function useMyReferralCode(...args: any[]) {
  return useQuery({
    queryKey: ['myReferralCode', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyReferralCode(...args);
      return res.data.data as any;
    },
  });
}

export function useMyReferralRewards(...args: any[]) {
  return useQuery({
    queryKey: ['myReferralRewards', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyReferralRewards(...args);
      return res.data.data as any;
    },
  });
}

export function useMyReferrals(...args: any[]) {
  return useQuery({
    queryKey: ['myReferrals', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyReferrals(...args);
      return res.data.data as any;
    },
  });
}

export function useMyRental(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myRental', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyRental(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyRentals(...args: any[]) {
  return useQuery({
    queryKey: ['myRentals', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyRentals(...args);
      return res.data.data as any;
    },
  });
}

export function useMyRoom(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myRoom', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyRoom(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyRooms(...args: any[]) {
  return useQuery({
    queryKey: ['myRooms', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyRooms(...args);
      return res.data.data as any;
    },
  });
}

export function useMyService(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['myService', id],
    queryFn: async () => {
      const res = await (apiClient as any).getMyService(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useMyServices(...args: any[]) {
  return useQuery({
    queryKey: ['myServices', args],
    queryFn: async () => {
      const res = await (apiClient as any).getMyServices(...args);
      return res.data.data as any;
    },
  });
}

export function useNotificationPreferences(...args: any[]) {
  return useQuery({
    queryKey: ['notificationPreferences', args],
    queryFn: async () => {
      const res = await (apiClient as any).getNotificationPreferences(...args);
      return res.data.data as any;
    },
  });
}

export function useNotifications(...args: any[]) {
  return useQuery({
    queryKey: ['notifications', args],
    queryFn: async () => {
      const res = await (apiClient as any).getNotifications(...args);
      return res.data.data as any;
    },
  });
}

export function usePayClientDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).payClientDebt(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientDebt'] });
    },
  });
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const res = await (apiClient as any).getPayment(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function usePaymentStats(...args: any[]) {
  return useQuery({
    queryKey: ['paymentStats'],
    queryFn: async () => {
      const res = await (apiClient as any).getPaymentStats();
      return res.data.data as any;
    },
  });
}

export function usePayments(params?: any) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const res = await (apiClient as any).getPayments(params);
      return res.data.data as any;
    },
  });
}

export function usePlanningSchedules(...args: any[]) {
  return useQuery({
    queryKey: ['planningSchedules', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPlanningSchedules(...args);
      return res.data.data as any;
    },
  });
}

export function usePlanningStats(...args: any[]) {
  return useQuery({
    queryKey: ['planningStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPlanningStats(...args);
      return res.data.data as any;
    },
  });
}

export function usePlanningTask(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['planningTask', id],
    queryFn: async () => {
      const res = await (apiClient as any).getPlanningTask(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function usePlanningTasks(...args: any[]) {
  return useQuery({
    queryKey: ['planningTasks', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPlanningTasks(...args);
      return res.data.data as any;
    },
  });
}

export function usePortfolioCategories(...args: any[]) {
  return useQuery({
    queryKey: ['portfolioCategories', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPortfolioCategories(...args);
      return res.data.data as any;
    },
  });
}

export function usePortfolioStats(...args: any[]) {
  return useQuery({
    queryKey: ['portfolioStats'],
    queryFn: async () => {
      const res = await (apiClient as any).getPortfolioStats();
      return res.data.data as any;
    },
  });
}

export function useProductCategories(...args: any[]) {
  return useQuery({
    queryKey: ['productCategories', args],
    queryFn: async () => {
      const res = await (apiClient as any).getProductCategories(...args);
      return res.data.data as any;
    },
  });
}

export function useProductStats(...args: any[]) {
  return useQuery({
    queryKey: ['productStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getProductStats(...args);
      return res.data.data as any;
    },
  });
}

export function useProfile(...args: any[]) {
  return useQuery({
    queryKey: ['profile', args],
    queryFn: async () => {
      const res = await (apiClient as any).getProfile(...args);
      return res.data.data as any;
    },
  });
}

export function useProlongRentalBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).prolongRentalBooking(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentalBooking'] });
    },
  });
}

export function usePromoBundles(...args: any[]) {
  return useQuery({
    queryKey: ['promoBundles', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPromoBundles(...args);
      return res.data.data as any;
    },
  });
}

export function usePromoCampaigns(...args: any[]) {
  return useQuery({
    queryKey: ['promoCampaigns', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPromoCampaigns(...args);
      return res.data.data as any;
    },
  });
}

export function usePromoCoupons(...args: any[]) {
  return useQuery({
    queryKey: ['promoCoupons', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPromoCoupons(...args);
      return res.data.data as any;
    },
  });
}

export function usePromoStats(...args: any[]) {
  return useQuery({
    queryKey: ['promoStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPromoStats(...args);
      return res.data.data as any;
    },
  });
}

export function usePublicBusinessFaqs(...args: any[]) {
  return useQuery({
    queryKey: ['publicBusinessFaqs', args],
    queryFn: async () => {
      const res = await (apiClient as any).getPublicBusinessFaqs(...args);
      return res.data.data as any;
    },
  });
}

export function useQuote(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const res = await (apiClient as any).getQuote(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useQuotes(...args: any[]) {
  return useQuery({
    queryKey: ['quotes', args],
    queryFn: async () => {
      const res = await (apiClient as any).getQuotes(...args);
      return res.data.data as any;
    },
  });
}

export function useReferralStats(...args: any[]) {
  return useQuery({
    queryKey: ['referralStats'],
    queryFn: async () => {
      const res = await (apiClient as any).getReferralStats();
      return res.data.data as any;
    },
  });
}

export function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).refundEscrow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escrow'] });
    },
  });
}

export function useRegisterDebtPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).registerDebtPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debtPayment'] });
    },
  });
}

export function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).releaseEscrow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escrow'] });
    },
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).removeCoupon(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupon'] });
    },
  });
}

export function useRemoveEventPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).removeEventPartner(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['eventPartner'] });
    },
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).removeFavorite(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorite'] });
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).removeFromCart(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fromCart'] });
    },
  });
}

export function useRentalStats(...args: any[]) {
  return useQuery({
    queryKey: ['rentalStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getRentalStats(...args);
      return res.data.data as any;
    },
  });
}

export function useRequestTaskValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).requestTaskValidation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskValidation'] });
    },
  });
}

export function useReviews(...args: any[]) {
  return useQuery({
    queryKey: ['reviews', args],
    queryFn: async () => {
      try {
        const res = await (apiClient as any).getReviews(...args);
        return (res?.data?.data ?? { reviews: [] }) as any;
      } catch {
        return { reviews: [] };
      }
    },
  });
}

export function useRoomPlanning(...args: any[]) {
  return useQuery({
    queryKey: ['roomPlanning', args],
    queryFn: async () => {
      const res = await (apiClient as any).getRoomPlanning(...args);
      return res.data.data as any;
    },
  });
}

export function useRoomStats(...args: any[]) {
  return useQuery({
    queryKey: ['roomStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getRoomStats(...args);
      return res.data.data as any;
    },
  });
}

export function useScanTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).scanTicket(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket'] });
    },
  });
}

export function useSendDebtReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).sendDebtReminder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debtReminder'] });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).sendMessage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['message'] });
    },
  });
}

export function useServiceCategories(...args: any[]) {
  return useQuery({
    queryKey: ['serviceCategories', args],
    queryFn: async () => {
      const res = await (apiClient as any).getServiceCategories(...args);
      return res.data.data as any;
    },
  });
}

export function useServiceStats(...args: any[]) {
  return useQuery({
    queryKey: ['serviceStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getServiceStats(...args);
      return res.data.data as any;
    },
  });
}

export function useStartTaskTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).startTaskTimer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskTimer'] });
    },
  });
}

export function useStockAlerts(...args: any[]) {
  return useQuery({
    queryKey: ['stockAlerts'],
    queryFn: async () => {
      const res = await (apiClient as any).getStockAlerts();
      return res.data.data as any;
    },
  });
}

export function useStopTaskTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).stopTaskTimer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskTimer'] });
    },
  });
}

export function useSubscribers(...args: any[]) {
  return useQuery({
    queryKey: ['subscribers', args],
    queryFn: async () => {
      const res = await (apiClient as any).getSubscribers(...args);
      return res.data.data as any;
    },
  });
}

export function useSubscriptionPlan(id: any, ...extra: any[]) {
  return useQuery({
    queryKey: ['subscriptionPlan', id],
    queryFn: async () => {
      const res = await (apiClient as any).getSubscriptionPlan(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}

export function useSubscriptionPlans(...args: any[]) {
  return useQuery({
    queryKey: ['subscriptionPlans', args],
    queryFn: async () => {
      const res = await (apiClient as any).getSubscriptionPlans(...args);
      return res.data.data as any;
    },
  });
}

export function useSubscriptionStats(...args: any[]) {
  return useQuery({
    queryKey: ['subscriptionStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getSubscriptionStats(...args);
      return res.data.data as any;
    },
  });
}

export function useTaskCategories(...args: any[]) {
  return useQuery({
    queryKey: ['taskCategories', args],
    queryFn: async () => {
      const res = await (apiClient as any).getTaskCategories(...args);
      return res.data.data as any;
    },
  });
}

export function useTaskHistory(...args: any[]) {
  return useQuery({
    queryKey: ['taskHistory', args],
    queryFn: async () => {
      const res = await (apiClient as any).getTaskHistory(...args);
      return res.data.data as any;
    },
  });
}

export function useTaskStats(...args: any[]) {
  return useQuery({
    queryKey: ['taskStats', args],
    queryFn: async () => {
      const res = await (apiClient as any).getTaskStats(...args);
      return res.data.data as any;
    },
  });
}

export function useToggleMenuItemActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).toggleMenuItemActive(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuItemActive'] });
    },
  });
}

export function useToggleProductActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).toggleProductActive(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productActive'] });
    },
  });
}

export function useToggleRentalActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).toggleRentalActive(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rentalActive'] });
    },
  });
}

export function useToggleRoomActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).toggleRoomActive(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roomActive'] });
    },
  });
}

export function useToggleServiceActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).toggleServiceActive(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceActive'] });
    },
  });
}

export function useToggleTaskChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).toggleTaskChecklistItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskChecklistItem'] });
    },
  });
}

export function useUnreadCount(...args: any[]) {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const res = await (apiClient as any).getUnreadCount();
      return res.data.data as any;
    },
  });
}

export function useUpdateAdvancedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateAdvancedTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['advancedTask'] });
    },
  });
}

export function useUpdateBizLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateBizLesson(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizLesson'] });
    },
  });
}

export function useUpdateBizTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateBizTraining(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bizTraining'] });
    },
  });
}

export function useUpdateBusinessOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateBusinessOrderStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['businessOrderStatus'] });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateCartItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartItem'] });
    },
  });
}

export function useUpdateClientRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateClientRisk(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientRisk'] });
    },
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDebt(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debt'] });
    },
  });
}

export function useUpdateDebtPriority() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDebtPriority(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['debtPriority'] });
    },
  });
}

export function useUpdateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDelivery(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery'] });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDeliveryStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveryStatus'] });
    },
  });
}

export function useUpdateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDeliveryZone(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveryZone'] });
    },
  });
}

export function useUpdateDisputeStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDisputeStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disputeStatus'] });
    },
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDocument(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document'] });
    },
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateDriver(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver'] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee'] });
    },
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateFaq(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faq'] });
    },
  });
}

export function useUpdateInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateInvoicePayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoicePayment'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateInvoiceStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoiceStatus'] });
    },
  });
}

export function useUpdateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateMenuCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuCategory'] });
    },
  });
}

export function useUpdateMenuIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateMenuIngredient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuIngredient'] });
    },
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateMenuItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuItem'] });
    },
  });
}

export function useUpdateMenuOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateMenuOrderStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuOrderStatus'] });
    },
  });
}

export function useUpdateMenuTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateMenuTable(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuTable'] });
    },
  });
}

export function useUpdateMenuTableStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateMenuTableStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menuTableStatus'] });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateNotificationPreferences(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateOrder(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export function useUpdateParticipantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateParticipantStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['participantStatus'] });
    },
  });
}

export function useUpdatePlanningTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updatePlanningTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planningTask'] });
    },
  });
}

export function useUpdatePortfolioItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updatePortfolioItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolioItem'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateProductCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productCategory'] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updatePromotion(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotion'] });
    },
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateQuote(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote'] });
    },
  });
}

export function useUpdateQuoteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateQuoteStatus(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quoteStatus'] });
    },
  });
}

export function useUpdateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateRental(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental'] });
    },
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service'] });
    },
  });
}

export function useUpdateServiceCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateServiceCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['serviceCategory'] });
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => (apiClient as any).updateSubscriptionPlan(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptionPlan'] });
    },
  });
}

export function useWallet(...args: any[]) {
  return useQuery({
    queryKey: ['wallet', args],
    queryFn: async () => {
      const res = await (apiClient as any).getWallet(...args);
      return res.data.data as any;
    },
  });
}

// ===== ADDITIONAL MISSING HOOKS =====

export function useMenuOrders(params?: any) {
  return useQuery({
    queryKey: ['menuOrders', params],
    queryFn: async () => {
      const res = await (apiClient as any).getMenuOrders(params);
      return res.data.data as any;
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await (apiClient as any).getOrder(id);
      return res.data.data as any;
    },
    enabled: !!id,
  });
}
