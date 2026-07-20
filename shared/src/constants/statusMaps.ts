export const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  READY: 'Prête',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERING: 'En livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const ORDER_STATUS_EN: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERING: 'Delivering',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const BOOKING_STATUS_MAP: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CHECKED_IN: 'Installé(e)',
  CHECKED_OUT: 'Parti(e)',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  NO_SHOW: 'Absent(e)',
};

export const BOOKING_STATUS_EN: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  CHECKED_OUT: 'Checked out',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No show',
};

export const PAYMENT_STATUS_MAP: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  COMPLETED: 'Effectué',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
  CANCELLED: 'Annulé',
};

export const PAYMENT_STATUS_EN: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

export const QUOTE_STATUS_MAP: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  EXPIRED: 'Expiré',
  CONVERTED: 'Converti en commande',
};

export const QUOTE_STATUS_EN: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CONVERTED: 'Converted to order',
};

export const SUBSCRIPTION_STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRING: 'Expire bientôt',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
  TRIAL: 'Essai gratuit',
};

export const SUBSCRIPTION_STATUS_EN: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRING: 'Expiring soon',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  TRIAL: 'Free trial',
};

export const KYC_STATUS_MAP: Record<string, string> = {
  PENDING: 'En attente',
  VERIFIED: 'Vérifié',
  REJECTED: 'Rejeté',
};

export const KYC_STATUS_EN: Record<string, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
};

export const ORDER_STATUS = { fr: ORDER_STATUS_MAP, en: ORDER_STATUS_EN } as const;
export const BOOKING_STATUS = { fr: BOOKING_STATUS_MAP, en: BOOKING_STATUS_EN } as const;
export const PAYMENT_STATUS = { fr: PAYMENT_STATUS_MAP, en: PAYMENT_STATUS_EN } as const;
export const QUOTE_STATUS = { fr: QUOTE_STATUS_MAP, en: QUOTE_STATUS_EN } as const;
export const SUBSCRIPTION_STATUS = {
  fr: SUBSCRIPTION_STATUS_MAP,
  en: SUBSCRIPTION_STATUS_EN,
} as const;
export const KYC_STATUS = { fr: KYC_STATUS_MAP, en: KYC_STATUS_EN } as const;

/** Helper: get status label in the correct language */
export function getStatusLabel(
  map: Record<string, Record<string, string>>,
  status: string,
  locale: string = 'fr'
): string {
  return map[locale]?.[status] || status;
}
