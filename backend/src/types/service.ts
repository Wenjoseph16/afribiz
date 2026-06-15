import { Prisma } from '@prisma/client';

// ============================================
// Types partagés pour les services
// ============================================

// === FILTER TYPES ===

export interface PaginationFilter {
  page?: number;
  limit?: number;
}

export interface SearchFilter extends PaginationFilter {
  search?: string;
}

export interface StatusFilter extends PaginationFilter {
  status?: string;
}

export interface DateRangeFilter {
  dateFrom?: string;
  dateTo?: string;
}

// === COMMON FILTERS ===

export interface MenuItemFilter extends SearchFilter, StatusFilter, DateRangeFilter {
  categoryId?: string;
  type?: string;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface OrderFilter extends SearchFilter, StatusFilter, DateRangeFilter {
  type?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface EventFilter extends SearchFilter, StatusFilter, DateRangeFilter {
  type?: string;
  isPublished?: boolean;
}

export interface EmployeeFilter extends SearchFilter {
  position?: string;
  department?: string;
  status?: string;
  isActive?: boolean;
}

export interface AttendanceFilter extends PaginationFilter, DateRangeFilter {
  employeeId?: string;
  date?: string;
}

export interface DebtFilter extends SearchFilter {
  status?: string;
  priority?: string;
  sourceType?: string;
  riskLevel?: string;
}

export type EscrowFilter = StatusFilter

export interface ClientRiskFilter extends SearchFilter {
  riskLevel?: string;
}

export interface ReminderFilter extends PaginationFilter, StatusFilter {}

export interface FinancialLogFilter extends PaginationFilter, DateRangeFilter {
  action?: string;
}

export interface PlanningFilter extends SearchFilter, StatusFilter, DateRangeFilter {
  priority?: string;
  assigneeId?: string;
}

export interface PartnerFilter extends SearchFilter {
  category?: string;
  collaborationLevel?: string;
  isActive?: boolean;
}

export interface DeliveryFilter extends SearchFilter, StatusFilter, DateRangeFilter {
  driverId?: string;
  zoneId?: string;
}

export interface SubPlanFilter extends StatusFilter {
  type?: string;
  isActive?: boolean;
}

export interface SubscriberFilter extends StatusFilter {
  planId?: string;
}

export interface SubPaymentFilter extends PaginationFilter, StatusFilter {}

export interface SubLogFilter extends PaginationFilter {
  action?: string;
}

export type PerformanceFilter = PaginationFilter

export interface ActivityFilter extends PaginationFilter, DateRangeFilter {
  action?: string;
}

// === CREATE / UPDATE TYPES ===

export interface MenuItemCreateInput {
  name: string;
  description?: string;
  categoryId?: string;
  price: number;
  currency?: string;
  status?: string;
  type?: string;
  images?: string[];
  tags?: string[];
  isAvailable?: boolean;
  isPopular?: boolean;
  variants?: Array<{ name: string; price: number; currency?: string; isAvailable?: boolean }>;
  [key: string]: unknown;
}

export interface OrderCreateInput {
  items: Array<{ productId?: string; menuItemId?: string; name: string; quantity: number; unitPrice: number; notes?: string }>;
  type?: string;
  source?: string;
  deliveryAddress?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  deliveryZoneId?: string;
  deliveryFee?: number;
  [key: string]: any;
}

export interface EventCreateInput {
  title: string;
  description?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  locationType?: string;
  address?: string;
  city?: string;
  capacity?: number;
  price?: number;
  currency?: string;
  coverImage?: string;
  [key: string]: any;
}

// === ADMIN QUERY TYPES ===

export interface AdminUserQuery extends SearchFilter {
  role?: string;
  status?: string;
}

export interface AdminBusinessQuery extends SearchFilter {
  status?: string;
  verified?: string;
}

export interface AdminDeveloperQuery extends SearchFilter {
  status?: string;
  verified?: string;
}

export interface AdminModuleQuery extends SearchFilter {
  status?: string;
}

export interface AdminPaymentQuery extends StatusFilter {
  type?: string;
}

export interface AdminAdQuery extends SearchFilter {
  status?: string;
}

// === MARKETPLACE TYPES ===

export interface MarketplaceSearchParams {
  q?: string;
  type?: string;
  category?: string;
  country?: string;
  city?: string;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  priceRange?: string;
  verified?: boolean;
  premium?: boolean;
  openNow?: boolean;
  delivery?: boolean;
  reservation?: boolean;
  proximity?: string;
  lat?: string;
  lng?: string;
  priceMin?: number;
  priceMax?: number;
  availability?: string[];
}

export interface MarketplaceResult {
  id: string;
  _type: string;
  name?: string;
  [key: string]: any;
}

// === Prisma WhereInput helpers ===
// Use Prisma's generated types directly where possible
export type MenuItemWhereInput = Prisma.MenuItemWhereInput;
export type OrderWhereInput = Prisma.OrderWhereInput;
export type EventWhereInput = Prisma.EventWhereInput;
export type BusinessWhereInput = Prisma.BusinessWhereInput;
