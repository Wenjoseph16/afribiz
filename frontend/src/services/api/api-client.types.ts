import type { AxiosResponse } from 'axios';
import type { ApiResponse } from '@afribiz/shared';

/**
 * Interface listing ALL methods injected into ApiClient at runtime.
 * This provides full TypeScript type safety for the dynamic method injection pattern.
 */
export interface ApiClientMethods {
  // ============================================
  // GENERIC HTTP METHODS (from ApiClient class)
  // ============================================
  get<T = any>(url: string, config?: any): Promise<AxiosResponse<ApiResponse<T>>>;
  post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>>;
  put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>>;
  delete<T = any>(url: string, config?: any): Promise<AxiosResponse<ApiResponse<T>>>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<ApiResponse<T>>>;
  queryWithSignal<T = any>(
    signal: AbortSignal | undefined | null,
    fn: (client: this) => Promise<{ data: ApiResponse<T> }>
  ): Promise<T>;

  // ============================================
  // AUTH (injectAuth)
  // ============================================
  signup(data: any): Promise<any>;
  login(data: { identifier: string; password: string; rememberMe?: boolean }): Promise<any>;
  logout(): Promise<any>;
  forgotPassword(email: string): Promise<any>;
  resetPassword(token: string, password: string): Promise<any>;
  verifyEmail(token: string): Promise<any>;
  resendVerification(email: string): Promise<any>;
  sendOTP(email: string, type: string): Promise<any>;
  verifyOTP(email: string, code: string, type: string): Promise<any>;
  getSessions(): Promise<any>;
  revokeSession(sessionId: string): Promise<any>;
  activateBusinessRole(): Promise<any>;
  activateDeveloperRole(): Promise<any>;
  revokeOtherSessions(): Promise<any>;
  getActiveSessions(): Promise<any>;
  get2FAStatus(): Promise<any>;
  setup2FA(): Promise<any>;
  verify2FA(token: string): Promise<any>;
  disable2FA(password: string): Promise<any>;
  verify2FALogin(data: {
    identifier: string;
    password: string;
    tempToken: string;
    totpCode: string;
    rememberMe?: boolean;
  }): Promise<any>;

  // ============================================
  // PROFILE (injectProfile)
  // ============================================
  getProfile(): Promise<any>;
  updateProfile(data: any): Promise<any>;
  updatePassword(data: { currentPassword: string; newPassword: string }): Promise<any>;
  uploadAvatar(file: File): Promise<any>;
  uploadMedia(file: File): Promise<any>;
  uploadMultipleMedia(files: File[]): Promise<any>;

  // ============================================
  // BUSINESS (injectBusiness)
  // ============================================
  createBusiness(data: any): Promise<any>;
  getMyBusiness(): Promise<any>;
  getPublicBusiness(slug: string): Promise<any>;
  getBusinessStats(): Promise<any>;
  getBusinessClients(params?: any): Promise<any>;
  getBusinessMenu(slug?: string): Promise<any>;
  getBusinessProducts(slug?: string): Promise<any>;
  getBusinessServices(slug?: string): Promise<any>;
  getBusinessRooms(slug?: string): Promise<any>;
  getBusinessEvents(slug?: string): Promise<any>;
  getBusinessRentals(slug?: string): Promise<any>;
  getBusinessBookings(slug?: string): Promise<any>;
  getBusinessReviews(slug?: string): Promise<any>;
  createBusinessReview(
    slug: string,
    data: { rating: number; title?: string; comment?: string }
  ): Promise<any>;
  getBusinessPromotions(slug?: string): Promise<any>;
  getBusinessPartners(slug?: string): Promise<any>;
  getBusinessPortfolio(slug?: string): Promise<any>;
  getBusinessTrainings(slug?: string): Promise<any>;
  getBusinessSubscriptionPlans(slug: string): Promise<any>;
  getPublicPagePreview(): Promise<any>;
  updatePublicPage(data: any): Promise<any>;

  // ============================================
  // ORDERS (injectOrders)
  // ============================================
  getOrders(params?: any): Promise<any>;
  getOrder(id: string): Promise<any>;
  getOrderTimeline(id: string): Promise<any>;
  updateOrder(id: string, data: any): Promise<any>;
  getMyBusinessOrders(params?: any): Promise<any>;
  getMyBusinessOrder(id: string): Promise<any>;
  createBusinessOrder(data: any): Promise<any>;
  updateBusinessOrderStatus(id: string, status: string, reason?: string): Promise<any>;
  updateBusinessOrderDelivery(id: string, deliveryStatus: string, notes?: string): Promise<any>;
  updateBusinessOrderPayment(id: string, data: any): Promise<any>;
  deleteBusinessOrder(id: string): Promise<any>;
  getBusinessOrderStats(): Promise<any>;
  exportBusinessOrdersCSV(): Promise<any>;
  getBusinessDebts(params?: any): Promise<any>;
  payBusinessDebt(id: string, amount: number): Promise<any>;
  settleBusinessDebt(id: string): Promise<any>;

  // ============================================
  // BOOKINGS Client (injectBookings)
  // ============================================
  getBookings(params?: any): Promise<any>;
  getBooking(id: string): Promise<any>;
  cancelMyBooking(id: string, reason?: string): Promise<any>;
  rescheduleMyBooking(id: string, startDate: string, endDate?: string): Promise<any>;
  createRentalBooking(data: {
    rentalId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }): Promise<any>;
  prolongRentalBooking(
    id: string,
    data: { newEndDate: string; additionalNotes?: string }
  ): Promise<any>;

  // ============================================
  // PAYMENTS (injectPayments)
  // ============================================
  getPayments(params?: any): Promise<any>;
  getPayment(id: string): Promise<any>;
  getWallet(): Promise<any>;
  getClientEscrows(params?: any): Promise<any>;
  confirmClientEscrow(id: string): Promise<any>;
  disputeClientEscrow(id: string, data: { reason: string }): Promise<any>;
  getClientDebts(params?: any): Promise<any>;
  payClientDebt(
    id: string,
    data: { amount: number; paymentMethod?: string; notes?: string }
  ): Promise<any>;
  initiatePayment(data: {
    provider: string;
    amount: number;
    phone?: string;
    paymentMethodId?: string;
    orderId?: string;
    currency?: string;
    mode?: string;
    callbackUrl?: string;
    customerName?: string;
    customerEmail?: string;
  }): Promise<any>;
  addPaymentProof(paymentId: string, data: { imageUrl: string; notes?: string }): Promise<any>;

  // ============================================
  // NOTIFICATIONS (injectNotifications)
  // ============================================
  getNotifications(params?: any): Promise<any>;
  getUnreadCount(): Promise<any>;
  markNotificationRead(id: string): Promise<any>;
  markAllNotificationsRead(): Promise<any>;
  deleteNotification(id: string): Promise<any>;
  getNotificationPreferences(): Promise<any>;
  updateNotificationPreferences(data: any): Promise<any>;

  // ============================================
  // MESSAGES (injectMessages)
  // ============================================
  getConversations(): Promise<any>;
  getMessages(conversationId: string, params?: { page?: number; limit?: number }): Promise<any>;
  sendMessage(data: {
    conversationId?: string;
    recipientId?: string;
    content: string;
    attachment?: string;
    attachmentType?: string;
  }): Promise<any>;
  createConversation(data: {
    recipientId: string;
    subject?: string;
    initialMessage?: string;
  }): Promise<any>;

  // ============================================
  // PRODUCTS (injectProducts)
  // ============================================
  getMyProducts(params?: any): Promise<any>;
  getMyProduct(id: string): Promise<any>;
  createProduct(data: any): Promise<any>;
  updateProduct(id: string, data: any): Promise<any>;
  deleteProduct(id: string): Promise<any>;
  duplicateProduct(id: string): Promise<any>;
  toggleProductActive(id: string): Promise<any>;
  updateProductStock(id: string, data: any): Promise<any>;
  getProductCategories(): Promise<any>;
  createProductCategory(data: any): Promise<any>;
  updateProductCategory(id: string, data: any): Promise<any>;
  deleteProductCategory(id: string): Promise<any>;
  getProductStats(): Promise<any>;
  getStockAlerts(): Promise<any>;
  exportProducts(params?: any): Promise<any>;
  importProducts(data: any): Promise<any>;
  bulkDeleteProducts(ids: string[]): Promise<any>;
  bulkToggleProducts(ids: string[], isActive: boolean): Promise<any>;
  bulkUpdateProductStock(items: { id: string; stock: number }[]): Promise<any>;

