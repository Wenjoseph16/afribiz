import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { createOrder } from './orders';

/**
 * Dispatcher d'actions hors-ligne.
 *
 * Au flush, chaque item de la file client est EXÉCUTÉ réellement côté serveur
 * (la vraie logique métier : validation, stock, dette, paiement), pas juste
 * marqué PENDING. Chaque action reçoit `userId` (le propriétaire du business)
 * et `payload` (la copie exacte du payload envoyé au moment de l'action).
 */
export async function executeSyncAction(action: string, userId: string, payload: any): Promise<any> {
  switch (action) {
    case 'CREATE_BUSINESS_ORDER':
      // Vente POS hors-ligne : rejouée avec la vraie création de commande
      // (décrement stock, paiement, dette intelligente, facture).
      return createOrder(userId, payload);

    default:
      throw new AppError(`Action de synchronisation inconnue: ${action}`, 400);
  }
}

export async function listSyncItems(ownerId: string, status?: string) {
  const where: any = { userId: ownerId };
  if (status) where.status = status;
  return prisma.offlineSyncQueue.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createSyncItem(data: {
  id?: string;
  userId: string;
  entityType: string;
  entityId?: string;
  action: string;
  payload: any;
}) {
  // Idempotence : le client envoie son propre uuid (id). Si un retry renvoie
  // le même id (réponse perdue), on ne crée pas de doublon.
  const existing = data.id
    ? await prisma.offlineSyncQueue.findUnique({ where: { id: data.id } })
    : null;
  if (existing) return existing;
  return prisma.offlineSyncQueue.create({
    data: { ...data, status: 'PENDING' } as any,
  });
}

export async function processSyncItem(id: string) {
  const item = await prisma.offlineSyncQueue.findUnique({ where: { id } });
  if (!item) throw new AppError('Élément de synchronisation non trouvé', 404);

  try {
    await executeSyncAction(item.action, item.userId, (item.payload as any) || {});
    return prisma.offlineSyncQueue.update({
      where: { id },
      data: { status: 'SYNCED', syncedAt: new Date(), error: null },
    });
  } catch (e: any) {
    // On marque FAILED avec l'erreur — le client peut réessayer
    return prisma.offlineSyncQueue.update({
      where: { id },
      data: {
        status: 'FAILED',
        retryCount: { increment: 1 },
        error: e?.message || 'Échec de synchronisation',
      },
    });
  }
}

export async function getPendingSyncCount(userId: string) {
  return prisma.offlineSyncQueue.count({ where: { userId, status: 'PENDING' } });
}

export async function bulkSync(
  userId: string,
  items: {
    id?: string;
    entityType: string;
    entityId?: string;
    action: string;
    payload: any;
  }[]
) {
  let synced = 0;
  const results: { id?: string; ok: boolean; error?: string }[] = [];

  for (const item of items) {
    try {
      // Idempotence : si l'id client a déjà été traité, on ne rejoue pas.
      if (item.id) {
        const existing = await prisma.offlineSyncQueue.findUnique({
          where: { id: item.id },
          select: { status: true },
        });
        if (existing && existing.status === 'SYNCED') {
          // Idempotence : déjà traité (retry après perte de réponse) → on ne
          // rejoue PAS l'action et on ne compte pas un nouveau synced.
          results.push({ id: item.id, ok: true, duplicate: true });
          continue;
        }
      }

      // Exécuter l'action RÉELLE, puis enregistrer la trace idempotente.
      await executeSyncAction(item.action, userId, item.payload || {});
      await prisma.offlineSyncQueue.upsert({
        where: { id: item.id || `none-${Date.now()}-${Math.random()}` },
        create: {
          id: item.id || undefined,
          userId,
          entityType: item.entityType,
          entityId: item.entityId,
          action: item.action,
          payload: item.payload,
          status: 'SYNCED',
          syncedAt: new Date(),
        },
        update: { status: 'SYNCED', syncedAt: new Date(), error: null },
      });
      synced++;
      results.push({ id: item.id, ok: true });
    } catch (e: any) {
      results.push({ id: item.id, ok: false, error: e?.message || 'Échec' });
    }
  }

  return { synced, results };
}
