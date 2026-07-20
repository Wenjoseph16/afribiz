export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REFUSED'
  | 'CANCELLED'
  | 'SHIPPED'
  | 'REFUNDED';

export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN' | 'TAKEAWAY';

export type OrderSource = 'WEB_SITE' | 'MARKETPLACE' | 'WHATSAPP' | 'PHONE' | 'WALK_IN';

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  variantId?: string;
  menuItemId?: string;
  serviceId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  businessId?: string;
  buyerId?: string;
  buyer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string | null;
  };
  orderNumber: string;
  type: OrderType;
  source: OrderSource;
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  deliveryFee?: number;
  discountAmount?: number;
  currency: string;
  notes?: string;
  internalNotes?: string;
  deliveryStatus?: string;
  deliveryAddress?: string;
  contactPhone?: string;
  contactName?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  deliveredAt?: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  accepted: number;
  preparing: number;
  delivered: number;
  completed: number;
  refused: number;
  cancelled: number;
  totalRevenue: number;
  todayRevenue: number;
}
