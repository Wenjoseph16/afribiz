import {
  Bell,
  ShoppingBag,
  Calendar,
  Wallet,
  MessageCircle,
  AlertTriangle,
  Star,
  Shield,
  Gift,
  Clock,
  Package,
  Truck,
  CreditCard,
  Sparkles,
  X,
  Hash,
} from 'lucide-react';

export const TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  ORDER_PLACED: ShoppingBag,
  ORDER_CONFIRMED: Package,
  ORDER_SHIPPED: Truck,
  ORDER_DELIVERED: Package,
  ORDER_CANCELLED: X,
  ORDER_MESSAGE: MessageCircle,
  BOOKING_CONFIRMED: Calendar,
  BOOKING_REMINDER: Clock,
  BOOKING_MESSAGE: MessageCircle,
  RENTAL_MESSAGE: MessageCircle,
  EVENT_MESSAGE: MessageCircle,
  SUBSCRIPTION_MESSAGE: MessageCircle,
  TRAINING_MESSAGE: MessageCircle,
  LAYAWAY_MESSAGE: MessageCircle,
  PAYMENT_RECEIVED: CreditCard,
  PAYMENT_FAILED: AlertTriangle,
  PAYMENT_REMINDER: Clock,
  NEW_MESSAGE: MessageCircle,
  REVIEW_RESPONSE: Star,
  PROMOTION: Gift,
  SECURITY_ALERT: Shield,
  DISPUTE_OPENED: AlertTriangle,
  NEW_EVENT: Sparkles,
  SYSTEM: Bell,
  TRACKING_MESSAGE: Hash,
};

export const TYPE_COLORS: Record<string, string> = {
  ORDER_PLACED: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  ORDER_CONFIRMED: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  ORDER_SHIPPED: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  ORDER_DELIVERED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  ORDER_CANCELLED: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  ORDER_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  BOOKING_CONFIRMED: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  BOOKING_REMINDER: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  BOOKING_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  RENTAL_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  EVENT_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  SUBSCRIPTION_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  TRAINING_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  LAYAWAY_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  PAYMENT_RECEIVED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  PAYMENT_FAILED: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  PAYMENT_REMINDER: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  NEW_MESSAGE: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
  REVIEW_RESPONSE: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  PROMOTION: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20',
  SECURITY_ALERT: 'text-red-600 bg-red-50 dark:bg-red-900/20',
  DISPUTE_OPENED: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  NEW_EVENT: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
  SYSTEM: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20',
  TRACKING_MESSAGE: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20',
};

export const MODULE_LABELS: Record<string, string> = {
  ORDER: 'Commande',
  BOOKING: 'Réservation',
  PAYMENT: 'Paiement',
  MESSAGE: 'Message',
  REVIEW: 'Avis',
  PROMOTION: 'Promotion',
  SECURITY: 'Sécurité',
  DISPUTE: 'Litige',
  EVENT: 'Événement',
  SYSTEM: 'Système',
  RENTAL: 'Location',
  SUBSCRIPTION: 'Abonnement',
  TRAINING: 'Formation',
  LAYAWAY: 'Épargne',
};

export function getModuleKey(notificationType: string): string | null {
  const mapping: Record<string, string> = {
    ORDER_PLACED: 'ORDER',
    ORDER_CONFIRMED: 'ORDER',
    ORDER_SHIPPED: 'ORDER',
    ORDER_DELIVERED: 'ORDER',
    ORDER_CANCELLED: 'ORDER',
    ORDER_MESSAGE: 'ORDER',
    BOOKING_CONFIRMED: 'BOOKING',
    BOOKING_REMINDER: 'BOOKING',
    BOOKING_MESSAGE: 'BOOKING',
    RENTAL_MESSAGE: 'RENTAL',
    EVENT_MESSAGE: 'EVENT',
    SUBSCRIPTION_MESSAGE: 'SUBSCRIPTION',
    TRAINING_MESSAGE: 'TRAINING',
    LAYAWAY_MESSAGE: 'LAYAWAY',
    PAYMENT_RECEIVED: 'PAYMENT',
    PAYMENT_FAILED: 'PAYMENT',
    PAYMENT_REMINDER: 'PAYMENT',
    NEW_MESSAGE: 'MESSAGE',
    REVIEW_RESPONSE: 'REVIEW',
    PROMOTION: 'PROMOTION',
    SECURITY_ALERT: 'SECURITY',
    DISPUTE_OPENED: 'DISPUTE',
    NEW_EVENT: 'EVENT',
    SYSTEM: 'SYSTEM',
    TRACKING_MESSAGE: 'MESSAGE',
  };
  return mapping[notificationType] || null;
}

export function getModuleLabel(notificationType: string): string {
  const key = getModuleKey(notificationType);
  return key ? MODULE_LABELS[key] || key : 'Autre';
}

export function getTypeIcon(notificationType: string): React.ComponentType<any> {
  return TYPE_ICONS[notificationType] || Bell;
}

export function getTypeColor(notificationType: string): string {
  return TYPE_COLORS[notificationType] || 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
}
