import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/authStore';

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private instance: AxiosInstance;

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
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        // CSRF token for state-changing requests
        if (config.method && !['get', 'head', 'options'].includes(config.method)) {
          const csrfToken = getCookie(CSRF_COOKIE);
          if (csrfToken) {
            config.headers[CSRF_HEADER] = csrfToken;
          }
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

        // If 401 and not a retry, try to refresh token (cookie is auto-sent)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await this.instance.post<
              ApiResponse<{
                accessToken: string;
                refreshToken: string;
              }>
            >('/auth/refresh');

            if (response.data.success && response.data.data) {
              useAuthStore.getState().setTokens(
                response.data.data.accessToken,
                response.data.data.refreshToken
              );

              originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // GENERIC HTTP METHODS (with AbortSignal support)
  // ============================================

  async get<T = any>(url: string, config?: any) {
    return this.instance.get<ApiResponse<T>>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any) {
    return this.instance.post<ApiResponse<T>>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any) {
    return this.instance.put<ApiResponse<T>>(url, data, config);
  }

  async delete<T = any>(url: string, config?: any) {
    return this.instance.delete<ApiResponse<T>>(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any) {
    return this.instance.patch<ApiResponse<T>>(url, data, config);
  }

  // ============================================
  // SIGNAL-AWARE WRAPPER for React Query hooks
  // Usage: queryFn: ({ signal }) => apiClient.queryWithSignal(signal, client => client.getProfile())
  // ============================================
  async queryWithSignal<T = any>(
    signal: AbortSignal | undefined | null,
    fn: (client: this) => Promise<{ data: ApiResponse<T> }>
  ): Promise<T> {
    const res = await fn(this);
    if (signal?.aborted) throw new DOMException('Query aborted', 'AbortError');
    return res.data.data as T;
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

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
    return this.instance.post<ApiResponse>('/developer/activate');
  }

  async revokeOtherSessions() {
    return this.instance.post<ApiResponse>('/auth/sessions/revoke-others');
  }

  async getActiveSessions() {
    return this.instance.get<ApiResponse>('/auth/sessions/active');
  }

  async get2FAStatus() {
    return this.instance.get<ApiResponse>('/auth/2fa/status');
  }

  async setup2FA() {
    return this.instance.post<ApiResponse>('/auth/2fa/setup');
  }

  async verify2FA(token: string) {
    return this.instance.post<ApiResponse>('/auth/2fa/verify', { token });
  }

  async disable2FA(password: string) {
    return this.instance.post<ApiResponse>('/auth/2fa/disable', { password });
  }

  async verify2FALogin(data: { identifier: string; password: string; tempToken: string; totpCode: string; rememberMe?: boolean }) {
    return this.instance.post<ApiResponse>('/auth/verify-2fa', data);
  }

  // ============================================
  // PROFILE / USER ENDPOINTS
  // ============================================

  async getProfile() {
    return this.instance.get<ApiResponse>('/users/profile');
  }

  async updateProfile(data: any) {
    return this.instance.put<ApiResponse>('/users/profile', data);
  }

  async updatePassword(data: { currentPassword: string; newPassword: string }) {
    return this.instance.put<ApiResponse>('/users/password', data);
  }

  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append('avatar', file);
    return this.instance.post<ApiResponse>('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async uploadMedia(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.instance.post<ApiResponse<{ url: string; filename: string; mimetype: string; size: number }>>('/upload/media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async uploadMultipleMedia(files: File[]) {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return this.instance.post<ApiResponse<Array<{ url: string; filename: string; mimetype: string; size: number }>>>('/upload/media/multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // ============================================
  // BUSINESS ENDPOINTS
  // ============================================

  async createBusiness(data: any) {
    return this.instance.post<ApiResponse>('/business/onboarding', data);
  }

  async getMyBusiness() {
    return this.instance.get<ApiResponse>('/business/me');
  }

  async getPublicBusiness(slug: string) {
    return this.instance.get<ApiResponse>(`/business/${slug}/public`);
  }

  async getBusinessStats() {
    return this.instance.get<ApiResponse>('/business/stats');
  }

  async getBusinessClients(params?: any) {
    return this.instance.get<ApiResponse>('/business/clients', { params });
  }

  // ============ CRM (Module 11) ============
  async getCrmDashboardStats() {
    return this.instance.get<ApiResponse>('/business/crm/dashboard');
  }

  async getCrmClients(params?: any) {
    return this.instance.get<ApiResponse>('/business/crm/clients', { params });
  }

  async getCrmClientDetail(clientId: string) {
    return this.instance.get<ApiResponse>(`/business/crm/clients/${clientId}`);
  }

  async getCustomer360(clientId: string) {
    return this.instance.get<ApiResponse>(`/business/crm/clients/${clientId}/360`);
  }

  async trackPageView(data: { userId?: string; visitorId?: string; referrer?: string; duration?: number }) {
    return this.instance.post<ApiResponse>('/business/crm/track/page-view', data);
  }

  async trackProductView(data: { productId: string; userId?: string; visitorId?: string; referrer?: string; source?: string }) {
    return this.instance.post<ApiResponse>('/business/crm/track/product-view', data);
  }

  async trackProductClick(data: { productId: string; userId?: string; visitorId?: string; source?: string }) {
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

  async createCrmSegment(data: { name: string; description?: string; color?: string; conditions?: any; isDynamic?: boolean }) {
    return this.instance.post<ApiResponse>('/business/crm/segments', data);
  }

  async updateCrmSegment(segmentId: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/crm/segments/${segmentId}`, data);
  }

  async deleteCrmSegment(segmentId: string) {
    return this.instance.delete<ApiResponse>(`/business/crm/segments/${segmentId}`);
  }

  async recalculateCrmSegment(segmentId: string) {
    return this.instance.post<ApiResponse>(`/business/crm/segments/${segmentId}/recalculate`);
  }

  async assignClientToSegment(clientId: string, segmentId: string) {
    return this.instance.post<ApiResponse>(`/business/crm/clients/${clientId}/segments`, { segmentId });
  }

  async removeClientFromSegment(clientId: string, segmentId: string) {
    return this.instance.delete<ApiResponse>(`/business/crm/clients/${clientId}/segments/${segmentId}`);
  }

  async getBusinessMenu(slug?: string) {
    const url = slug ? `/business/${slug}/menu` : '/business/menu';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessProducts(slug?: string) {
    const url = slug ? `/business/${slug}/products` : '/business/products';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessServices(slug?: string) {
    const url = slug ? `/business/${slug}/services` : '/business/services';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessRooms(slug?: string) {
    const url = slug ? `/business/${slug}/rooms` : '/business/rooms';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessEvents(slug?: string) {
    const url = slug ? `/business/${slug}/events` : '/business/events';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessRentals(slug?: string) {
    const url = slug ? `/business/${slug}/rentals` : '/business/rentals';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessBookings(slug?: string) {
    const url = slug ? `/business/${slug}/bookings` : '/business/bookings';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessReviews(slug?: string) {
    const url = slug ? `/business/${slug}/reviews` : '/business/reviews';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessPromotions(slug?: string) {
    const url = slug ? `/business/${slug}/promotions` : '/business/promotions';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessPartners(slug?: string) {
    const url = slug ? `/business/${slug}/partners` : '/business/partners';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessPortfolio(slug?: string) {
    const url = slug ? `/business/${slug}/portfolio` : '/business/portfolio';
    return this.instance.get<ApiResponse>(url);
  }

  async getBusinessTrainings(slug?: string) {
    const url = slug ? `/business/${slug}/trainings` : '/business/trainings';
    return this.instance.get<ApiResponse>(url);
  }

  async getPublicPagePreview() {
    return this.instance.get<ApiResponse>('/business/public-page-preview');
  }

  async updatePublicPage(data: any) {
    return this.instance.put<ApiResponse>('/business/public-page', data);
  }

  // ============================================
  // PARTNER ENDPOINTS (Gestion des Partenaires)
  // ============================================

  async getPartners(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners', { params });
  }

  async getPartner(id: string) {
    return this.instance.get<ApiResponse>(`/business/partners/${id}`);
  }

  async createPartner(data: any) {
    return this.instance.post<ApiResponse>('/business/partners', data);
  }

  async updatePartner(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/partners/${id}`, data);
  }

  async deletePartner(id: string) {
    return this.instance.delete<ApiResponse>(`/business/partners/${id}`);
  }

  async getPartnerStats() {
    return this.instance.get<ApiResponse>('/business/partners/stats');
  }

  async getPartnerAnalytics() {
    return this.instance.get<ApiResponse>('/business/partners/analytics');
  }

  async getPublicPartners(slug: string) {
    return this.instance.get<ApiResponse>(`/business/partners/public/${slug}`);
  }

  // Contracts
  async getPartnerContracts(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners/contracts/list', { params });
  }

  async createPartnerContract(data: any) {
    return this.instance.post<ApiResponse>('/business/partners/contracts', data);
  }

  async updatePartnerContract(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/partners/contracts/${id}`, data);
  }

  async signPartnerContract(id: string, byBusiness: boolean) {
    return this.instance.post<ApiResponse>(`/business/partners/contracts/${id}/sign`, { byBusiness });
  }

  // Transactions
  async getPartnerTransactions(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners/transactions/list', { params });
  }

  async createPartnerTransaction(data: any) {
    return this.instance.post<ApiResponse>('/business/partners/transactions', data);
  }

  // Assignments
  async getPartnerAssignments(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners/assignments/list', { params });
  }

  async createPartnerAssignment(data: any) {
    return this.instance.post<ApiResponse>('/business/partners/assignments', data);
  }

  async updatePartnerAssignment(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/partners/assignments/${id}`, data);
  }

  // Reviews
  async getPartnerReviews(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners/reviews/list', { params });
  }

  async createPartnerReview(data: any) {
    return this.instance.post<ApiResponse>('/business/partners/reviews', data);
  }

  // Documents
  async getPartnerDocuments(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners/documents/list', { params });
  }

  async createPartnerDocument(data: any) {
    return this.instance.post<ApiResponse>('/business/partners/documents', data);
  }

  async deletePartnerDocument(id: string) {
    return this.instance.delete<ApiResponse>(`/business/partners/documents/${id}`);
  }

  // Permissions
  async getPartnerPermissions(params?: any) {
    return this.instance.get<ApiResponse>('/business/partners/permissions/list', { params });
  }

  async createPartnerPermission(data: any) {
    return this.instance.post<ApiResponse>('/business/partners/permissions', data);
  }

  async updatePartnerPermission(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/partners/permissions/${id}`, data);
  }

  async deletePartnerPermission(id: string) {
    return this.instance.delete<ApiResponse>(`/business/partners/permissions/${id}`);
  }

  // ============================================
  // CLIENT ENDPOINTS (Loyalty, Escrow, Trainings)
  // ============================================

  async getMyLoyalty() {
    return this.instance.get<ApiResponse>('/promotions/loyalty/program');
  }

  async redeemLoyaltyPoints(data: { businessId: string; points: number; rewardTitle?: string; rewardType?: string }) {
    return this.instance.post<ApiResponse>('/loyalty/redeem', data);
  }

  async getAvailablePromotions() {
    return this.instance.get<ApiResponse>('/promotions');
  }

  async getClientEscrows() {
    return this.instance.get<ApiResponse>('/payments/escrow/client');
  }

  async confirmClientEscrow(id: string) {
    return this.instance.post<ApiResponse>(`/payments/escrow/client/${id}/confirm`);
  }

  async disputeClientEscrow(id: string, reason: string) {
    return this.instance.post<ApiResponse>(`/payments/escrow/client/${id}/dispute`, { reason });
  }

  async getClientDebts() {
    return this.instance.get<ApiResponse>('/payments/debts/client');
  }

  async payClientDebt(id: string, data: { amount: number; paymentMethod?: string; notes?: string }) {
    return this.instance.post<ApiResponse>(`/payments/debts/client/${id}/pay`, data);
  }

  async getMyTrainings() {
    return this.instance.get<ApiResponse>('/trainings/my');
  }

  async enrollInTraining(id: string) {
    return this.instance.post<ApiResponse>(`/trainings/${id}/enroll`);
  }

  // ============ BUSINESS TRAININGS ============

  async getBizTrainings(params?: any) {
    return this.instance.get<ApiResponse>(`/trainings/business`, { params });
  }

  async getBizTraining(id: string) {
    return this.instance.get<ApiResponse>(`/trainings/business/${id}`);
  }

  async createBizTraining(data: any) {
    return this.instance.post<ApiResponse>(`/trainings/business`, data);
  }

  async updateBizTraining(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/trainings/business/${id}`, data);
  }

  async deleteBizTraining(id: string) {
    return this.instance.delete<ApiResponse>(`/trainings/business/${id}`);
  }

  async getBizTrainingStudents(trainingId: string, params?: any) {
    return this.instance.get<ApiResponse>(`/trainings/business/${trainingId}/students`, { params });
  }

  async getBizTrainingStats() {
    return this.instance.get<ApiResponse>(`/trainings/business/stats`);
  }

  async getBizTrainingLessons(trainingId: string) {
    return this.instance.get<ApiResponse>(`/trainings/business/${trainingId}/lessons`);
  }

  async createBizTrainingLesson(data: any) {
    return this.instance.post<ApiResponse>(`/trainings/business/lessons`, data);
  }

  async updateBizTrainingLesson(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/trainings/business/lessons/${id}`, data);
  }

  async deleteBizTrainingLesson(id: string) {
    return this.instance.delete<ApiResponse>(`/trainings/business/lessons/${id}`);
  }

  async createBizTrainingQuiz(data: any) {
    return this.instance.post<ApiResponse>(`/trainings/business/quiz`, data);
  }

  async deleteBizTrainingQuiz(quizId: string) {
    return this.instance.delete<ApiResponse>(`/trainings/business/quiz/${quizId}`);
  }

  async registerForEvent(id: string) {
    return this.instance.post<ApiResponse>(`/events/${id}/register`);
  }

  async getClientDashboardStats() {
    return this.instance.get<ApiResponse>('/dashboard/client/stats');
  }

  // ============================================
  // ORDERS ENDPOINTS
  // ============================================

  async getOrders(params?: any) {
    return this.instance.get<ApiResponse>('/orders', { params });
  }

  async getOrder(id: string) {
    return this.instance.get<ApiResponse>(`/orders/${id}`);
  }

  async updateOrder(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/orders/${id}`, data);
  }

  // ============ BUSINESS ORDERS ============

  async getMyBusinessOrders(params?: any) {
    return this.instance.get<ApiResponse>('/business/orders', { params });
  }

  async getMyBusinessOrder(id: string) {
    return this.instance.get<ApiResponse>(`/business/orders/${id}`);
  }

  async createBusinessOrder(data: any) {
    return this.instance.post<ApiResponse>('/business/orders', data);
  }

  async updateBusinessOrderStatus(id: string, status: string, reason?: string) {
    return this.instance.put<ApiResponse>(`/business/orders/${id}/status`, { status, reason });
  }

  async updateBusinessOrderDelivery(id: string, deliveryStatus: string, notes?: string) {
    return this.instance.put<ApiResponse>(`/business/orders/${id}/delivery`, { deliveryStatus, notes });
  }

  async updateBusinessOrderPayment(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/orders/${id}/payment`, data);
  }

  async deleteBusinessOrder(id: string) {
    return this.instance.delete<ApiResponse>(`/business/orders/${id}`);
  }

  async getBusinessOrderStats() {
    return this.instance.get<ApiResponse>('/business/orders/stats');
  }

  // ============ BUSINESS DEBTS ============

  async getBusinessDebts(params?: any) {
    return this.instance.get<ApiResponse>('/business/orders/debts/list', { params });
  }

  async payBusinessDebt(id: string, amount: number) {
    return this.instance.post<ApiResponse>(`/business/orders/debts/${id}/pay`, { amount });
  }

  async settleBusinessDebt(id: string) {
    return this.instance.post<ApiResponse>(`/business/orders/debts/${id}/settle`);
  }

  // ============================================
  // BOOKINGS ENDPOINTS
  // ============================================

  async getBookings(params?: any) {
    return this.instance.get<ApiResponse>('/bookings', { params });
  }

  async getBooking(id: string) {
    return this.instance.get<ApiResponse>(`/bookings/${id}`);
  }

  async cancelMyBooking(id: string, reason?: string) {
    return this.instance.post<ApiResponse>(`/bookings/${id}/cancel`, { reason });
  }

  async rescheduleMyBooking(id: string, startDate: string, endDate?: string) {
    return this.instance.put<ApiResponse>(`/bookings/${id}/reschedule`, { startDate, endDate });
  }

  async createRentalBooking(data: { rentalId: string; startDate: string; endDate: string; notes?: string }) {
    return this.instance.post<ApiResponse>('/bookings/rental', data);
  }

  async prolongRentalBooking(id: string, data: { newEndDate: string; additionalNotes?: string }) {
    return this.instance.post<ApiResponse>(`/bookings/${id}/prolong`, data);
  }

  // ============================================
  // PAYMENTS ENDPOINTS
  // ============================================

  async getPayments(params?: any) {
    return this.instance.get<ApiResponse>('/payments', { params });
  }

  async getPayment(id: string) {
    return this.instance.get<ApiResponse>(`/payments/${id}`);
  }

  async getWallet() {
    return this.instance.get<ApiResponse>('/payments/wallet');
  }

  // ============================================
  // NOTIFICATIONS ENDPOINTS
  // ============================================

  async getNotifications(params?: any) {
    return this.instance.get<ApiResponse>('/notifications', { params });
  }

  async getUnreadCount() {
    return this.instance.get<ApiResponse>('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.instance.put<ApiResponse>(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead() {
    return this.instance.put<ApiResponse>('/notifications/read-all');
  }

  async deleteNotification(id: string) {
    return this.instance.delete<ApiResponse>(`/notifications/${id}`);
  }

  async getNotificationPreferences() {
    return this.instance.get<ApiResponse>('/notifications/preferences');
  }

  async updateNotificationPreferences(data: any) {
    return this.instance.put<ApiResponse>('/notifications/preferences', data);
  }

  // ============================================
  // FAVORITES ENDPOINTS
  // ============================================

  async getFavorites(params?: any) {
    return this.instance.get<ApiResponse>('/favorites', { params });
  }

  async addFavorite(type: string, referenceId: string) {
    return this.instance.post<ApiResponse>('/favorites', { type, referenceId });
  }

  async removeFavorite(id: string) {
    return this.instance.delete<ApiResponse>(`/favorites/${id}`);
  }

  // ============================================
  // MESSAGES ENDPOINTS
  // ============================================

  async getConversations() {
    return this.instance.get<ApiResponse>('/messages/conversations');
  }

  async getMessages(conversationId: string) {
    return this.instance.get<ApiResponse>(`/messages/conversations/${conversationId}`);
  }

  async sendMessage(data: { conversationId?: string; recipientId?: string; content: string; attachment?: string }) {
    return this.instance.post<ApiResponse>('/messages', data);
  }

  async createConversation(data: { recipientId: string; subject?: string; initialMessage?: string }) {
    return this.instance.post<ApiResponse>('/messages/conversations', data);
  }

  // ============================================
  // FINANCE (QUOTES & INVOICES) ENDPOINTS
  // ============================================

  async getQuotes(params?: any) {
    return this.instance.get<ApiResponse>('/business/finance/quotes', { params });
  }

  async getQuote(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/quotes/${id}`);
  }

  async createQuote(data: any) {
    return this.instance.post<ApiResponse>('/business/finance/quotes', data);
  }

  async updateQuote(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/finance/quotes/${id}`, data);
  }

  async updateQuoteStatus(id: string, status: string) {
    return this.instance.put<ApiResponse>(`/business/finance/quotes/${id}/status`, { status });
  }

  async convertQuoteToInvoice(id: string) {
    return this.instance.post<ApiResponse>(`/business/finance/quotes/${id}/convert`);
  }

  async deleteQuote(id: string) {
    return this.instance.delete<ApiResponse>(`/business/finance/quotes/${id}`);
  }

  async getInvoices(params?: any) {
    return this.instance.get<ApiResponse>('/business/finance/invoices', { params });
  }

  async getInvoice(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/invoices/${id}`);
  }

  async createInvoice(data: any) {
    return this.instance.post<ApiResponse>('/business/finance/invoices', data);
  }

  async updateInvoiceStatus(id: string, status: string) {
    return this.instance.put<ApiResponse>(`/business/finance/invoices/${id}/status`, { status });
  }

  async updateInvoicePayment(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/finance/invoices/${id}/payment`, data);
  }

  async deleteInvoice(id: string) {
    return this.instance.delete<ApiResponse>(`/business/finance/invoices/${id}`);
  }

  async getFinanceStats() {
    return this.instance.get<ApiResponse>('/business/finance/stats');
  }

  async downloadInvoicePdf(id: string) {
    return this.instance.get(`/business/finance/invoices/${id}/pdf`, { responseType: 'blob' });
  }

  async downloadQuotePdf(id: string) {
    return this.instance.get(`/business/finance/quotes/${id}/pdf`, { responseType: 'blob' });
  }

  // ============================================
  // BUSINESS PRODUCTS (AUTH) ENDPOINTS
  // ============================================

  async getMyProducts(params?: any) {
    return this.instance.get<ApiResponse>('/business/products', { params });
  }

  async getMyProduct(id: string) {
    return this.instance.get<ApiResponse>(`/business/products/${id}`);
  }

  async createProduct(data: any) {
    return this.instance.post<ApiResponse>('/business/products', data);
  }

  async updateProduct(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/products/${id}`, data);
  }

  async deleteProduct(id: string) {
    return this.instance.delete<ApiResponse>(`/business/products/${id}`);
  }

  async duplicateProduct(id: string) {
    return this.instance.post<ApiResponse>(`/business/products/${id}/duplicate`);
  }

  async toggleProductActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/products/${id}/toggle`);
  }

  async updateProductStock(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/products/${id}/stock`, data);
  }

  async getProductCategories() {
    return this.instance.get<ApiResponse>('/business/products/categories');
  }

  async createProductCategory(data: any) {
    return this.instance.post<ApiResponse>('/business/products/categories', data);
  }

  async updateProductCategory(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/products/categories/${id}`, data);
  }

  async deleteProductCategory(id: string) {
    return this.instance.delete<ApiResponse>(`/business/products/categories/${id}`);
  }

  async getProductStats() {
    return this.instance.get<ApiResponse>('/business/products/stats');
  }

  async getStockAlerts() {
    return this.instance.get<ApiResponse>('/business/products/alerts');
  }

  async exportProducts(params?: any) {
    return this.instance.get<ApiResponse>('/business/products/export', { params });
  }

  async importProducts(data: any) {
    return this.instance.post<ApiResponse>('/business/products/import', data);
  }

  async bulkDeleteProducts(ids: string[]) {
    return this.instance.post<ApiResponse>('/business/products/bulk/delete', { ids });
  }

  async bulkToggleProducts(ids: string[], isActive: boolean) {
    return this.instance.patch<ApiResponse>('/business/products/bulk/toggle', { ids, isActive });
  }

  async bulkUpdateProductStock(items: { id: string; stock: number }[]) {
    return this.instance.patch<ApiResponse>('/business/products/bulk/stock', { items });
  }

  // ============================================
  // BUSINESS SERVICES (AUTH) ENDPOINTS
  // ============================================

  async getMyServices(params?: any) {
    return this.instance.get<ApiResponse>('/business/services', { params });
  }

  async getMyService(id: string) {
    return this.instance.get<ApiResponse>(`/business/services/${id}`);
  }

  async createService(data: any) {
    return this.instance.post<ApiResponse>('/business/services', data);
  }

  async updateService(id: string, data: any) {
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

  async createServiceCategory(data: any) {
    return this.instance.post<ApiResponse>('/business/services/categories', data);
  }

  async updateServiceCategory(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/services/categories/${id}`, data);
  }

  async deleteServiceCategory(id: string) {
    return this.instance.delete<ApiResponse>(`/business/services/categories/${id}`);
  }

  async getServiceStats() {
    return this.instance.get<ApiResponse>('/business/services/stats');
  }

  async duplicateService(id: string) {
    return this.instance.post<ApiResponse>(`/business/services/${id}/duplicate`);
  }

  async exportServices(params?: any) {
    return this.instance.get<ApiResponse>('/business/services/export', { params });
  }

  async importServices(data: any) {
    return this.instance.post<ApiResponse>('/business/services/import', data);
  }

  async bulkDeleteServices(ids: string[]) {
    return this.instance.post<ApiResponse>('/business/services/bulk/delete', { ids });
  }

  async bulkToggleServices(ids: string[], isActive: boolean) {
    return this.instance.patch<ApiResponse>('/business/services/bulk/toggle', { ids, isActive });
  }

  // ============================================
  // BUSINESS MENU (AUTH) ENDPOINTS
  // ============================================

  async getMyMenuItems(params?: any) {
    return this.instance.get<ApiResponse>('/business/menu/items', { params });
  }

  async getMyMenuItem(id: string) {
    return this.instance.get<ApiResponse>(`/business/menu/items/${id}`);
  }

  async createMenuItem(data: any) {
    return this.instance.post<ApiResponse>('/business/menu/items', data);
  }

  async updateMenuItem(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/menu/items/${id}`, data);
  }

  async deleteMenuItem(id: string) {
    return this.instance.delete<ApiResponse>(`/business/menu/items/${id}`);
  }

  async toggleMenuItemActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/menu/items/${id}/toggle`);
  }

  async updateMenuItemStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/menu/items/${id}/status`, { status });
  }

  async getMenuCategories() {
    return this.instance.get<ApiResponse>('/business/menu/categories');
  }

  async createMenuCategory(data: any) {
    return this.instance.post<ApiResponse>('/business/menu/categories', data);
  }

  async updateMenuCategory(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/menu/categories/${id}`, data);
  }

  async deleteMenuCategory(id: string) {
    return this.instance.delete<ApiResponse>(`/business/menu/categories/${id}`);
  }

  async getMenuOrders(params?: any) {
    return this.instance.get<ApiResponse>('/business/menu/orders', { params });
  }

  async getMenuOrder(id: string) {
    return this.instance.get<ApiResponse>(`/business/menu/orders/${id}`);
  }

  async createMenuOrder(data: any) {
    return this.instance.post<ApiResponse>('/business/menu/orders', data);
  }

  async updateMenuOrderStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/menu/orders/${id}/status`, { status });
  }

  async getMenuOrderStats() {
    return this.instance.get<ApiResponse>('/business/menu/orders/stats');
  }

  async getMenuTables() {
    return this.instance.get<ApiResponse>('/business/menu/tables');
  }

  async createMenuTable(data: any) {
    return this.instance.post<ApiResponse>('/business/menu/tables', data);
  }

  async updateMenuTable(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/menu/tables/${id}`, data);
  }

  async deleteMenuTable(id: string) {
    return this.instance.delete<ApiResponse>(`/business/menu/tables/${id}`);
  }

  async updateMenuTableStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/menu/tables/${id}/status`, { status });
  }

  async getMenuIngredients(params?: any) {
    return this.instance.get<ApiResponse>('/business/menu/ingredients', { params });
  }

  async createMenuIngredient(data: any) {
    return this.instance.post<ApiResponse>('/business/menu/ingredients', data);
  }

  async updateMenuIngredient(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/menu/ingredients/${id}`, data);
  }

  async deleteMenuIngredient(id: string) {
    return this.instance.delete<ApiResponse>(`/business/menu/ingredients/${id}`);
  }

  async adjustIngredientStock(id: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/menu/ingredients/${id}/stock`, data);
  }

  async getMenuStats() {
    return this.instance.get<ApiResponse>('/business/menu/stats');
  }

  // ============================================
  // BUSINESS ROOMS (AUTH) ENDPOINTS
  // ============================================

  async getMyRooms(params?: any) {
    return this.instance.get<ApiResponse>('/business/rooms', { params });
  }

  async getMyRoom(id: string) {
    return this.instance.get<ApiResponse>(`/business/rooms/${id}`);
  }

  async createRoom(data: any) {
    return this.instance.post<ApiResponse>('/business/rooms', data);
  }

  async updateRoom(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/rooms/${id}`, data);
  }

  async deleteRoom(id: string) {
    return this.instance.delete<ApiResponse>(`/business/rooms/${id}`);
  }

  async toggleRoomActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/rooms/${id}/toggle`);
  }

  async updateRoomStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/rooms/${id}/status`, { status });
  }

  async blockRoomDates(id: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/rooms/${id}/block`, data);
  }

  async duplicateRoom(id: string) {
    return this.instance.post<ApiResponse>(`/business/rooms/${id}/duplicate`);
  }

  async exportRooms(params?: any) {
    return this.instance.get<ApiResponse>('/business/rooms/export', { params });
  }

  async importRooms(data: any) {
    return this.instance.post<ApiResponse>('/business/rooms/import', data);
  }

  async bulkDeleteRooms(ids: string[]) {
    return this.instance.post<ApiResponse>('/business/rooms/bulk/delete', { ids });
  }

  async bulkToggleRooms(ids: string[], isActive: boolean) {
    return this.instance.patch<ApiResponse>('/business/rooms/bulk/toggle', { ids, isActive });
  }

  async getRoomStats() {
    return this.instance.get<ApiResponse>('/business/rooms/stats');
  }

  // ============================================
  // BUSINESS BOOKINGS (AUTH) ENDPOINTS
  // ============================================

  async getMyBusinessBookings(params?: any) {
    return this.instance.get<ApiResponse>('/business/bookings', { params });
  }

  async getMyBusinessBooking(id: string) {
    return this.instance.get<ApiResponse>(`/business/bookings/${id}`);
  }

  async createBusinessBooking(data: any) {
    return this.instance.post<ApiResponse>('/business/bookings', data);
  }

  async updateBusinessBookingStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/bookings/${id}/status`, { status });
  }

  async getBookingResources() {
    return this.instance.get<ApiResponse>('/business/bookings/resources');
  }

  async getBookingSlots() {
    return this.instance.get<ApiResponse>('/business/bookings/slots');
  }

  async updateBusinessBooking(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/bookings/${id}`, data);
  }

  async deleteBusinessBooking(id: string) {
    return this.instance.delete<ApiResponse>(`/business/bookings/${id}`);
  }

  async sendBookingReminder(id: string, type: string, channel: string) {
    return this.instance.post<ApiResponse>(`/business/bookings/${id}/reminder`, { type, channel });
  }

  async getBookingCalendar(params?: any) {
    return this.instance.get<ApiResponse>('/business/bookings/calendar', { params });
  }

  // ============================================
  // PLANNING ENDPOINTS
  // ============================================

  async getPlanningCalendar(params?: any) {
    return this.instance.get<ApiResponse>('/business/planning/calendar', { params });
  }

  async getPlanningTasks(params?: any) {
    return this.instance.get<ApiResponse>('/business/planning/tasks', { params });
  }

  async getPlanningTask(id: string) {
    return this.instance.get<ApiResponse>(`/business/planning/tasks/${id}`);
  }

  async createPlanningTask(data: any) {
    return this.instance.post<ApiResponse>('/business/planning/tasks', data);
  }

  async updatePlanningTask(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/planning/tasks/${id}`, data);
  }

  async deletePlanningTask(id: string) {
    return this.instance.delete<ApiResponse>(`/business/planning/tasks/${id}`);
  }

  async getPlanningSchedules(params?: any) {
    return this.instance.get<ApiResponse>('/business/planning/schedules', { params });
  }

  async upsertPlanningSchedule(data: any) {
    return this.instance.post<ApiResponse>('/business/planning/schedules', data);
  }

  async deletePlanningSchedule(id: string) {
    return this.instance.delete<ApiResponse>(`/business/planning/schedules/${id}`);
  }

  async getPlanningStats() {
    return this.instance.get<ApiResponse>('/business/planning/stats');
  }

  async getPlanningLogs(params?: any) {
    return this.instance.get<ApiResponse>('/business/planning/logs', { params });
  }

  // ============================================
  // PROMOTIONS ENDPOINTS
  // ============================================

  async getMyPromotions(params?: any) {
    return this.instance.get<ApiResponse>('/business/promotions', { params });
  }

  async getMyPromotion(id: string) {
    return this.instance.get<ApiResponse>(`/business/promotions/${id}`);
  }

  async createPromotion(data: any) {
    return this.instance.post<ApiResponse>('/business/promotions', data);
  }

  async updatePromotion(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/promotions/${id}`, data);
  }

  async deletePromotion(id: string) {
    return this.instance.delete<ApiResponse>(`/business/promotions/${id}`);
  }

  async getPromoCoupons(params?: any) {
    return this.instance.get<ApiResponse>('/business/promotions/coupons', { params });
  }

  async createPromoCoupon(data: any) {
    return this.instance.post<ApiResponse>('/business/promotions/coupons', data);
  }

  async getPromoBundles(params?: any) {
    return this.instance.get<ApiResponse>('/business/promotions/bundles', { params });
  }

  async createPromoBundle(data: any) {
    return this.instance.post<ApiResponse>('/business/promotions/bundles', data);
  }

  async getPromoCampaigns(params?: any) {
    return this.instance.get<ApiResponse>('/business/promotions/campaigns', { params });
  }

  async createPromoCampaign(data: any) {
    return this.instance.post<ApiResponse>('/business/promotions/campaigns', data);
  }

  async getLoyaltyProgram() {
    return this.instance.get<ApiResponse>('/business/promotions/loyalty/program');
  }

  async updateLoyaltyProgram(data: any) {
    return this.instance.put<ApiResponse>('/business/promotions/loyalty/program', data);
  }

  async getPromoStats() {
    return this.instance.get<ApiResponse>('/business/promotions/stats');
  }

  // ============================================
  // EMPLOYEES ENDPOINTS
  // ============================================

  async getMyEmployees(params?: any) {
    return this.instance.get<ApiResponse>('/business/employees', { params });
  }

  async getMyEmployee(id: string) {
    return this.instance.get<ApiResponse>(`/business/employees/${id}`);
  }

  async createEmployee(data: any) {
    return this.instance.post<ApiResponse>('/business/employees', data);
  }

  async updateEmployee(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/employees/${id}`, data);
  }

  async deleteEmployee(id: string) {
    return this.instance.delete<ApiResponse>(`/business/employees/${id}`);
  }

  async getEmployeeRoles() {
    return this.instance.get<ApiResponse>('/business/employees/roles/list');
  }

  async createEmployeeRole(data: any) {
    return this.instance.post<ApiResponse>('/business/employees/roles', data);
  }

  async updateEmployeeRole(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/employees/roles/${id}`, data);
  }

  async deleteEmployeeRole(id: string) {
    return this.instance.delete<ApiResponse>(`/business/employees/roles/${id}`);
  }

  async getEmployeeAttendances(params?: any) {
    return this.instance.get<ApiResponse>('/business/employees/attendances', { params });
  }

  async clockIn(data: any) {
    return this.instance.post<ApiResponse>('/business/employees/attendance/clock-in', data);
  }

  async clockOut(id: string) {
    return this.instance.patch<ApiResponse>(`/business/employees/attendance/clock-out/${id}`);
  }

  async getEmployeeStats() {
    return this.instance.get<ApiResponse>('/business/employees/stats');
  }

  async getEmployeeDocuments(employeeId: string) {
    return this.instance.get<ApiResponse>(`/business/employees/${employeeId}/documents`);
  }

  async createEmployeeDocument(data: any) {
    return this.instance.post<ApiResponse>('/business/employees/documents', data);
  }

  async deleteEmployeeDocument(id: string) {
    return this.instance.delete<ApiResponse>(`/business/employees/documents/${id}`);
  }

  // ============================================
  // PORTFOLIO ENDPOINTS
  // ============================================

  async getMyPortfolioItems(params?: any) {
    return this.instance.get<ApiResponse>('/business/portfolio', { params });
  }

  async getMyPortfolioItem(id: string) {
    return this.instance.get<ApiResponse>(`/business/portfolio/${id}`);
  }

  async createPortfolioItem(data: any) {
    return this.instance.post<ApiResponse>('/business/portfolio', data);
  }

  async updatePortfolioItem(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/portfolio/${id}`, data);
  }

  async deletePortfolioItem(id: string) {
    return this.instance.delete<ApiResponse>(`/business/portfolio/${id}`);
  }

  async getPortfolioCategories() {
    return this.instance.get<ApiResponse>('/business/portfolio/categories');
  }

  async createPortfolioCategory(data: any) {
    return this.instance.post<ApiResponse>('/business/portfolio/categories', data);
  }

  async updatePortfolioCategory(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/portfolio/categories/${id}`, data);
  }

  async deletePortfolioCategory(id: string) {
    return this.instance.delete<ApiResponse>(`/business/portfolio/categories/${id}`);
  }

  async getPortfolioTestimonials(params?: any) {
    return this.instance.get<ApiResponse>('/business/portfolio/testimonials', { params });
  }

  async createPortfolioTestimonial(data: any) {
    return this.instance.post<ApiResponse>('/business/portfolio/testimonials', data);
  }

  async updatePortfolioTestimonial(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/portfolio/testimonials/${id}`, data);
  }

  async deletePortfolioTestimonial(id: string) {
    return this.instance.delete<ApiResponse>(`/business/portfolio/testimonials/${id}`);
  }

  async getPortfolioStats() {
    return this.instance.get<ApiResponse>('/business/portfolio/stats');
  }

  // ============================================
  // SUBSCRIPTIONS ENDPOINTS
  // ============================================

  async getSubscriptionPlans() {
    return this.instance.get<ApiResponse>('/business/subscriptions/plans');
  }

  async getSubscriptionPlan(id: string) {
    return this.instance.get<ApiResponse>(`/business/subscriptions/plans/${id}`);
  }

  async createSubscriptionPlan(data: any) {
    return this.instance.post<ApiResponse>('/business/subscriptions/plans', data);
  }

  async updateSubscriptionPlan(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/subscriptions/plans/${id}`, data);
  }

  async deleteSubscriptionPlan(id: string) {
    return this.instance.delete<ApiResponse>(`/business/subscriptions/plans/${id}`);
  }

  async getSubscribers(params?: any) {
    return this.instance.get<ApiResponse>('/business/subscriptions/subscribers', { params });
  }

  async getSubscriber(id: string) {
    return this.instance.get<ApiResponse>(`/business/subscriptions/subscribers/${id}`);
  }

  async createSubscription(data: any) {
    return this.instance.post<ApiResponse>('/business/subscriptions/subscribers', data);
  }

  async cancelSubscription(id: string) {
    return this.instance.patch<ApiResponse>(`/business/subscriptions/subscribers/${id}/cancel`);
  }

  async renewSubscription(id: string) {
    return this.instance.post<ApiResponse>(`/business/subscriptions/subscribers/${id}/renew`);
  }

  async getSubscriptionPayments(params?: any) {
    return this.instance.get<ApiResponse>('/business/subscriptions/payments', { params });
  }

  async recordSubscriptionPayment(data: any) {
    return this.instance.post<ApiResponse>('/business/subscriptions/payments', data);
  }

  async getSubscriptionStats() {
    return this.instance.get<ApiResponse>('/business/subscriptions/stats');
  }

  async getSubscriptionLogs(params?: any) {
    return this.instance.get<ApiResponse>('/business/subscriptions/logs', { params });
  }

  // ============ BUSINESS DOCUMENTS ============

  async getDocuments(params?: any) {
    return this.instance.get<ApiResponse>('/business/documents', { params });
  }

  async getDocument(id: string) {
    return this.instance.get<ApiResponse>(`/business/documents/${id}`);
  }

  async createDocument(data: any) {
    return this.instance.post<ApiResponse>('/business/documents', data);
  }

  async updateDocument(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/documents/${id}`, data);
  }

  async deleteDocument(id: string) {
    return this.instance.delete<ApiResponse>(`/business/documents/${id}`);
  }

  async getDocumentStats() {
    return this.instance.get<ApiResponse>('/business/documents/stats');
  }

  // ============================================
  // DELIVERY ENDPOINTS
  // ============================================

  async getDeliveries(params?: any) {
    return this.instance.get<ApiResponse>('/business/delivery', { params });
  }

  async getDelivery(id: string) {
    return this.instance.get<ApiResponse>(`/business/delivery/${id}`);
  }

  async createDelivery(data: any) {
    return this.instance.post<ApiResponse>('/business/delivery', data);
  }

  async updateDelivery(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/delivery/${id}`, data);
  }

  async assignDriver(id: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/delivery/${id}/assign`, data);
  }

  async updateDeliveryStatus(id: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/delivery/${id}/status`, { status });
  }

  async addTrackingEvent(id: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/delivery/${id}/tracking`, data);
  }

  async addDeliveryProof(id: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/delivery/${id}/proofs`, data);
  }

  async getDeliveryZones() {
    return this.instance.get<ApiResponse>('/business/delivery/zones');
  }

  async createDeliveryZone(data: any) {
    return this.instance.post<ApiResponse>('/business/delivery/zones', data);
  }

  async updateDeliveryZone(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/delivery/zones/${id}`, data);
  }

  async deleteDeliveryZone(id: string) {
    return this.instance.delete<ApiResponse>(`/business/delivery/zones/${id}`);
  }

  async getDrivers(params?: any) {
    return this.instance.get<ApiResponse>('/business/delivery/drivers', { params });
  }

  async createDriver(data: any) {
    return this.instance.post<ApiResponse>('/business/delivery/drivers', data);
  }

  async updateDriver(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/delivery/drivers/${id}`, data);
  }

  async deleteDriver(id: string) {
    return this.instance.delete<ApiResponse>(`/business/delivery/drivers/${id}`);
  }

  async getDeliveryStats() {
    return this.instance.get<ApiResponse>('/business/delivery/stats');
  }

  // ============================================
  // EVENTS ENDPOINTS
  // ============================================

  async getMyEvents(params?: any) {
    return this.instance.get<ApiResponse>('/business/events', { params });
  }

  async getMyEvent(id: string) {
    return this.instance.get<ApiResponse>(`/business/events/${id}`);
  }

  async createEvent(data: any) {
    return this.instance.post<ApiResponse>('/business/events', data);
  }

  async updateEvent(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/events/${id}`, data);
  }

  async deleteEvent(id: string) {
    return this.instance.delete<ApiResponse>(`/business/events/${id}`);
  }

  async getEventTickets(eventId: string) {
    return this.instance.get<ApiResponse>(`/business/events/${eventId}/tickets`);
  }

  async createEventTicket(eventId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/events/${eventId}/tickets`, data);
  }

  async updateEventTicket(eventId: string, ticketId: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/events/${eventId}/tickets/${ticketId}`, data);
  }

  async deleteEventTicket(eventId: string, ticketId: string) {
    return this.instance.delete<ApiResponse>(`/business/events/${eventId}/tickets/${ticketId}`);
  }

  async getEventParticipants(eventId: string) {
    return this.instance.get<ApiResponse>(`/business/events/${eventId}/participants`);
  }

  async registerEventParticipant(eventId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/events/${eventId}/participants`, data);
  }

  async getEventDashboardStats() {
    return this.instance.get<ApiResponse>('/business/events/dashboard/stats');
  }

  async updateEventParticipantStatus(eventId: string, participantId: string, status: string) {
    return this.instance.patch<ApiResponse>(`/business/events/${eventId}/participants/${participantId}/status`, { status });
  }

  async getEventScans(eventId: string) {
    return this.instance.get<ApiResponse>(`/business/events/${eventId}/scans`);
  }

  async scanEventTicket(eventId: string, ticketRef: string) {
    return this.instance.post<ApiResponse>(`/business/events/${eventId}/scan`, { ticketRef });
  }

  async getEventPromotions(eventId: string) {
    return this.instance.get<ApiResponse>(`/business/events/${eventId}/promotions`);
  }

  async createEventPromotion(eventId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/events/${eventId}/promotions`, data);
  }

  async deleteEventPromotion(eventId: string, promoId: string) {
    return this.instance.delete<ApiResponse>(`/business/events/${eventId}/promotions/${promoId}`);
  }

  async getEventGallery(eventId: string) {
    return this.instance.get<ApiResponse>(`/business/events/${eventId}/gallery`);
  }

  async addEventGalleryItem(eventId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/events/${eventId}/gallery`, data);
  }

  async deleteEventGalleryItem(eventId: string, itemId: string) {
    return this.instance.delete<ApiResponse>(`/business/events/${eventId}/gallery/${itemId}`);
  }

  async getEventPartners(eventId: string) {
    return this.instance.get<ApiResponse>(`/business/events/${eventId}/partners`);
  }

  async addEventPartner(eventId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/events/${eventId}/partners`, data);
  }

  async removeEventPartner(eventId: string, partnerId: string) {
    return this.instance.delete<ApiResponse>(`/business/events/${eventId}/partners/${partnerId}`);
  }

  async getEventStats(id: string) {
    return this.instance.get<ApiResponse>(`/business/events/${id}/stats`);
  }

  async getPublicEvent(slug: string, eventId: string) {
    return this.instance.get<ApiResponse>(`/business/${slug}/events/${eventId}`);
  }

  async registerPublicParticipant(slug: string, eventId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/${slug}/events/${eventId}/register`, data);
  }

  // ============================================
  // ADVANCED TASKS ENDPOINTS
  // ============================================

  async getAdvancedTasks(params?: any) {
    return this.instance.get<ApiResponse>('/business/tasks/tasks', { params });
  }

  async getAdvancedTask(id: string) {
    return this.instance.get<ApiResponse>(`/business/tasks/tasks/${id}`);
  }

  async createAdvancedTask(data: any) {
    return this.instance.post<ApiResponse>('/business/tasks/tasks', data);
  }

  async updateAdvancedTask(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/tasks/tasks/${id}`, data);
  }

  async deleteAdvancedTask(id: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/tasks/${id}`);
  }

  async getKanbanBoard(params?: any) {
    return this.instance.get<ApiResponse>('/business/tasks/kanban', { params });
  }

  async reorderTask(taskId: string, newStatus: string, newSortOrder: number) {
    return this.instance.patch<ApiResponse>(`/business/tasks/tasks/${taskId}/reorder`, { status: newStatus, sortOrder: newSortOrder });
  }

  async getTaskCategories() {
    return this.instance.get<ApiResponse>('/business/tasks/categories');
  }

  async createTaskCategory(data: any) {
    return this.instance.post<ApiResponse>('/business/tasks/categories', data);
  }

  async addTaskChecklistItem(taskId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/tasks/tasks/${taskId}/checklist`, data);
  }

  async toggleTaskChecklistItem(taskId: string, itemId: string) {
    return this.instance.patch<ApiResponse>(`/business/tasks/tasks/${taskId}/checklist/${itemId}`);
  }

  async deleteTaskChecklistItem(taskId: string, itemId: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/tasks/${taskId}/checklist/${itemId}`);
  }

  async addTaskComment(taskId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/tasks/tasks/${taskId}/comments`, data);
  }

  async deleteTaskComment(taskId: string, commentId: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/tasks/${taskId}/comments/${commentId}`);
  }

  async startTaskTimer(taskId: string) {
    return this.instance.post<ApiResponse>(`/business/tasks/tasks/${taskId}/timer/start`);
  }

  async stopTaskTimer(taskId: string) {
    return this.instance.post<ApiResponse>(`/business/tasks/tasks/${taskId}/timer/stop`);
  }

  async addTaskResource(taskId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/tasks/tasks/${taskId}/resources`, data);
  }

  async deleteTaskResource(taskId: string, resourceId: string) {
    return this.instance.delete<ApiResponse>(`/business/tasks/tasks/${taskId}/resources/${resourceId}`);
  }

  async requestTaskValidation(taskId: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/tasks/tasks/${taskId}/validations`, data);
  }

  async approveTaskValidation(taskId: string, validationId: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/tasks/tasks/${taskId}/validations/${validationId}`, data);
  }

  async getTaskStats() {
    return this.instance.get<ApiResponse>('/business/tasks/tasks/stats');
  }

  async getTaskHistory(taskId: string) {
    return this.instance.get<ApiResponse>(`/business/tasks/tasks/${taskId}/history`);
  }

  // ============================================
  // RENTALS ENDPOINTS
  // ============================================

  async getMyRentals(params?: any) {
    return this.instance.get<ApiResponse>('/business/rentals', { params });
  }

  async getMyRental(id: string) {
    return this.instance.get<ApiResponse>(`/business/rentals/${id}`);
  }

  async createRental(data: any) {
    return this.instance.post<ApiResponse>('/business/rentals', data);
  }

  async updateRental(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/rentals/${id}`, data);
  }

  async deleteRental(id: string) {
    return this.instance.delete<ApiResponse>(`/business/rentals/${id}`);
  }

  async toggleRentalActive(id: string) {
    return this.instance.patch<ApiResponse>(`/business/rentals/${id}/toggle`);
  }

  async getRentalStats() {
    return this.instance.get<ApiResponse>('/business/rentals/stats');
  }

  // ============================================
  // FINANCE DEBTS & ESCROW ENDPOINTS
  // ============================================

  async getDebts(params?: any) {
    return this.instance.get<ApiResponse>('/business/finance/debts', { params });
  }

  async getDebt(id: string) {
    return this.instance.get<ApiResponse>(`/business/finance/debts/${id}`);
  }

  async updateDebt(id: string, data: any) {
    return this.instance.patch<ApiResponse>(`/business/finance/debts/${id}`, data);
  }

  async registerDebtPayment(id: string, data: any) {
    return this.instance.post<ApiResponse>(`/business/finance/debts/${id}/payment`, data);
  }

  async updateDebtPriority(id: string, priority: string) {
    return this.instance.patch<ApiResponse>(`/business/finance/debts/${id}/priority`, { priority });
  }

  async getEscrows(params?: any) {
    return this.instance.get<ApiResponse>('/business/finance/escrow', { params });
  }

  async createEscrow(data: any) {
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

  async getClientRisks(params?: any) {
    return this.instance.get<ApiResponse>('/business/finance/client-risks', { params });
  }

  async getPaymentStats() {
    return this.instance.get<ApiResponse>('/business/finance/stats');
  }

  async getFinancialLogs(params?: any) {
    return this.instance.get<ApiResponse>('/business/finance/logs', { params });
  }

  async sendDebtReminder(debtId: string) {
    return this.instance.post<ApiResponse>(`/business/finance/debts/${debtId}/reminder`);
  }

  // ============================================
  // REVIEWS ENDPOINTS
  // ============================================

  async getReviews(params?: any) {
    return this.instance.get<ApiResponse>('/reviews', { params });
  }

  async respondToReview(reviewId: string, response: string) {
    return this.instance.post<ApiResponse>(`/reviews/${reviewId}/respond`, { response });
  }

  async createReview(data: FormData) {
    return this.instance.post<ApiResponse>('/reviews', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  // ============================================
  // AFRI SCORE ENDPOINTS
  // ============================================

  async getMyScore() {
    return this.instance.get<ApiResponse>('/afriscore/mine');
  }

  async getPublicScore(businessId: string) {
    return this.instance.get<ApiResponse>(`/afriscore/${businessId}`);
  }

  async getScoreHistory() {
    return this.instance.get<ApiResponse>('/afriscore/mine/history');
  }

  async recomputeMyScore() {
    return this.instance.post<ApiResponse>('/afriscore/mine/recompute');
  }

  async getMyBadges() {
    return this.instance.get<ApiResponse>('/afriscore/mine/badges');
  }

  async getMyConsents() {
    return this.instance.get<ApiResponse>('/afriscore/consent');
  }

  async createConsent(data: any) {
    return this.instance.post<ApiResponse>('/afriscore/consent', data);
  }

  async updateConsent(id: string, data: any) {
    return this.instance.put<ApiResponse>('/afriscore/consent', data);
  }

  async revokeConsent(id: string) {
    return this.instance.delete<ApiResponse>('/afriscore/consent');
  }

  // ============================================
  // ADS ENDPOINTS
  // ============================================

  async getMyAdCampaigns() {
    return this.instance.get<ApiResponse>('/ads/my-campaigns');
  }

  async createAdCampaign(data: any) {
    return this.instance.post<ApiResponse>('/ads/campaigns', data);
  }

  async getAdCampaignById(id: string) {
    return this.instance.get<ApiResponse>(`/ads/campaigns/${id}`);
  }

  async getAdCampaignStats(id: string) {
    return this.instance.get<ApiResponse>(`/ads/campaigns/${id}/stats`);
  }

  async getActiveAds(params?: any) {
    return this.instance.get<ApiResponse>('/ads/active', { params });
  }

  async pauseAdCampaign(id: string) {
    return this.instance.patch<ApiResponse>(`/ads/${id}/pause`);
  }

  async resumeAdCampaign(id: string) {
    return this.instance.patch<ApiResponse>(`/ads/${id}/resume`);
  }

  async deleteAdCampaign(id: string) {
    return this.instance.delete<ApiResponse>(`/ads/${id}`);
  }

  // ============================================
  // DEVELOPER ENDPOINTS
  // ============================================

  async getDeveloperProfile() {
    return this.instance.get<ApiResponse>('/developer/profile');
  }

  async updateDeveloperProfile(data: any) {
    return this.instance.put<ApiResponse>('/developer/profile', data);
  }

  async getDeveloperDashboard() {
    return this.instance.get<ApiResponse>('/developer/dashboard');
  }

  async getDeveloperModules() {
    return this.instance.get<ApiResponse>('/developer/modules');
  }

  async getDeveloperModule(id: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${id}`);
  }

  async createDeveloperModule(data: any) {
    return this.instance.post<ApiResponse>('/developer/modules', data);
  }

  async updateDeveloperModule(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/developer/modules/${id}`, data);
  }

  async publishDeveloperModule(id: string) {
    return this.instance.post<ApiResponse>(`/developer/modules/${id}/publish`);
  }

  async createModuleVersion(moduleId: string, data: any) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/versions`, data);
  }

  async getModuleVersions(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/versions`);
  }

  async getModuleReviews(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/reviews`);
  }

  async createModuleReview(moduleId: string, data: any) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/reviews`, data);
  }

  async getDeveloperOrders() {
    return this.instance.get<ApiResponse>('/developer/orders');
  }

  async getDeveloperRevenues() {
    return this.instance.get<ApiResponse>('/developer/revenues');
  }

  async getDeveloperRevenueSummary() {
    return this.instance.get<ApiResponse>('/developer/revenues/summary');
  }

  async getDeveloperPayouts() {
    return this.instance.get<ApiResponse>('/developer/payouts');
  }

  async requestDeveloperPayout(data: any) {
    return this.instance.post<ApiResponse>('/developer/payouts', data);
  }

  async getDeveloperInstallations() {
    return this.instance.get<ApiResponse>('/developer/installations');
  }

  async getDeveloperSubscriptions() {
    return this.instance.get<ApiResponse>('/developer/subscriptions');
  }

  async getDeveloperTickets() {
    return this.instance.get<ApiResponse>('/developer/tickets');
  }

  async getDeveloperTicket(id: string) {
    return this.instance.get<ApiResponse>(`/developer/tickets/${id}`);
  }

  async createDeveloperTicket(data: any) {
    return this.instance.post<ApiResponse>('/developer/tickets', data);
  }

  async replyToTicket(ticketId: string, data: any) {
    return this.instance.post<ApiResponse>(`/developer/tickets/${ticketId}/reply`, data);
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return this.instance.put<ApiResponse>(`/developer/tickets/${ticketId}/status`, { status });
  }

  async uploadModuleImage(moduleId: string, formData: FormData) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async submitDeveloperVerification(documents: any) {
    return this.instance.post<ApiResponse>('/developer/verification', documents);
  }

  async createSupportTicket(data: any) {
    return this.instance.post<ApiResponse>('/messages/support', data);
  }

  // ============================================
  // SIMULATION / SANDBOX ENDPOINTS
  // ============================================

  async getSimulationEnvironments() {
    return this.instance.get<ApiResponse>('/sandbox/environments');
  }

  async testSimulationEndpoint(moduleSlug: string, data: { endpoint: string; method: string; body?: any }) {
    return this.instance.post<ApiResponse>(`/sandbox/environments/${moduleSlug}/test`, data);
  }

  async getSimulationLogs(moduleSlug?: string) {
    return this.instance.get<ApiResponse>('/sandbox/logs', { params: { moduleSlug } });
  }

  async getSimulationMockData(moduleSlug: string, dataType: string) {
    return this.instance.get<ApiResponse>(`/sandbox/environments/${moduleSlug}/mock/${dataType}`);
  }

  async getSimulationEndpoints() {
    return this.instance.get<ApiResponse>('/sandbox/endpoints');
  }

  // ============================================
  // MARKETPLACE ENDPOINTS
  // ============================================

  async searchMarketplace(params?: any) {
    return this.instance.get<ApiResponse>('/marketplace/search', { params });
  }

  async getTrendingMarketplace() {
    return this.instance.get<ApiResponse>('/marketplace/trending');
  }

  async getMarketplaceModules(params?: any) {
    return this.instance.get<ApiResponse>('/marketplace/modules', { params });
  }

  async getMarketplaceModule(slug: string) {
    return this.instance.get<ApiResponse>(`/marketplace/modules/${slug}`);
  }

  async getMarketplaceStats() {
    return this.instance.get<ApiResponse>('/marketplace/stats');
  }

  async getSimilarBusinesses(businessId: string, limit?: number) {
    return this.instance.get<ApiResponse>(`/marketplace/similar/${businessId}`, { params: { limit } });
  }

  async getActiveMarketplaceAds(params?: { page?: string; position?: string; country?: string }) {
    return this.instance.get<ApiResponse>('/marketplace/ads', { params });
  }

  async startMarketplaceModuleTrial(moduleId: string) {
    return this.instance.post<ApiResponse>(`/marketplace/modules/${moduleId}/trial`);
  }

  async purchaseMarketplaceModule(moduleId: string, data: { provider: string; phone: string }) {
    return this.instance.post<ApiResponse>(`/marketplace/modules/${moduleId}/purchase`, data);
  }

  async getBusinessInstalledModules() {
    return this.instance.get<ApiResponse>('/business/modules/installed');
  }

  async confirmMarketplaceModulePayment(data: { providerRef: string }) {
    return this.instance.post<ApiResponse>('/marketplace/confirm-payment', data);
  }

  async installMarketplaceModule(moduleId: string, data?: any) {
    return this.instance.post<ApiResponse>(`/marketplace/modules/${moduleId}/install`, data);
  }

  async toggleBusinessModule(module: string, enabled: boolean) {
    return this.instance.patch<ApiResponse>('/business/modules/toggle', { module, enabled });
  }

  async installCoreModule(moduleId: string) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/install`);
  }

  async uninstallCoreModule(moduleId: string) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/uninstall`);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  async adminGetAllAdCampaigns(params?: any) {
    return this.instance.get<ApiResponse>('/admin/ads/campaigns', { params });
  }

  async adminGetAdStats(params?: any) {
    return this.instance.get<ApiResponse>('/admin/ads/stats', { params });
  }

  async adminGetAdRevenue(params?: any) {
    return this.instance.get<ApiResponse>('/admin/ads/revenue', { params });
  }

  async adminValidateAdCampaign(id: string) {
    return this.instance.post<ApiResponse>(`/admin/ads/campaigns/${id}/validate`);
  }

  async adminRejectAdCampaign(id: string, reason?: string) {
    return this.instance.post<ApiResponse>(`/admin/ads/campaigns/${id}/reject`, { reason });
  }

  async adminSuspendAdCampaign(id: string, reason?: string) {
    return this.instance.post<ApiResponse>(`/admin/ads/campaigns/${id}/suspend`, { reason });
  }

  async adminCreateAdPackage(data: any) {
    return this.instance.post<ApiResponse>('/admin/ads/packages', data);
  }

  async adminGetAdPackages() {
    return this.instance.get<ApiResponse>('/admin/ads/packages');
  }

  async adminGetPartners(params?: any) {
    return this.instance.get<ApiResponse>('/admin/partners', { params });
  }

  async adminGetPartnerDetail(id: string) {
    return this.instance.get<ApiResponse>(`/admin/partners/${id}`);
  }

  async adminApprovePartner(id: string) {
    return this.instance.post<ApiResponse>(`/admin/partners/${id}/approve`);
  }

  async adminRevokePartner(id: string, reason?: string) {
    return this.instance.post<ApiResponse>(`/admin/partners/${id}/revoke`, { reason });
  }

  async adminSuspendPartner(id: string, reason?: string) {
    return this.instance.post<ApiResponse>(`/admin/partners/${id}/suspend`, { reason });
  }

  async searchPartnerBusinesses(query: string) {
    return this.instance.get<ApiResponse>('/admin/partners/search', { params: { q: query } });
  }

  async adminRecomputeAllScores() {
    return this.instance.post<ApiResponse>('/admin/afriscore/recompute-all');
  }

  async adminGetDataAccessLogs(params?: any) {
    return this.instance.get<ApiResponse>('/admin/data-access-logs', { params });
  }

  async adminGetPlatformAnalytics(params?: any) {
    return this.instance.get<ApiResponse>('/admin/analytics', { params });
  }

  async adminGetReports(params?: any) {
    return this.instance.get<ApiResponse>('/admin/reports', { params });
  }

  // ============================================
  // PARTNER / DATA HUB ENDPOINTS
  // ============================================

  async getPartnerReports(params?: any) {
    return this.instance.get<ApiResponse>('/data-hub/reports', { params });
  }

  async getPartnerReportDetail(id: string) {
    return this.instance.get<ApiResponse>(`/data-hub/reports/${id}`);
  }

  async orderPartnerReport(data: any) {
    return this.instance.post<ApiResponse>('/data-hub/reports/order', data);
  }

  async getPartnerBusinessDetails(businessId: string) {
    return this.instance.get<ApiResponse>(`/data-hub/businesses/${businessId}`);
  }

  // ============================================
  // DATA HUB ANALYTICS ENDPOINTS
  // ============================================

  async getHubPlatformStats(params?: any) {
    return this.instance.get<ApiResponse>('/afriscore/hub/overview', { params });
  }

  async getHubSectorBenchmarks(params?: any) {
    return this.instance.get<ApiResponse>('/afriscore/hub/sectors', { params });
  }

  async getHubSectorStats(params?: any) {
    return this.instance.get<ApiResponse>('/afriscore/hub/sectors', { params });
  }

  async getHubGeographicStats(params?: any) {
    return this.instance.get<ApiResponse>('/afriscore/hub/geographic', { params });
  }

  async getHubGrowthStats(params?: any) {
    return this.instance.get<ApiResponse>('/afriscore/hub/trends', { params });
  }

  async getHubPaymentTrends(params?: any) {
    return this.instance.get<ApiResponse>('/afriscore/hub/payments', { params });
  }

  // ============================================
  // CART ENDPOINTS
  // ============================================
  async getCart() {
    return this.instance.get<ApiResponse>('/cart');
  }

  async addToCart(data: { productId?: string; variantId?: string; serviceId?: string; name: string; quantity: number; unitPrice: number; image?: string; notes?: string }) {
    return this.instance.post<ApiResponse>('/cart/items', data);
  }

  async updateCartItem(itemId: string, data: { quantity: number; notes?: string }) {
    return this.instance.put<ApiResponse>(`/cart/items/${itemId}`, data);
  }

  async removeFromCart(itemId: string) {
    return this.instance.delete<ApiResponse>(`/cart/items/${itemId}`);
  }

  async clearCart() {
    return this.instance.delete<ApiResponse>('/cart');
  }

  async applyCoupon(code: string) {
    return this.instance.post<ApiResponse>('/cart/coupon', { code });
  }

  async removeCoupon() {
    return this.instance.delete<ApiResponse>('/cart/coupon');
  }

  async checkout(data: {
    type?: string;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    contactPhone?: string;
    contactName?: string;
    notes?: string;
    paymentMethod?: string;
  }) {
    return this.instance.post<ApiResponse>('/cart/checkout', data);
  }

  // ============================================
  // REFERRAL ENDPOINTS
  // ============================================
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

  // ============================================
  // EXTENDED DEVELOPER ENDPOINTS
  // ============================================

  // PERMISSIONS
  async getModulePermissions(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/permissions`);
  }

  async addModulePermission(moduleId: string, data: { resource: string; accessLevel: string; description?: string; isRequired?: boolean }) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/permissions`, data);
  }

  async removeModulePermission(permissionId: string) {
    return this.instance.delete<ApiResponse>(`/developer/permissions/${permissionId}`);
  }

  async checkModulePermissions(moduleId: string, businessId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/permissions/check`, { params: { businessId } });
  }

  async getPermissionSummary(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/permissions/summary`);
  }

  // LICENSES
  async createLicense(data: { moduleId: string; businessId: string; licenseType: string; price?: number; currency?: string; expiresAt?: Date; autoRenew?: boolean }) {
    return this.instance.post<ApiResponse>('/developer/licenses', data);
  }

  async activateLicense(licenseKey: string) {
    return this.instance.post<ApiResponse>('/developer/licenses/activate', { licenseKey });
  }

  async revokeLicense(id: string, reason?: string) {
    return this.instance.post<ApiResponse>(`/developer/licenses/${id}/revoke`, { reason });
  }

  async renewLicense(id: string, durationDays?: number) {
    return this.instance.post<ApiResponse>(`/developer/licenses/${id}/renew`, { durationDays });
  }

  async checkLicense(moduleId: string, businessId: string) {
    return this.instance.get<ApiResponse>(`/developer/licenses/check/${moduleId}/${businessId}`);
  }

  async getModuleLicenses(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/licenses`);
  }

  async getBusinessLicenses(businessId: string) {
    return this.instance.get<ApiResponse>(`/developer/licenses/business/${businessId}`);
  }

  async getLicenseStats() {
    return this.instance.get<ApiResponse>('/developer/licenses/stats');
  }

  // API KEYS
  async getApiKeys() {
    return this.instance.get<ApiResponse>('/developer/api-keys');
  }

  async createApiKey(data: { name: string; scopes?: string[]; expiresAt?: Date }) {
    return this.instance.post<ApiResponse>('/developer/api-keys', data);
  }

  async revokeApiKey(id: string) {
    return this.instance.delete<ApiResponse>(`/developer/api-keys/${id}`);
  }

  // WEBHOOKS
  async getWebhooks() {
    return this.instance.get<ApiResponse>('/developer/webhooks');
  }

  async createWebhook(data: { url: string; events: string[]; moduleId?: string }) {
    return this.instance.post<ApiResponse>('/developer/webhooks', data);
  }

  async deleteWebhook(id: string) {
    return this.instance.delete<ApiResponse>(`/developer/webhooks/${id}`);
  }

  async getWebhookDeliveries(webhookId: string, limit?: number) {
    return this.instance.get<ApiResponse>(`/developer/webhooks/${webhookId}/deliveries`, { params: { limit } });
  }

  // ANALYTICS
  async trackAnalytics(moduleId: string, data: any) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/analytics/track`, data);
  }

  async getModuleAnalytics(moduleId: string, startDate?: string, endDate?: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/analytics`, { params: { startDate, endDate } });
  }

  async getDeveloperAnalyticsOverview() {
    return this.instance.get<ApiResponse>('/developer/analytics/overview');
  }

  async logModuleError(moduleId: string, data: any) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/errors`, data);
  }

  async getModuleErrors(moduleId: string, resolved?: boolean, limit?: number) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/errors`, { params: { resolved, limit } });
  }

  async resolveModuleError(errorId: string) {
    return this.instance.post<ApiResponse>(`/developer/errors/${errorId}/resolve`);
  }

  // VALIDATION
  async submitModuleForValidation(moduleId: string) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/validation/submit`);
  }

  async getModuleValidation(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/validation`);
  }

  async getValidationHistory(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/validation/history`);
  }

  async getPendingValidations() {
    return this.instance.get<ApiResponse>('/developer/validations/pending');
  }

  async approveValidationCheck(checkId: string, score: number, details?: string) {
    return this.instance.post<ApiResponse>(`/developer/validation-checks/${checkId}/approve`, { score, details });
  }

  async rejectValidationCheck(checkId: string, details: string) {
    return this.instance.post<ApiResponse>(`/developer/validation-checks/${checkId}/reject`, { details });
  }

  async completeValidation(validationId: string, status: string, notes?: string) {
    return this.instance.post<ApiResponse>(`/developer/validations/${validationId}/complete`, { status, notes });
  }

  // CONFIGURATION
  async saveModuleConfiguration(moduleId: string, data: { businessId: string; installationId: string; settings: any }) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/configuration`, data);
  }

  async getModuleConfiguration(moduleId: string, businessId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/configuration/${businessId}`);
  }

  async toggleModuleActive(moduleId: string, businessId: string, isActive: boolean) {
    return this.instance.put<ApiResponse>(`/developer/modules/${moduleId}/configuration/${businessId}/toggle`, { isActive });
  }

  async getModuleConfigurations(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/configurations`);
  }

  async getBusinessModules(businessId: string) {
    return this.instance.get<ApiResponse>(`/developer/configurations/business/${businessId}`);
  }

  // ACTIVITY
  async logActivity(moduleId: string, data: { activityType: string; businessId?: string; installationId?: string; description?: string; metadata?: any }) {
    return this.instance.post<ApiResponse>(`/developer/modules/${moduleId}/activity`, data);
  }

  async getModuleActivity(moduleId: string, limit?: number) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/activity`, { params: { limit } });
  }

  async getDeveloperActivityFeed(limit?: number) {
    return this.instance.get<ApiResponse>('/developer/activity/feed', { params: { limit } });
  }

  async getBusinessActivityFeed(businessId: string, limit?: number) {
    return this.instance.get<ApiResponse>(`/developer/activity/business/${businessId}`, { params: { limit } });
  }

  async getActivityStats(moduleId: string) {
    return this.instance.get<ApiResponse>(`/developer/modules/${moduleId}/activity/stats`);
  }

  // BUSINESS SETTINGS & PAYMENTS
  async getBusinessPaymentMethods() {
    return this.instance.get<ApiResponse>('/business/payment-methods');
  }

  async addBusinessPaymentMethod(data: any) {
    return this.instance.post<ApiResponse>('/business/payment-methods', data);
  }

  async updateBusinessPaymentMethod(id: string, data: any) {
    return this.instance.put<ApiResponse>(`/business/payment-methods/${id}`, data);
  }

  async deleteBusinessPaymentMethod(id: string) {
    return this.instance.delete<ApiResponse>(`/business/payment-methods/${id}`);
  }

  async getBusinessFunnel() {
    return this.instance.get<ApiResponse>('/business/analytics/funnel');
  }

  async getBusinessEngagement() {
    return this.instance.get<ApiResponse>('/business/analytics/engagement');
  }
}

export const apiClient = new ApiClient();
