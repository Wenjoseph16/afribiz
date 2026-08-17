import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

async function getBusinessByOwner(ownerId: string, db: any = prisma, businessId?: string | null) {
  const where = businessId
    ? { id: businessId, ownerId, deletedAt: null }
    : { ownerId, deletedAt: null };
  const business = await db.business.findFirst({
    where,
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, ownerId: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business;
}

export const CASH_MOVEMENT_LABELS: Record<string, string> = {
  OPENING: 'Fond de caisse',
  SALE: 'Vente',
  FREE_SALE: 'Vente libre',
  EXPENSE: 'Sortie de caisse',
  DEBT_COLLECTION: 'Encaissement dette',
  ADJUSTMENT: 'Ajustement',
  WITHDRAWAL: 'Retrait de caisse',
};

/**
 * Retrouve la session ouverte du jour (ou crée une session auto si aucune
 * n'existe — le premier mouvement du jour ouvre la caisse implicitement).
 */
/** Début du jour calendaire (heure locale serveur). */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Auto-clôture des sessions OPEN d'un jour précédent (le gérant a oublié de
 * clôturer hier) : les ventes du jour ne doivent JAMAIS se mélanger à hier,
 * sinon le solde attendu de la « caisse du jour » devient faux.
 */
async function closeStaleOpenSession(businessId: string, closedBy: string, db: any) {
  const startOfDay = startOfToday();
  const stale = await db.cashSession.findFirst({
    where: { businessId, status: 'OPEN', openedAt: { lt: startOfDay } },
    orderBy: { openedAt: 'desc' },
    include: { movements: true },
  });
  if (!stale) return;
  const totals = computeTotals(stale);
  await db.cashSession.update({
    where: { id: stale.id },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      closedBy,
      expectedBalance: totals.totals.expectedBalance,
      actualBalance: totals.totals.expectedBalance,
      difference: 0,
      closingNotes: 'Auto-clôture : journée précédente non clôturée',
    },
  });
  logger.warn(`Caisse: session ${stale.id} auto-clôturée (jour écoulé) par ${closedBy}`);
}

export async function getOrCreateTodaySession(ownerId: string, openedBy: string, tx?: any) {
  const db: any = tx || prisma;
  const business = await getBusinessByOwner(ownerId, db);
  const startOfDay = startOfToday();

  await closeStaleOpenSession(business.id, openedBy, db);

  const existing = await db.cashSession.findFirst({
    where: { businessId: business.id, status: 'OPEN', openedAt: { gte: startOfDay } },
    orderBy: { openedAt: 'desc' },
  });
  if (existing) return existing;

  // Aucune session ouverte aujourd'hui → on l'ouvre avec fond de caisse à 0
  return db.cashSession.create({
    data: { businessId: business.id, openedBy, openingBalance: 0 },
  });
}

/** Ouvre une session avec le fond de caisse saisi par le gérant. */
export async function openSession(ownerId: string, openingBalance: number, openedBy: string) {
  const business = await getBusinessByOwner(ownerId);

  // Une session d'hier restée ouverte ne bloque pas l'ouverture d'aujourd'hui
  await closeStaleOpenSession(business.id, openedBy, prisma);

  const alreadyOpen = await prisma.cashSession.findFirst({
    where: { businessId: business.id, status: 'OPEN', openedAt: { gte: startOfToday() } },
  });
  if (alreadyOpen) {
    throw new AppError('Une caisse est déjà ouverte pour aujourd’hui', 400);
  }

  const session = await prisma.cashSession.create({
    data: {
      businessId: business.id,
      openedBy,
      openingBalance: Number(openingBalance || 0),
    },
  });

  // Le fond de caisse est lui-même un mouvement (trace + journal)
  if (Number(openingBalance || 0) > 0) {
    await prisma.cashMovement.create({
      data: {
        sessionId: session.id,
        businessId: business.id,
        type: 'OPENING',
        amount: Number(openingBalance),
        method: 'CASH',
        label: 'Fond de caisse',
        performedBy: openedBy,
      },
    });
    await prisma.financialLog.create({
      data: {
        businessId: business.id,
        userId: openedBy,
        action: 'MANUAL_ADJUSTMENT',
        amount: Number(openingBalance),
        description: 'Fond de caisse — ouverture',
        reference: `CAISSE-${session.id.slice(0, 8)}`,
      },
    });
  }

  return getSessionWithTotals(business.id, session.id);
}

/**
 * Ajoute un mouvement à la caisse du jour (crée la session si besoin).
 * Idempotent grâce à offlineClientId : un retry hors-ligne ne double pas.
 */
