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
  deliveredAt?: string;
  business?: {
    id: string;
    name: string;
    slug?: string;
    avatar?: string;
  };
  items?: TransactionItem[];
  timeline?: TimelineEvent[];
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

export interface TransactionFilters {
  types?: TransactionType[];
  statuses?: string[];
  search?: string;
  page?: number;
  limit?: number;
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

export const TRANSACTION_TYPE_CONFIG: Record<
  TransactionType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  ORDER: {
    label: 'Commande',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'ShoppingBag',
  },
  BOOKING: {
    label: 'Réservation',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'Calendar',
  },
  RENTAL: {
    label: 'Location',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'Home',
  },
  EVENT: {
    label: 'Événement',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'Ticket',
  },
  SUBSCRIPTION: {
    label: 'Abonnement',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'RefreshCw',
  },
  TRAINING: {
    label: 'Formation',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-900/20',
    icon: 'GraduationCap',
  },
  LAYAWAY: {
    label: 'Épargne',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'PiggyBank',
  },
};
