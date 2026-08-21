// ============================================
// Unified Transaction Tracking Types
// ============================================

export type TransactionType =
  | 'ORDER'
  | 'BOOKING'
  | 'RENTAL'
  | 'EVENT'
  | 'SUBSCRIPTION'
  | 'TRAINING'
  | 'LAYAWAY';

export interface TransactionSnapshot {
  id: string;
  type: TransactionType;
  number: string;
  title: string;
  subtitle?: string;
  status: string;
  statusLabel: string;
  amount: number;
  currency: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  business?: {
    id: string;
    name: string;
    slug?: string;
    avatar?: string;
  };
  items?: TransactionItem[];
  timeline?: TimelineEvent[];
  actions?: TransactionAction[];
  meta?: Record<string, unknown>;
}

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image?: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  description?: string;
  timestamp: string;
  icon?: string;
  color?: string;
  isCurrent?: boolean;
}

export interface TransactionAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  icon?: string;
  disabled?: boolean;
  confirmMessage?: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
}

export interface TransactionFilters {
  types?: TransactionType[];
  statuses?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  transactions: TransactionSnapshot[];
  total: number;
  page: number;
  totalPages: number;
  stats: TransactionStats;
}

export interface TransactionStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  pending: number;
  totalAmount: number;
  byType: Record<TransactionType, number>;
}

export interface TransactionRealtimeEvent {
  type: TransactionType;
  id: string;
  status: string;
  statusLabel: string;
  progress?: number;
  timestamp: string;
  message?: string;
}

// Status labels for each transaction type
export const TRANSACTION_STATUS_LABELS: Record<string, Record<string, string>> = {
  ORDER: {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    ACCEPTED: 'Acceptée',
    PREPARING: 'En préparation',
    READY: 'Prête',
    DELIVERING: 'En livraison',
    DELIVERED: 'Livrée',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
    REFUSED: 'Refusée',
    SHIPPED: 'Expédiée',
    REFUNDED: 'Remboursée',
  },
  BOOKING: {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
    RESCHEDULED: 'Reportée',
    ARRIVED: 'Arrivée',
    NO_SHOW: 'Absente',
  },
  RENTAL: {
    PENDING: 'En attente',
    ACTIVE: 'En cours',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
    OVERDUE: 'En retard',
    RETURNED: 'Retournée',
  },
  EVENT: {
    PENDING: 'En attente',
    REGISTERED: 'Inscrit',
    CONFIRMED: 'Confirmé',
    ATTENDED: 'Présent',
    CANCELLED: 'Annulé',
    NO_SHOW: 'Absent',
  },
  SUBSCRIPTION: {
    ACTIVE: 'Active',
    PAUSE: 'En pause',
    CANCELLED: 'Annulée',
    EXPIRED: 'Expirée',
    PENDING: 'En attente',
    RENEWED: 'Renouvelée',
  },
  TRAINING: {
    NOT_STARTED: 'Non commencé',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
    PENDING: 'En attente',
  },
  LAYAWAY: {
    ACTIVE: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
    EXPIRED: 'Expiré',
    PENDING: 'En attente',
  },
};

// Progress calculation for each type
export const STATUS_PROGRESS: Record<string, Record<string, number>> = {
  ORDER: {
    PENDING: 10,
    CONFIRMED: 25,
    ACCEPTED: 30,
    PREPARING: 50,
    READY: 70,
    DELIVERING: 85,
    DELIVERED: 95,
    COMPLETED: 100,
    CANCELLED: 0,
    REFUSED: 0,
    SHIPPED: 85,
    REFUNDED: 0,
  },
  BOOKING: {
    PENDING: 10,
    CONFIRMED: 40,
    IN_PROGRESS: 70,
    COMPLETED: 100,
    CANCELLED: 0,
    RESCHEDULED: 10,
    ARRIVED: 60,
    NO_SHOW: 0,
  },
  RENTAL: {
    PENDING: 10,
    ACTIVE: 50,
    COMPLETED: 100,
    CANCELLED: 0,
    OVERDUE: 80,
    RETURNED: 100,
  },
  EVENT: {
    PENDING: 10,
    REGISTERED: 30,
    CONFIRMED: 50,
    ATTENDED: 100,
    CANCELLED: 0,
    NO_SHOW: 0,
  },
  SUBSCRIPTION: {
    ACTIVE: 100,
    PAUSE: 50,
    CANCELLED: 0,
    EXPIRED: 0,
    PENDING: 10,
    RENEWED: 100,
  },
  TRAINING: {
    NOT_STARTED: 0,
    IN_PROGRESS: 50,
    COMPLETED: 100,
    CANCELLED: 0,
    PENDING: 10,
  },
  LAYAWAY: {
    ACTIVE: 50,
    COMPLETED: 100,
    CANCELLED: 0,
    EXPIRED: 0,
    PENDING: 10,
  },
};
