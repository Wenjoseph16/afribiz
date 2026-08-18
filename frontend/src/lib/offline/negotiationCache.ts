/**
 * Cache négociation hors-ligne.
 *
 * Le gérant peut recevoir/proposer des offres même sans réseau.
 * Les offres sont enregistrées localement et sync au retour du signal.
 *
 * Stratégie :
 * - Offres envoyées → en file de sync (pas de requête serveur)
 * - Offres reçues → rien (il faut être en ligne pour recevoir)
 * - État des offres → cache local pour affichage
 */
import { dbGet, dbPut, dbGetAll, dbDelete } from './db';
import { enqueueSyncItem } from './queue';

const NEGOTIATION_STORE = 'negotiations' as const;

export interface CachedNegotiation {
  id: string;
  businessId: string;
  productId?: string;
  productName?: string;
  proposedPrice: number;
  counterPrice?: number;
  status: 'PENDING' | 'ACCEPTED' | 'COUNTERED' | 'DECLINED' | 'EXPIRED';
  clientName?: string;
  clientPhone?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  cachedAt: number;
}

// ── ÉCRITURE ──

export async function cacheNegotiation(neg: any): Promise<void> {
  const cached: CachedNegotiation = {
    id: neg.id,
    businessId: neg.businessId || '',
    productId: neg.productId,
    productName: neg.productName,
    proposedPrice: Number(neg.proposedPrice) || 0,
    counterPrice: neg.counterPrice ? Number(neg.counterPrice) : undefined,
    status: neg.status || 'PENDING',
    clientName: neg.clientName,
    clientPhone: neg.clientPhone,
    message: neg.message,
    createdAt: neg.createdAt,
    updatedAt: neg.updatedAt,
    cachedAt: Date.now(),
  };
  await dbPut(NEGOTIATION_STORE, cached, neg.id);
}

export async function cacheNegotiations(negotiations: any[]): Promise<void> {
  for (const neg of negotiations) {
    await cacheNegotiation(neg);
  }
}

// ── LECTURE ──

export async function getCachedNegotiations(): Promise<CachedNegotiation[]> {
  const all = await dbGetAll<CachedNegotiation>(NEGOTIATION_STORE);
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCachedNegotiation(id: string): Promise<CachedNegotiation | undefined> {
  return dbGet<CachedNegotiation>(NEGOTIATION_STORE, id);
}

export async function getPendingNegotiations(): Promise<CachedNegotiation[]> {
  const all = await getCachedNegotiations();
  return all.filter((n) => n.status === 'PENDING');
}

// ── ACTIONS OFFLINE ──

/**
 * Accepter une offre hors-ligne.
 * L'action est mise en file de sync pour rejouée côté serveur.
 */
export async function acceptNegotiationOffline(
  negotiationId: string,
  businessId: string
): Promise<void> {
  // Mettre à jour le cache local
  const neg = await getCachedNegotiation(negotiationId);
  if (neg) {
    await cacheNegotiation({ ...neg, status: 'ACCEPTED', updatedAt: new Date().toISOString() });
  }

  // Mettre en file de sync
  await enqueueSyncItem({
    action: 'ACCEPT_NEGOTIATION',
    entityType: 'NEGOTIATION',
    entityId: negotiationId,
    payload: { negotiationId, businessId },
  });
}

/**
 * Contre-proposer une offre hors-ligne.
 */
export async function counterNegotiationOffline(
  negotiationId: string,
  counterPrice: number,
  businessId: string
): Promise<void> {
  const neg = await getCachedNegotiation(negotiationId);
  if (neg) {
    await cacheNegotiation({
      ...neg,
      status: 'COUNTERED',
      counterPrice,
      updatedAt: new Date().toISOString(),
    });
  }

  await enqueueSyncItem({
    action: 'COUNTER_NEGOTIATION',
    entityType: 'NEGOTIATION',
    entityId: negotiationId,
    payload: { negotiationId, counterPrice, businessId },
  });
}

/**
 * Refuser une offre hors-ligne.
 */
export async function declineNegotiationOffline(
  negotiationId: string,
  businessId: string
): Promise<void> {
  const neg = await getCachedNegotiation(negotiationId);
  if (neg) {
    await cacheNegotiation({ ...neg, status: 'DECLINED', updatedAt: new Date().toISOString() });
  }

  await enqueueSyncItem({
    action: 'DECLINE_NEGOTIATION',
    entityType: 'NEGOTIATION',
    entityId: negotiationId,
    payload: { negotiationId, businessId },
  });
}