  // ============================================
  // SERVICES (injectServicesDomain)
  // ============================================
  getMyServices(params?: any): Promise<any>;
  getMyService(id: string): Promise<any>;
  createService(data: any): Promise<any>;
  updateService(id: string, data: any): Promise<any>;
  deleteService(id: string): Promise<any>;
  toggleServiceActive(id: string): Promise<any>;
  getServiceCategories(): Promise<any>;
  createServiceCategory(data: any): Promise<any>;
  updateServiceCategory(id: string, data: any): Promise<any>;
  deleteServiceCategory(id: string): Promise<any>;
  getServiceStats(): Promise<any>;
  duplicateService(id: string): Promise<any>;
  exportServices(params?: any): Promise<any>;
  importServices(data: any): Promise<any>;
  bulkDeleteServices(ids: string[]): Promise<any>;
  bulkToggleServices(ids: string[], isActive: boolean): Promise<any>;

  // ============================================
  // MENU (injectMenu)
  // ============================================
  getMyMenuItems(params?: any): Promise<any>;
  getMyMenuItem(id: string): Promise<any>;
  createMenuItem(data: any): Promise<any>;
  updateMenuItem(id: string, data: any): Promise<any>;
  deleteMenuItem(id: string): Promise<any>;
  toggleMenuItemActive(id: string): Promise<any>;
  updateMenuItemStatus(id: string, status: string): Promise<any>;
  getMenuCategories(): Promise<any>;
  createMenuCategory(data: any): Promise<any>;
  updateMenuCategory(id: string, data: any): Promise<any>;
  deleteMenuCategory(id: string): Promise<any>;
  getMenuOrders(params?: any): Promise<any>;
  getMenuOrder(id: string): Promise<any>;
  createMenuOrder(data: any): Promise<any>;
  updateMenuOrderStatus(id: string, status: string): Promise<any>;
  getMenuOrderStats(): Promise<any>;
  getMenuTables(): Promise<any>;
  createMenuTable(data: any): Promise<any>;
  updateMenuTable(id: string, data: any): Promise<any>;
  deleteMenuTable(id: string): Promise<any>;
  updateMenuTableStatus(id: string, status: string): Promise<any>;
  getMenuIngredients(params?: any): Promise<any>;
  createMenuIngredient(data: any): Promise<any>;
  updateMenuIngredient(id: string, data: any): Promise<any>;
  deleteMenuIngredient(id: string): Promise<any>;
  adjustIngredientStock(id: string, data: any): Promise<any>;
  getMenuStats(): Promise<any>;

  // ============================================
  // ROOMS (injectRooms)
  // ============================================
  getMyRooms(params?: any): Promise<any>;
  getMyRoom(id: string): Promise<any>;
  createRoom(data: any): Promise<any>;
  updateRoom(id: string, data: any): Promise<any>;
  deleteRoom(id: string): Promise<any>;
  toggleRoomActive(id: string): Promise<any>;
  updateRoomStatus(id: string, status: string): Promise<any>;
  blockRoomDates(id: string, data: any): Promise<any>;
  duplicateRoom(id: string): Promise<any>;
  exportRooms(params?: any): Promise<any>;
  importRooms(data: any): Promise<any>;
  bulkDeleteRooms(ids: string[]): Promise<any>;
  bulkToggleRooms(ids: string[], isActive: boolean): Promise<any>;
  getRoomStats(): Promise<any>;

  // ============================================
  // BUSINESS BOOKINGS (injectBusinessBookings)
  // ============================================
  getMyBusinessBookings(params?: any): Promise<any>;
  getMyBusinessBooking(id: string): Promise<any>;
  createBusinessBooking(data: any): Promise<any>;
  updateBusinessBookingStatus(id: string, status: string): Promise<any>;
  getBookingResources(): Promise<any>;
  getBookingSlots(): Promise<any>;
  updateBusinessBooking(id: string, data: any): Promise<any>;
  deleteBusinessBooking(id: string): Promise<any>;
  sendBookingReminder(id: string, type: string, channel: string): Promise<any>;
  getBookingCalendar(params?: any): Promise<any>;

  // ============================================
  // PLANNING (injectPlanning)
  // ============================================
  getPlanningCalendar(params?: any): Promise<any>;
  getPlanningTasks(params?: any): Promise<any>;
  getPlanningTask(id: string): Promise<any>;
  createPlanningTask(data: any): Promise<any>;
  updatePlanningTask(id: string, data: any): Promise<any>;
  deletePlanningTask(id: string): Promise<any>;
  getPlanningSchedules(params?: any): Promise<any>;
  upsertPlanningSchedule(data: any): Promise<any>;
  deletePlanningSchedule(id: string): Promise<any>;
  getPlanningStats(): Promise<any>;
  getPlanningLogs(params?: any): Promise<any>;

  // ============================================
  // PROMOTIONS (injectPromotions)
  // ============================================
  getMyPromotions(params?: any): Promise<any>;
  getMyPromotion(id: string): Promise<any>;
  createPromotion(data: any): Promise<any>;
  updatePromotion(id: string, data: any): Promise<any>;
  deletePromotion(id: string): Promise<any>;
  getPromoCoupons(params?: any): Promise<any>;
  createPromoCoupon(data: any): Promise<any>;
  getPromoBundles(params?: any): Promise<any>;
  createPromoBundle(data: any): Promise<any>;
  getPromoCampaigns(params?: any): Promise<any>;
  createPromoCampaign(data: any): Promise<any>;
  sendCampaignWhatsApp(campaignId: string, data: any): Promise<any>;
  getLoyaltyProgram(): Promise<any>;
  updateLoyaltyProgram(data: any): Promise<any>;
  getPromoStats(): Promise<any>;

  // ============================================
  // EMPLOYEES (injectEmployees)
  // ============================================
  getMyEmployees(params?: any): Promise<any>;
  getMyEmployee(id: string): Promise<any>;
  createEmployee(data: any): Promise<any>;
  updateEmployee(id: string, data: any): Promise<any>;
  deleteEmployee(id: string): Promise<any>;
  getEmployeeRoles(): Promise<any>;
  createEmployeeRole(data: any): Promise<any>;
  updateEmployeeRole(id: string, data: any): Promise<any>;
  deleteEmployeeRole(id: string): Promise<any>;
  getEmployeeAttendances(params?: any): Promise<any>;
  clockIn(data: any): Promise<any>;
  clockOut(id: string): Promise<any>;
  getEmployeeStats(): Promise<any>;
  getEmployeeDocuments(employeeId: string): Promise<any>;
  createEmployeeDocument(data: any): Promise<any>;
  deleteEmployeeDocument(id: string): Promise<any>;

  // ============================================
  // PORTFOLIO (injectPortfolio)
  // ============================================
  getMyPortfolioItems(params?: any): Promise<any>;
  getMyPortfolioItem(id: string): Promise<any>;
  createPortfolioItem(data: any): Promise<any>;
  updatePortfolioItem(id: string, data: any): Promise<any>;
  deletePortfolioItem(id: string): Promise<any>;
  getPortfolioCategories(): Promise<any>;
  createPortfolioCategory(data: any): Promise<any>;
  updatePortfolioCategory(id: string, data: any): Promise<any>;
  deletePortfolioCategory(id: string): Promise<any>;
  getPortfolioTestimonials(params?: any): Promise<any>;
  createPortfolioTestimonial(data: any): Promise<any>;
  updatePortfolioTestimonial(id: string, data: any): Promise<any>;
  deletePortfolioTestimonial(id: string): Promise<any>;
  getPortfolioStats(): Promise<any>;

  // ============================================
  // SUBSCRIPTIONS (injectSubscriptions)
  // ============================================
  getSubscriptionPlans(): Promise<any>;
  getSubscriptionPlan(id: string): Promise<any>;
  createSubscriptionPlan(data: any): Promise<any>;
  updateSubscriptionPlan(id: string, data: any): Promise<any>;
  deleteSubscriptionPlan(id: string): Promise<any>;
  getSubscribers(params?: any): Promise<any>;
  getSubscriber(id: string): Promise<any>;
  createSubscription(data: any): Promise<any>;
  cancelSubscription(id: string): Promise<any>;
  renewSubscription(id: string): Promise<any>;
  getSubscriptionPayments(params?: any): Promise<any>;
  recordSubscriptionPayment(data: any): Promise<any>;
  getSubscriptionStats(): Promise<any>;
  getSubscriptionLogs(params?: any): Promise<any>;

  // ============================================
  // DOCUMENTS (injectDocuments)
  // ============================================
  getDocuments(params?: any): Promise<any>;
  getDocument(id: string): Promise<any>;
  createDocument(data: any): Promise<any>;
  updateDocument(id: string, data: any): Promise<any>;
  deleteDocument(id: string): Promise<any>;
  getDocumentStats(): Promise<any>;

  // ============================================
  // DELIVERY (injectDelivery)
  // ============================================
  getDeliveries(params?: any): Promise<any>;
  getDelivery(id: string): Promise<any>;
  createDelivery(data: any): Promise<any>;
  updateDelivery(id: string, data: any): Promise<any>;
  assignDriver(id: string, data: any): Promise<any>;
  updateDeliveryStatus(id: string, status: string): Promise<any>;
  addTrackingEvent(id: string, data: any): Promise<any>;
  addDeliveryProof(id: string, data: any): Promise<any>;
  getDeliveryZones(): Promise<any>;
  createDeliveryZone(data: any): Promise<any>;
  updateDeliveryZone(id: string, data: any): Promise<any>;
  deleteDeliveryZone(id: string): Promise<any>;
  getDrivers(params?: any): Promise<any>;
  createDriver(data: any): Promise<any>;
  updateDriver(id: string, data: any): Promise<any>;
  deleteDriver(id: string): Promise<any>;
  getDeliveryStats(): Promise<any>;