export async function addMovement(
  ownerId: string,
  data: {
    type: 'SALE' | 'FREE_SALE' | 'EXPENSE' | 'DEBT_COLLECTION' | 'ADJUSTMENT' | 'WITHDRAWAL';
    amount: number;
    method?: string;
    label?: string;
    description?: string;
    sourceType?: string;
    sourceId?: string;
    offlineClientId?: string;
  },
  performedBy: string,
  tx?: any
) {
  const db: any = tx || prisma;
  const business = await getBusinessByOwner(ownerId, db);

  // Idempotence : si ce mouvement a déjà été appliqué, on ne le rejoue pas
  if (data.offlineClientId) {
    const existing = await db.cashMovement.findUnique({
      where: { offlineClientId: data.offlineClientId },
    });
    if (existing) return existing;
  }

  const session = await getOrCreateTodaySession(ownerId, performedBy, tx);
  const amount = Number(data.amount || 0);
  if (amount <= 0) throw new AppError('Montant invalide', 400);

  const movement = await db.cashMovement.create({
    data: {
      sessionId: session.id,
      businessId: business.id,
      type: data.type,
      amount,
      method: data.method || 'CASH',
      label: data.label || CASH_MOVEMENT_LABELS[data.type] || data.type,
      description: data.description,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      performedBy,
      offlineClientId: data.offlineClientId,
    },
  });

  // Journal comptable signé (audit boss, Chantier 5)
  const isExpense = data.type === 'EXPENSE' || data.type === 'WITHDRAWAL';
  await db.financialLog.create({
    data: {
      businessId: business.id,
      userId: performedBy,
      action: isExpense ? 'PAYMENT_SENT' : 'PAYMENT_RECEIVED',
      amount,
      description: `${movement.label} — ${movement.description || ''}`.trim(),
      reference: `CAISSE-${session.id.slice(0, 8)}`,
      metadata: { cashMovementId: movement.id, sourceType: data.sourceType, sourceId: data.sourceId },
    },
  });

  return movement;
}

/** Normalise le moyen de paiement pour la caisse (CASH / MOBILE_MONEY / CARD / MIXED). */
export function normalizeCashMethod(m?: string | null): string {
  const s = String(m || 'CASH').toUpperCase();
  if (s === 'MIXED') return 'MIXED';
  if (
    s.includes('MOBILE') ||
    s.includes('MOMO') ||
    ['WAVE', 'ORANGE_MONEY', 'MTN_MONEY', 'MTN', 'ORANGE'].includes(s)
  )
    return 'MOBILE_MONEY';
  if (s.includes('CARD') || s.includes('BANK') || s.includes('VIREMENT')) return 'CARD';
  return 'CASH';
}

/**
 * Trace l'argent encaissé d'une vente dans la caisse du jour.
 *
 * Idempotence par montant : un acompte déjà tracé puis le solde à la livraison
 * produisent DEUX mouvements distincts, mais re-marquer PAYÉ ne crée jamais de
 * doublon (montant déjà couvert → rien). Ne lève JAMAIS : la caisse ne doit
 * jamais bloquer la vente.
 */
export async function recordOrderSale(
  ownerId: string,
  order: {
    id: string;
    number?: string | null;
    totalAmount?: number | null;
    paymentMethod?: string | null;
    businessId?: string | null;
  },
  paidAmount: number,
  performedBy: string,
  tx?: any
) {
  try {
    if (Number(paidAmount || 0) <= 0) return null;
    const db: any = tx || prisma;
    const traced = await db.cashMovement.findMany({
      where: { sourceType: 'ORDER', sourceId: order.id, type: 'SALE' },
    });
    const alreadyTraced = traced.reduce((a: number, m: any) => a + Number(m.amount), 0);

    // Déjà intégralement tracé → idempotent, on ne rejoue pas
    if (Math.abs(alreadyTraced - Number(paidAmount)) < 0.01) return traced[0] || null;

    // Cas partiel : on complète le manquant (acompte déjà tracé → solde restant)
    const toAdd = Number(paidAmount) - alreadyTraced;
    if (toAdd <= 0) return traced[0] || null;

    return addMovement(
      ownerId,
      {
        type: 'SALE',
        amount: toAdd,
        method: normalizeCashMethod(order.paymentMethod),
        label: `Vente ${order.number || ''}`.trim(),
        description: `Paiement ${order.paymentMethod || 'CASH'} — ${order.number || ''}`,
        sourceType: 'ORDER',
        sourceId: order.id,
      },
      performedBy,
      tx
    );
  } catch (e: any) {
    // Plus jamais d'échec SILENCIEUX : une vente non tracée dans la caisse est un
    // trou de trésorerie invisible. On écrit une trace comptable dédiée pour que
    // le boss puisse la voir (le mouvement sera rejoué par le flush offline).
    logger.warn(`Caisse: mouvement SALE non créé (commande ${order.id}): ${e?.message || e}`);
    try {
      await prisma.financialLog.create({
        data: {
          businessId: order.businessId || '',
          userId: performedBy,
          action: 'MANUAL_ADJUSTMENT',
          amount: 0,
          description: `⚠️ TRACE CAISSE EN ÉCHEC — commande ${order.number || order.id} (${Number(paidAmount || 0)} F non tracés dans la caisse du jour)`, 
          metadata: {
            cashTraceFailed: true,
            orderId: order.id,
            amount: Number(paidAmount || 0),
            error: e?.message || String(e),
          },
        },
      });
    } catch {
      /* la trace d'échec elle-même ne doit pas planter */
    }
    return null;
  }
}

