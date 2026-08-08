import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '@/lib/config';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiClient {
  private instance: AxiosInstance;

  // Base HTTP methods — permet aux hooks d'appeler directement l'API
  async get<T = ApiResponse>(url: string, config?: Record<string, unknown>) {
    return this.instance.get<T>(url, config);
  }
  async post<T = ApiResponse>(url: string, data?: unknown, config?: Record<string, unknown>) {
    return this.instance.post<T>(url, data, config);
  }
  async put<T = ApiResponse>(url: string, data?: unknown, config?: Record<string, unknown>) {
    return this.instance.put<T>(url, data, config);
  }
  async patch<T = ApiResponse>(url: string, data?: unknown, config?: Record<string, unknown>) {
    return this.instance.patch<T>(url, data, config);
  }
  async delete<T = ApiResponse>(url: string, config?: Record<string, unknown>) {
    return this.instance.delete<T>(url, config);
  }

  // Dynamic API router — toute méthode non définie est automatiquement routée
  // Ex: apiClient.getProducts() → GET /business/products
  // Ex: apiClient.adminGetUsers() → GET /admin/users
  // Ex: apiClient.createProduct(data) → POST /business/products
  [key: string]: any;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Mode maintenance : rediriger vers la page /maintenance (une seule fois)
        if (
          error.response?.status === 503 &&
          error.response?.data?.error === 'MAINTENANCE_MODE' &&
          !window.location.pathname.startsWith('/maintenance')
        ) {
          window.location.href = '/maintenance';
        }

        // If 401 and not a retry, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.instance.post<
                ApiResponse<{
                  accessToken: string;
                  refreshToken: string;
                }>
              >('/auth/refresh', {
                refreshToken,
              });

              if (response.data.success && response.data.data) {
                // setTokens synchronise store + localStorage + cookies (même logique que le login) —
                // sans ça le middleware voit un vieux cookie et on boucle /dashboard ⇄ /login
                useAuthStore
                  .getState()
                  .setTokens(response.data.data.accessToken, response.data.data.refreshToken);

                originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
                return this.instance(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh échoué → logout complet (y compris le store persisté 'auth-storage',
            // sinon AuthGuard restaure de vieux tokens et on boucle /dashboard ⇄ /login)
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(data: any) {
    return this.instance.post<ApiResponse>('/auth/signup', data);
  }

  async login(data: { identifier: string; password: string; rememberMe?: boolean }) {
    return this.instance.post<ApiResponse>('/auth/login', data);
  }

  async logout() {
    return this.instance.post<ApiResponse>('/auth/logout');
  }

  async forgotPassword(email: string) {
    return this.instance.post<ApiResponse>('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string) {
    return this.instance.post<ApiResponse>('/auth/reset-password', {
      token,
      password,
    });
  }

  async verifyEmail(token: string) {
    return this.instance.post<ApiResponse>('/auth/verify-email', { token });
  }

  async resendVerification(email: string) {
    return this.instance.post<ApiResponse>('/auth/resend-verification', { email });
  }

  async sendOTP(email: string, type: string) {
    return this.instance.post<ApiResponse>('/auth/send-otp', { email, type });
  }

  async verifyOTP(email: string, code: string, type: string) {
    return this.instance.post<ApiResponse>('/auth/verify-otp', { email, code, type });
  }

  async getSessions() {
    return this.instance.get<ApiResponse>('/auth/sessions');
  }

  async revokeSession(sessionId: string) {
    return this.instance.delete<ApiResponse>(`/auth/sessions/${sessionId}`);
  }

  async activateBusinessRole() {
    return this.instance.post<ApiResponse>('/auth/activate-business');
  }

  async activateDeveloperRole() {
    return this.instance.post<ApiResponse>('/auth/activate-developer');
  }
  // Dashboard endpoints
  async getClientDashboard() {
    return this.instance.get<ApiResponse>('/dashboard/client');
  }

  async getBusinessDashboard(businessId: string) {
    return this.instance.get<ApiResponse>(`/dashboard/business?businessId=${businessId}`);
  }

  async getDeveloperDashboard() {
    return this.instance.get<ApiResponse>('/dashboard/developer');
  }

  async getAdminDashboard() {
    return this.instance.get<ApiResponse>('/dashboard/admin');
  }

  // CRM
  async getCrmDashboardStats() {
    return this.instance.get<ApiResponse>('/business/crm/dashboard');
  }

  async getCrmClients(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/crm/clients', { params });
  }

  async getCrmClientDetail(clientId: string) {
    return this.instance.get<ApiResponse>(`/business/crm/clients/${clientId}`);
  }

  async getCustomer360(clientId: string) {
    return this.instance.get<ApiResponse>(`/business/crm/clients/${clientId}/360`);
  }

  async trackPageView(data: {
    userId?: string;
    visitorId?: string;
    referrer?: string;
    duration?: number;
  }) {
    return this.instance.post<ApiResponse>('/business/crm/track/page-view', data);
  }

  async trackProductView(data: {
    productId: string;
    userId?: string;
    visitorId?: string;
    referrer?: string;
    source?: string;
  }) {
    return this.instance.post<ApiResponse>('/business/crm/track/product-view', data);
  }

  async trackProductClick(data: {
    productId: string;
    userId?: string;
    visitorId?: string;
    source?: string;
  }) {
    return this.instance.post<ApiResponse>('/business/crm/track/product-click', data);
  }

  async createCrmClientNote(clientId: string, content: string) {
    return this.instance.post<ApiResponse>(`/business/crm/clients/${clientId}/notes`, { content });
  }

  async updateCrmClientNote(noteId: string, content: string) {
    return this.instance.put<ApiResponse>(`/business/crm/clients/notes/${noteId}`, { content });
  }

  async deleteCrmClientNote(noteId: string) {
    return this.instance.delete<ApiResponse>(`/business/crm/clients/notes/${noteId}`);
  }

  async getCrmTags() {
    return this.instance.get<ApiResponse>('/business/crm/tags');
  }

  async createCrmTag(name: string, color?: string) {
    return this.instance.post<ApiResponse>('/business/crm/tags', { name, color });
  }

  async deleteCrmTag(tagId: string) {
    return this.instance.delete<ApiResponse>(`/business/crm/tags/${tagId}`);
  }

  async assignCrmTag(clientId: string, tagId: string) {
    return this.instance.post<ApiResponse>(`/business/crm/clients/${clientId}/tags`, { tagId });
  }

  async removeCrmTag(clientId: string, tagId: string) {
    return this.instance.delete<ApiResponse>(`/business/crm/clients/${clientId}/tags/${tagId}`);
  }

  async getCrmSegments() {
    return this.instance.get<ApiResponse>('/business/crm/segments');
  }

  async createCrmSegment(data: {
    name: string;
    description?: string;
    color?: string;
    conditions?: unknown;
    isDynamic?: boolean;
  }) {
    return this.instance.post<ApiResponse>('/business/crm/segments', data);
  }

  async updateCrmSegment(segmentId: string, data: unknown) {
    return this.instance.put<ApiResponse>(`/business/crm/segments/${segmentId}`, data);
  }

  async deleteCrmSegment(segmentId: string) {
    return this.instance.delete<ApiResponse>(`/business/crm/segments/${segmentId}`);
  }

  async recalculateCrmSegment(segmentId: string) {
    return this.instance.post<ApiResponse>(`/business/crm/segments/${segmentId}/recalculate`);
  }

  async assignClientToSegment(clientId: string, segmentId: string) {
    return this.instance.post<ApiResponse>(`/business/crm/clients/${clientId}/segments`, {
      segmentId,
    });
  }

  async removeClientFromSegment(clientId: string, segmentId: string) {
    return this.instance.delete<ApiResponse>(
      `/business/crm/clients/${clientId}/segments/${segmentId}`
    );
  }

  // Business
  async getBusiness() {
    return this.instance.get<ApiResponse>('/business/me');
  }

  async getBusinessStats() {
    return this.instance.get<ApiResponse>('/business/stats');
  }

  // Finance - Quotes & Invoices
  async getQuotes(params?: { status?: string; page?: number; limit?: number }) {
    return this.instance.get<ApiResponse>('/business/finance/quotes', { params });
  }

  async getQuote(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/quotes/${id}`);
  }

  async createQuote(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/finance/quotes', data);
  }

  async updateQuote(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/finance/quotes/${id}`, data);
  }

  async updateQuoteStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/finance/quotes/${id}/status`, { status });
  }

  async convertQuoteToInvoice(id: string) {
    return this.instance.post<ApiResponse>(`/business/finance/quotes/${id}/convert`);
  }

  async deleteQuote(id: string) {
    return this.instance.delete<ApiResponse>(`/business/finance/quotes/${id}`);
  }

  async getInvoices(params?: { status?: string; page?: number; limit?: number }) {
    return this.instance.get<ApiResponse>('/business/finance/invoices', { params });
  }

  async getInvoice(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/invoices/${id}`);
  }

  async createInvoice(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/finance/invoices', data);
  }

  async updateInvoiceStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/finance/invoices/${id}/status`, { status });
  }

  async updateInvoicePayment(id: string, data: Record<string, unknown>) {
    return this.instance.patch<ApiResponse>(`/business/finance/invoices/${id}/payment`, data);
  }

  async deleteInvoice(id: string) {
    return this.instance.delete<ApiResponse>(`/business/finance/invoices/${id}`);
  }

  async getFinanceStats() {
    return this.instance.get<ApiResponse>('/business/finance/stats');
  }

  // Client-facing invoices & quotes
  async getClientQuotes(params?: { status?: string; page?: number; limit?: number }) {
    return this.instance.get<ApiResponse>('/client/finance/quotes', { params });
  }
  async getClientQuote(id: string) {
    return this.instance.get<ApiResponse>(`/client/finance/quotes/${id}`);
  }
  async getClientInvoices(params?: { status?: string; page?: number; limit?: number }) {
    return this.instance.get<ApiResponse>('/client/finance/invoices', { params });
  }
  async getClientInvoice(id: string) {
    return this.instance.get<ApiResponse>(`/client/finance/invoices/${id}`);
  }
  async getClientInvoiceStats() {
    return this.instance.get<ApiResponse>('/client/finance/invoices/stats');
  }

  // Products
  async getMyProducts(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/products', { params });
  }
  async getMyProduct(id: string) {
    return this.instance.get<ApiResponse>(`/business/products/${id}`);
  }
  async createProduct(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/products', data);
  }
  async updateProduct(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/products/${id}`, data);
  }
  async deleteProduct(id: string) {
    return this.instance.delete<ApiResponse>(`/business/products/${id}`);
  }
  async toggleProductActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/products/${id}/toggle`);
  }
  async getProductCategories() {
    return this.instance.get<ApiResponse>('/business/products/categories');
  }
  async getProductStats() {
    return this.instance.get<ApiResponse>('/business/products/stats');
  }

  // Services
  async getMyServices(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/services', { params });
  }
  async getMyService(id: string) {
    return this.instance.get<ApiResponse>(`/business/services/${id}`);
  }
  async createService(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/services', data);
  }
  async updateService(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/services/${id}`, data);
  }
  async deleteService(id: string) {
    return this.instance.delete<ApiResponse>(`/business/services/${id}`);
  }
  async toggleServiceActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/services/${id}/toggle`);
  }
  async getServiceCategories() {
    return this.instance.get<ApiResponse>('/business/services/categories');
  }
  async getServiceStats() {
    return this.instance.get<ApiResponse>('/business/services/stats');
  }

  // Orders
  async getOrders(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/orders', { params });
  }
  async getOrder(id: string) {
    return this.instance.get<ApiResponse>(`/business/orders/${id}`);
  }
  async updateOrderStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/orders/${id}/status`, { status });
  }

  // Public Business
  async getPublicBusiness(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}`);
  }
  async getBusinessProducts(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/products`);
  }
  async getBusinessServices(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/services`);
  }
  async getBusinessMenu(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/menu`);
  }
  async getBusinessRooms(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/rooms`);
  }
  async getBusinessEvents(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/events`);
  }
  async getBusinessRentals(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/rentals`);
  }
  async getBusinessPortfolio(slug: string) {
    return this.instance.get<ApiResponse>(`/business/public/${slug}/portfolio`);
  }

  // Bookings
  async getBookings(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/bookings', { params });
  }
  async getBooking(id: string) {
    return this.instance.get<ApiResponse>(`/bookings/${id}`);
  }
  async getMyBusinessBookings(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/bookings', { params });
  }
  async createBusinessBooking(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/bookings', data);
  }
  async getBookingResources() {
    return this.instance.get<ApiResponse>('/business/bookings/resources');
  }
  async createBookingResource(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/bookings/resources', data);
  }
  async updateBookingResource(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/bookings/resources/${id}`, data);
  }
  async deleteBookingResource(id: string) {
    return this.instance.delete<ApiResponse>(`/business/bookings/resources/${id}`);
  }
  async getBookingSlots(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/bookings/slots', { params });
  }
  async createBookingSlot(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/bookings/slots', data);
  }
  async updateBookingSlot(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/bookings/slots/${id}`, data);
  }
  async deleteBookingSlot(id: string) {
    return this.instance.delete<ApiResponse>(`/business/bookings/slots/${id}`);
  }
  async getBookingCalendar(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/bookings/calendar', { params });
  }

  // Expenses & Accounting
  async getExpenses(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/accounting/expenses', { params });
  }
  async getExpense(id: string) {
    return this.instance.get<ApiResponse>(`/business/accounting/expenses/${id}`);
  }
  async createExpense(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/accounting/expenses', data);
  }
  async updateExpense(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/accounting/expenses/${id}`, data);
  }
  async deleteExpense(id: string) {
    return this.instance.delete<ApiResponse>(`/business/accounting/expenses/${id}`);
  }
  async getAccountingStats() {
    return this.instance.get<ApiResponse>('/business/accounting/stats');
  }
  async getMonthlyReport(year: number, month: number) {
    return this.instance.get<ApiResponse>(`/business/accounting/reports/monthly/${year}/${month}`);
  }
  async getBalanceSheet(year: number) {
    return this.instance.get<ApiResponse>(`/business/accounting/reports/balance/${year}`);
  }
  async getIncomeStatement(year: number) {
    return this.instance.get<ApiResponse>(`/business/accounting/reports/income/${year}`);
  }

  // Deliveries
  async getDeliveries(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/delivery', { params });
  }
  async getDelivery(id: string) {
    return this.instance.get<ApiResponse>(`/business/delivery/${id}`);
  }
  async createDelivery(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/delivery', data);
  }
  async updateDelivery(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/delivery/${id}`, data);
  }
  async updateDeliveryStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/delivery/${id}/status`, { status });
  }
  async getDeliveryStats() {
    return this.instance.get<ApiResponse>('/business/delivery/stats');
  }
  async getDeliveryZones() {
    return this.instance.get<ApiResponse>('/business/delivery/zones');
  }
  async createDeliveryZone(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/delivery/zones', data);
  }
  async deleteDeliveryZone(id: string) {
    return this.instance.delete<ApiResponse>(`/business/delivery/zones/${id}`);
  }
  async updateDeliveryZone(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/delivery/zones/${id}`, data);
  }

  // Tasks
  async getAdvancedTasks(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/tasks', { params });
  }
  async getAdvancedTask(id: string) {
    return this.instance.get<ApiResponse>(`/business/tasks/${id}`);
  }
  async createAdvancedTask(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/tasks', data);
  }
  async updateAdvancedTask(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/tasks/${id}`, data);
  }
  async deleteAdvancedTask(id: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/${id}`);
  }
  async getKanbanBoard(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/tasks/kanban', { params });
  }
  async addTaskChecklistItem(taskId: string, data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>(`/business/tasks/${taskId}/checklist`, data);
  }
  async toggleTaskChecklistItem(taskId: string, itemId: string) {
    return this.instance.patch<ApiResponse>(`/business/tasks/${taskId}/checklist/${itemId}`);
  }
  async deleteTaskChecklistItem(taskId: string, itemId: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/${taskId}/checklist/${itemId}`);
  }
  async addTaskComment(taskId: string, data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>(`/business/tasks/${taskId}/comments`, data);
  }
  async deleteTaskComment(taskId: string, commentId: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/${taskId}/comments/${commentId}`);
  }
  async startTaskTimer(taskId: string) {
    return this.instance.post<ApiResponse>(`/business/tasks/${taskId}/timer`);
  }

  async getTaskCategories() {
    return this.instance.get<ApiResponse>('/business/tasks/categories');
  }

  // Rooms
  async getMyRooms(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/rooms', { params });
  }
  async getMyRoom(id: string) {
    return this.instance.get<ApiResponse>(`/business/rooms/${id}`);
  }
  async createRoom(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/rooms', data);
  }
  async updateRoom(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/rooms/${id}`, data);
  }
  async deleteRoom(id: string) {
    return this.instance.delete<ApiResponse>(`/business/rooms/${id}`);
  }
  async toggleRoomActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/rooms/${id}/toggle`);
  }
  async getRoomStats() {
    return this.instance.get<ApiResponse>('/business/rooms/stats');
  }

  // Debts
  async getDebts(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/finance/debts', { params });
  }
  async getDebt(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/debts/${id}`);
  }
  async createDebt(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/finance/debts', data);
  }
  async updateDebt(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/finance/debts/${id}`, data);
  }
  async updateDebtPriority(id: string, priority: string) {
    return this.instance.patch<ApiResponse>(`/business/finance/debts/${id}/priority`, { priority });
  }
  async deleteDebt(id: string) {
    return this.instance.delete<ApiResponse>(`/business/finance/debts/${id}`);
  }
  async registerDebtPayment(id: string, data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>(`/business/finance/debts/${id}/payments`, data);
  }
  async sendDebtReminder(debtId: string) {
    return this.instance.post<ApiResponse>(`/business/finance/debts/${debtId}/remind`);
  }

  // Escrow
  async getEscrows(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/finance/escrow', { params });
  }
  async getEscrowById(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/escrow/${id}`);
  }
  async getEscrowStats() {
    return this.instance.get<ApiResponse>('/business/finance/escrow/stats');
  }
  async createEscrow(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/finance/escrow', data);
  }
  async releaseEscrow(id: string) {
    return this.instance.post<ApiResponse>(`/business/finance/escrow/${id}/release`);
  }
  async refundEscrow(id: string) {
    return this.instance.post<ApiResponse>(`/business/finance/escrow/${id}/refund`);
  }
  async disputeEscrow(id: string) {
    return this.instance.post<ApiResponse>(`/business/finance/escrow/${id}/dispute`);
  }

  // Cart
  async getCart() {
    return this.instance.get<ApiResponse>('/cart');
  }
  async addToCart(data: { productId: string; quantity: number; variantId?: string }) {
    return this.instance.post<ApiResponse>('/cart', data);
  }
  async updateCartItem(itemId: string, data: { quantity: number }) {
    return this.instance.put<ApiResponse>(`/cart/${itemId}`, data);
  }
  async removeFromCart(itemId: string) {
    return this.instance.delete<ApiResponse>(`/cart/${itemId}`);
  }
  async clearCart() {
    return this.instance.delete<ApiResponse>('/cart');
  }
  async checkout(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/cart/checkout', data);
  }
  async applyCoupon(code: string) {
    return this.instance.post<ApiResponse>('/cart/coupon', { code });
  }
  async removeCoupon() {
    return this.instance.delete<ApiResponse>('/cart/coupon');
  }

  // Promotions
  async getMyPromotions(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/promotions', { params });
  }
  async getMyPromotion(id: string) {
    return this.instance.get<ApiResponse>(`/business/promotions/${id}`);
  }
  async createPromotion(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/promotions', data);
  }
  async updatePromotion(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/promotions/${id}`, data);
  }
  async deletePromotion(id: string) {
    return this.instance.delete<ApiResponse>(`/business/promotions/${id}`);
  }
  async getPromoStats() {
    return this.instance.get<ApiResponse>('/business/promotions/stats');
  }
  async getPromoCoupons(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/promotions/coupons', { params });
  }
  async getPromoBundles(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/promotions/bundles', { params });
  }
  async getPromoCampaigns(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/promotions/campaigns', { params });
  }
  async getLoyaltyProgram() {
    return this.instance.get<ApiResponse>('/business/promotions/loyalty');
  }

  // Rentals
  async getMyRentals(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/rentals', { params });
  }
  async getMyRental(id: string) {
    return this.instance.get<ApiResponse>(`/business/rentals/${id}`);
  }
  async createRental(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/rentals', data);
  }
  async updateRental(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/rentals/${id}`, data);
  }
  async deleteRental(id: string) {
    return this.instance.delete<ApiResponse>(`/business/rentals/${id}`);
  }
  async getRentalStats() {
    return this.instance.get<ApiResponse>('/business/rentals/stats');
  }
  async createRentalBooking(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/rentals/bookings', data);
  }
  async prolongRentalBooking(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/rentals/bookings/${id}/prolong`, data);
  }

  // Service Categories
  async createServiceCategory(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/services/categories', data);
  }
  async updateServiceCategory(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/services/categories/${id}`, data);
  }
  async deleteServiceCategory(id: string) {
    return this.instance.delete<ApiResponse>(`/business/services/categories/${id}`);
  }

  // Drivers
  async getDrivers(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/delivery/drivers', { params });
  }
  async createDriver(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/delivery/drivers', data);
  }
  async updateDriver(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/delivery/drivers/${id}`, data);
  }
  async deleteDriver(id: string) {
    return this.instance.delete<ApiResponse>(`/business/delivery/drivers/${id}`);
  }
  async assignDriver(id: string, data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>(`/business/delivery/drivers/${id}/assign`, data);
  }

  // Bookings extra
  async getMyBusinessBooking(id: string) {
    return this.instance.get<ApiResponse>(`/business/bookings/${id}`);
  }

  // Referrals
  async getMyReferralCode() {
    return this.instance.get<ApiResponse>('/referral/code');
  }
  async inviteReferral(email: string) {
    return this.instance.post<ApiResponse>('/referral/invite', { email });
  }
  async getMyReferrals() {
    return this.instance.get<ApiResponse>('/referral/list');
  }
  async getMyReferralRewards() {
    return this.instance.get<ApiResponse>('/referral/rewards');
  }
  async getReferralStats() {
    return this.instance.get<ApiResponse>('/referral/stats');
  }

  // Reviews
  async getReviews(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/reviews', { params });
  }
  async createReview(data: FormData | Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/reviews', data);
  }

  // Documents
  async getDocuments(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/documents', { params });
  }
  async getDocument(id: string) {
    return this.instance.get<ApiResponse>(`/business/documents/${id}`);
  }
  async createDocument(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/documents', data);
  }
  async updateDocument(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/documents/${id}`, data);
  }
  async deleteDocument(id: string) {
    return this.instance.delete<ApiResponse>(`/business/documents/${id}`);
  }
  async getDocumentStats() {
    return this.instance.get<ApiResponse>('/business/documents/stats');
  }

  // Disputes
  async getDisputes(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/disputes', { params });
  }
  async getDisputeDetail(id: string) {
    return this.instance.get<ApiResponse>(`/business/disputes/${id}`);
  }
  async createDispute(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/disputes', data);
  }

  // Subscriptions
  async getSubscriptionPlans() {
    return this.instance.get<ApiResponse>('/business/subscriptions/plans');
  }
  async getSubscriptionPlan(id: string) {
    return this.instance.get<ApiResponse>(`/business/subscriptions/plans/${id}`);
  }
  async createSubscriptionPlan(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/subscriptions/plans', data);
  }
  async updateSubscriptionPlan(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/subscriptions/plans/${id}`, data);
  }
  async deleteSubscriptionPlan(id: string) {
    return this.instance.delete<ApiResponse>(`/business/subscriptions/plans/${id}`);
  }
  async getSubscribers(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/subscriptions/subscribers', { params });
  }
  async getSubscriptionStats() {
    return this.instance.get<ApiResponse>('/business/subscriptions/stats');
  }

  // Trainings
  async getBizTrainings(params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>('/business/trainings', { params });
  }
  async getBizTraining(id: string) {
    return this.instance.get<ApiResponse>(`/business/trainings/${id}`);
  }
  async createBizTraining(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/trainings', data);
  }
  async updateBizTraining(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/trainings/${id}`, data);
  }
  async deleteBizTraining(id: string) {
    return this.instance.delete<ApiResponse>(`/business/trainings/${id}`);
  }
  async getBizTrainingStudents(trainingId: string, params?: Record<string, unknown>) {
    return this.instance.get<ApiResponse>(`/business/trainings/${trainingId}/students`, { params });
  }
  async getBizTrainingStats() {
    return this.instance.get<ApiResponse>('/business/trainings/stats');
  }
  async getBizTrainingLessons(trainingId: string) {
    return this.instance.get<ApiResponse>(`/business/trainings/${trainingId}/lessons`);
  }
  async createBizTrainingLesson(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/trainings/lessons', data);
  }
  async updateBizTrainingLesson(id: string, data: Record<string, unknown>) {
    return this.instance.put<ApiResponse>(`/business/trainings/lessons/${id}`, data);
  }
  async deleteBizTrainingLesson(id: string) {
    return this.instance.delete<ApiResponse>(`/business/trainings/lessons/${id}`);
  }
  async enrollInTraining(id: string) {
    return this.instance.post<ApiResponse>(`/business/trainings/${id}/enroll`);
  }

  // Products extra
  async duplicateProduct(id: string) {
    return this.instance.post<ApiResponse>(`/business/products/${id}/duplicate`);
  }
  async bulkDeleteProducts(ids: string[]) {
    return this.instance.post<ApiResponse>('/business/products/bulk-delete', { ids });
  }
  async bulkToggleProducts(ids: string[], isActive: boolean) {
    return this.instance.post<ApiResponse>('/business/products/bulk-toggle', { ids, isActive });
  }
  async duplicateService(id: string) {
    return this.instance.post<ApiResponse>(`/business/services/${id}/duplicate`);
  }
  async bulkDeleteServices(ids: string[]) {
    return this.instance.post<ApiResponse>('/business/services/bulk-delete', { ids });
  }
  async bulkToggleServices(ids: string[], isActive: boolean) {
    return this.instance.post<ApiResponse>('/business/services/bulk-toggle', { ids, isActive });
  }

  // Payment Methods
  async getBusinessPaymentMethods() {
    return this.instance.get<ApiResponse>('/business/payment-methods');
  }
  async addBusinessPaymentMethod(data: Record<string, unknown>) {
    return this.instance.post<ApiResponse>('/business/payment-methods', data);
  }
  async deleteBusinessPaymentMethod(id: string) {
    return this.instance.delete<ApiResponse>(`/business/payment-methods/${id}`);
  }

  // Search
  async searchMarketplace(params: { q: string; limit?: number }) {
    return this.instance.get<ApiResponse>('/marketplace/search', { params });
  }

  // Price Distribution
  async getPriceDistribution(params?: { type?: string; category?: string }) {
    return this.instance.get<ApiResponse>('/marketplace/price-distribution', { params });
  }
}

