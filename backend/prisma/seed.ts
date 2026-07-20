import { PrismaClient, BusinessType } from '@prisma/client';
import { seedAutomationTemplates } from '../src/seed-data/automation-templates';
import { seedCampaignTemplates } from '../src/seed-data/campaign-templates';


const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // ============================================
  // 1. SYSTEM CONFIGURATION
  // ============================================

  // Platform Settings
  const defaultSettings = [
    { key: 'monetization_transactionCommissionRate', value: 0.01, category: 'general', label: 'Commission transactions' },
    { key: 'monetization_escrowCommissionRate', value: 0.02, category: 'general', label: 'Commission escrow' },
    { key: 'monetization_developerModuleCommissionRate', value: 0.20, category: 'general', label: 'Commission modules développeur' },
    { key: 'monetization_minimumEscrowFee', value: 0, category: 'general', label: 'Frais escrow min' },
    { key: 'monetization_maximumEscrowFee', value: null, category: 'general', label: 'Frais escrow max' },
    { key: 'monetization_currency', value: 'FCFA', category: 'general', label: 'Devise' },
  ];
  for (const setting of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✓ Platform settings (6)');

  // Commission Configs
  const defaultCommissions = [
    { key: 'escrow_fee', label: 'Commission Escrow', description: 'Frais prélevés sur chaque transaction sécurisée', rate: 0.01, scope: 'global', currency: 'FCFA', isActive: true },
    { key: 'marketplace_dev_fee', label: 'Commission Marketplace Développeurs', description: 'Part AfriBiz sur les ventes de modules développeurs', rate: 0.15, scope: 'global', currency: 'FCFA', isActive: true },
  ];
  for (const commission of defaultCommissions) {
    await prisma.commissionConfig.upsert({
      where: { key: commission.key },
      update: commission,
      create: commission,
    });
  }
  console.log('✓ Commission configs (2)');

  // Ad Packages
  const adPackages = [
    { name: 'Découverte', slug: 'decouverte', description: 'Bannière sur les pages business pendant 24h', advertiserType: 'BUSINESS', placements: ['BUSINESS_PUBLIC_PAGE:HERO_BANNER', 'BUSINESS_PUBLIC_PAGE:SIDEBAR'], durationHours: 24, price: 10000, currency: 'FCFA', isActive: true },
    { name: 'Standard', slug: 'standard', description: 'Visibilité accrue : bannière + sidebar + carrousel pendant 48h', advertiserType: 'BUSINESS', placements: ['BUSINESS_PUBLIC_PAGE:HERO_BANNER', 'BUSINESS_PUBLIC_PAGE:SIDEBAR', 'BUSINESS_PUBLIC_PAGE:PROMO_WIDGET', 'MARKETPLACE:SPONSORED_CARD'], durationHours: 48, price: 25000, currency: 'FCFA', isActive: true },
    { name: 'Premium', slug: 'premium', description: 'Pack complet : toutes les positions sur toutes les pages pendant 48h', advertiserType: 'BUSINESS', placements: ['BUSINESS_PUBLIC_PAGE:HERO_BANNER', 'BUSINESS_PUBLIC_PAGE:SIDEBAR', 'BUSINESS_PUBLIC_PAGE:PROMO_WIDGET', 'MARKETPLACE:SPONSORED_CARD', 'MARKETPLACE:SPONSORED_RESULT', 'HOMEPAGE:FEATURED_BLOCK', 'DASHBOARD_CLIENT:SIDEBAR', 'DASHBOARD_BUSINESS:SIDEBAR'], durationHours: 48, price: 100000, currency: 'FCFA', isActive: true },
    { name: 'Développeur Boost', slug: 'developpeur-boost', description: 'Promouvez vos modules sur le marketplace développeur', advertiserType: 'DEVELOPER', placements: ['MARKETPLACE:SPONSORED_CARD', 'MODULE_PAGE:SIDEBAR', 'DASHBOARD_DEVELOPER:SIDEBAR'], durationHours: 48, price: 35000, currency: 'FCFA', isActive: true },
    { name: 'Externe Pro', slug: 'externe-pro', description: 'Annonceurs externes — audience large sur tout l\'écosystème', advertiserType: 'EXTERNAL', placements: ['HOMEPAGE:HERO_BANNER', 'HOMEPAGE:FEATURED_BLOCK', 'MARKETPLACE:SPONSORED_RESULT', 'EVENT_PAGE:SIDEBAR', 'DASHBOARD_CLIENT:SIDEBAR'], durationHours: 48, price: 100000, currency: 'FCFA', isActive: true },
  ];
  for (const pkg of adPackages) {
    await prisma.adPackage.upsert({ where: { slug: pkg.slug }, update: {}, create: pkg });
  }
  console.log('✓ Ad packages (5)');

  // ============================================
  // 2. SYSTEM BUSINESS (required by SubscriptionPlan & AutomationRule)
  // ============================================
  const sysUser = await prisma.user.upsert({
    where: { email: 'system@afribiz.local' },
    update: {},
    create: {
      email: 'system@afribiz.local',
      firstName: 'System',
      lastName: 'AfriBiz',
      passwordHash: '$2a$12$dummy',
      emailVerified: true,
      isActive: true,
      primaryRole: 'ADMIN',
      roles: ['ADMIN'],
      country: 'CI',
    },
  });

  const sysBusiness = await prisma.business.upsert({
    where: { slug: 'afribiz-system' },
    update: {},
    create: {
      ownerId: sysUser.id,
      name: 'AfriBiz System',
      slug: 'afribiz-system',
      type: BusinessType.RESTAURANT,
      email: 'system@afribiz.local',
      country: 'CI',
      city: 'Abidjan',
      isActive: false,
    },
  });

  // ============================================
  // 3. DEFAULT SUBSCRIPTION PLAN
  // ============================================
  const existingPlan = await prisma.subscriptionPlan.findFirst({ where: { type: 'STANDARD' } });
  if (!existingPlan) {
    await prisma.subscriptionPlan.create({
      data: {
        businessId: sysBusiness.id,
        name: 'AfriBiz Standard',
        description: 'Accès à toutes les fonctionnalités de la plateforme',
        type: 'STANDARD', price: 5000, currency: 'FCFA',
        billingCycle: 'MONTHLY', trialDays: 14,
        isPublic: true, isActive: true, featured: true, badge: 'POPULAIRE',
        benefits: ['Tous les modules de gestion', 'Paiement Mobile Money intégré', 'Page publique personnalisée', 'Statistiques et rapports', 'Support prioritaire'],
      },
    });
    console.log('✓ Default subscription plan (5000 FCFA/mois)');
  }

  // ============================================
  // 4. AUTOMATION RULES
  // ============================================
  const autoCount = await seedAutomationTemplates(sysBusiness.id);
  if (autoCount > 0) {
    console.log(`✓ Automation rules: ${autoCount} nouveaux templates crees`);
  } else {
    console.log(`✓ Automation rules: deja presents (0 nouveaux)`);
  }

  // ============================================
  // 4. CAMPAIGN TEMPLATES
  // ============================================

  const campCount = await seedCampaignTemplates();
  if (campCount > 0) {
    console.log(`✓ Campaign templates: ${campCount} nouveaux templates crees`);
  } else {
    console.log(`✓ Campaign templates: deja presents (0 nouveaux)`);
  }



  console.log('\n========================================');
  console.log('  Seed completed successfully!');
  console.log('  ⚠️  Aucune donnée de test créée.');
  console.log('  ⚠️  Les utilisateurs doivent s\'inscrire via l\'application.');
  console.log('========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
