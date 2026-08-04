/**
 * Grandfathering des business existants.
 *
 * Problème : le fallback "plan Gratuit" s'applique à tout business SANS plan
 * explicite (planId = NULL). Ses limites sont 10 produits / 50 clients /
 * 30 réservations. Un business existant qui dépasse déjà ces limites serait
 * bloqué à la prochaine création.
 *
 * Solution : ce script attribue le plan AfriBiz (illimité) aux business
 * existants qui dépassent déjà les limites du Gratuit. Les nouveaux business
 * continuent de démarrer sur le plan Gratuit (fallback).
 *
 * Usage : npm run db:seed:grandfather   (ou)   npx tsx scripts/grandfather-businesses.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Limites du plan Gratuit (doivent correspondre aux privilèges seedés)
const FREE_LIMITS = {
  PRODUCTS: 10,
  CLIENTS: 50,
  BOOKINGS: 30,
};

async function main() {
  console.log('👴 Grandfathering des business existants...');

  // 1) Vérifier que le plan AfriBiz existe
  const afribiz = await prisma.subscriptionPlan.findUnique({
    where: { id: 'platform-afribiz' },
    select: { id: true, name: true },
  });
  if (!afribiz) {
    console.error('❌ Plan AfriBiz (platform-afribiz) introuvable. Lancez d\'abord: npm run db:seed:plans');
    process.exit(1);
  }

  // 2) Business sans plan explicite
  const businesses = await prisma.business.findMany({
    where: { planId: null },
    select: { id: true, name: true },
  });
  console.log(`  ↳ ${businesses.length} business sans plan explicite`);

  if (businesses.length === 0) {
    console.log('✅ Rien à faire — tous les business ont déjà un plan.');
    return;
  }

  // 2bis) Business utilisant déjà le Copilot IA (config copilot présente ou activée)
  // → grandfathered sur le plan Copilot IA pour ne jamais couper un outil déjà utilisé.
  const copilotPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: 'platform-copilot' },
    select: { id: true, name: true },
  });
  const copilotConfigs = await prisma.copilotConfiguration.findMany({
    where: { businessId: { in: businesses.map((b) => b.id) } },
    select: { businessId: true },
  });
  const copilotBizIds = new Set(copilotConfigs.map((c) => c.businessId));

  // Décision de design (documentée) :
  // - Si un business dépasse les limites Gratuit → AfriBiz (illimité)
  // - Si un business utilise déjà le Copilot IA → plan Copilot IA (garde COPILOT_ACCESS)
  // - Si les deux → priorité au Copilot IA (le blocage le plus visible est celui de l'IA)
  //   NB: le plan Copilot ne change pas les limites produits/clients (fallback Gratuit).
  //   Pour débloquer les DEUX, l'admin assigne AfriBiz + ajoute le privilège COPILOT_ACCESS à AfriBiz.

  // 3) Compter produits / clients / réservations par business
  const bizIds = businesses.map((b) => b.id);
  const [products, clients, bookings] = await Promise.all([
    prisma.product.groupBy({
      by: ['businessId'],
      where: { businessId: { in: bizIds }, deletedAt: null },
      _count: true,
    }),
    prisma.businessClient.groupBy({
      by: ['businessId'],
      where: { businessId: { in: bizIds } },
      _count: true,
    }),
    prisma.booking.groupBy({
      by: ['businessId'],
      where: { businessId: { in: bizIds }, status: { not: 'CANCELLED' } },
      _count: true,
    }),
  ]);

  const counts = (rows: { businessId: string; _count: number }[]) =>
    new Map(rows.map((r) => [r.businessId, r._count]));
  const productCounts = counts(products);
  const clientCounts = counts(clients);
  const bookingCounts = counts(bookings);

  // 4) Déterminer les business qui dépassent une limite Gratuit
  const toUpgrade = businesses.filter((b) => {
    const p = productCounts.get(b.id) || 0;
    const c = clientCounts.get(b.id) || 0;
    const k = bookingCounts.get(b.id) || 0;
    return p > FREE_LIMITS.PRODUCTS || c > FREE_LIMITS.CLIENTS || k > FREE_LIMITS.BOOKINGS;
  });

  // 4bis) Business à grandfathered sur le Copilot IA (utilisaient déjà l'IA)
  const toCopilot = businesses.filter((b) => copilotBizIds.has(b.id));

  if (toUpgrade.length === 0 && toCopilot.length === 0) {
    console.log('✅ Aucun business ne dépasse les limites Gratuit ni n\'utilise le Copilot — fallback sûr.');
    return;
  }

  // 5) Attribuer les plans (priorité : Copilot IA > AfriBiz > rien)
  let upgraded = 0;
  let copilotGranted = 0;
  for (const b of businesses) {
    // Un business qui utilise le Copilot prend la priorité (garder l'outil vivant)
    if (copilotBizIds.has(b.id) && copilotPlan) {
      await prisma.business.update({
        where: { id: b.id },
        data: { planId: copilotPlan.id },
      });
      console.log(`  ↳ ${b.name} → Copilot IA (utilisait déjà l'assistant)`);
      copilotGranted++;
      continue;
    }
    if (toUpgrade.some((x) => x.id === b.id)) {
      await prisma.business.update({
        where: { id: b.id },
        data: { planId: afribiz.id },
      });
      console.log(
        `  ↳ ${b.name} → AfriBiz (produits=${productCounts.get(b.id) || 0}, clients=${clientCounts.get(b.id) || 0}, réservations=${bookingCounts.get(b.id) || 0})`
      );
      upgraded++;
    }
  }

  console.log(
    `✅ ${upgraded} business passé(s) à AfriBiz + ${copilotGranted} au Copilot IA (grandfathered).`
  );
}

main()
  .catch((e) => {
    console.error('Erreur grandfathering :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
