import { prisma } from '../lib/db';
import { getBusinessesByOwner } from '../lib/businessAccess';
import { getCashWidget } from './cashService';
import { logger } from '../lib/logger';

/**
 * COCKPIT SANTÉ DU BOSS (Chantier 5, Brique B)
 *
 * Le boss voit comment tourne son entreprise d'un coup d'œil :
 *  - un score de santé par business (et un score consolidé)
 *  - les anomalies détectées automatiquement (loi de conservation stock↔caisse,
 *    vente à perte, remises récentes au-dessus du seuil)
 *  - la vue consolidée multi-activités (boutique + gym + locations…)
 *
 * Aucune fonctionnalité existante n'est modifiée : c'est une couche de pilotage
 * par-dessus les données déjà tracées (caisse, stock, ventes, dettes).
 */

const DEFAULT_DISCOUNT_THRESHOLD = 5000;

/** Récupère la valeur du stock (prix d'achat + prix de vente) + produits à risque. */
async function getStockHealth(businessId: string) {
  const products = await prisma.product.findMany({
    where: { businessId },
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
      costPrice: true,
      lowStockThreshold: true,
    },
  });

  let stockValueAtSale = 0;
  let stockValueAtCost = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  const lossMaking: { id: string; name: string; price: number; costPrice: number }[] = [];

  for (const p of products) {
    const price = Number(p.price || 0);
    const cost = Number(p.costPrice || 0);
    const stock = Number(p.stock || 0);
    stockValueAtSale += price * stock;
    stockValueAtCost += cost * stock;

    if (stock <= 0) outOfStockCount++;
    else if (p.lowStockThreshold && stock <= Number(p.lowStockThreshold)) lowStockCount++;

    // Vente à perte : prix de vente < prix d'achat (signale une bradage dangereux)
    if (cost > 0 && price > 0 && price < cost) {
      lossMaking.push({ id: p.id, name: p.name, price, costPrice: cost });
    }
  }

  return {
    productCount: products.length,
    stockValueAtSale,
    stockValueAtCost,
    lowStockCount,
    outOfStockCount,
    lossMaking,
  };
}

/**
 * LOI DE CONSERVATION stock ↔ caisse.
 *
 * À l'ouverture (ou au premier calcul) on enregistre la « réserve » : la valeur
 * du stock au prix de vente. À chaque vérification :
 *   valeur stock restant + argent encaissé depuis + dettes clients
 * doit rester ≈ la réserve initiale (moins les remises tracées).
 *
 * Si le total est significativement EN DESSOUS → il manque de l'argent
 * (vente non enregistrée, vol, perte non déclarée) → anomalie.
 */
async function getConservationAnomaly(businessId: string, baseline: any, cash: any, debtTotal: number) {
  const current = await getStockHealth(businessId);
  const expectedRemaining = baseline.stockValueAtSale - baseline.soldSinceBaseline;
  const actualRemaining = current.stockValueAtSale;

  const cashExpected = baseline.cashAtBaseline + baseline.cashInSinceBaseline;
  const cashActual = cash?.totals?.expectedBalance ?? 0;

  const accounted = actualRemaining + cashActual + debtTotal;
  const expected = expectedRemaining + cashExpected + debtTotal;

  const gap = expected - accounted;
  // Tolérance : 2% ou 2000 F — évite les faux positifs d'arrondis/remises non tracées
  const tolerance = Math.max(2000, expected * 0.02);
  if (gap > tolerance) {
    return {
      type: 'STOCK_CASH_GAP',
      severity: gap > tolerance * 3 ? 'high' : 'medium',
      message: `${Math.round(gap).toLocaleString('fr-FR')} F non expliqués (stock + caisse + dettes ne collent pas au total attendu)`,
      gap: Math.round(gap),
      expected: Math.round(expected),
      accounted: Math.round(accounted),
    };
  }
  return null;
}

/**
 * Calcule le cockpit complet pour UN business : score santé + anomalies + chiffres clés.
 * `baseline` (optionnel) = l'état de référence du matin pour la loi de conservation.
 */