  // ============================================
  // EVENTS (injectEvents)
  // ============================================
  getMyEvents(params?: any): Promise<any>;
  getMyEvent(id: string): Promise<any>;
  createEvent(data: any): Promise<any>;
  updateEvent(id: string, data: any): Promise<any>;
  deleteEvent(id: string): Promise<any>;
  getEventTickets(eventId: string): Promise<any>;
  createEventTicket(eventId: string, data: any): Promise<any>;
  updateEventTicket(eventId: string, ticketId: string, data: any): Promise<any>;
  deleteEventTicket(eventId: string, ticketId: string): Promise<any>;
  getEventParticipants(eventId: string): Promise<any>;
  registerEventParticipant(eventId: string, data: any): Promise<any>;
  getEventDashboardStats(): Promise<any>;
  updateEventParticipantStatus(
    eventId: string,
    participantId: string,
    status: string
  ): Promise<any>;
  getEventScans(eventId: string): Promise<any>;
  scanEventTicket(eventId: string, ticketRef: string): Promise<any>;
  getEventPromotions(eventId: string): Promise<any>;
  createEventPromotion(eventId: string, data: any): Promise<any>;
  deleteEventPromotion(eventId: string, promoId: string): Promise<any>;
  getEventGallery(eventId: string): Promise<any>;
  addEventGalleryItem(eventId: string, data: any): Promise<any>;
  deleteEventGalleryItem(eventId: string, itemId: string): Promise<any>;
  getEventPartners(eventId: string): Promise<any>;
  addEventPartner(eventId: string, data: any): Promise<any>;
  removeEventPartner(eventId: string, partnerId: string): Promise<any>;
  getEventStats(id: string): Promise<any>;
  getPublicEvent(slug: string, eventId: string): Promise<any>;
  registerPublicParticipant(slug: string, eventId: string, data: any): Promise<any>;
  getMyTicket(eventId: string): Promise<any>;

  // ============================================
  // TASKS / ADVANCED TASKS (injectTasks)
  // ============================================
  getAdvancedTasks(params?: any): Promise<any>;
  getAdvancedTask(id: string): Promise<any>;
  createAdvancedTask(data: any): Promise<any>;
  updateAdvancedTask(id: string, data: any): Promise<any>;
  deleteAdvancedTask(id: string): Promise<any>;
  getKanbanBoard(params?: any): Promise<any>;
  reorderTask(taskId: string, newStatus: string, newSortOrder: number): Promise<any>;
  getTaskCategories(): Promise<any>;
  createTaskCategory(data: any): Promise<any>;
  addTaskChecklistItem(taskId: string, data: any): Promise<any>;
  toggleTaskChecklistItem(taskId: string, itemId: string): Promise<any>;
  deleteTaskChecklistItem(taskId: string, itemId: string): Promise<any>;
  addTaskComment(taskId: string, data: any): Promise<any>;
  deleteTaskComment(taskId: string, commentId: string): Promise<any>;
  startTaskTimer(taskId: string): Promise<any>;
  stopTaskTimer(taskId: string): Promise<any>;
  addTaskResource(taskId: string, data: any): Promise<any>;
  deleteTaskResource(taskId: string, resourceId: string): Promise<any>;
  requestTaskValidation(taskId: string, data: any): Promise<any>;
  approveTaskValidation(taskId: string, validationId: string, data: any): Promise<any>;
  getTaskStats(): Promise<any>;
  getTaskHistory(taskId: string): Promise<any>;

  // ============================================
  // RENTALS (injectRentals)
  // ============================================
  getMyRentals(params?: any): Promise<any>;
  getMyRental(id: string): Promise<any>;
  createRental(data: any): Promise<any>;
  updateRental(id: string, data: any): Promise<any>;
  deleteRental(id: string): Promise<any>;
  toggleRentalActive(id: string): Promise<any>;
  getRentalStats(): Promise<any>;

  // ============================================
  // DEBTS (injectDebts)
  // ============================================
  getDebts(params?: any): Promise<any>;
  getDebt(id: string): Promise<any>;
  updateDebt(id: string, data: any): Promise<any>;
  registerDebtPayment(id: string, data: any): Promise<any>;
  updateDebtPriority(id: string, priority: string): Promise<any>;
  getEscrows(params?: any): Promise<any>;
  createEscrow(data: any): Promise<any>;
  releaseEscrow(id: string): Promise<any>;
  refundEscrow(id: string): Promise<any>;
  disputeEscrow(id: string): Promise<any>;
  getEscrowById(id: string): Promise<any>;
  getEscrowStats(): Promise<any>;
  getClientEscrowById(id: string): Promise<any>;
  getClientRisks(params?: any): Promise<any>;
  getPaymentStats(): Promise<any>;
  getFinancialLogs(params?: any): Promise<any>;
  sendDebtReminder(debtId: string): Promise<any>;
  runAutoReminders(): Promise<any>;
  getReminderConfig(): Promise<any>;
  updateReminderConfig(data: any): Promise<any>;
  attachDebtToOrder(data: any): Promise<any>;

  // ============================================
  // REVIEWS (injectReviews)
  // ============================================
  getReviews(params?: any): Promise<any>;
  respondToReview(reviewId: string, response: string): Promise<any>;
  createReview(data: FormData): Promise<any>;

  // ============================================
  // AFRI SCORE (injectAfriscore)
  // ============================================
  getMyScore(): Promise<any>;
  getPublicScore(businessId: string): Promise<any>;
  getScoreHistory(days?: number): Promise<any>;
  recomputeMyScore(): Promise<any>;
  getMyBadges(): Promise<any>;
  getMyConsents(): Promise<any>;
  createConsent(data: any): Promise<any>;
  updateConsent(id: string, data: any): Promise<any>;
  revokeConsent(id: string): Promise<any>;

  // ============================================
  // ADS (injectAds)
  // ============================================
  getMyAdCampaigns(): Promise<any>;
  createAdCampaign(data: any): Promise<any>;
  getAdCampaignById(id: string): Promise<any>;
  getAdCampaignStats(id: string): Promise<any>;
  getActiveAds(params?: any): Promise<any>;
  pauseAdCampaign(id: string): Promise<any>;
  resumeAdCampaign(id: string): Promise<any>;
  deleteAdCampaign(id: string): Promise<any>;

  // ============================================
  // DEVELOPER (injectDeveloper)
  // ============================================
  getDeveloperProfile(): Promise<any>;
  updateDeveloperProfile(data: any): Promise<any>;
  getDeveloperDashboard(): Promise<any>;
  getDeveloperModules(params?: any): Promise<any>;
  getDeveloperModule(id: string): Promise<any>;
  createDeveloperModule(data: any): Promise<any>;
  updateDeveloperModule(id: string, data: any): Promise<any>;
  publishDeveloperModule(id: string): Promise<any>;
  createModuleVersion(moduleId: string, data: any): Promise<any>;
  uploadModuleVersionFile(moduleId: string, versionId: string, formData: FormData): Promise<any>;
  getModuleVersions(moduleId: string): Promise<any>;
  getModuleReviews(moduleId: string): Promise<any>;
  createModuleReview(moduleId: string, data: any): Promise<any>;
  getDeveloperOrders(params?: any): Promise<any>;
  getDeveloperRevenues(): Promise<any>;
  getDeveloperRevenueSummary(): Promise<any>;
  getDeveloperPayouts(): Promise<any>;
  requestDeveloperPayout(data: any): Promise<any>;
  getDeveloperInstallations(params?: any): Promise<any>;
  getDeveloperSubscriptions(): Promise<any>;
  getDeveloperTickets(): Promise<any>;
  getDeveloperTicket(id: string): Promise<any>;
  createDeveloperTicket(data: any): Promise<any>;
  replyToTicket(ticketId: string, data: any): Promise<any>;
  updateTicketStatus(ticketId: string, status: string): Promise<any>;
  uploadModuleImage(moduleId: string, formData: FormData): Promise<any>;
  submitDeveloperVerification(documents: any): Promise<any>;
  createSupportTicket(data: any): Promise<any>;
  installCoreModule(moduleId: string): Promise<any>;
  uninstallCoreModule(moduleId: string): Promise<any>;
  reinstallModule(moduleId: string): Promise<any>;