export const apiClient = new ApiClient();

import type { ApiClientMethods } from './api/api-client.types';
import { injectAccounting } from './api/accounting';
import { injectAdmin } from './api/admin';
import { injectAdminExtended } from './api/admin-extended';
import { injectAds } from './api/ads';
import { injectAfricanUnits } from './api/africanUnits';
import { injectAfriscore } from './api/afriscore';
import { injectAgents } from './api/agents';
import { injectAnalytics } from './api/analytics';
import { injectAnalyticsEvents } from './api/analytics-events';
import { injectAnalyticsExtended, injectCopilot } from './api/analytics-extended';
import { injectAuth } from './api/auth';
import { injectAutomations } from './api/automations';
import { injectBookings } from './api/bookings';
import { injectBusiness } from './api/business';
import { injectBusinessBookings } from './api/business-bookings';
import { injectBusinessExtended } from './api/business-extended';
import { injectCart } from './api/cart';
import { injectClientData } from './api/client-data';
import { injectCrm } from './api/crm';
import { injectCrmAutomation } from './api/crm-automation';
import { injectCrmPipeline } from './api/crm-pipeline';
import { injectDataHub } from './api/data-hub';
import { injectDebts } from './api/debts';
import { injectDelivery } from './api/delivery';
import { injectDeveloper } from './api/developer';
import { injectDeveloperExtended } from './api/developer-extended';
import { injectDisputes } from './api/disputes';
import { injectDocuments } from './api/documents';
import { injectDocumentsExtended } from './api/documents-extended';
import { injectEmployees } from './api/employees';
import { injectEvents } from './api/events';
import { injectFaq } from './api/faq';
import { injectFavorites } from './api/favorites';
import { injectLayaway } from './api/layaway';
import { injectFeed } from './api/feed';
import { injectFinance } from './api/finance';
import { injectGamification } from './api/gamification';
import { injectGroupBuys } from './api/groupBuys';
import { injectLives } from './api/lives';
import { injectMarketplace } from './api/marketplace';
import { injectMediaCommerce } from './api/media-commerce';
import { injectMenu } from './api/menu';
import { injectMessages } from './api/messages';
import { injectMessagesExtended } from './api/messages-extended';
import { injectMisc } from './api/misc';
import { injectNotifications } from './api/notifications';
import { injectOffers } from './api/offers';
import { injectOfflineSync } from './api/offlineSync';
import { injectOrders } from './api/orders';
import { injectPartners } from './api/partners';
import { injectPayments } from './api/payments';
import { injectPlanning } from './api/planning';
import { injectPortfolio } from './api/portfolio';
import { injectProducts } from './api/products';
import { injectProfile } from './api/profile';
import { injectPromotions } from './api/promotions';
import { injectReferral } from './api/referral';
import { injectRentals } from './api/rentals';
import { injectReviews } from './api/reviews';
import { injectRooms } from './api/rooms';
import { injectSandbox } from './api/sandbox';
import { injectSavings } from './api/savings';
import { injectServicesDomain } from './api/services-domain';
import { injectSettings } from './api/settings';
import { injectShorts } from './api/shorts';
import { injectStories } from './api/stories';
import { injectSubscriptions } from './api/subscriptions';
import { injectSubscriptionsExtended } from './api/subscriptions-extended';
import { injectTasks } from './api/tasks';
import { injectTaxes } from './api/taxes';
import { injectTrainings } from './api/trainings';
import { injectVerification } from './api/verification';
import { injectVoiceCatalogue } from './api/voiceCatalogue';
import { injectWhatsApp } from './api/whatsapp';

