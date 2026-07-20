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

export type EscrowFilter = StatusFilter;

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

export type PerformanceFilter = PaginationFilter;

export interface ActivityFilter extends PaginationFilter, DateRangeFilter {
  action?: string;
}

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
  allergens?: string[];
}

export interface OrderCreateInput {
  items: Array<{
    productId?: string;
    menuItemId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  type?: string;
  source?: string;
  deliveryAddress?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  deliveryZoneId?: string;
  deliveryFee?: number;
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
}