  // ============================================
  // DEVELOPER EXTENDED (injectDeveloperExtended)
  // ============================================
  getModulePermissions(moduleId: string): Promise<any>;
  addModulePermission(
    moduleId: string,
    data: { resource: string; accessLevel: string; description?: string; isRequired?: boolean }
  ): Promise<any>;
  removeModulePermission(permissionId: string): Promise<any>;
  checkModulePermissions(moduleId: string, businessId: string): Promise<any>;
  getPermissionSummary(moduleId: string): Promise<any>;
  createLicense(data: {
    moduleId: string;
    businessId: string;
    licenseType: string;
    price?: number;
    currency?: string;
    expiresAt?: Date;
    autoRenew?: boolean;
  }): Promise<any>;
  activateLicense(licenseKey: string): Promise<any>;
  revokeLicense(id: string, reason?: string): Promise<any>;
  renewLicense(id: string, durationDays?: number): Promise<any>;
  checkLicense(moduleId: string, businessId: string): Promise<any>;
  getModuleLicenses(moduleId: string): Promise<any>;
  getBusinessLicenses(businessId: string): Promise<any>;
  getLicenseStats(): Promise<any>;
  getApiKeys(): Promise<any>;
  createApiKey(data: { name: string; scopes?: string[]; expiresAt?: Date }): Promise<any>;
  revokeApiKey(id: string): Promise<any>;
  getWebhooks(): Promise<any>;
  createWebhook(data: { url: string; events: string[]; moduleId?: string }): Promise<any>;
  deleteWebhook(id: string): Promise<any>;
  getWebhookDeliveries(webhookId: string, limit?: number): Promise<any>;
  trackAnalytics(moduleId: string, data: any): Promise<any>;
  getModuleAnalytics(moduleId: string, startDate?: string, endDate?: string): Promise<any>;
  getDeveloperAnalyticsOverview(): Promise<any>;
  logModuleError(moduleId: string, data: any): Promise<any>;
  getModuleErrors(moduleId: string, resolved?: boolean, limit?: number): Promise<any>;
  resolveModuleError(errorId: string): Promise<any>;
  submitModuleForValidation(moduleId: string): Promise<any>;
  getModuleValidation(moduleId: string): Promise<any>;
  getValidationHistory(moduleId: string): Promise<any>;
  getPendingValidations(): Promise<any>;
  approveValidationCheck(checkId: string, score: number, details?: string): Promise<any>;
  rejectValidationCheck(checkId: string, details: string): Promise<any>;
  completeValidation(validationId: string, status: string, notes?: string): Promise<any>;
  saveModuleConfiguration(
    moduleId: string,
    data: { businessId: string; installationId: string; settings: any }
  ): Promise<any>;
  getModuleConfiguration(moduleId: string, businessId: string): Promise<any>;
  toggleModuleActive(moduleId: string, businessId: string, isActive: boolean): Promise<any>;
  getModuleConfigurations(moduleId: string): Promise<any>;
  getBusinessModules(businessId: string): Promise<any>;
  logActivity(
    moduleId: string,
    data: {
      activityType: string;
      businessId?: string;
      installationId?: string;
      description?: string;
      metadata?: any;
    }
  ): Promise<any>;
  getModuleActivity(moduleId: string, limit?: number): Promise<any>;
  getDeveloperActivityFeed(limit?: number): Promise<any>;
  getBusinessActivityFeed(businessId: string, limit?: number): Promise<any>;
  getActivityStats(moduleId: string): Promise<any>;

  // ============================================
  // SANDBOX (injectSandbox)
  // ============================================
  getSimulationEnvironments(): Promise<any>;
  testSimulationEndpoint(
    moduleSlug: string,
    data: { endpoint: string; method: string; body?: any }
  ): Promise<any>;
  getSimulationLogs(moduleSlug?: string): Promise<any>;
  getSimulationMockData(moduleSlug: string, dataType: string): Promise<any>;
  getSimulationEndpoints(): Promise<any>;
  getSandboxEnvironments(): Promise<any>;

  // ============================================
  // MARKETPLACE (injectMarketplace)
  // ============================================
  searchMarketplace(params?: any): Promise<any>;
  getHomeData(): Promise<any>;
  getTrendingMarketplace(): Promise<any>;
  getMarketplaceModules(params?: any): Promise<any>;
  getMarketplaceModule(slug: string): Promise<any>;
  getMarketplaceProduct(slug: string): Promise<any>;
  getMarketplaceStats(): Promise<any>;
  getSimilarBusinesses(businessId: string, limit?: number): Promise<any>;
  getPriceDistribution(params?: { type?: string; category?: string }): Promise<any>;
  getActiveMarketplaceAds(params?: {
    page?: string;
    position?: string;
    country?: string;
  }): Promise<any>;
  startMarketplaceModuleTrial(moduleId: string): Promise<any>;
  purchaseMarketplaceModule(
    moduleId: string,
    data: { provider: string; phone: string }
  ): Promise<any>;
  getBusinessInstalledModules(): Promise<any>;
  confirmModuleUpdate(installationId: string): Promise<any>;
  confirmMarketplaceModulePayment(data: { providerRef: string }): Promise<any>;
  installMarketplaceModule(moduleId: string, data?: any): Promise<any>;
  getModuleAssignments(): Promise<any>;
  getModuleAnalysis(): Promise<any>;
  toggleBusinessModule(module: string, enabled: boolean): Promise<any>;

  // ============================================
  // ADMIN (injectAdmin)
  // ============================================
  adminGetAllAdCampaigns(params?: any): Promise<any>;
  adminGetAdStats(params?: any): Promise<any>;
  adminGetAdRevenue(params?: any): Promise<any>;
  adminValidateAdCampaign(id: string): Promise<any>;
  adminRejectAdCampaign(id: string, reason?: string): Promise<any>;
  adminSuspendAdCampaign(id: string, reason?: string): Promise<any>;
  adminCreateAdPackage(data: any): Promise<any>;
  adminGetAdPackages(): Promise<any>;
  adminGetPartners(params?: any): Promise<any>;
  adminGetPartnerDetail(id: string): Promise<any>;
  adminApprovePartner(id: string): Promise<any>;
  adminRevokePartner(id: string, reason?: string): Promise<any>;
  adminSuspendPartner(id: string, reason?: string): Promise<any>;
  searchPartnerBusinesses(query: string): Promise<any>;
  adminRecomputeAllScores(): Promise<any>;
  adminGetDataAccessLogs(params?: any): Promise<any>;
  adminGetPlatformAnalytics(params?: any): Promise<any>;
  getAdminPresence(): Promise<any>;
  adminGetReports(params?: any): Promise<any>;

  // ============================================
  // DATA HUB (injectDataHub)
  // ============================================
  getPartnerReports(params?: any): Promise<any>;
  getPartnerReportDetail(id: string): Promise<any>;
  orderPartnerReport(data: any): Promise<any>;
  getPartnerBusinessDetails(businessId: string): Promise<any>;
  getHubPlatformStats(params?: any): Promise<any>;
  getHubSectorBenchmarks(params?: any): Promise<any>;
  getHubSectorStats(params?: any): Promise<any>;
  getHubGeographicStats(params?: any): Promise<any>;
  getHubGrowthStats(params?: any): Promise<any>;
  getHubPaymentTrends(params?: any): Promise<any>;

  // ============================================
  // CART (injectCart)
  // ============================================
  getCart(): Promise<any>;
  addToCart(data: {
    productId?: string;
    variantId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
    notes?: string;
  }): Promise<any>;
  updateCartItem(itemId: string, data: { quantity: number; notes?: string }): Promise<any>;
  removeFromCart(itemId: string): Promise<any>;
  clearCart(): Promise<any>;
  applyCoupon(code: string): Promise<any>;
  removeCoupon(): Promise<any>;
  checkout(data: {
    type?: string;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    contactPhone?: string;
    contactName?: string;
    notes?: string;
    paymentMethod?: string;
  }): Promise<any>;
  guestCheckout(data: {
    email: string;
    contactName: string;
    contactPhone?: string;
    deliveryAddress?: string;
    notes?: string;
    paymentMethod?: string;
    items: Array<{
      productId?: string;
      serviceId?: string;
      name: string;
      quantity: number;
      unitPrice: number;
      image?: string;
    }>;
  }): Promise<any>;

  // ============================================
  // REFERRAL (injectReferral)
  // ============================================
  getMyReferralCode(): Promise<any>;
  inviteReferral(email: string): Promise<any>;
  getMyReferrals(): Promise<any>;
  getMyReferralRewards(): Promise<any>;
  getReferralStats(): Promise<any>;

  // ============================================
  // SETTINGS (injectSettings)
  // ============================================
  getBusinessPaymentMethods(): Promise<any>;
  addBusinessPaymentMethod(data: any): Promise<any>;
  updateBusinessPaymentMethod(id: string, data: any): Promise<any>;
  deleteBusinessPaymentMethod(id: string): Promise<any>;

  // ============================================
  // ACCOUNTING (injectAccounting)
  // ============================================
  getExpenses(params?: any): Promise<any>;
  getExpense(id: string): Promise<any>;
  createExpense(data: any): Promise<any>;
  updateExpense(id: string, data: any): Promise<any>;
  deleteExpense(id: string): Promise<any>;
  getAccountingStats(): Promise<any>;
  getMonthlyReport(year: number, month: number): Promise<any>;
  getBalanceSheet(year?: number): Promise<any>;
  getIncomeStatement(year?: number): Promise<any>;
  exportAccountingCSV(year?: number): Promise<any>;