const _api = apiClient as unknown as ApiClientMethods;
injectAccounting(_api);
injectAdmin(_api);
injectAdminExtended(_api);
injectAds(_api);
injectAfricanUnits(_api);
injectAfriscore(_api);
injectAgents(_api);
injectAnalytics(_api);
injectAnalyticsEvents(_api);
injectAnalyticsExtended(_api);
injectCopilot(_api);
injectAuth(_api);
injectAutomations(_api);
injectBookings(_api);
injectBusiness(_api);
injectBusinessBookings(_api);
injectBusinessExtended(_api);
injectCart(_api);
injectClientData(_api);
injectCrm(_api);
injectCrmAutomation(_api);
injectCrmPipeline(_api);
injectDataHub(_api);
injectDebts(_api);
injectDelivery(_api);
injectDeveloper(_api);
injectDeveloperExtended(_api);
injectDisputes(_api);
injectDocuments(_api);
injectDocumentsExtended(_api);
injectEmployees(_api);
injectEvents(_api);
injectFaq(_api);
injectFavorites(_api);
injectLayaway(_api);
injectFeed(_api);
injectFinance(_api);
injectGamification(_api);
injectGroupBuys(_api);
injectLives(_api);
injectMarketplace(_api);
injectMediaCommerce(_api);
injectMenu(_api);
injectMessages(_api);
injectMessagesExtended(_api);
injectMisc(_api);
injectNotifications(_api);
injectOffers(_api);
injectOfflineSync(_api);
injectOrders(_api);
injectPartners(_api);
injectPayments(_api);
injectPlanning(_api);
injectPortfolio(_api);
injectProducts(_api);
injectProfile(_api);
injectPromotions(_api);
injectReferral(_api);
injectRentals(_api);
injectReviews(_api);
injectRooms(_api);
injectSandbox(_api);
injectSavings(_api);
injectServicesDomain(_api);
injectSettings(_api);
injectShorts(_api);
injectStories(_api);
injectSubscriptions(_api);
injectSubscriptionsExtended(_api);
injectTasks(_api);
injectTaxes(_api);
injectTrainings(_api);
injectVerification(_api);
injectVoiceCatalogue(_api);
injectWhatsApp(_api);