/** La session du jour avec ses totaux (entrées, sorties, solde attendu). */
export async function getTodaySession(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const session = await prisma.cashSession.findFirst({
    where: { businessId: business.id, status: 'OPEN', openedAt: { gte: startOfToday() } },
    orderBy: { openedAt: 'desc' },
    include: { movements: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) return null;
  return { ...computeTotals(session), open: true };
}

export async function getSessionHistory(ownerId: string, limit = 30) {
  const business = await getBusinessByOwner(ownerId);
  const sessions = await prisma.cashSession.findMany({
    where: { businessId: business.id },
    orderBy: { openedAt: 'desc' },
    take: limit,
    include: { movements: { orderBy: { createdAt: 'asc' } } },
  });
  return sessions.map(computeTotals);
}

/**
 * Clôture : solde attendu = fond + entrées − sorties. Le gérant tape le réel,
 * l'écart est détecté immédiatement.
 */
export async function closeSession(
  ownerId: string,
  actualBalance: number,
  closedBy: string,
  closingNotes?: string
) {
  const business = await getBusinessByOwner(ownerId);
  const session = await prisma.cashSession.findFirst({
    where: { businessId: business.id, status: 'OPEN', openedAt: { gte: startOfToday() } },
    orderBy: { openedAt: 'desc' },
    include: { movements: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) throw new AppError('Aucune caisse ouverte à clôturer', 400);

  const totals = computeTotals(session);
  const expectedBalance = totals.totals.expectedBalance;
  const difference = Number(actualBalance || 0) - expectedBalance;

  return prisma.cashSession.update({
    where: { id: session.id },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      closedBy,
      expectedBalance,
      actualBalance: Number(actualBalance || 0),
      difference,
      closingNotes: closingNotes || null,
    },
    include: { movements: { orderBy: { createdAt: 'asc' } } },
  });
}

function computeTotals(session: any) {
  const opening = Number(session.openingBalance || 0);
  const entries = session.movements
    .filter((m: any) => ['SALE', 'FREE_SALE', 'DEBT_COLLECTION', 'ADJUSTMENT'].includes(m.type))
    .reduce((a: number, m: any) => a + Number(m.amount), 0);
  const expenses = session.movements
    .filter((m: any) => ['EXPENSE', 'WITHDRAWAL'].includes(m.type))
    .reduce((a: number, m: any) => a + Number(m.amount), 0);
  const expectedBalance = opening + entries - expenses;

  return {
    ...session,
    totals: {
      opening,
      entries,
      expenses,
      expectedBalance,
      salesCount: session.movements.filter((m: any) => m.type === 'SALE').length,
    },
  };
}

async function getSessionWithTotals(businessId: string, sessionId: string) {
  const session = await prisma.cashSession.findUnique({
    where: { id: sessionId },
    include: { movements: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) return null;
  return computeTotals(session);
}

/** Widget boss / cockpit : la caisse du jour en un coup d'œil. */
export async function getCashWidget(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const session = await prisma.cashSession.findFirst({
    where: { businessId: business.id, status: 'OPEN', openedAt: { gte: startOfToday() } },
    orderBy: { openedAt: 'desc' },
    include: { movements: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) {
    return { open: false, totals: { opening: 0, entries: 0, expenses: 0, expectedBalance: 0, salesCount: 0 } };
  }
  const totals = computeTotals(session);
  return { open: true, sessionId: session.id, openedAt: session.openedAt, ...totals };
}

// Ré-export pour éviter les imports circulaires ailleurs
export { logger };