  // ============================================
  // CRM (injectCrm)
  // ============================================
  getCrmDashboardStats(): Promise<any>;
  getCrmClients(params?: any): Promise<any>;
  getCrmClientDetail(clientId: string): Promise<any>;
  getCustomer360(clientId: string): Promise<any>;
  trackPageView(data: {
    userId?: string;
    visitorId?: string;
    referrer?: string;
    duration?: number;
  }): Promise<any>;
  trackProductView(data: {
    productId: string;
    userId?: string;
    visitorId?: string;
    referrer?: string;
    source?: string;
  }): Promise<any>;
  trackProductClick(data: {
    productId: string;
    userId?: string;
    visitorId?: string;
    source?: string;
  }): Promise<any>;
  createCrmClientNote(clientId: string, content: string): Promise<any>;
  updateCrmClientNote(noteId: string, content: string): Promise<any>;
  deleteCrmClientNote(noteId: string): Promise<any>;
  getCrmTags(): Promise<any>;
  createCrmTag(name: string, color?: string): Promise<any>;
  deleteCrmTag(tagId: string): Promise<any>;
  assignCrmTag(clientId: string, tagId: string): Promise<any>;
  removeCrmTag(clientId: string, tagId: string): Promise<any>;
  getCrmSegments(): Promise<any>;
  createCrmSegment(data: {
    name: string;
    description?: string;
    color?: string;
    conditions?: any;
    isDynamic?: boolean;
  }): Promise<any>;
  updateCrmSegment(segmentId: string, data: any): Promise<any>;
  deleteCrmSegment(segmentId: string): Promise<any>;
  recalculateCrmSegment(segmentId: string): Promise<any>;
  assignClientToSegment(clientId: string, segmentId: string): Promise<any>;
  removeClientFromSegment(clientId: string, segmentId: string): Promise<any>;

  // ============================================
  // CRM PIPELINE (injectCrmPipeline)
  // ============================================
  getPipelineStages(): Promise<any>;
  createPipelineStage(data: any): Promise<any>;
  updatePipelineStage(id: string, data: any): Promise<any>;
  deletePipelineStage(id: string): Promise<any>;
  getPipelineDeals(params?: any): Promise<any>;
  getPipelineDeal(id: string): Promise<any>;
  createPipelineDeal(data: any): Promise<any>;
  updatePipelineDeal(id: string, data: any): Promise<any>;
  movePipelineDeal(id: string, data: any): Promise<any>;
  deletePipelineDeal(id: string): Promise<any>;
  getPipelineStats(): Promise<any>;
  seedPipelineStages(): Promise<any>;

  // ============================================
  // PARTNERS (injectPartners)
  // ============================================
  getPartners(params?: any): Promise<any>;
  getPartner(id: string): Promise<any>;
  createPartner(data: any): Promise<any>;
  updatePartner(id: string, data: any): Promise<any>;
  deletePartner(id: string): Promise<any>;
  getPartnerStats(): Promise<any>;
  getPartnerAnalytics(): Promise<any>;
  getPublicPartners(slug: string): Promise<any>;
  getPartnerContracts(params?: any): Promise<any>;
  createPartnerContract(data: any): Promise<any>;
  updatePartnerContract(id: string, data: any): Promise<any>;
  signPartnerContract(id: string, byBusiness: boolean): Promise<any>;
  getPartnerTransactions(params?: any): Promise<any>;
  createPartnerTransaction(data: any): Promise<any>;
  getPartnerAssignments(params?: any): Promise<any>;
  createPartnerAssignment(data: any): Promise<any>;
  updatePartnerAssignment(id: string, data: any): Promise<any>;
  getPartnerReviews(params?: any): Promise<any>;
  createPartnerReview(data: any): Promise<any>;
  getPartnerDocuments(params?: any): Promise<any>;
  createPartnerDocument(data: any): Promise<any>;
  deletePartnerDocument(id: string): Promise<any>;
  getPartnerPermissions(params?: any): Promise<any>;
  createPartnerPermission(data: any): Promise<any>;
  updatePartnerPermission(id: string, data: any): Promise<any>;
  deletePartnerPermission(id: string): Promise<any>;

  // ============================================
  // CLIENT DATA (injectClientData)
  // ============================================
  getMyLoyalty(): Promise<any>;
  redeemLoyaltyPoints(data: {
    businessId: string;
    points: number;
    rewardTitle?: string;
    rewardType?: string;
  }): Promise<any>;
  getAvailablePromotions(): Promise<any>;
  getMyTrainings(): Promise<any>;
  enrollInTraining(id: string): Promise<any>;
  registerForEvent(id: string): Promise<any>;
  getClientDashboardStats(): Promise<any>;

  // ============================================
  // FAVORITES (injectFavorites)
  // ============================================
  getFavorites(params?: any): Promise<any>;
  addFavorite(type: string, referenceId: string): Promise<any>;
  // ── Épargne Achat (Layaway) ──
  createLayawayOffer(data: any): Promise<any>;
  createLayawayOffersBatch(data: any): Promise<any>;
  getSuppliers(params?: any): Promise<any>;
  createSupplier(data: any): Promise<any>;
  updateSupplier(id: string, data: any): Promise<any>;
  deleteSupplier(id: string): Promise<any>;
  resolveCatalogAttachments(
    items: Array<{ itemType: string; itemId: string; quantity?: number; options?: any }>
  ): Promise<any>;
  createAffiliateLink(data: any): Promise<any>;
  getAffiliateLinks(): Promise<any>;
  deleteAffiliateLink(id: string): Promise<any>;
  resolveAffiliateLink(code: string): Promise<any>;
  getLayawayOffers(): Promise<any>;
  toggleLayawayOffer(id: string, isActive: boolean): Promise<any>;
  deleteLayawayOffer(id: string): Promise<any>;
  getBusinessLayawayPlans(): Promise<any>;
  getBusinessLayawayStats(): Promise<any>;
  getActiveLayawayOffer(itemType: string, itemId: string): Promise<any>;
  getActiveLayawayOffers(itemType: string, itemIds: string[]): Promise<any>;
  createLayawayPlan(offerId: string): Promise<any>;
  getMyLayawayPlans(): Promise<any>;
  getLayawayPlan(id: string): Promise<any>;
  contributeLayaway(id: string, data: any): Promise<any>;
  cancelLayawayPlan(id: string): Promise<any>;
  confirmLayawayCheckout(id: string, data?: any): Promise<any>;
  removeFavorite(id: string): Promise<any>;

  // ============================================
  // FINANCE (injectFinance)
  // ============================================
  getQuotes(params?: any): Promise<any>;
  getQuote(id: string): Promise<any>;
  createQuote(data: any): Promise<any>;
  updateQuote(id: string, data: any): Promise<any>;
  updateQuoteStatus(id: string, status: string): Promise<any>;
  convertQuoteToInvoice(id: string): Promise<any>;
  deleteQuote(id: string): Promise<any>;
  getInvoices(params?: any): Promise<any>;
  getInvoice(id: string): Promise<any>;
  createInvoice(data: any): Promise<any>;
  updateInvoiceStatus(id: string, status: string): Promise<any>;
  updateInvoicePayment(id: string, data: any): Promise<any>;
  deleteInvoice(id: string): Promise<any>;
  getFinanceStats(): Promise<any>;
  downloadInvoicePdf(id: string): Promise<any>;
  downloadQuotePdf(id: string): Promise<any>;

  // ============================================
  // CRM AUTOMATION (injectCrmAutomation)
  // ============================================
  getAutomationRules(): Promise<any>;
  getAutomationRule(id: string): Promise<any>;
  createAutomationRule(data: any): Promise<any>;
  updateAutomationRule(id: string, data: any): Promise<any>;
  toggleAutomationRule(id: string): Promise<any>;
  deleteAutomationRule(id: string): Promise<any>;

