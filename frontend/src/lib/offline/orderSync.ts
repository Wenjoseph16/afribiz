/**
 * Vente POS offline-aware.
 *
 * - En ligne  : création de commande RÉELLE via l'API (comportement actuel).
 * - Hors-ligne : la vente est mise en file client (IndexedDB) avec le payload
 *   complet ; on retourne un ordre LOCAL marqué `offlineQueued: true` pour que
 *   l'écran succès du POS s'affiche normalement. Le serveur rejouera la vraie
 *   création (stock, paiement, dette) au prochain flush.
 */
import { apiClient } from '@/services/apiClient';
import { enqueueSyncItem } from './queue';

export interface OfflineOrderResult {
  orderNumber: string;
  offlineQueued?: boolean;
  items?: any[];
  totalAmount?: number;
  deliveryFee?: number;
  discountAmount?: number;
  debts?: any[];
}

export async function createBusinessOrderOfflineAware(
  payload: Record<string, unknown>
): Promise<OfflineOrderResult> {
  // En ligne → comportement normal
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    const res = await apiClient.createBusinessOrder(payload);
    return res.data?.data || res.data || {};
  }

  // Hors-ligne → mise en file + ordre local
  const queued = await enqueueSyncItem({
    action: 'CREATE_BUSINESS_ORDER',
    entityType: 'ORDER',
    payload,
  });

  const items = (payload.items as any[]) || [];
  const subtotal = items.reduce((a: number, i: any) => a + Number(i.unitPrice || 0) * Number(i.quantity || 0), 0);
  const discount = Number(payload.discount || 0);
  const deliveryFee = Number(payload.deliveryFee || 0);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  return {
    orderNumber: queued ? `OFFLINE-${queued.id.slice(0, 8).toUpperCase()}` : 'OFFLINE-LOCAL',
    offlineQueued: true,
    items: items.map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      total: Number(i.unitPrice || 0) * Number(i.quantity || 0),
    })),
    totalAmount: total,
    deliveryFee,
    discountAmount: discount,
    debts: [],
  };
}