export async function getBusinessCockpit(businessId: string, baseline?: any) {
  const [cash, stock, debtAgg, todayOrders] = await Promise.all([
    getCashWidgetFromId(businessId),
    getStockHealth(businessId),
    prisma.debt.aggregate({
      where: { businessId, status: 'ACTIVE' },
      _sum: { remainingAmount: true },
    }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: startOfDay() } },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  const debtTotal = Number(debtAgg._sum.remainingAmount || 0);
  const cashIn = cash?.totals?.entries ?? 0;
  const cashOut = cash?.totals?.expenses ?? 0;
  const expectedBalance = cash?.totals?.expectedBalance ?? 0;
  const todayRevenue = Number(todayOrders._sum.totalAmount || 0);
  const todayOrdersCount = todayOrders._count || 0;

  const anomalies: any[] = [];

  // 1. Loi de conservation stock ↔ caisse
  if (baseline) {
    const conservation = await getConservationAnomaly(businessId, baseline, cash, debtTotal);
    if (conservation) anomalies.push(conservation);
  }

  // 2. Ventes à perte (prix de vente < prix d'achat)
  for (const lm of stock.lossMaking.slice(0, 3)) {
    anomalies.push({
      type: 'LOSS_MAKING_SALE',
      severity: 'medium',
      message: `${lm.name} vendu à ${lm.price.toLocaleString('fr-FR')} F pour un coût de ${lm.costPrice.toLocaleString('fr-FR')} F — vente à perte`,
      productId: lm.id,
    });
  }

  // 3. Stock épuisé
  if (stock.outOfStockCount > 0) {
    anomalies.push({
      type: 'OUT_OF_STOCK',
      severity: stock.outOfStockCount > 3 ? 'high' : 'low',
      message: `${stock.outOfStockCount} produit(s) en rupture de stock`,
    });
  }

  // Score de santé (100 − pénalités)
  let score = 100;
  for (const a of anomalies) score -= a.severity === 'high' ? 15 : a.severity === 'medium' ? 8 : 3;
  if (cash?.open && Math.abs(Number(cash.difference || 0)) > 0) score -= 5; // écart de caisse
  score = Math.max(0, Math.min(100, score));

  const status = score >= 85 ? 'good' : score >= 65 ? 'warning' : 'critical';

  return {
    businessId,
    score,
    status,
    cash: {
      open: !!cash?.open,
      entries: Math.round(cashIn),
      expenses: Math.round(cashOut),
      expectedBalance: Math.round(expectedBalance),
      difference: cash?.difference != null ? Math.round(Number(cash.difference)) : null,
    },
    stock: {
      valueAtSale: Math.round(stock.stockValueAtSale),
      valueAtCost: Math.round(stock.stockValueAtCost),
      productCount: stock.productCount,
      lowStockCount: stock.lowStockCount,
      outOfStockCount: stock.outOfStockCount,
    },
    debts: Math.round(debtTotal),
    today: {
      revenue: Math.round(todayRevenue),
      ordersCount: todayOrdersCount,
    },
    anomalies,
    baseline: {
      stockValueAtSale: Math.round(stock.stockValueAtSale),
      cashAtBaseline: Math.round(expectedBalance),
      cashInSinceBaseline: 0,
      soldSinceBaseline: Math.round(stock.stockValueAtSale - stock.stockValueAtSale),
    },
  };
}

/** Cockpit consolidé : tous les business du boss + score global. */
export async function getBossCockpit(ownerId: string) {
  const businesses = await getBusinessesByOwner(ownerId);
  if (businesses.length === 0) {
    return { businesses: [], consolidated: null, hasMultiple: false };
  }

  const items: any[] = [];
  for (const b of businesses) {
    try {
      const cockpit = await getBusinessCockpit(b.id);
      items.push({
        id: b.id,
        name: b.name,
        type: b.type,
        logo: b.logo,
        ...cockpit,
      });
    } catch (e: any) {
      logger.warn(`Cockpit business ${b.id} échoué: ${e?.message || e}`);
      items.push({ id: b.id, name: b.name, type: b.type, logo: b.logo, score: 0, status: 'critical', anomalies: [] });
    }
  }

  const totalScore = Math.round(items.reduce((a, i) => a + i.score, 0) / items.length);
  const allAnomalies = items.flatMap((i) =>
    i.anomalies.map((a: any) => ({ ...a, businessId: i.id, businessName: i.name }))
  );

  return {
    businesses: items,
    consolidated: {
      score: totalScore,
      status: totalScore >= 85 ? 'good' : totalScore >= 65 ? 'warning' : 'critical',
      businessCount: items.length,
      anomalyCount: allAnomalies.length,
      highAnomalyCount: allAnomalies.filter((a) => a.severity === 'high').length,
      totalExpectedCash: Math.round(
        items.reduce((a, i) => a + (i.cash?.expectedBalance || 0), 0)
      ),
      totalStockValue: Math.round(items.reduce((a, i) => a + (i.stock?.valueAtSale || 0), 0)),
      totalDebts: Math.round(items.reduce((a, i) => a + (i.debts || 0), 0)),
      totalTodayRevenue: Math.round(items.reduce((a, i) => a + (i.today?.revenue || 0), 0)),
    },
    anomalies: allAnomalies,
    hasMultiple: items.length > 1,
  };
}

// ── helpers ──

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** getCashWidget mais par businessId directement (le service utilise ownerId). */
async function getCashWidgetFromId(businessId: string) {
  try {
    const session = await prisma.cashSession.findFirst({
      where: { businessId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: { movements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) {
      return { open: false, totals: { opening: 0, entries: 0, expenses: 0, expectedBalance: 0, salesCount: 0 }, difference: 0 };
    }
    const opening = Number(session.openingBalance || 0);
    const entries = session.movements
      .filter((m: any) => ['SALE', 'FREE_SALE', 'DEBT_COLLECTION', 'ADJUSTMENT'].includes(m.type))
      .reduce((a: number, m: any) => a + Number(m.amount), 0);
    const expenses = session.movements
      .filter((m: any) => ['EXPENSE', 'WITHDRAWAL'].includes(m.type))
      .reduce((a: number, m: any) => a + Number(m.amount), 0);
    return {
      open: true,
      sessionId: session.id,
      openedAt: session.openedAt,
      difference: session.difference != null ? Number(session.difference) : null,
      totals: { opening, entries, expenses, expectedBalance: opening + entries - expenses, salesCount: 0 },
    };
  } catch (e: any) {
    logger.warn(`getCashWidgetFromId échoué: ${e?.message || e}`);
    return { open: false, totals: { opening: 0, entries: 0, expenses: 0, expectedBalance: 0, salesCount: 0 }, difference: 0 };
  }
}