  // ============================================
  // FAQ (injectFaq)
  // ============================================
  getPublicBusinessFaqs(slug: string): Promise<any>;
  getMyFaqs(): Promise<any>;
  createFaq(data: {
    question: string;
    answer: string;
    category?: string;
    sortOrder?: number;
  }): Promise<any>;
  updateFaq(
    faqId: string,
    data: {
      question?: string;
      answer?: string;
      category?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<any>;
  deleteFaq(faqId: string): Promise<any>;
  reorderFaqs(faqIds: string[]): Promise<any>;

  // ============================================
  // ANALYTICS (injectAnalytics)
  // ============================================
  getBusinessFunnel(): Promise<any>;
  getBusinessEngagement(): Promise<any>;

  // ============================================
  // ANALYTICS EVENTS (injectAnalyticsEvents) — chantier 1
  // ============================================
  getAnalyticsEvents(params?: any): Promise<any>;
  getAnalyticsEventsBreakdownType(params?: any): Promise<any>;
  getAnalyticsEventsBreakdownCategory(params?: any): Promise<any>;
  getAnalyticsEventsSummary(params?: any): Promise<any>;
  getAnalyticsEventsCounters(params?: any): Promise<any>;

  // ============================================
  // MISC (injectMisc) — Business Training, Alerts, Attention, etc.
  // ============================================
  getBizTrainings(params?: any): Promise<any>;
  getBizTraining(id: string): Promise<any>;
  createBizTraining(data: any): Promise<any>;
  updateBizTraining(id: string, data: any): Promise<any>;
  deleteBizTraining(id: string): Promise<any>;
  getBizTrainingStudents(trainingId: string, params?: any): Promise<any>;
  getBizTrainingStats(): Promise<any>;
  getBizTrainingLessons(trainingId: string): Promise<any>;
  createBizTrainingLesson(data: any): Promise<any>;
  updateBizTrainingLesson(id: string, data: any): Promise<any>;
  deleteBizTrainingLesson(id: string): Promise<any>;
  createBizTrainingQuiz(data: any): Promise<any>;
  deleteBizTrainingQuiz(quizId: string): Promise<any>;
  getAlerts(params?: any): Promise<any>;
  markAlertRead(id: string): Promise<any>;
  deleteAlert(id: string): Promise<any>;
  getAttentionItems(params?: any): Promise<any>;
  getClientIntelligence(businessId: string): Promise<any>;
  getComments(targetType: string, targetId: string, params?: any): Promise<any>;
  deleteComment(id: string): Promise<any>;
  getContentReports(params?: any): Promise<any>;
  resolveContentReport(id: string, action: string): Promise<any>;
  getGamification(): Promise<any>;
  getLeaderboard(): Promise<any>;
  getGrowthCoaching(params?: any): Promise<any>;
  getGrowthMetrics(): Promise<any>;
  getGrowthRecommendations(): Promise<any>;
  getHybridPaymentMethods(): Promise<any>;
  getMarketIdeas(params?: any): Promise<any>;
  createMarketIdea(data: any): Promise<any>;
  getMarketNeeds(params?: any): Promise<any>;
  getMarketingCampaigns(params?: any): Promise<any>;
  createMarketingCampaign(data: any): Promise<any>;
  getMatchingSuggestions(): Promise<any>;
  getMediaCommerceItems(params?: any): Promise<any>;
  getOpportunities(params?: any): Promise<any>;
  getPosts(params?: any): Promise<any>;
  createPost(data: any): Promise<any>;
  deletePost(id: string): Promise<any>;
  getReactions(targetType: string, targetId: string): Promise<any>;
  getRecommendations(): Promise<any>;
  getSavedItems(params?: any): Promise<any>;
  saveItem(data: { targetType: string; targetId: string }): Promise<any>;
  unsaveItem(id: string): Promise<any>;
  getSignatures(params?: any): Promise<any>;
  createSignature(data: any): Promise<any>;
  getSmartSearchHistory(): Promise<any>;
  getSocialAccounts(): Promise<any>;
  connectSocialAccount(data: any): Promise<any>;
  disconnectSocialAccount(id: string): Promise<any>;
  getWalletTransactions(params?: any): Promise<any>;
  getBusinessWallet(): Promise<any>;
  getBusinessWalletTransactions(params?: any): Promise<any>;

  // ============================================
  // ANALYTICS EXTENDED (injectAnalyticsExtended)
  // ============================================
  getSearchTrends(params?: any): Promise<any>;
  getConversionFunnel(): Promise<any>;
  getRetentionCohorts(): Promise<any>;
  getProductRecommendations(params?: any): Promise<any>;
  getEngagementAnalytics(): Promise<any>;

  // ============================================
  // COPILOT (injectCopilot)
  // ============================================
  getDailyTips(): Promise<any>;
  getBusinessHealth(): Promise<any>;
  getModuleTips(moduleKey: string): Promise<any>;
  generateLLMAnalysis(): Promise<any>;
  generateProductDescription(data: {
    productName: string;
    category: string;
    price: number;
    currency?: string;
    keywords?: string[];
  }): Promise<any>;
  generateSmartTip(moduleKey: string): Promise<any>;
  getDailyBrief(): Promise<any>;
  getBenchmarks(): Promise<any>;
  getAnomalies(): Promise<any>;
  getSeasonal(): Promise<any>;
  getWeeklyReport(): Promise<any>;
  triggerOnboarding(): Promise<any>;

  // ============================================
  // GAMIFICATION (injectGamification)
  // ============================================
  getGamificationDashboard(): Promise<any>;
  getMyQuests(): Promise<any>;
  getCompletedQuests(): Promise<any>;
  getMyStreaks(): Promise<any>;
  getMyRanking(): Promise<any>;
  getLeaderboard(params?: any): Promise<any>;
  getMyChallenges(): Promise<any>;
  initializeQuests(): Promise<any>;

  // ============================================
  // DISPUTES (injectDisputes)
  // ============================================
  getDisputes(params?: any): Promise<any>;
  getDisputeDetail(id: string): Promise<any>;
  createDispute(data: any): Promise<any>;
  updateDisputeStatus(id: string, status: string): Promise<any>;

  // ============================================
  // ADMIN EXTENDED (injectAdminExtended)
  // ============================================
  adminGetAlertQueue(): Promise<any>;
  adminGetRecentActivity(): Promise<any>;
  adminGetWarningStats(): Promise<any>;
  adminGetUserDetail(id: string): Promise<any>;
  adminGetUserActivity(id: string): Promise<any>;
  adminGetUserSessions(id: string): Promise<any>;
  adminGetUserPayments(id: string): Promise<any>;
  adminGetUserReports(id: string): Promise<any>;
  updateUserStatus(id: string, action: string): Promise<any>;
  adminGetSupportTickets(params?: any): Promise<any>;
  adminGetSupportStats(): Promise<any>;
  updateSupportTicketStatus(id: string, action: string): Promise<any>;

  // ============================================
  // BUSINESS EXTENDED (injectBusinessExtended)
  // ============================================
  getBusinessStatsAggregated(): Promise<any>;
  getBusinessConversations(): Promise<any>;

  // ============================================
  // MESSAGES EXTENDED (injectMessagesExtended)
  // ============================================
  getConversationsByType(type?: string): Promise<any>;
  sendMessageDirect(payload: {
    conversationId: string;
    content: string;
    attachment?: string;
    attachmentType?: string;
  }): Promise<any>;

  // ============================================
  // SUBSCRIPTIONS EXTENDED (injectSubscriptionsExtended)
  // ============================================
  adminGetAllSubscriptionPlans(): Promise<any>;
  adminCreateSubscriptionPlan(data: any): Promise<any>;
  adminUpdateSubscriptionPlan(id: string, data: any): Promise<any>;
  adminDeleteSubscriptionPlan(id: string): Promise<any>;
  adminAddPlanPrivilege(planId: string, data: any): Promise<any>;
  adminUpdatePlanPrivilege(planId: string, id: string, data: any): Promise<any>;
  adminDeletePlanPrivilege(planId: string, id: string): Promise<any>;
  adminGetAllSubscriptions(params?: any): Promise<any>;
  adminGetSubscriptionStats(): Promise<any>;
  adminCancelSubscription(id: string): Promise<any>;
  adminRenewSubscription(id: string): Promise<any>;
  getMySubscription(): Promise<any>;
  subscribeToPlan(
    planId: string,
    opts?: { provider?: string; phone?: string; autoRenew?: boolean }
  ): Promise<any>;
  confirmSubscriptionPayment(providerRef: string): Promise<any>;
  cancelMySubscription(): Promise<any>;

  // ============================================
  // STORIES (injectStories)
  // ============================================
  getActiveStories(): Promise<any>;
  getBusinessStories(businessId: string): Promise<any>;
  createStory(data: any): Promise<any>;
  viewStory(storyId: string): Promise<any>;
  clickStory(storyId: string): Promise<any>;
  deleteStory(id: string): Promise<any>;
  updateStory(id: string, data: any): Promise<any>;
  addSticker(storyId: string, sticker: any): Promise<any>;
  removeSticker(storyId: string, stickerId: string): Promise<any>;
  getHighlights(businessId: string): Promise<any>;
  toggleHighlight(storyId: string, isHighlight: boolean): Promise<any>;

  // ============================================
  // SHORTS (injectShorts)
  // ============================================
  getShorts(params?: any): Promise<any>;
  getShort(id: string): Promise<any>;
  createShort(data: any): Promise<any>;
  updateShort(id: string, data: any): Promise<any>;
  deleteShort(id: string): Promise<any>;
  likeShort(id: string): Promise<any>;
  addShortComment(id: string, content: string): Promise<any>;
  getShortComments(id: string): Promise<any>;
  viewShort(id: string): Promise<any>;
  shareShort(id: string): Promise<any>;
  saveShort(id: string): Promise<any>;

  // ============================================
  // LIVES (injectLives)
  // ============================================
  getActiveLives(params?: any): Promise<any>;
  getLive(id: string): Promise<any>;
  createLive(data: any): Promise<any>;
  startLive(id: string, streamUrl?: string): Promise<any>;
  endLive(id: string): Promise<any>;
  deleteLive(id: string): Promise<any>;
  addLiveProduct(liveId: string, data: any): Promise<any>;
  getLiveChats(liveId: string): Promise<any>;
  sendLiveChat(liveId: string, message: string): Promise<any>;
  joinLiveRoom(liveId: string): Promise<any>;
  leaveLiveRoom(liveId: string): Promise<any>;
  sendLiveReaction(liveId: string, emoji: string): Promise<any>;
  getLiveStats(): Promise<any>;

  // ============================================
  // OFFERS (injectOffers)
  // ============================================
  getActiveOffers(params?: any): Promise<any>;
  getOffer(id: string): Promise<any>;
  createOffer(data: any): Promise<any>;
  updateOffer(id: string, data: any): Promise<any>;
  deleteOffer(id: string): Promise<any>;
  claimOffer(id: string): Promise<any>;
  getNearbyBusinesses(params?: any): Promise<any>;

  // ============================================
  // MEDIA COMMERCE (injectMediaCommerce)
  // ============================================
  getMediaCommerceData(type: string, id: string | undefined): Promise<any>;
  mediaAddToCart(data: any): Promise<any>;
  mediaCreateOrder(data: any): Promise<any>;
  mediaBook(data: any): Promise<any>;
  mediaInstallModule(data: any): Promise<any>;

  // ============================================
  // FEED (injectFeed)
  // ============================================
  getFeedItems(params?: any): Promise<any>;
  createFeedItem(data: any): Promise<any>;
  deleteFeedItem(id: string): Promise<any>;

  // ============================================
  // ADMIN EXTENDED — Security (injectAdminExtended)
  // ============================================
  adminGetWarnings(params?: any): Promise<any>;
  adminCreateWarning(userId: string, data: any): Promise<any>;
  adminDeleteWarning(id: string): Promise<any>;
  adminGetUsers(params?: any): Promise<any>;
  adminSearchUsers(params?: any): Promise<any>;
  adminGetEscrowList(params?: any): Promise<any>;
  adminGetEscrowStats2(): Promise<any>;
  adminReleaseEscrow2(id: string): Promise<any>;
  adminRefundEscrow2(id: string): Promise<any>;
  adminArbitrateEscrow(id: string, decision: string): Promise<any>;
  adminGetDisputes2(params?: any): Promise<any>;
  adminGetDisputeStats2(): Promise<any>;
  adminUpdateDisputeStatus(id: string, action: string): Promise<any>;
  adminReportModeration(data: any): Promise<any>;
  adminGetDevelopers(params?: any): Promise<any>;
  adminGetDeveloperDetail(id: string): Promise<any>;
  adminUpdateDeveloperStatus(id: string, action: string): Promise<any>;
  adminGetDeveloperCommissions(params?: any): Promise<any>;
  adminGetCMSPages(): Promise<any>;
  adminGetCMSCategories(): Promise<any>;
  adminCreateCMSPage(data: any): Promise<any>;
  adminUpdateCMSPage(id: string, data: any): Promise<any>;
  adminDeleteCMSPage(id: string): Promise<any>;
  adminPublishCMSPage(id: string): Promise<any>;
  adminCreateCMSCategory(data: any): Promise<any>;
  adminUpdateCMSCategory(id: string, data: any): Promise<any>;
  adminDeleteCMSCategory(id: string): Promise<any>;
  adminGetFraudReports(params?: any): Promise<any>;
  adminApproveFraudReport(id: string): Promise<any>;
  adminRejectFraudReport(id: string): Promise<any>;
  adminBanFraudReport(id: string): Promise<any>;
  adminGetDemands(params?: any): Promise<any>;
  adminUpdateDemandStatus(id: string, data: { status: string }): Promise<any>;
  adminAutoMatchDemand(id: string): Promise<any>;
  adminUpdateMatchStatus(matchId: string, data: { status: string }): Promise<any>;
  adminGetCampaigns(params?: any): Promise<any>;
  adminCreateCampaign(data: any): Promise<any>;
  adminUpdateCampaign(id: string, data: any): Promise<any>;
  adminDeleteCampaign(id: string): Promise<any>;
  adminStartCampaign(id: string): Promise<any>;
  adminGetReportData(tab: string, params?: any): Promise<any>;
  adminGetPromoStats(): Promise<any>;
  adminGetPromoCoupons(): Promise<any>;
  adminGetPromoPromotions(): Promise<any>;
  adminDisableCoupon(id: string): Promise<any>;
  adminGetBackups(params?: any): Promise<any>;
  adminCreateBackup(): Promise<any>;
  adminRestoreBackup(id: string): Promise<any>;
  adminToggleAutoBackup(enabled: boolean): Promise<any>;
  adminDownloadBackup(id: string): Promise<any>;
  adminGetNotificationsList(params?: any): Promise<any>;
  adminGetBusinesses(params?: any): Promise<any>;
  adminGetBusinessById(id: string): Promise<any>;
  adminGetBusinessDetail(id: string): Promise<any>;
  adminUpdateBusinessStatus(id: string, action: string): Promise<any>;
  adminGetFinanceOverview(): Promise<any>;
  adminGetFinanceTransactions(params?: any): Promise<any>;
  adminGetFinanceEscrows(params?: any): Promise<any>;
  adminGetFinanceFraudAlerts(): Promise<any>;
  adminGetFinanceDebtRecovery(): Promise<any>;
  adminGetReviews2(params?: any): Promise<any>;
  adminUpdateReviewStatus(id: string, action: string): Promise<any>;
  adminDeleteReview2(id: string): Promise<any>;
  adminGetRevenueStats(period?: string): Promise<any>;
  adminGetFeatureFlags(params?: any): Promise<any>;
  adminCreateFeatureFlag(data: any): Promise<any>;
  adminUpdateFeatureFlag(id: string, data: any): Promise<any>;
  adminDeleteFeatureFlag(id: string): Promise<any>;
  adminToggleFeatureFlag(id: string): Promise<any>;
  adminGetDashboardStats(): Promise<any>;
  adminExportData(data: any): Promise<any>;
  adminPurgeData(data: any): Promise<any>;
  adminGetSecurityStats(): Promise<any>;
  adminGetSecurityAdmins(params?: any): Promise<any>;
  adminGetSecuritySessions(params?: any): Promise<any>;
  adminGetSecurityAttempts(params?: any): Promise<any>;
  adminGetBlacklist(params?: any): Promise<any>;
  adminGetSecurityJournal(params?: any): Promise<any>;
  adminDeleteSecuritySession(sessionId: string): Promise<any>;
  adminAddToBlacklist(data: { ip: string }): Promise<any>;
  adminRemoveFromBlacklist(ip: string): Promise<any>;
  adminGetRoles(): Promise<any>;
  adminGetUsersAdmins(): Promise<any>;
  adminCreateRole(data: any): Promise<any>;
  adminAssignRole(data: { roleId: string; userId: string }): Promise<any>;
  adminUnassignRole(data: { roleId: string; userId: string }): Promise<any>;
  adminGetSettings(): Promise<any>;
  adminGetVerificationSettings(): Promise<any>;
  adminUpdateSettings(data: any): Promise<any>;
  adminUpdateVerificationSettings(data: { mode: string }): Promise<any>;
  adminGetStatistics(params?: any): Promise<any>;
  adminGetMatchesForDemand(demandId: string): Promise<any>;

  // ============================================
  // ORDERS EXTENDED (injectOrders)
  // ============================================
  cancelOrder(id: string, reason?: string): Promise<any>;
  getOrderPayments(orderId: string): Promise<any>;
  initiateHybridPayment(orderId: string, data: any): Promise<any>;
  verifyPayment(paymentId: string, data: any): Promise<any>;

  // ============================================
  // ESCROW (injectEscrow)
  // ============================================
  getEscrowSteps(escrowId: string): Promise<any>;
  releaseEscrowStep(escrowId: string, stepNumber: number): Promise<any>;

  // ============================================
  // DOCUMENTS EXTENDED (injectDocumentsExtended)
  // ============================================
  signDocument(token: string, data: any): Promise<any>;

  // ============================================
  // ADS EXTENDED (injectAdsExtended)
  // ============================================
  getAdCampaign(campaignId: string): Promise<any>;
  generateAdInvoice(campaignId: string): Promise<any>;
  reportAd(data: any): Promise<any>;
  trackAdImpression(data: any): Promise<any>;
  trackAdClick(data: any): Promise<any>;

  // ============================================
  // BUSINESS EXTENDED 2 (injectBusinessExtended2)
  // ============================================
  createBusinessPortfolioMedia(data: any): Promise<any>;
  sendQuoteRequest(slug: string, data: any): Promise<any>;
  createPublicBooking(data: any): Promise<any>;

  // ============================================
  // BOOKING RESOURCES (injectBookingResources)
  // ============================================
  createBookingResource(data: any): Promise<any>;
  updateBookingResource(id: string, data: any): Promise<any>;
  deleteBookingResource(id: string): Promise<any>;
  createBookingSlot(data: any): Promise<any>;
  updateBookingSlot(id: string, data: any): Promise<any>;
  deleteBookingSlot(id: string): Promise<any>;

  // ============================================
  // DEBTS EXTENDED (injectDebtsExtended)
  // ============================================
  createDebt(data: any): Promise<any>;
  deleteDebt(id: string): Promise<any>;
  updateClientRiskLevel(clientId: string, riskLevel: string): Promise<any>;
  getReminders(params?: any): Promise<any>;
  getLogs(params?: any): Promise<any>;

  // ============================================
  // REVIEWS EXTENDED (injectReviewsExtended)
  // ============================================
  updateReview(id: string, data: any): Promise<any>;
  deleteMyReview(id: string): Promise<any>;

  // ============================================
  // MESSAGES EXTENDED 2 (injectMessagesExtended2)
  // ============================================
  searchRecipients(query?: string): Promise<any>;
  getMessageReactions(messageId: string): Promise<any>;
  addMessageReaction(messageId: string, data: { emoji: string }): Promise<any>;
  removeMessageReaction(messageId: string, emoji: string): Promise<any>;

  // ============================================
  // TRAININGS (injectTrainings)
  // ============================================
  getTrainingProgress(trainingId: string): Promise<any>;
  getLesson(lessonId: string): Promise<any>;
  generateCertificate(trainingId: string): Promise<any>;
  submitQuizAttempt(quizId: string, data: any): Promise<any>;

  // ============================================
  // AUTOMATIONS (injectAutomations)
  // ============================================
  getAutomationStatus(): Promise<any>;
  getAutomationActivity(): Promise<any>;
  getExecutionLogs(limit?: number): Promise<any>;
  getFailedJobs(): Promise<any>;
  getErrorRate(): Promise<any>;

  // ============================================
  // PAYMENTS EXTENDED (injectPaymentsExtended)
  // ============================================
  getPaymentProcessorTransactions(): Promise<any>;

  // ============================================
  // MARKETPLACE EXTENDED (injectMarketplaceExtended)
  // ============================================
  getAdminModuleDetail(id: string): Promise<any>;

  // ============================================
  // VERIFICATION (injectVerification)
  // ============================================
  getVerification(): Promise<any>;
  upgradeToOr(data: { identityDocument: string; responsiblePhoto: string }): Promise<any>;
  upgradeToPlatine(): Promise<any>;

  // ============================================
  // SAVINGS / TONTINE (injectSavings) — Phase 4.2
  // ============================================
  getSavingsGroups(params?: any): Promise<any>;
  getSavingsGroup(id: string): Promise<any>;
  createSavingsGroup(data: any): Promise<any>;
  updateSavingsGroup(id: string, data: any): Promise<any>;
  deleteSavingsGroup(id: string): Promise<any>;
  getSavingsStats(): Promise<any>;

  // Membres
  addSavingsMember(data: any): Promise<any>;
  removeSavingsMember(memberId: string): Promise<any>;
  getSavingsMemberScore(memberId: string): Promise<any>;

  // Cycles
  startSavingsCycle(groupId: string, data?: any): Promise<any>;
  closeSavingsCycle(cycleId: string): Promise<any>;
  validateSavingsCycle(cycleId: string): Promise<any>;
  processCyclePayout(cycleId: string): Promise<any>;
  getCyclePayoutStatus(cycleId: string): Promise<any>;

  // Cotisations
  recordContribution(data: any): Promise<any>;

  // Prêts
  getSavingsLoans(params?: any): Promise<any>;
  createSavingsLoan(data: any): Promise<any>;
  approveSavingsLoan(loanId: string): Promise<any>;
  repaySavingsLoan(loanId: string, amount: number, method?: string): Promise<any>;

  // Escrows
  getGroupEscrows(groupId: string): Promise<any>;

  // ============================================
  // AFRICAN UNITS (injectAfricanUnits) — Phase 4.4
  // ============================================
  getAfricanUnits(params?: any): Promise<any>;
  getAfricanUnit(id: string): Promise<any>;
  createAfricanUnit(data: any): Promise<any>;
  updateAfricanUnit(id: string, data: any): Promise<any>;
  deleteAfricanUnit(id: string): Promise<any>;
  convertAfricanUnit(unitId: string, value: number, toStandard?: boolean): Promise<any>;
  getAfricanUnitCategories(): Promise<any>;

  // ============================================
  // AGENTS NETWORK (injectAgents) — Phase 4.6
  // ============================================
  getAgents(params?: any): Promise<any>;
  getAgent(id: string): Promise<any>;
  createAgent(data: any): Promise<any>;
  updateAgent(id: string, data: any): Promise<any>;
  deleteAgent(id: string): Promise<any>;
  getAgentStats(): Promise<any>;
  recordAgentTransaction(data: any): Promise<any>;
  getAgentTransactions(params?: any): Promise<any>;

  // ============================================
  // GROUP BUYS (injectGroupBuys) — Phase 4.7
  // ============================================
  getGroupBuys(params?: any): Promise<any>;
  getGroupBuy(id: string): Promise<any>;
  createGroupBuy(data: any): Promise<any>;
  updateGroupBuy(id: string, data: any): Promise<any>;
  deleteGroupBuy(id: string): Promise<any>;
  addGroupBuyParticipant(data: any): Promise<any>;
  removeGroupBuyParticipant(participantId: string): Promise<any>;
  confirmGroupBuyParticipant(participantId: string): Promise<any>;

  // ============================================
  // CATALOG ATTACHMENTS (injectCatalogAttachments)
  // ============================================
  getCatalogAttachments(params?: any): Promise<any>;
  createCatalogAttachment(data: any): Promise<any>;
  updateCatalogAttachment(id: string, data: any): Promise<any>;
  deleteCatalogAttachment(id: string): Promise<any>;

  // ============================================
  // TAXES ZLECAF (injectTaxes) — Phase 4.5
  // ============================================
  getCountryTaxes(): Promise<any>;
  getCountryTax(countryCode: string): Promise<any>;
  createCountryTax(data: any): Promise<any>;
  updateCountryTax(countryCode: string, data: any): Promise<any>;
  getBusinessTaxConfig(): Promise<any>;
  updateBusinessTaxConfig(data: any): Promise<any>;
  getTaxReports(): Promise<any>;
  generateTaxReport(data: any): Promise<any>;

  // ============================================
  // WHATSAPP BUSINESS (injectWhatsApp) — Phase 4.1
  // ============================================
  getWhatsAppTemplates(): Promise<any>;
  createWhatsAppTemplate(data: any): Promise<any>;
  updateWhatsAppTemplate(id: string, data: any): Promise<any>;
  deleteWhatsAppTemplate(id: string): Promise<any>;
  getWhatsAppSessions(): Promise<any>;
  getWhatsAppMessages(sessionId: string): Promise<any>;
  sendWhatsAppMessage(data: any): Promise<any>;
  getWhatsAppStats(): Promise<any>;

  // ============================================
  // OFFLINE SYNC / PWA (injectOfflineSync) — Phase 4.3
  // ============================================
  getSyncItems(params?: any): Promise<any>;
  createSyncItem(data: any): Promise<any>;
  processSyncItem(id: string): Promise<any>;
  getPendingSyncCount(): Promise<any>;
  bulkSync(items: any[]): Promise<any>;

  // ============================================
  // CAISSE JOURNALIÈRE (injectCash) — Chantier 4 Brique A
  // ============================================
  getCashWidget(): Promise<any>;
  getTodayCash(): Promise<any>;
  getCashHistory(params?: any): Promise<any>;
  openCashSession(data: { openingBalance: number }): Promise<any>;
  addCashMovement(data: any): Promise<any>;
  closeCashSession(data: { actualBalance: number; closingNotes?: string }): Promise<any>;

  // ============================================
  // VOICE CATALOGUE (injectVoiceCatalogue) — Phase 4.8
  // ============================================
  getVoiceCommands(): Promise<any>;
  createVoiceCommand(data: any): Promise<any>;
  updateVoiceCommand(id: string, data: any): Promise<any>;
  deleteVoiceCommand(id: string): Promise<any>;
  getVoiceQueries(): Promise<any>;
  createVoiceQuery(data: any): Promise<any>;
  getVoiceStats(): Promise<any>;

  // ============================================
  // SATISFACTION SURVEY
  // ============================================
  submitSatisfaction(data: any): Promise<any>;
  getSatisfactionContext(params: any): Promise<any>;
  getBusinessSatisfactionStats(): Promise<any>;
  getBusinessReputation(): Promise<any>;
}
