/**
 * Seed des plans plateforme AfriBiz selon la stratégie de monétisation :
 *
 * Phase 1 (Acquisition) : 100% gratuit, monétisation par commission sur transaction
 * Phase 3 (Bascule)     : abonnement unique AfriBiz (tout inclus) + option Copilot IA
 *
 * Plans :
 *   - Gratuit        : 0 FCFA      — tout inclus, commission transaction 1%
 *   - AfriBiz        : 5 000 FCFA  — abonnement unique, tout inclus, commission réduite
 *   - Copilot IA     : +3 000 FCFA — option premium IA (add-on)
 *
 * Usage : npm run db:seed:plans   (ou)   npx tsx scripts/seed-platform-plans.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PrivilegeSeed = {
  code: string;
  label: string;
  description?: string;
  value?: number;
  valueType?: string;
  sortOrder: number;
};

type PlanSeed = {
  id: string;
  name: string;
  description: string;
  type: 'STANDARD' | 'PREMIUM' | 'FREE_TRIAL';
  price: number;
  badge: string | null;
  featured: boolean;
  sortOrder: number;
  benefits: string[];
  privileges: PrivilegeSeed[];
};

const PLANS: PlanSeed[] = [
  {
    id: 'platform-free',
    name: 'Gratuit',
    description:
      "100% des fonctionnalités AfriBiz, sans frais fixes. On ne gagne que lorsque vous gagnez : une micro-commission de 1% sur chaque transaction réussie.",
    type: 'FREE_TRIAL',
    price: 0,
    badge: '🔥 Populaire',
    featured: true,
    sortOrder: 1,
    benefits: [
      'Tous les modules de gestion (produits, stocks, factures, clients)',
      'Réservations, commandes et paiements Mobile Money (Wave, TMoney, Flooz)',
      'Système Escrow (tiers de confiance)',
      'Page business publique + QR menu',
      'Commission de 1% sur chaque transaction réussie',
      'Support communautaire',
    ],
    privileges: [
      { code: 'COMMISSION_TRANSACTION', label: 'Commission transaction', description: 'Prélevée uniquement sur vente réussie', value: 1, valueType: 'PERCENT', sortOrder: 1 },
      { code: 'COMMISSION_ESCROW', label: 'Commission Escrow', value: 2, valueType: 'PERCENT', sortOrder: 2 },
      { code: 'SUPPORT_LEVEL', label: 'Support', value: 1, valueType: 'TEXT', sortOrder: 3, description: 'Communauté + email' },
      { code: 'PRODUCTS_LIMIT', label: 'Produits', value: 10, valueType: 'COUNT', sortOrder: 4, description: '10 produits en ligne' },
      { code: 'CLIENTS_LIMIT', label: 'Clients', value: 50, valueType: 'COUNT', sortOrder: 5, description: '50 fiches clients' },
      { code: 'BOOKINGS_LIMIT', label: 'Réservations', value: 30, valueType: 'COUNT', sortOrder: 6, description: '30 réservations' },
      { code: 'MODULES_ACCESS', label: 'Modules', value: -1, valueType: 'COUNT', sortOrder: 7, description: 'Tous les modules' },
    ],
  },
  {
    id: 'platform-afribiz',
    name: 'AfriBiz',
    description:
      "L'abonnement unique et sans complication. 100% des modules + commission réduite + support prioritaire. Pour les entreprises qui veulent aller plus loin.",
    type: 'STANDARD',
    price: 5000,
    badge: '🚀 Recommandé',
    featured: true,
    sortOrder: 2,
    benefits: [
      'Tout le plan Gratuit, sans limite',
      'Commission transaction réduite à 0,5%',
      'Support prioritaire (réponse < 24h)',
      'Analytics avancés + rapports automatiques',
      'Réservations en ligne illimitées',
    ],
    privileges: [
      { code: 'COMMISSION_TRANSACTION', label: 'Commission transaction', value: 0.5, valueType: 'PERCENT', sortOrder: 1 },
      { code: 'COMMISSION_ESCROW', label: 'Commission Escrow', value: 1.5, valueType: 'PERCENT', sortOrder: 2 },
      { code: 'SUPPORT_LEVEL', label: 'Support', value: 2, valueType: 'TEXT', sortOrder: 3, description: 'Prioritaire' },
      { code: 'PRODUCTS_LIMIT', label: 'Produits', value: -1, valueType: 'COUNT', sortOrder: 4, description: 'Illimité' },
      { code: 'CLIENTS_LIMIT', label: 'Clients', value: -1, valueType: 'COUNT', sortOrder: 5, description: 'Illimité' },
      { code: 'BOOKINGS_LIMIT', label: 'Réservations', value: -1, valueType: 'COUNT', sortOrder: 6, description: 'Illimité' },
      { code: 'MODULES_ACCESS', label: 'Modules', value: -1, valueType: 'COUNT', sortOrder: 7, description: 'Tous les modules' },
      { code: 'REPORTS_AUTOMATION', label: 'Rapports automatiques', value: 1, valueType: 'BOOL', sortOrder: 8 },
    ],
  },
  {
    id: 'platform-copilot',
    name: 'Copilot IA',
    description:
      "Votre assistant virtuel : alertes WhatsApp sur les ruptures de stock, prévisions de ventes, conseils de croissance personnalisés. Option ajoutable à tout plan.",
    type: 'PREMIUM',
    price: 3000,
    badge: '✨ Option IA',
    featured: false,
    sortOrder: 3,
    benefits: [
      'Alertes intelligentes (rupture de stock prévue, pic de vente)',
      'Prévisions de ventes et de demande',
      'Recommandations de croissance personnalisées',
      'Rapport de santé business hebdomadaire',
      'Notifications WhatsApp automatisées',
    ],
    privileges: [
      { code: 'COPILOT_ACCESS', label: 'Copilot IA', value: 1, valueType: 'BOOL', sortOrder: 1 },
      { code: 'COPILOT_ALERTS', label: 'Alertes intelligentes', value: -1, valueType: 'COUNT', sortOrder: 2 },
      { code: 'COPILOT_FORECAST', label: 'Prévisions de ventes', value: 1, valueType: 'BOOL', sortOrder: 3 },
    ],
  },
];

async function main() {
  console.log('🌱 Seed des plans plateforme AfriBiz...');

  // 1) Désactiver les anciens plans plateforme non stratégiques (Basic/Premium à 0 FCFA)
  const stale = await prisma.subscriptionPlan.findMany({
    where: { businessId: null, id: { notIn: PLANS.map((p) => p.id) } },
    select: { id: true, name: true },
  });
  if (stale.length > 0) {
    await prisma.subscriptionPlan.updateMany({
      where: { businessId: null, id: { notIn: PLANS.map((p) => p.id) } },
      data: { isActive: false, isPublic: false },
    });
    console.log(`  ↳ ${stale.length} ancien(s) plan(s) désactivé(s) : ${stale.map((s) => s.name).join(', ')}`);
  }

  // 2) Upsert des 3 plans stratégiques
  for (const plan of PLANS) {
    const existing = await prisma.subscriptionPlan.findUnique({ where: { id: plan.id } });
    const data = {
      businessId: null,
      name: plan.name,
      description: plan.description,
      type: plan.type,
      price: plan.price,
      currency: 'FCFA',
      billingCycle: 'MONTHLY' as const,
      trialDays: 0,
      benefits: plan.benefits,
      isPublic: true,
      isActive: true,
      sortOrder: plan.sortOrder,
      featured: plan.featured,
      badge: plan.badge,
    };

    if (existing) {
      await prisma.subscriptionPlan.update({ where: { id: plan.id }, data });
      console.log(`  ↳ ${plan.name} mis à jour (${plan.price} FCFA/mois)`);
    } else {
      await prisma.subscriptionPlan.create({ data: { id: plan.id, ...data } });
      console.log(`  ↳ ${plan.name} créé (${plan.price} FCFA/mois)`);
    }

    // 3) Privilèges : suppression + recréation pour refléter le catalogue
    await prisma.subscriptionPrivilege.deleteMany({ where: { planId: plan.id } });
    await prisma.subscriptionPrivilege.createMany({
      data: plan.privileges.map((p) => ({
        planId: plan.id,
        code: p.code,
        label: p.label,
        description: p.description || null,
        value: p.value ?? null,
        valueType: p.valueType || null,
        sortOrder: p.sortOrder,
      })),
    });
    console.log(`  ↳ ${plan.privileges.length} privilèges attachés`);
  }

  console.log('✅ Seed terminé. Plans publics :');
  const plans = await prisma.subscriptionPlan.findMany({
    where: { businessId: null, isPublic: true, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { name: true, price: true, isPublic: true, _count: { select: { privileges: true } } },
  });
  for (const p of plans) {
    console.log(`   • ${p.name} — ${p.price} FCFA/mois — ${p._count.privileges} privilèges`);
  }
}

main()
  .catch((e) => {
    console.error('Erreur seed :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
