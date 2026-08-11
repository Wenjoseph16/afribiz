import { PrismaClient, UserRole, BusinessModule, BusinessType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * ============================================================
 * SEED RÉALISTE — Zéro fiction, tout est connecté
 * ============================================================
 * 16 comptes : 1 admin + 5 clients + 4 développeurs + 6 gérants.
 * 6 business à domaines différents, modules activés selon leur métier.
 * Chaque commande/réservation/avis/favori/message appartient à un vrai user.
 * Mot de passe unique pour TOUS les comptes : Afribiz@2026!
 * ============================================================
 */

export const PASSWORD = 'Afribiz@2026!';

// ─── Déterministic IDs (users & business) ───
export const U = {
  ADMIN: '00000000-0000-0000-0000-000000000001',
  CLIENT_1: '00000000-0000-0000-0000-000000000002',
  CLIENT_2: '00000000-0000-0000-0000-000000000003',
  CLIENT_3: '00000000-0000-0000-0000-000000000004',
  CLIENT_4: '00000000-0000-0000-0000-000000000005',
  CLIENT_5: '00000000-0000-0000-0000-000000000006',
  DEV_1: '00000000-0000-0000-0000-000000000007',
  DEV_2: '00000000-0000-0000-0000-000000000008',
  DEV_3: '00000000-0000-0000-0000-000000000009',
  DEV_4: '00000000-0000-0000-0000-00000000000a',
  OWNER_RESTO: '00000000-0000-0000-0000-00000000000b',
  OWNER_SALON: '00000000-0000-0000-0000-00000000000c',
  OWNER_HOTEL: '00000000-0000-0000-0000-00000000000d',
  OWNER_BOUTIQUE: '00000000-0000-0000-0000-00000000000e',
  OWNER_BTP: '00000000-0000-0000-0000-00000000000f',
  OWNER_EVENTS: '00000000-0000-0000-0000-000000000010',
};

export const B = {
  RESTO: '00000000-0000-0000-0000-000000000020',
  SALON: '00000000-0000-0000-0000-000000000021',
  HOTEL: '00000000-0000-0000-0000-000000000022',
  BOUTIQUE: '00000000-0000-0000-0000-000000000023',
  BTP: '00000000-0000-0000-0000-000000000024',
  EVENTS: '00000000-0000-0000-0000-000000000025',
};

const ALL_USER_IDS = Object.values(U);
const ALL_BIZ_IDS = Object.values(B);

async function hashPwd(pwd: string): Promise<string> {
  return bcrypt.hash(pwd, 12);
}

async function roleAssign(id: string, userId: string, role: UserRole, source: string = 'ACTIVATION') {
  await prisma.userRoleAssignment.upsert({
    where: { id },
    update: {},
    create: { id, userId, role, source: source as any },
  });
}

// ============================================================
// 1. UTILISATEURS (16)
// ============================================================
async function seedUsers() {
  const pwd = await hashPwd(PASSWORD);

  const users: any[] = [
    // Admin
    { id: U.ADMIN, email: 'admin@afribiz.com', firstName: 'Sonia', lastName: 'Kouassi', primaryRole: 'ADMIN', roles: ['ADMIN', 'CLIENT'], country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'F', createdAt: new Date('2025-01-10') },
    // Clients
    { id: U.CLIENT_1, email: 'client1@afribiz.com', firstName: 'Awa', lastName: 'Coulibaly', primaryRole: 'CLIENT', roles: ['CLIENT'], country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'F', createdAt: new Date('2025-02-01') },
    { id: U.CLIENT_2, email: 'client2@afribiz.com', firstName: 'Kofi', lastName: 'Mensah', primaryRole: 'CLIENT', roles: ['CLIENT'], country: 'Ghana', city: 'Accra', gender: 'M', createdAt: new Date('2025-02-14') },
    { id: U.CLIENT_3, email: 'client3@afribiz.com', firstName: 'Fatou', lastName: 'Ndiaye', primaryRole: 'CLIENT', roles: ['CLIENT'], country: 'Sénégal', city: 'Dakar', gender: 'F', createdAt: new Date('2025-03-02') },
    { id: U.CLIENT_4, email: 'client4@afribiz.com', firstName: 'Jean', lastName: 'Kouadio', primaryRole: 'CLIENT', roles: ['CLIENT'], country: 'Côte d\'Ivoire', city: 'Bouaké', gender: 'M', createdAt: new Date('2025-03-20') },
    { id: U.CLIENT_5, email: 'client5@afribiz.com', firstName: 'Aminata', lastName: 'Koné', primaryRole: 'CLIENT', roles: ['CLIENT'], country: 'Mali', city: 'Bamako', gender: 'F', createdAt: new Date('2025-04-05') },
    // Développeurs
    { id: U.DEV_1, email: 'dev1@afribiz.com', firstName: 'Mamadou', lastName: 'Traoré', primaryRole: 'DEVELOPER', roles: ['DEVELOPER', 'CLIENT'], country: 'Sénégal', city: 'Dakar', gender: 'M', createdAt: new Date('2025-01-20') },
    { id: U.DEV_2, email: 'dev2@afribiz.com', firstName: 'Aïssatou', lastName: 'Diop', primaryRole: 'DEVELOPER', roles: ['DEVELOPER', 'CLIENT'], country: 'Sénégal', city: 'Dakar', gender: 'F', createdAt: new Date('2025-02-10') },
    { id: U.DEV_3, email: 'dev3@afribiz.com', firstName: 'Yao', lastName: 'Kouamé', primaryRole: 'DEVELOPER', roles: ['DEVELOPER', 'CLIENT'], country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'M', createdAt: new Date('2025-03-08') },
    { id: U.DEV_4, email: 'dev4@afribiz.com', firstName: 'Chloé', lastName: 'Amegashie', primaryRole: 'DEVELOPER', roles: ['DEVELOPER', 'CLIENT'], country: 'Togo', city: 'Lomé', gender: 'F', createdAt: new Date('2025-04-01') },
    // Gérants de business
    { id: U.OWNER_RESTO, email: 'resto@afribiz.com', firstName: 'Ismaël', lastName: 'Bamba', primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'], country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'M', createdAt: new Date('2025-05-12') },
    { id: U.OWNER_SALON, email: 'salon@afribiz.com', firstName: 'Mariam', lastName: 'Sow', primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'], country: 'Sénégal', city: 'Dakar', gender: 'F', createdAt: new Date('2025-05-20') },
    { id: U.OWNER_HOTEL, email: 'hotel@afribiz.com', firstName: 'Éric', lastName: 'Aka', primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'], country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'M', createdAt: new Date('2025-06-01') },
    { id: U.OWNER_BOUTIQUE, email: 'boutique@afribiz.com', firstName: 'Lydia', lastName: 'Owusu', primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'], country: 'Ghana', city: 'Accra', gender: 'F', createdAt: new Date('2025-06-15') },
    { id: U.OWNER_BTP, email: 'btp@afribiz.com', firstName: 'Serge', lastName: 'Koffi', primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'], country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'M', createdAt: new Date('2025-07-01') },
    { id: U.OWNER_EVENTS, email: 'events@afribiz.com', firstName: 'Nadia', lastName: 'Bello', primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'], country: 'Bénin', city: 'Cotonou', gender: 'F', createdAt: new Date('2025-07-10') },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id, email: u.email, phone: u.phone || `+22500000${u.id.slice(-1)}`,
        firstName: u.firstName, lastName: u.lastName, passwordHash: pwd,
        emailVerified: true, isActive: true,
        primaryRole: u.primaryRole, roles: u.roles,
        country: u.country, city: u.city, gender: u.gender, createdAt: u.createdAt,
      },
    });
  }

  await roleAssign('ra-admin', U.ADMIN, 'ADMIN', 'ADMIN');
  for (const u of users.filter((x) => x.primaryRole !== 'ADMIN')) {
    await roleAssign(`ra-${u.id.slice(-2)}`, u.id, u.primaryRole as UserRole);
  }

  console.log(`✓ ${users.length} utilisateurs (mdp unique : ${PASSWORD})`);
}

// ============================================================
// 1b. PLANS PLATEFORME (businessId=null)
// Stratégie lancement : UN SEUL plan vendu → AfriBiz, GRATUIT en promo (0 FCFA).
// Le plan Copilot IA est PRÉPARÉ (en base, privilèges) mais pas vendu (isPublic=false)
// → il sera activé quand de vraies IA externes seront intégrées après le lancement.
// L'ancien plan « platform-free » n'existe plus.
// ============================================================
async function seedPlatformPlans() {
  // ── Migration : les business qui pointaient vers l'ancien platform-free → AfriBiz ──
  await prisma.business.updateMany({
    where: { planId: 'platform-free' },
    data: { planId: 'platform-afribiz' },
  });

  // ── Purge de TOUS les plans plateforme hors whitelist + leurs privilèges ──
  // (source de vérité unique : seuls AfriBiz + Copilot existent. Tout autre plan
  //  résiduel d'un ancien seed — ex. « AfriBiz Standard » — est purgé.)
  await prisma.subscriptionPrivilege.deleteMany({
    where: {
      plan: { businessId: null, id: { notIn: ['platform-afribiz', 'platform-copilot'] } },
    },
  });
  await prisma.subscriptionPlan.deleteMany({
    where: { businessId: null, id: { notIn: ['platform-afribiz', 'platform-copilot'] } },
  });

  // ── Plan AfriBiz (plan par défaut, GRATUIT en promo de lancement) ──
  const afribiz = {
    id: 'platform-afribiz', businessId: null, name: 'AfriBiz',
    description: "L'abonnement unique, tout inclus — GRATUIT pour le lancement (0 FCFA). Pas de carte bancaire requise.",
    type: 'STANDARD', price: 0, currency: 'FCFA', billingCycle: 'MONTHLY', trialDays: null,
    benefits: [
      '100% des modules, sans limite',
      'Paiements Mobile Money (Wave, TMoney, Flooz) + Escrow sécurisé',
      'Commission transaction de 1% seulement quand vous vendez',
      'Commission Escrow de 2% (tiers de confiance)',
      'Copilot IA inclus gratuitement pour le lancement',
      'Analytics avancés + rapports automatiques',
    ],
    // isPublic=true pour l'afficher sur /pricing · badge promo de lancement
    isPublic: true, isActive: true, sortOrder: 1, featured: true,
    badge: '🔥 Promo lancement : gratuit (5 000 FCFA/mois après)',
  };
  await prisma.subscriptionPlan.upsert({
    where: { id: afribiz.id },
    update: {
      description: afribiz.description,
      benefits: afribiz.benefits,
      price: afribiz.price,
      isPublic: afribiz.isPublic,
      isActive: afribiz.isActive,
      badge: afribiz.badge,
    },
    create: { id: afribiz.id, businessId: null, ...afribiz },
  });

  // Privilèges AfriBiz — limites illimitées (-1) + commissions 1%/2% + Copilot gratuit
  // NB: les commissions réelles sont calculées dans monetizationConfig (global) —
  // ces valeurs servent uniquement à l'affichage de la page /pricing.
  await prisma.subscriptionPrivilege.deleteMany({
    where: { planId: afribiz.id },
  });
  const afribizPrivileges: any[] = [
    { id: 'prv-abz-products', planId: afribiz.id, code: 'PRODUCTS_LIMIT', label: 'Produits', description: 'Produits au catalogue — illimité', value: -1, valueType: 'COUNT', sortOrder: 1 },
    { id: 'prv-abz-clients', planId: afribiz.id, code: 'CLIENTS_LIMIT', label: 'Clients CRM', description: 'Clients CRM — illimité', value: -1, valueType: 'COUNT', sortOrder: 2 },
    { id: 'prv-abz-bookings', planId: afribiz.id, code: 'BOOKINGS_LIMIT', label: 'Réservations', description: 'Réservations — illimité', value: -1, valueType: 'COUNT', sortOrder: 3 },
    { id: 'prv-abz-commission', planId: afribiz.id, code: 'COMMISSION_TRANSACTION', label: 'Commission transaction', description: '1% par transaction réussie', value: 1, valueType: 'PERCENT', sortOrder: 4 },
    { id: 'prv-abz-escrow', planId: afribiz.id, code: 'COMMISSION_ESCROW', label: 'Commission Escrow', description: '2% sur le séquestre', value: 2, valueType: 'PERCENT', sortOrder: 5 },
    { id: 'prv-abz-copilot', planId: afribiz.id, code: 'COPILOT_ACCESS', label: 'Copilot IA', description: 'Accès Copilot inclus (gratuit au lancement)', value: 1, valueType: 'FLAG', sortOrder: 6 },
    { id: 'prv-abz-reports', planId: afribiz.id, code: 'REPORTS_AUTOMATION', label: 'Rapports automatiques', description: 'Rapports automatiques inclus', value: 1, valueType: 'BOOL', sortOrder: 7 },
    { id: 'prv-abz-support', planId: afribiz.id, code: 'SUPPORT_LEVEL', label: 'Support', description: 'Support prioritaire', value: 2, valueType: 'TEXT', sortOrder: 8 },
  ];
  for (const pr of afribizPrivileges) {
    await prisma.subscriptionPrivilege.upsert({
      where: { id: pr.id },
      update: {},
      create: { id: pr.id, planId: afribiz.id, code: pr.code, value: pr.value, valueType: pr.valueType, label: pr.label, description: pr.description, sortOrder: pr.sortOrder },
    });
  }

  // ── Plan Copilot IA — PRÉPARÉ mais PAS vendu (isPublic=false) :
  // il sera mis en vente quand les vraies IA externes seront intégrées après le lancement.
  const copilot = {
    id: 'platform-copilot', businessId: null, name: 'Copilot IA',
    description: "Option IA premium — préparée, disponible après le lancement (0 FCFA pour l'instant).",
    type: 'PREMIUM', price: 0, currency: 'FCFA', billingCycle: 'MONTHLY', trialDays: null,
    benefits: [
      'Alertes intelligentes (rupture de stock prévue, pic de vente)',
      'Prévisions de ventes et de demande',
      'Recommandations de croissance personnalisées',
      'Rapport de santé business hebdomadaire',
      'Notifications WhatsApp automatisées',
    ],
    isPublic: false, isActive: true, sortOrder: 2, featured: false, badge: '✨ Bientôt disponible',
  };
  await prisma.subscriptionPlan.upsert({
    where: { id: copilot.id },
    update: {
      description: copilot.description,
      price: copilot.price,
      benefits: copilot.benefits,
      isPublic: copilot.isPublic,
      badge: copilot.badge,
    },
    create: { id: copilot.id, businessId: null, ...copilot },
  });
  await prisma.subscriptionPrivilege.deleteMany({ where: { planId: copilot.id } });
  const copilotPrivileges: any[] = [
    { id: 'prv-cop-access', planId: copilot.id, code: 'COPILOT_ACCESS', label: 'Copilot IA', description: 'Accès IA', value: 1, valueType: 'FLAG', sortOrder: 1 },
    { id: 'prv-cop-alerts', planId: copilot.id, code: 'COPILOT_ALERTS', label: 'Alertes intelligentes', description: 'Alertes IA', value: -1, valueType: 'COUNT', sortOrder: 2 },
    { id: 'prv-cop-forecast', planId: copilot.id, code: 'COPILOT_FORECAST', label: 'Prévisions de ventes', description: 'Prévisions IA', value: 1, valueType: 'BOOL', sortOrder: 3 },
  ];
  for (const pr of copilotPrivileges) {
    await prisma.subscriptionPrivilege.upsert({
      where: { id: pr.id },
      update: {},
      create: { id: pr.id, planId: copilot.id, code: pr.code, value: pr.value, valueType: pr.valueType, label: pr.label, description: pr.description, sortOrder: pr.sortOrder },
    });
  }

  console.log('✓ Plans plateforme : AfriBiz GRATUIT (promo lancement) + Copilot IA préparé (non vendu)');
}

// ============================================================
// 2. BUSINESS + MODULES MÉTIER
// ============================================================
const BIZ_DEFS: any[] = [
  {
    id: B.RESTO, ownerId: U.OWNER_RESTO, name: 'Saveur d\'Abidjan', slug: 'saveur-dabidjan', type: BusinessType.RESTAURANT,
    description: 'Restaurant traditionnel ivoirien : plats du terroir, ambiance chaleureuse et service de livraison.',
    shortDescription: 'Cuisine ivoirienne authentique', tagline: 'Le goût du terroir',
    email: 'contact@saveur-abidjan.com', phone: '+2250102030405', country: 'Côte d\'Ivoire', city: 'Abidjan', region: 'Cocody',
    address: 'Angré 7e tranche', foundedYear: 2019, employeeCount: 14, rating: 4.6, reviewCount: 96,
    modules: ['PRODUCTS', 'MENU', 'ORDERS', 'BOOKINGS', 'DELIVERIES', 'PROMOTIONS', 'EMPLOYEES', 'PLANNING', 'CRM', 'MARKETING', 'DEBTS_PAYMENTS', 'QUOTES_INVOICES', 'AFRISCORE', 'DOCUMENTS'],
  },
  {
    id: B.SALON, ownerId: U.OWNER_SALON, name: 'Kenza Beauté', slug: 'kenza-beaute', type: BusinessType.SALON_BEAUTE,
    description: 'Salon de beauté : coiffure, manucure, soins du visage et maquillage. Rendez-vous en ligne.',
    shortDescription: 'Coiffure & soins de beauté', tagline: 'Révélez votre éclat',
    email: 'contact@kenzabeaute.com', phone: '+221770001122', country: 'Sénégal', city: 'Dakar', region: 'Almadies',
    address: 'Route des Almadies', foundedYear: 2020, employeeCount: 6, rating: 4.8, reviewCount: 54,
    modules: ['SERVICES', 'BOOKINGS', 'CRM', 'PROMOTIONS', 'PORTFOLIO', 'EMPLOYEES', 'PLANNING', 'MARKETING', 'AFRISCORE', 'SAVINGS'],
  },
  {
    id: B.HOTEL, ownerId: U.OWNER_HOTEL, name: 'Hôtel Palmier', slug: 'hotel-palmier', type: BusinessType.HOTEL,
    description: 'Hôtel 3 étoiles au cœur d\'Abidjan : chambres climatisées, piscine, séminaires et restauration.',
    shortDescription: 'Hôtel 3 étoiles & séminaires', tagline: 'Votre second chez-vous',
    email: 'reservation@hotelpalmier.com', phone: '+22527210000', country: 'Côte d\'Ivoire', city: 'Abidjan', region: 'Plateau',
    address: 'Bd de la République', foundedYear: 2015, employeeCount: 32, rating: 4.4, reviewCount: 140,
    modules: ['ROOMS', 'BOOKINGS', 'SERVICES', 'QUOTES_INVOICES', 'EVENTS', 'EMPLOYEES', 'CRM', 'PROMOTIONS', 'DOCUMENTS'],
  },
  {
    id: B.BOUTIQUE, ownerId: U.OWNER_BOUTIQUE, name: 'TechStore Afrique', slug: 'techstore-afrique', type: BusinessType.BOUTIQUE_TELEPHONIQUE,
    description: 'Smartphones, accessoires et produits high-tech au meilleur prix, livrés dans toute l\'Afrique de l\'Ouest.',
    shortDescription: 'High-tech & smartphones', tagline: 'La tech pour tous',
    email: 'contact@techstoreafrique.com', phone: '+233202020202', country: 'Ghana', city: 'Accra', region: 'Osu',
    address: 'Oxford Street, Osu', foundedYear: 2021, employeeCount: 8, rating: 4.5, reviewCount: 78,
    modules: ['PRODUCTS', 'ORDERS', 'DELIVERIES', 'DEBTS_PAYMENTS', 'PROMOTIONS', 'CRM', 'MARKETING', 'DOCUMENTS', 'QUOTES_INVOICES', 'SAVINGS'],
  },
  {
    id: B.BTP, ownerId: U.OWNER_BTP, name: 'BuildPro BTP', slug: 'buildpro-btp', type: BusinessType.ARTISAN,
    description: 'Entreprise de construction et de rénovation : devis, chantiers, gros œuvre et finitions.',
    shortDescription: 'Construction & rénovation', tagline: 'Construisons l\'avenir',
    email: 'contact@buildpro.ci', phone: '+2250708091011', country: 'Côte d\'Ivoire', city: 'Abidjan', region: 'Yopougon',
    address: 'Zone industrielle Yopougon', foundedYear: 2017, employeeCount: 22, rating: 4.7, reviewCount: 41,
    modules: ['PORTFOLIO', 'QUOTES_INVOICES', 'ADVANCED_TASKS', 'PLANNING', 'EMPLOYEES', 'DOCUMENTS', 'PARTNERS', 'CRM', 'TRAINING'],
  },
  {
    id: B.EVENTS, ownerId: U.OWNER_EVENTS, name: 'Événements Plus', slug: 'evenements-plus', type: BusinessType.LOCATION_SAISONNIERE,
    description: 'Organisation d\'événements, location de matériel (tentes, sonorisation) et billetterie en ligne.',
    shortDescription: 'Événements & locations', tagline: 'Vos événements réussis',
    email: 'contact@evenementsplus.com', phone: '+22997000000', country: 'Bénin', city: 'Cotonou', region: 'Ganhi',
    address: 'Bd St Michel', foundedYear: 2018, employeeCount: 10, rating: 4.3, reviewCount: 33,
    modules: ['PRODUCTS', 'EVENTS', 'RENTALS', 'BOOKINGS', 'ORDERS', 'PROMOTIONS', 'CRM', 'MARKETING', 'PLANNING', 'EMPLOYEES'],
  },
];

async function seedBusinesses() {
  const days = [1, 2, 3, 4, 5, 6, 0];
  for (const d of BIZ_DEFS) {
    await prisma.business.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id, ownerId: d.ownerId, name: d.name, slug: d.slug, type: d.type,
        description: d.description, shortDescription: d.shortDescription, tagline: d.tagline,
        email: d.email, phone: d.phone, country: d.country, city: d.city, region: d.region, address: d.address,
        foundedYear: d.foundedYear, employeeCount: d.employeeCount,
        planId: 'platform-afribiz',
        isActive: true, isVerified: true, isPremium: true, isNew: false,
        isTopSeller: true, isTopProvider: true, isRecommended: true,
        onboardingCompleted: true, onboardedAt: new Date('2025-08-01'),
        verificationStatus: 'VERIFIED',
        // Note et compteur recalculés depuis les VRAIS avis (seedBusinessReviews) —
        // plus jamais de valeurs statiques fictionnelles qui trahissent la réalité.
        rating: 0, reviewCount: 0,
        whatsapp: d.phone,
      },
    });

    await prisma.businessSettings.upsert({
      where: { businessId: d.id },
      update: {},
      create: { businessId: d.id, currency: 'FCFA', timezone: 'Africa/Abidjan', language: 'fr', dateFormat: 'DD/MM/YYYY', autoConfirmBookings: true, autoConfirmOrders: false, allowOnlinePayments: true, allowCashOnDelivery: true },
    });

    for (const day of days) {
      await prisma.businessHour.upsert({
        where: { businessId_day: { businessId: d.id, day } },
        update: {},
        create: { businessId: d.id, day, open: '08:00', close: '22:00', isClosed: day === 0 },
      });
    }

    await prisma.businessPaymentMethod.upsert({
      where: { id: `bpm-${d.slug}-1` }, update: {},
      create: { businessId: d.id, method: 'Orange Money', name: 'Orange Money', number: d.phone, isActive: true },
    });
    await prisma.businessPaymentMethod.upsert({
      where: { id: `bpm-${d.slug}-2` }, update: {},
      create: { businessId: d.id, method: 'Wave', name: 'Wave', number: d.phone, isActive: true },
    });

    for (const mod of d.modules) {
      await prisma.businessModuleAssignment.upsert({
        where: { businessId_module: { businessId: d.id, module: mod as BusinessModule } },
        update: {},
        create: { businessId: d.id, module: mod as BusinessModule, status: 'ACTIVE', config: { enabled: true } },
      });
    }

    await prisma.wallet.upsert({
      where: { businessId: d.id },
      update: {},
      create: { id: `wallet-${d.slug}`, businessId: d.id, balance: d.id === B.BOUTIQUE ? 2500000 : 1200000, currency: 'FCFA' },
    });
  }
  console.log(`✓ ${BIZ_DEFS.length} business créés + modules métier activés`);
}

// ============================================================
// 3. CATALOGUES (chaque article appartient à un vrai business)
// ============================================================
async function seedCatalogs() {
  // ── RESTAURANT : produits (plats) + catégories + menu ──
  await prisma.productCategory.upsert({ where: { id: 'cat-res-1' }, update: {}, create: { id: 'cat-res-1', businessId: B.RESTO, name: 'Plats', slug: 'plats', description: 'Plats traditionnels' } });
  await prisma.productCategory.upsert({ where: { id: 'cat-res-2' }, update: {}, create: { id: 'cat-res-2', businessId: B.RESTO, name: 'Boissons', slug: 'boissons', description: 'Boissons et jus' } });
  await prisma.productCategory.upsert({ where: { id: 'cat-bout-1' }, update: {}, create: { id: 'cat-bout-1', businessId: B.BOUTIQUE, name: 'Smartphones', slug: 'smartphones', description: 'Téléphones et accessoires' } });
  await prisma.productCategory.upsert({ where: { id: 'cat-bout-2' }, update: {}, create: { id: 'cat-bout-2', businessId: B.BOUTIQUE, name: 'Accessoires', slug: 'accessoires', description: 'Coques, câbles, écouteurs' } });
  await prisma.productCategory.upsert({ where: { id: 'cat-evt-1' }, update: {}, create: { id: 'cat-evt-1', businessId: B.EVENTS, name: 'Billetterie', slug: 'billetterie', description: 'Billets et passes' } });

  // Produits Restaurant (commandables en ligne)
  await prisma.product.upsert({
    where: { id: 'prod-res-1' }, update: {},
    create: { id: 'prod-res-1', businessId: B.RESTO, sellerId: U.OWNER_RESTO, categoryId: 'cat-res-1', name: 'Attiéké Poisson Braisé', slug: 'attieke-poisson-braise', description: 'Attiéké fin, poisson braisé, sauce graine', shortDescription: 'Notre plat signature', price: 3500, currency: 'FCFA', images: ['/images/products/attieke.svg'], tags: ['attieke', 'poisson'], stock: 100, lowStockThreshold: 10, unit: 'plat', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: true, rating: 4.8, reviewCount: 45, orderCount: 230 },
  });
  await prisma.product.upsert({
    where: { id: 'prod-res-2' }, update: {},
    create: { id: 'prod-res-2', businessId: B.RESTO, sellerId: U.OWNER_RESTO, categoryId: 'cat-res-1', name: 'Mafé Poulet', slug: 'mafe-poulet', description: 'Poulet mijoté sauce cacahuète, riz blanc', price: 4500, currency: 'FCFA', images: ['/images/products/mafe.svg'], tags: ['mafe', 'poulet'], stock: 80, lowStockThreshold: 10, unit: 'plat', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: true, rating: 4.6, reviewCount: 32, orderCount: 180, isPromotional: true, promotionalPrice: 3800, discountPercent: 15, promotionEndsAt: new Date('2026-12-31') },
  });
  await prisma.product.upsert({
    where: { id: 'prod-res-3' }, update: {},
    create: { id: 'prod-res-3', businessId: B.RESTO, sellerId: U.OWNER_RESTO, categoryId: 'cat-res-2', name: 'Jus de Bissap', slug: 'jus-de-bissap', description: 'Jus naturel d hibiscus', price: 1500, currency: 'FCFA', images: ['/images/products/bissap.svg'], tags: ['bissap'], stock: 200, lowStockThreshold: 20, unit: 'verre', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: false, rating: 4.3, reviewCount: 18, orderCount: 95 },
  });

  // Menu du restaurant (mêmes plats en page menu)
  await prisma.menuCategory.upsert({ where: { id: 'mc-res-1' }, update: {}, create: { id: 'mc-res-1', businessId: B.RESTO, name: 'Plats principaux', description: 'Nos plats signatures' } });
  await prisma.menuItem.upsert({
    where: { id: 'mi-res-1' }, update: {},
    create: { id: 'mi-res-1', businessId: B.RESTO, categoryId: 'mc-res-1', name: 'Attiéké Poisson Braisé', description: 'Attiéké fin, poisson braisé, sauce graine', price: 3500, currency: 'FCFA', images: ['/images/products/attieke.svg'], isPopular: true, featured: true, rating: 4.8, reviewCount: 45, orderCount: 230 },
  });
  await prisma.menuItem.upsert({
    where: { id: 'mi-res-2' }, update: {},
    create: { id: 'mi-res-2', businessId: B.RESTO, categoryId: 'mc-res-1', name: 'Mafé Poulet', description: 'Poulet mijoté sauce cacahuète', price: 4500, currency: 'FCFA', images: ['/images/products/mafe.svg'], isPopular: true, rating: 4.6, reviewCount: 32, orderCount: 180 },
  });
  await prisma.menuItem.upsert({
    where: { id: 'mi-res-3' }, update: {},
    create: { id: 'mi-res-3', businessId: B.RESTO, categoryId: 'mc-res-1', name: 'Garba', description: 'Attiéké au thon, spécialité ivoirienne', price: 2000, currency: 'FCFA', images: [], rating: 4.4, reviewCount: 20, orderCount: 88 },
  });

  // ── SALON : services + portfolio ──
  await prisma.serviceCategory.upsert({ where: { id: 'sc-sal-1' }, update: {}, create: { id: 'sc-sal-1', businessId: B.SALON, name: 'Coiffure', slug: 'coiffure' } });
  await prisma.serviceCategory.upsert({ where: { id: 'sc-sal-2' }, update: {}, create: { id: 'sc-sal-2', businessId: B.SALON, name: 'Soins', slug: 'soins' } });
  await prisma.service.upsert({
    where: { id: 'sv-sal-1' }, update: {},
    create: { id: 'sv-sal-1', businessId: B.SALON, categoryId: 'sc-sal-1', name: 'Coupe + Brushing', description: 'Coupe adaptée à votre morphologie + brushing', price: 5000, priceType: 'FIXED', currency: 'FCFA', duration: 60, isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, featured: true, rating: 4.9, reviewCount: 40, bookingCount: 120 },
  });
  await prisma.service.upsert({
    where: { id: 'sv-sal-2' }, update: {},
    create: { id: 'sv-sal-2', businessId: B.SALON, categoryId: 'sc-sal-2', name: 'Manucure complète', description: 'Manucure + pose vernis semi-permanent', price: 8000, priceType: 'FIXED', currency: 'FCFA', duration: 90, isActive: true, featured: true, rating: 4.8, reviewCount: 35, bookingCount: 95 },
  });
  await prisma.service.upsert({
    where: { id: 'sv-sal-3' }, update: {},
    create: { id: 'sv-sal-3', businessId: B.SALON, categoryId: 'sc-sal-2', name: 'Soin visage éclat', description: 'Nettoyage profond + masque hydratant', price: 12000, priceType: 'FIXED', currency: 'FCFA', duration: 75, isActive: true, rating: 4.7, reviewCount: 22, bookingCount: 60 },
  });
  await prisma.portfolioCategory.upsert({ where: { id: 'pfc-sal-1' }, update: {}, create: { id: 'pfc-sal-1', businessId: B.SALON, name: 'Mariage', slug: 'mariage' } });
  await prisma.portfolioItem.upsert({
    where: { id: 'pf-sal-1' }, update: {},
    create: { id: 'pf-sal-1', businessId: B.SALON, title: 'Mariage de Awa', description: 'Coiffure + maquillage pour 12 personnes', categoryId: 'pfc-sal-1' },
  });

  // ── HÔTEL : chambres + services ──
  await prisma.room.upsert({
    where: { id: 'rm-hot-1' }, update: {},
    create: { id: 'rm-hot-1', businessId: B.HOTEL, name: 'Chambre Standard', roomNumber: '101', type: 'STANDARD', description: 'Chambre climatisée avec salle de bain privée', price: 25000, currency: 'FCFA', capacity: 2, adults: 2, beds: 1, amenities: ['Climatisation', 'Wi-Fi', 'TV'], breakfastIncluded: true, featured: true, isActive: true, isAvailable: true },
  });
  await prisma.room.upsert({
    where: { id: 'rm-hot-2' }, update: {},
    create: { id: 'rm-hot-2', businessId: B.HOTEL, name: 'Chambre Deluxe', roomNumber: '201', type: 'DELUXE', description: 'Suite spacieuse avec vue sur la lagune', price: 45000, currency: 'FCFA', capacity: 2, adults: 2, beds: 1, amenities: ['Climatisation', 'Wi-Fi', 'TV', 'Minibar'], breakfastIncluded: true, featured: true, isActive: true, isAvailable: true },
  });
  await prisma.service.upsert({
    where: { id: 'sv-hot-1' }, update: {},
    create: { id: 'sv-hot-1', businessId: B.HOTEL, name: 'Petit-déjeuner buffet', description: 'Buffet continental inclus ou en supplément', price: 3000, priceType: 'FIXED', currency: 'FCFA', isActive: true, isVisibleOnPublicPage: true },
  });

  // ── BOUTIQUE : produits tech ──
  await prisma.product.upsert({
    where: { id: 'prod-bout-1' }, update: {},
    create: { id: 'prod-bout-1', businessId: B.BOUTIQUE, sellerId: U.OWNER_BOUTIQUE, categoryId: 'cat-bout-1', name: 'Smartphone TechX Pro', slug: 'smartphone-techx-pro', description: 'Écran 6.7 pouces, 256 Go, double SIM', shortDescription: 'Flagship abordable', brand: 'TechX', price: 150000, comparePrice: 175000, currency: 'FCFA', images: [], tags: ['smartphone'], stock: 25, lowStockThreshold: 5, unit: 'unité', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: true, featured: true, rating: 4.5, reviewCount: 28, orderCount: 64 },
  });
  await prisma.product.upsert({
    where: { id: 'prod-bout-2' }, update: {},
    create: { id: 'prod-bout-2', businessId: B.BOUTIQUE, sellerId: U.OWNER_BOUTIQUE, categoryId: 'cat-bout-1', name: 'Smartphone Go Mini', slug: 'smartphone-go-mini', description: 'Compact et endurant, idéal premier smartphone', price: 65000, currency: 'FCFA', images: [], tags: ['smartphone'], stock: 40, lowStockThreshold: 8, unit: 'unité', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: true, featured: false, rating: 4.3, reviewCount: 19, orderCount: 47 },
  });
  await prisma.product.upsert({
    where: { id: 'prod-bout-3' }, update: {},
    create: { id: 'prod-bout-3', businessId: B.BOUTIQUE, sellerId: U.OWNER_BOUTIQUE, categoryId: 'cat-bout-2', name: 'Casque Bluetooth Pro', slug: 'casque-bluetooth-pro', description: 'Réduction de bruit active, 30h autonomie', price: 25000, currency: 'FCFA', images: [], tags: ['audio'], stock: 60, lowStockThreshold: 10, unit: 'unité', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: true, featured: true, rating: 4.6, reviewCount: 24, orderCount: 52 },
  });
  await prisma.product.upsert({
    where: { id: 'prod-bout-4' }, update: {},
    create: { id: 'prod-bout-4', businessId: B.BOUTIQUE, sellerId: U.OWNER_BOUTIQUE, categoryId: 'cat-bout-2', name: 'Coque + Verre trempé', slug: 'coque-verre-trempe', description: 'Pack protection complet', price: 5000, currency: 'FCFA', images: [], tags: ['accessoire'], stock: 150, lowStockThreshold: 30, unit: 'pack', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: true, featured: false, rating: 4.2, reviewCount: 12, orderCount: 88 },
  });

  // ── BTP : portfolio ──
  await prisma.portfolioCategory.upsert({ where: { id: 'pfc-btp-1' }, update: {}, create: { id: 'pfc-btp-1', businessId: B.BTP, name: 'Construction', slug: 'construction' } });
  await prisma.portfolioCategory.upsert({ where: { id: 'pfc-btp-2' }, update: {}, create: { id: 'pfc-btp-2', businessId: B.BTP, name: 'Rénovation', slug: 'renovation' } });
  await prisma.portfolioItem.upsert({
    where: { id: 'pf-btp-1' }, update: {},
    create: { id: 'pf-btp-1', businessId: B.BTP, title: 'Villa R+1 Cocody', description: 'Construction neuve 4 pièces livrée clé en main', categoryId: 'pfc-btp-1' },
  });
  await prisma.portfolioItem.upsert({
    where: { id: 'pf-btp-2' }, update: {},
    create: { id: 'pf-btp-2', businessId: B.BTP, title: 'Rénovation immeuble Yopougon', description: 'Rénovation complète 12 bureaux', categoryId: 'pfc-btp-2' },
  });

  // ── FORMATION (BuildPro BTP) — épargnable : la conversion crée une inscription réelle
  await prisma.training.upsert({
    where: { id: 'tr-btp-1' },
    update: { price: 25000 },
    create: { id: 'tr-btp-1', businessId: B.BTP, title: 'Formation Rénovation Express', description: 'Techniques de rénovation en 5 leçons : enduits, peinture, carrelage, finitions.', category: 'BTP', duration: '2 semaines', lessons: 5, price: 25000 },
  });

  // ── ÉVÉNEMENTS : produits (billets) + locations + événement ──
  await prisma.product.upsert({
    where: { id: 'prod-evt-1' }, update: {},
    create: { id: 'prod-evt-1', businessId: B.EVENTS, sellerId: U.OWNER_EVENTS, categoryId: 'cat-evt-1', name: 'Pass Concert Afrique', slug: 'pass-concert-afrique', description: 'Billet standard pour le concert de l été', price: 10000, currency: 'FCFA', images: [], tags: ['concert', 'billet'], stock: 500, lowStockThreshold: 50, unit: 'billet', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: true, rating: 4.4, reviewCount: 15, orderCount: 42 },
  });
  await prisma.rental.upsert({
    where: { id: 'rn-evt-1' }, update: {},
    create: { id: 'rn-evt-1', businessId: B.EVENTS, name: 'Tente 100 places', description: 'Tente de réception 100 personnes avec montage', price: 150000, currency: 'FCFA', images: [], isActive: true },
  });
  await prisma.event.upsert({
    where: { id: 'ev-evt-1' }, update: {},
    create: { id: 'ev-evt-1', businessId: B.EVENTS, title: 'Concert Afrique Festival', shortDescription: 'Grande scène ouverte aux artistes locaux', description: 'Grande scène ouverte aux artistes locaux. Billetterie en ligne.', startDate: new Date('2026-08-15T18:00:00Z'), endDate: new Date('2026-08-15T23:00:00Z'), status: 'PUBLISHED' },
  });
  // Billet réel pour l'événement — indispensable pour l'épargne EVENT :
  // le plan cible le billet le moins cher et la conversion crée un vrai
  // participant avec QR + décrément du stock (jamais une commande générique).
  await prisma.eventTicket.upsert({
    where: { id: 'tk-evt-1' },
    update: { price: 10000, quantity: 500, remaining: 500, isActive: true, saleStatus: 'ACTIVE' },
    create: { id: 'tk-evt-1', eventId: 'ev-evt-1', name: 'Pass Standard', type: 'STANDARD', price: 10000, currency: 'FCFA', quantity: 500, remaining: 500, benefits: ['Accès concert', 'Entrée 1 personne'], saleStatus: 'ACTIVE', isActive: true, sortOrder: 1 },
  });
  // Zéro fiction : ticketsSold reflète les VRAIS participants (aucun au seed),
  // la conversion épargne EVENT le fera grimper avec un vrai billet + QR.
  await prisma.event.update({
    where: { id: 'ev-evt-1' },
    data: { remainingSpots: 500, ticketsSold: 0, totalRevenue: 0 },
  });

  console.log('✓ Catalogues (produits, services, menu, chambres, locations, portfolio)');
}

// ============================================================
// 3b. MENU OPS (ingrédients, tables, commandes en salle) + TÉMOIGNAGES PORTFOLIO
// Alimente les pages Ingrédients / Tables / Commandes (menu) / Témoignages (portfolio)
// ============================================================
async function seedMenuOps() {
  // ── Ingrédients (resto) — module MENU ──
  const ingredients: any[] = [
    { id: 'ing-res-1', businessId: B.RESTO, name: 'Attiéké', unit: 'kg', stock: 25, minStock: 5 },
    { id: 'ing-res-2', businessId: B.RESTO, name: 'Poisson frais', unit: 'kg', stock: 12, minStock: 3 },
    { id: 'ing-res-3', businessId: B.RESTO, name: 'Poulet', unit: 'kg', stock: 30, minStock: 8 },
    { id: 'ing-res-4', businessId: B.RESTO, name: 'Cacahuètes', unit: 'kg', stock: 4, minStock: 5 },
    { id: 'ing-res-5', businessId: B.RESTO, name: 'Hibiscus (bissap)', unit: 'kg', stock: 9, minStock: 2 },
  ];
  for (const i of ingredients) {
    await prisma.ingredient.upsert({ where: { id: i.id }, update: {}, create: i });
  }

  // ── Tables (resto) — module MENU ──
  const tables: any[] = [
    { id: 'tbl-res-1', businessId: B.RESTO, number: 1, capacity: 2, location: 'Salle principale', isAvailable: true, isActive: true },
    { id: 'tbl-res-2', businessId: B.RESTO, number: 2, capacity: 4, location: 'Salle principale', isAvailable: true, isActive: true },
    { id: 'tbl-res-3', businessId: B.RESTO, number: 3, capacity: 4, location: 'Terrasse', isAvailable: false, isActive: true },
    { id: 'tbl-res-4', businessId: B.RESTO, number: 4, capacity: 6, location: 'Salle privée', isAvailable: true, isActive: true },
    { id: 'tbl-res-5', businessId: B.RESTO, number: 5, capacity: 2, location: 'Terrasse', isAvailable: true, isActive: true },
  ];
  for (const t of tables) {
    await prisma.restaurantTable.upsert({ where: { id: t.id }, update: {}, create: t });
  }

  // ── Commandes menu (resto) — vraies commandes en salle liées aux tables ──
  const menuOrders: any[] = [
    { id: 'mo-res-1', businessId: B.RESTO, tableId: 'tbl-res-2', status: 'COMPLETED', items: [{ name: 'Attiéké Poisson Braisé', qty: 2, price: 3500 }, { name: 'Jus de Bissap', qty: 2, price: 1500 }], total: 10000, notes: 'Table 2 — service rapide' },
    { id: 'mo-res-2', businessId: B.RESTO, tableId: 'tbl-res-3', status: 'PREPARING', items: [{ name: 'Mafé Poulet', qty: 1, price: 4500 }], total: 4500, notes: 'Terrasse' },
    { id: 'mo-res-3', businessId: B.RESTO, tableId: 'tbl-res-1', status: 'PENDING', items: [{ name: 'Garba', qty: 1, price: 2000 }, { name: 'Jus de Bissap', qty: 1, price: 1500 }], total: 3500, notes: null },
  ];
  for (const mo of menuOrders) {
    await prisma.menuOrder.upsert({ where: { id: mo.id }, update: {}, create: mo });
  }

  // ── Témoignages portfolio (BTP) — de vrais clients ──
  const pTestimonials: any[] = [
    { id: 'pt-btp-1', businessId: B.BTP, portfolioItemId: 'pf-btp-1', clientName: 'Jean Kouadio', clientCompany: 'Particulier', text: 'Maison livrée dans les délais, finitions impeccables. Je recommande BuildPro.', rating: 5, projectDate: new Date('2026-03-15'), isPinned: true, sortOrder: 1 },
    { id: 'pt-btp-2', businessId: B.BTP, portfolioItemId: 'pf-btp-2', clientName: 'Awa Coulibaly', clientCompany: 'Kouassi Immobilier', text: 'Rénovation de nos bureaux : chantier propre, équipe sérieuse.', rating: 5, projectDate: new Date('2026-05-20'), sortOrder: 2 },
    { id: 'pt-btp-3', businessId: B.BTP, portfolioItemId: 'pf-btp-1', clientName: 'Kofi Mensah', clientCompany: 'Accra Invest', text: 'Bonne communication du début à la fin. Coût respecté.', rating: 4, projectDate: new Date('2026-04-02'), sortOrder: 3 },
  ];
  for (const pt of pTestimonials) {
    await prisma.portfolioTestimonial.upsert({ where: { id: pt.id }, update: {}, create: pt });
  }

  // ── Médias portfolio (BTP + salon) — la galerie alimentée ──
  const pMedia: any[] = [
    { id: 'pm-btp-1', portfolioItemId: 'pf-btp-1', businessId: B.BTP, type: 'IMAGE', url: '/images/portfolio/villa-r1.svg', title: 'Villa R+1 — extérieur', description: 'Façade principale livrée clé en main', sortOrder: 1 },
    { id: 'pm-btp-2', portfolioItemId: 'pf-btp-1', businessId: B.BTP, type: 'IMAGE', url: '/images/portfolio/villa-r1-salon.svg', title: 'Villa R+1 — salon', description: 'Séjour avec finitions premium', sortOrder: 2 },
    { id: 'pm-btp-3', portfolioItemId: 'pf-btp-2', businessId: B.BTP, type: 'IMAGE', url: '/images/portfolio/immeuble-yopougon.svg', title: 'Rénovation — bureaux', description: '12 bureaux rénovés en 6 semaines', sortOrder: 1 },
    { id: 'pm-sal-1', portfolioItemId: 'pf-sal-1', businessId: B.SALON, type: 'IMAGE', url: '/images/portfolio/mariage-awa.svg', title: 'Mariage de Awa', description: 'Coiffure & maquillage — 12 personnes', sortOrder: 1 },
  ];
  for (const pm of pMedia) {
    await prisma.portfolioMedia.upsert({ where: { id: pm.id }, update: {}, create: pm });
  }

  console.log('✓ Menu ops (5 ingrédients, 5 tables, 3 commandes) + 3 témoignages + 4 médias portfolio');
}

// ============================================================
// 4. COMMANDES (vrai client → vrai business → vrais produits)
// ============================================================
async function seedOrders() {
  const orders: any[] = [
    {
      id: 'ord-1', businessId: B.RESTO, buyerId: U.CLIENT_1, orderNumber: 'CMD-2026-001', type: 'DELIVERY', source: 'WEB_SITE', status: 'DELIVERED',
      totalAmount: 9500, subtotal: 8000, deliveryFee: 1000, discountAmount: 500, currency: 'FCFA',
      deliveryAddress: 'Angré 7e tranche, Abidjan', contactPhone: '+2250100000002', contactName: 'Awa Coulibaly',
      paidAt: new Date('2026-06-15'), deliveredAt: new Date('2026-06-15'), paymentMethod: 'Orange Money', paymentStatus: 'PAID',
      items: [{ id: 'oi-1', productId: 'prod-res-1', name: 'Attiéké Poisson Braisé', quantity: 2, unitPrice: 3500, total: 7000 }, { id: 'oi-2', productId: 'prod-res-3', name: 'Jus de Bissap', quantity: 2, unitPrice: 1500, total: 3000 }],
    },
    {
      id: 'ord-2', businessId: B.RESTO, buyerId: U.CLIENT_2, orderNumber: 'CMD-2026-002', type: 'DELIVERY', source: 'WEB_SITE', status: 'PREPARING',
      totalAmount: 6000, subtotal: 6000, deliveryFee: 0, discountAmount: 0, currency: 'FCFA',
      deliveryAddress: 'Plateau, Abidjan', contactPhone: '+233202020202', contactName: 'Kofi Mensah',
      paidAt: new Date('2026-07-02'), paymentMethod: 'Wave', paymentStatus: 'PAID', createdAt: new Date('2026-07-02'),
      items: [{ id: 'oi-3', productId: 'prod-res-2', name: 'Mafé Poulet', quantity: 1, unitPrice: 4500, total: 4500 }, { id: 'oi-4', productId: 'prod-res-3', name: 'Jus de Bissap', quantity: 1, unitPrice: 1500, total: 1500 }],
    },
    {
      id: 'ord-3', businessId: B.RESTO, buyerId: U.CLIENT_5, orderNumber: 'CMD-2026-003', type: 'DELIVERY', source: 'WEB_SITE', status: 'DELIVERED',
      totalAmount: 3500, subtotal: 3500, deliveryFee: 0, discountAmount: 0, currency: 'FCFA',
      deliveryAddress: 'Bamako, Faladié', contactPhone: '+22370000001', contactName: 'Aminata Koné',
      paidAt: null, paymentMethod: null, paymentStatus: 'UNPAID', createdAt: new Date('2026-07-05'),
      items: [{ id: 'oi-5', productId: 'prod-res-1', name: 'Attiéké Poisson Braisé', quantity: 1, unitPrice: 3500, total: 3500 }],
    },
    {
      id: 'ord-4', businessId: B.BOUTIQUE, buyerId: U.CLIENT_2, orderNumber: 'CMD-2026-004', type: 'DELIVERY', source: 'WEB_SITE', status: 'DELIVERED',
      totalAmount: 160000, subtotal: 155000, deliveryFee: 5000, discountAmount: 0, currency: 'FCFA',
      deliveryAddress: 'Osu, Accra', contactPhone: '+233202020202', contactName: 'Kofi Mensah',
      paidAt: new Date('2026-06-20'), deliveredAt: new Date('2026-06-22'), paymentMethod: 'Orange Money', paymentStatus: 'PAID',
      items: [{ id: 'oi-6', productId: 'prod-bout-1', name: 'Smartphone TechX Pro', quantity: 1, unitPrice: 150000, total: 150000 }, { id: 'oi-7', productId: 'prod-bout-4', name: 'Coque + Verre trempé', quantity: 1, unitPrice: 5000, total: 5000 }],
    },
    {
      id: 'ord-5', businessId: B.BOUTIQUE, buyerId: U.CLIENT_3, orderNumber: 'CMD-2026-005', type: 'DELIVERY', source: 'WEB_SITE', status: 'DELIVERED',
      totalAmount: 50000, subtotal: 50000, deliveryFee: 0, discountAmount: 0, currency: 'FCFA',
      deliveryAddress: 'Dakar, Almadies', contactPhone: '+221770001122', contactName: 'Fatou Ndiaye',
      paidAt: new Date('2026-06-28'), deliveredAt: new Date('2026-06-29'), paymentMethod: 'Orange Money', paymentStatus: 'PAID',
      items: [{ id: 'oi-8', productId: 'prod-bout-3', name: 'Casque Bluetooth Pro', quantity: 2, unitPrice: 25000, total: 50000 }],
    },
    {
      id: 'ord-6', businessId: B.EVENTS, buyerId: U.CLIENT_3, orderNumber: 'CMD-2026-006', type: 'PICKUP', source: 'WEB_SITE', status: 'CONFIRMED',
      totalAmount: 20000, subtotal: 20000, deliveryFee: 0, discountAmount: 0, currency: 'FCFA',
      contactPhone: '+221770001122', contactName: 'Fatou Ndiaye',
      paidAt: new Date('2026-07-08'), paymentMethod: 'Wave', paymentStatus: 'PAID', createdAt: new Date('2026-07-08'),
      items: [{ id: 'oi-9', productId: 'prod-evt-1', name: 'Pass Concert Afrique', quantity: 2, unitPrice: 10000, total: 20000 }],
    },
  ];

  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id }, update: {},
      create: {
        id: o.id, businessId: o.businessId, buyerId: o.buyerId, orderNumber: o.orderNumber,
        type: o.type as any, source: o.source as any, status: o.status as any,
        totalAmount: o.totalAmount, subtotal: o.subtotal, deliveryFee: o.deliveryFee, discountAmount: o.discountAmount, currency: o.currency,
        deliveryAddress: o.deliveryAddress, contactPhone: o.contactPhone, contactName: o.contactName,
        paidAt: o.paidAt, deliveredAt: o.deliveredAt, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
        createdAt: o.createdAt || new Date('2026-07-01'),
      },
    });
    for (const it of o.items) {
      await prisma.orderItem.upsert({ where: { id: it.id }, update: {}, create: { orderId: o.id, ...it } });
    }
  }
  console.log(`✓ ${orders.length} commandes reliées (clients → business → produits)`);
}

// ============================================================
// 5. RÉSERVATIONS
// ============================================================
async function seedBookings() {
  const bookings: any[] = [
    { id: 'bk-1', bookingNumber: 'RSV-2026-001', businessId: B.SALON, clientId: U.CLIENT_1, title: 'Manucure complète', serviceId: 'sv-sal-2', startDate: new Date('2026-07-20T10:00:00Z'), price: 8000, status: 'CONFIRMED', customerName: 'Awa Coulibaly', customerPhone: '+2250100000002', guests: 1 },
    { id: 'bk-2', bookingNumber: 'RSV-2026-002', businessId: B.SALON, clientId: U.CLIENT_3, title: 'Coupe + Brushing', serviceId: 'sv-sal-1', startDate: new Date('2026-07-25T15:00:00Z'), price: 5000, status: 'PENDING', customerName: 'Fatou Ndiaye', customerPhone: '+221770001122', guests: 1 },
    { id: 'bk-3', bookingNumber: 'RSV-2026-003', businessId: B.HOTEL, clientId: U.CLIENT_3, title: 'Séjour Chambre Deluxe', roomId: 'rm-hot-2', checkIn: new Date('2026-08-01T14:00:00Z'), checkOut: new Date('2026-08-03T12:00:00Z'), startDate: new Date('2026-08-01T14:00:00Z'), endDate: new Date('2026-08-03T12:00:00Z'), price: 90000, status: 'CONFIRMED', guests: 2, customerName: 'Fatou Ndiaye', customerPhone: '+221770001122' },
    { id: 'bk-4', bookingNumber: 'RSV-2026-004', businessId: B.HOTEL, clientId: U.CLIENT_1, title: 'Nuit Chambre Standard', roomId: 'rm-hot-1', checkIn: new Date('2026-07-10T14:00:00Z'), checkOut: new Date('2026-07-11T12:00:00Z'), startDate: new Date('2026-07-10T14:00:00Z'), endDate: new Date('2026-07-11T12:00:00Z'), price: 25000, status: 'CANCELLED', guests: 1, cancelledAt: new Date('2026-07-08'), cancelReason: 'Changement de plan' },
    { id: 'bk-5', bookingNumber: 'RSV-2026-005', businessId: B.EVENTS, clientId: U.CLIENT_3, title: 'Location tente 100 places', rentalId: 'rn-evt-1', startDate: new Date('2026-08-20T08:00:00Z'), endDate: new Date('2026-08-21T20:00:00Z'), price: 150000, status: 'CONFIRMED', guests: 100, customerName: 'Fatou Ndiaye', customerPhone: '+221770001122' },
  ];
  for (const b of bookings) {
    await prisma.booking.upsert({
      where: { id: b.id }, update: {},
      create: {
        id: b.id, bookingNumber: b.bookingNumber, businessId: b.businessId, clientId: b.clientId,
        title: b.title, serviceId: b.serviceId, roomId: b.roomId, rentalId: b.rentalId,
        startDate: b.startDate, endDate: b.endDate, checkIn: b.checkIn, checkOut: b.checkOut,
        price: b.price, status: b.status as any, guests: b.guests,
        customerName: b.customerName, customerPhone: b.customerPhone,
        cancelledAt: b.cancelledAt, cancelReason: b.cancelReason,
      },
    });
  }
  console.log(`✓ ${bookings.length} réservations reliées`);
}

// ============================================================
// 6. AVIS (écrits par de vrais clients)
// ============================================================
async function seedReviews() {
  const reviews: any[] = [
    { id: 'rv-1', userId: U.CLIENT_1, productId: 'prod-res-1', rating: 5, title: 'Excellente cuisine', comment: 'L attiéké poisson braisé est un régal, livraison rapide.', isActive: true },
    { id: 'rv-2', userId: U.CLIENT_2, productId: 'prod-res-2', rating: 4, title: 'Très bon mafé', comment: 'Sauce généreuse, un peu long à préparer mais délicieux.', isActive: true },
    { id: 'rv-3', userId: U.CLIENT_1, serviceId: 'sv-sal-2', rating: 5, title: 'Manucure impeccable', comment: 'Résultat superbe et équipe très professionnelle.', isActive: true },
    { id: 'rv-4', userId: U.CLIENT_3, serviceId: 'sv-sal-1', rating: 4, title: 'Bonne coupe', comment: 'Très satisfaite du résultat, salon propre.', isActive: true },
    { id: 'rv-5', userId: U.CLIENT_3, productId: 'prod-bout-1', rating: 4, title: 'Bon téléphone', comment: 'Rapport qualité prix excellent, livraison bien emballée.', isActive: true },
    { id: 'rv-6', userId: U.CLIENT_2, productId: 'prod-bout-3', rating: 5, title: 'Casque top', comment: 'Réduction de bruit efficace, batterie longue durée.', isActive: true },
    { id: 'rv-7', userId: U.CLIENT_5, productId: 'prod-res-3', rating: 5, title: 'Bissap frais', comment: 'Jus naturel comme à la maison.', isActive: true },
  ];
  for (const r of reviews) {
    await prisma.review.upsert({ where: { id: r.id }, update: {}, create: { id: r.id, ...r } });
  }
  console.log(`✓ ${reviews.length} avis de vrais clients`);
}

// ============================================================
// 3b. AVIS BUSINESS (réputation publique du commerce — BusinessReview)
// Chaque avis appartient à un vrai client ; les notes moyenne + compteur du
// business sont RECALCULÉS depuis ces lignes (zéro statique fictionnel).
// ============================================================
async function seedBusinessReviews() {
  const reviews: any[] = [
    // ── Saveur d'Abidjan (resto) : 8 avis ──
    { id: 'br-res-1', businessId: B.RESTO, userId: U.CLIENT_2, rating: 5, title: 'Attiéké au top', comment: "Le plat signature ne déçoit jamais. Service rapide.", createdAt: new Date('2026-07-12T12:30:00Z'), response: 'Merci beaucoup ! À très vite 🍽️', responseAt: new Date('2026-07-13T09:00:00Z') },
    { id: 'br-res-2', businessId: B.RESTO, userId: U.CLIENT_3, rating: 4, title: 'Bon resto', comment: 'Mafé délicieux, ambiance sympa.', createdAt: new Date('2026-07-18T13:00:00Z') },
    { id: 'br-res-3', businessId: B.RESTO, userId: U.CLIENT_4, rating: 5, title: 'Excellente cuisine', comment: 'Bissap maison incroyable.', createdAt: new Date('2026-07-25T19:15:00Z') },
    { id: 'br-res-4', businessId: B.RESTO, userId: U.CLIENT_1, rating: 4, title: 'Très bon', comment: 'Livraison un peu longue mais la qualité compense.', createdAt: new Date('2026-08-01T20:00:00Z') },
    { id: 'br-res-5', businessId: B.RESTO, userId: U.CLIENT_5, rating: 5, title: 'Favori du quartier', comment: 'Toujours frais, personnel accueillant.', createdAt: new Date('2026-08-04T12:45:00Z') },
    { id: 'br-res-6', businessId: B.RESTO, userId: U.OWNER_BOUTIQUE, rating: 3, title: 'Correct', comment: 'Bon mais portions un peu petites.', createdAt: new Date('2026-08-06T18:30:00Z') },
    { id: 'br-res-7', businessId: B.RESTO, userId: U.DEV_1, rating: 5, title: 'Je recommande', comment: 'Parfait pour les repas de famille.', createdAt: new Date('2026-07-08T14:00:00Z') },
    { id: 'br-res-8', businessId: B.RESTO, userId: U.OWNER_HOTEL, rating: 4, title: 'Bonne adresse', comment: 'Le poulet braisé est succulent.', createdAt: new Date('2026-07-30T13:30:00Z') },
    // ── Kenza Beauté (salon) : 5 avis ──
    { id: 'br-sal-1', businessId: B.SALON, userId: U.CLIENT_1, rating: 5, title: 'Manucure parfaite', comment: 'Équipe professionnelle et salon propre.', createdAt: new Date('2026-07-15T16:00:00Z'), response: 'Merci Awa, au plaisir de vous revoir ✨', responseAt: new Date('2026-07-16T10:00:00Z') },
    { id: 'br-sal-2', businessId: B.SALON, userId: U.CLIENT_3, rating: 4, title: 'Bon résultat', comment: "Coupe + brushing impeccables.", createdAt: new Date('2026-07-22T17:30:00Z') },
    { id: 'br-sal-3', businessId: B.SALON, userId: U.CLIENT_2, rating: 5, title: 'Ambiance chaleureuse', comment: 'Je viens toutes les semaines !', createdAt: new Date('2026-08-02T15:00:00Z') },
    { id: 'br-sal-4', businessId: B.SALON, userId: U.CLIENT_4, rating: 4, title: 'Très satisfaite', comment: "Pose d'ongles soignée.", createdAt: new Date('2026-07-28T18:00:00Z') },
    { id: 'br-sal-5', businessId: B.SALON, userId: U.CLIENT_5, rating: 3, title: 'Bien', comment: 'Résultat correct, attente un peu longue.', createdAt: new Date('2026-08-05T14:30:00Z') },
    // ── Hôtel Palmier (hôtel) : 6 avis ──
    { id: 'br-hot-1', businessId: B.HOTEL, userId: U.CLIENT_3, rating: 5, title: 'Séjour excellent', comment: 'Chambre spacieuse et personnel adorable.', createdAt: new Date('2026-07-10T11:00:00Z'), response: 'Merci pour votre séjour, à bientôt !', responseAt: new Date('2026-07-11T09:00:00Z') },
    { id: 'br-hot-2', businessId: B.HOTEL, userId: U.CLIENT_2, rating: 4, title: 'Bon séjour', comment: 'Petit déjeuner copieux.', createdAt: new Date('2026-07-20T10:30:00Z') },
    { id: 'br-hot-3', businessId: B.HOTEL, userId: U.CLIENT_1, rating: 5, title: 'Top', comment: 'Vue magnifique sur la lagune.', createdAt: new Date('2026-07-27T09:15:00Z') },
    { id: 'br-hot-4', businessId: B.HOTEL, userId: U.CLIENT_4, rating: 4, title: 'Bien placé', comment: 'Proche de tout, très calme.', createdAt: new Date('2026-08-03T12:00:00Z') },
    { id: 'br-hot-5', businessId: B.HOTEL, userId: U.CLIENT_5, rating: 3, title: 'Correct', comment: 'Chambre propre mais wifi capricieux.', createdAt: new Date('2026-08-06T08:45:00Z') },
    { id: 'br-hot-6', businessId: B.HOTEL, userId: U.DEV_2, rating: 5, title: 'Je reviendrai', comment: 'Excellent rapport qualité-prix.', createdAt: new Date('2026-07-05T14:20:00Z') },
    // ── Boutique Yeko (boutique) : 5 avis ──
    { id: 'br-bout-1', businessId: B.BOUTIQUE, userId: U.CLIENT_2, rating: 5, title: 'Super boutique', comment: "Téléphone reçu en 2 jours, neuf.", createdAt: new Date('2026-07-14T17:00:00Z') },
    { id: 'br-bout-2', businessId: B.BOUTIQUE, userId: U.CLIENT_3, rating: 4, title: 'Bon casque', comment: 'Qualité au rendez-vous.', createdAt: new Date('2026-07-24T16:30:00Z') },
    { id: 'br-bout-3', businessId: B.BOUTIQUE, userId: U.CLIENT_1, rating: 5, title: 'Rapide et fiable', comment: 'Colis bien emballé.', createdAt: new Date('2026-08-01T11:45:00Z') },
    { id: 'br-bout-4', businessId: B.BOUTIQUE, userId: U.CLIENT_5, rating: 4, title: 'Satisfait', comment: 'Bon rapport qualité-prix.', createdAt: new Date('2026-08-05T15:20:00Z') },
    { id: 'br-bout-5', businessId: B.BOUTIQUE, userId: U.CLIENT_4, rating: 3, title: 'Correct', comment: 'Produit conforme, livraison un peu lente.', createdAt: new Date('2026-07-19T10:00:00Z') },
    // ── BTP Excellence (BTP) : 2 avis ──
    { id: 'br-btp-1', businessId: B.BTP, userId: U.CLIENT_3, rating: 5, title: 'Entreprise sérieuse', comment: 'Chantier livré dans les délais.', createdAt: new Date('2026-07-16T09:00:00Z') },
    { id: 'br-btp-2', businessId: B.BTP, userId: U.CLIENT_2, rating: 4, title: 'Bon travail', comment: 'Équipe compétente et ponctuelle.', createdAt: new Date('2026-07-29T14:00:00Z') },
    // ── Événements Plus (events) : 4 avis ──
    { id: 'br-evt-1', businessId: B.EVENTS, userId: U.CLIENT_3, rating: 5, title: 'Soirée mémorable', comment: 'Organisation au top, matériel de qualité.', createdAt: new Date('2026-07-13T23:00:00Z') },
    { id: 'br-evt-2', businessId: B.EVENTS, userId: U.CLIENT_1, rating: 4, title: 'Très bonne organisation', comment: 'Son et lumière impeccables.', createdAt: new Date('2026-07-26T22:30:00Z') },
    { id: 'br-evt-3', businessId: B.EVENTS, userId: U.CLIENT_4, rating: 5, title: 'Super événement', comment: 'Je recommande vivement.', createdAt: new Date('2026-08-02T21:00:00Z') },
    { id: 'br-evt-4', businessId: B.EVENTS, userId: U.CLIENT_5, rating: 3, title: 'Bien', comment: 'Bel événement, léger retard au début.', createdAt: new Date('2026-08-07T20:15:00Z') },
  ];

  for (const r of reviews) {
    await prisma.businessReview.upsert({
      where: { id: r.id },
      update: {
        rating: r.rating, title: r.title, comment: r.comment,
        response: r.response || null, responseAt: r.responseAt || null,
        isActive: true, createdAt: r.createdAt,
      },
      create: { id: r.id, ...r, response: r.response || null, responseAt: r.responseAt || null, isActive: true },
    });
  }

  // Recalcul des notes moyenne + compteur depuis les VRAIS avis (zéro statique)
  for (const b of ALL_BIZ_IDS) {
    const stats = await prisma.businessReview.aggregate({
      where: { businessId: b, isActive: true },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.business.update({
      where: { id: b },
      data: { rating: stats._avg.rating || 0, reviewCount: stats._count },
    });
  }
  console.log(`✓ ${reviews.length} avis business reliés à de vrais clients + notes recalculées`);
}

// ============================================================
// 7. FAVORIS + SUIVIS
// ============================================================
async function seedSocial() {
  const favs: any[] = [
    { id: 'fav-1', userId: U.CLIENT_1, productId: 'prod-res-1', type: 'product', referenceId: 'prod-res-1' },
    { id: 'fav-2', userId: U.CLIENT_1, productId: 'prod-res-2', type: 'product', referenceId: 'prod-res-2' },
    { id: 'fav-3', userId: U.CLIENT_2, productId: 'prod-bout-1', type: 'product', referenceId: 'prod-bout-1' },
    { id: 'fav-4', userId: U.CLIENT_3, productId: 'prod-bout-3', type: 'product', referenceId: 'prod-bout-3' },
    { id: 'fav-5', userId: U.CLIENT_5, productId: 'prod-res-1', type: 'product', referenceId: 'prod-res-1' },
    { id: 'fav-6', userId: U.CLIENT_2, type: 'business', referenceId: B.BOUTIQUE },
    { id: 'fav-7', userId: U.CLIENT_3, type: 'business', referenceId: B.HOTEL },
  ];
  for (const f of favs) {
    await prisma.favorite.upsert({ where: { id: f.id }, update: {}, create: { id: f.id, ...f } });
  }

  const follows: any[] = [
    { id: 'fol-1', followerId: U.CLIENT_1, businessId: B.RESTO },
    { id: 'fol-2', followerId: U.CLIENT_1, businessId: B.SALON },
    { id: 'fol-3', followerId: U.CLIENT_2, businessId: B.BOUTIQUE },
    { id: 'fol-4', followerId: U.CLIENT_3, businessId: B.HOTEL },
    { id: 'fol-5', followerId: U.CLIENT_5, businessId: B.RESTO },
    { id: 'fol-6', followerId: U.CLIENT_5, businessId: B.EVENTS },
  ];
  for (const f of follows) {
    await prisma.follow.upsert({ where: { id: f.id }, update: {}, create: { id: f.id, ...f } });
  }
  console.log(`✓ ${favs.length} favoris + ${follows.length} suivis`);
}

// ============================================================
// 8. DÉVELOPPEURS (profils + modules marketplace + installations)
// ============================================================
async function seedDevelopers() {
  await prisma.developerProfile.upsert({
    where: { userId: U.DEV_1 }, update: {},
    create: { id: 'devprof-1', userId: U.DEV_1, companyName: 'DevPro CI', description: 'Solutions SaaS pour PME africaines', website: 'https://devpro.ci', phone: '+2250700000001', email: 'dev1@afribiz.com', country: 'Côte d\'Ivoire', city: 'Abidjan', skills: ['Node.js', 'React', 'Prisma'], specialties: ['Gestion de stock', 'CRM'], technologies: ['TypeScript', 'PostgreSQL'], experience: 6, github: 'https://github.com/devproci' },
  });
  await prisma.developerProfile.upsert({
    where: { userId: U.DEV_2 }, update: {},
    create: { id: 'devprof-2', userId: U.DEV_2, companyName: 'LoyaltyLabs', description: 'Programmes de fidélité nouvelle génération', website: 'https://loyaltylabs.sn', phone: '+221770000001', email: 'dev2@afribiz.com', country: 'Sénégal', city: 'Dakar', skills: ['Vue', 'Node.js'], specialties: ['Fidélité', 'Marketing'], technologies: ['JavaScript', 'MongoDB'], experience: 4 },
  });
  await prisma.developerProfile.upsert({
    where: { userId: U.DEV_3 }, update: {},
    create: { id: 'devprof-3', userId: U.DEV_3, companyName: 'ChatKit', description: 'Widgets de chat et support client', website: 'https://chatkit.ci', phone: '+2250700000002', email: 'dev3@afribiz.com', country: 'Côte d\'Ivoire', city: 'Abidjan', skills: ['React', 'Socket.io'], specialties: ['Messagerie', 'Support'], technologies: ['TypeScript', 'Redis'], experience: 5 },
  });
  await prisma.developerProfile.upsert({
    where: { userId: U.DEV_4 }, update: {},
    create: { id: 'devprof-4', userId: U.DEV_4, companyName: 'DataInsight', description: 'Tableaux de bord et analytics pour business', website: 'https://datainsight.tg', phone: '+22890000001', email: 'dev4@afribiz.com', country: 'Togo', city: 'Lomé', skills: ['Python', 'React'], specialties: ['Analytics', 'Reporting'], technologies: ['Python', 'PostgreSQL'], experience: 7 },
  });

  const modules: any[] = [
    { id: 'devmod-1', developerId: 'devprof-1', name: 'Stock Pro', slug: 'stock-pro', description: 'Gestion avancée du stock multi-dépôts', price: 15000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: true, category: 'Gestion', tags: ['stock', 'inventaire'], dashboardUrl: 'https://stock-pro.app.afribiz.com/dashboard', sidebarLabel: 'Stock Pro', sidebarIcon: 'Boxes' },
    { id: 'devmod-2', developerId: 'devprof-2', name: 'Loyalty Plus', slug: 'loyalty-plus', description: 'Points de fidélité et parrainage automatiques', price: 10000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: true, category: 'Marketing', tags: ['fidélité', 'parrainage'], dashboardUrl: 'https://loyalty-plus.app.afribiz.com/dashboard', sidebarLabel: 'Loyalty Plus', sidebarIcon: 'Gift' },
    { id: 'devmod-3', developerId: 'devprof-3', name: 'Chat Widget', slug: 'chat-widget', description: 'Widget de chat temps réel pour votre site', price: 8000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: false, category: 'Communication', tags: ['chat', 'support'], dashboardUrl: 'https://chat-widget.app.afribiz.com/dashboard', sidebarLabel: 'Chat Widget', sidebarIcon: 'MessageSquare' },
    { id: 'devmod-4', developerId: 'devprof-4', name: 'Analytics Pro', slug: 'analytics-pro', description: 'Rapports avancés et KPI temps réel', price: 12000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: true, category: 'Analytics', tags: ['kpi', 'rapports'], dashboardUrl: 'https://analytics-pro.app.afribiz.com/dashboard', sidebarLabel: 'Analytics Pro', sidebarIcon: 'BarChart3' },
  ];
  for (const m of modules) {
    await prisma.developerModule.upsert({
      where: { id: m.id },
      update: { dashboardUrl: m.dashboardUrl, sidebarLabel: m.sidebarLabel, sidebarIcon: m.sidebarIcon },
      create: { id: m.id, ...m },
    });
  }

  // Installations par les business (revenus dev + preuve de vie)
  const installs: any[] = [
    { id: 'dmi-1', moduleId: 'devmod-1', businessId: B.BOUTIQUE, status: 'ACTIVE', autoUpdate: true, installedAt: new Date('2026-05-10') },
    { id: 'dmi-2', moduleId: 'devmod-1', businessId: B.RESTO, status: 'ACTIVE', autoUpdate: true, installedAt: new Date('2026-05-15') },
    { id: 'dmi-3', moduleId: 'devmod-2', businessId: B.SALON, status: 'ACTIVE', autoUpdate: false, installedAt: new Date('2026-06-01') },
    { id: 'dmi-4', moduleId: 'devmod-3', businessId: B.HOTEL, status: 'ACTIVE', autoUpdate: false, installedAt: new Date('2026-06-10') },
    { id: 'dmi-5', moduleId: 'devmod-4', businessId: B.BTP, status: 'ACTIVE', autoUpdate: true, installedAt: new Date('2026-06-20') },
  ];
  for (const i of installs) {
    await prisma.developerModuleInstallation.upsert({ where: { id: i.id }, update: {}, create: { id: i.id, ...i } });
  }

  // ── Demandes de modules des business + matches dev (écosystème vivant) ──
  const demands: any[] = [
    { id: 'moddem-1', businessId: B.RESTO, moduleType: 'PRODUCTS', title: 'Module inventaire + rupture de stock automatique', description: 'Nous avons 120 références. On veut des alertes de rupture par dépôt et des commandes fournisseurs automatiques.', budget: 25000, currency: 'FCFA', deadline: new Date('2026-10-01'), status: 'MATCHED', isUrgent: true },
    { id: 'moddem-2', businessId: B.SALON, moduleType: 'CRM', title: 'Rappels SMS automatiques pour rendez-vous', description: 'Réduire les no-shows : rappel J-1 et J-2 par SMS + liste d\'attente si annulation.', budget: 15000, currency: 'FCFA', deadline: new Date('2026-09-15'), status: 'OPEN', isUrgent: false },
    { id: 'moddem-3', businessId: B.HOTEL, moduleType: 'MARKETING', title: 'Moteur de prix dynamique chambres', description: 'Ajuster le prix des chambres selon le taux d\'occupation et les périodes de pointe.', budget: 40000, currency: 'FCFA', deadline: new Date('2026-11-01'), status: 'OPEN', isUrgent: false },
  ];
  for (const d of demands) {
    await prisma.moduleDemand.upsert({ where: { id: d.id }, update: {}, create: { id: d.id, ...d } });
  }

  const matches: any[] = [
    { id: 'modmatch-1', demandId: 'moddem-1', developerId: 'devprof-1', moduleId: 'devmod-1', score: 92, matchReasons: ['Module stock existant', 'Catégorie identique', 'Dev vérifié'], status: 'ACCEPTED', notes: 'Solution adaptée : Stock Pro couvre le multi-dépôt et les alertes de rupture.', contactedAt: new Date('2026-08-01') },
    { id: 'modmatch-2', demandId: 'moddem-2', developerId: 'devprof-3', moduleId: 'devmod-3', score: 78, matchReasons: ['Chat/notifications', 'Communication'], status: 'PENDING', contactedAt: null },
    { id: 'modmatch-3', demandId: 'moddem-3', developerId: 'devprof-4', moduleId: 'devmod-4', score: 85, matchReasons: ['Analytics/prix', 'Dev expérimenté'], status: 'PENDING', contactedAt: null },
  ];
  for (const mt of matches) {
    await prisma.moduleMatch.upsert({ where: { id: mt.id }, update: {}, create: { id: mt.id, ...mt } });
  }

  // ── Tickets support dev (preuve de vie) ──
  const tickets: any[] = [
    { id: 'devtkt-1', developerId: 'devprof-1', businessId: B.BOUTIQUE, moduleId: 'devmod-1', category: 'Bug', subject: 'Erreur de synchronisation multi-dépôt', description: 'Le stock du dépôt 2 ne se met pas à jour après une vente. Reproduction : vente sur le dépôt 2 puis vérification du dashboard.', priority: 'HIGH', status: 'OPEN' },
    { id: 'devtkt-2', developerId: 'devprof-2', businessId: B.SALON, moduleId: 'devmod-2', category: 'Question', subject: 'Comment configurer les paliers de fidélité ?', description: 'Nous voulons 5 niveaux de fidélité avec des avantages différents. Où configurer cela ?', priority: 'LOW', status: 'OPEN' },
  ];
  for (const t of tickets) {
    await prisma.developerSupportTicket.upsert({ where: { id: t.id }, update: {}, create: { id: t.id, ...t } });
  }

  console.log(`✓ ${modules.length} modules développeurs + ${installs.length} installations business`);
  console.log(`✓ ${demands.length} demandes de modules + ${matches.length} matches dev + ${tickets.length} tickets support`);
}

// ============================================================
// 9. MESSAGES (conversations réelles client ↔ business)
// ============================================================
async function seedMessages() {
  const convos: any[] = [
    { id: 'conv-1', type: 'business', subject: 'Commande CMD-2026-001', participants: [U.CLIENT_1, U.OWNER_RESTO], messages: [{ id: 'msg-1', senderId: U.CLIENT_1, content: 'Bonjour, ma commande est-elle bien arrivée ?', read: true }, { id: 'msg-2', senderId: U.OWNER_RESTO, content: 'Bonjour Awa, oui elle a été livrée à 13h. Bon appétit !', read: true }, { id: 'msg-3', senderId: U.CLIENT_1, content: 'Merci, tout était parfait.', read: false }] },
    { id: 'conv-2', type: 'business', subject: 'Sécurité de mon paiement', participants: [U.CLIENT_2, U.OWNER_BOUTIQUE], messages: [{ id: 'msg-4', senderId: U.CLIENT_2, content: 'Bonjour, le smartphone est-il sous garantie ?', read: true }, { id: 'msg-5', senderId: U.OWNER_BOUTIQUE, content: 'Oui 12 mois, facture incluse.', read: true }] },
    { id: 'conv-3', type: 'business', subject: 'Demande de devis villa', participants: [U.CLIENT_4, U.OWNER_BTP], messages: [{ id: 'msg-6', senderId: U.CLIENT_4, content: 'Bonjour, pouvez-vous me faire un devis pour une villa R+1 ?', read: true }, { id: 'msg-7', senderId: U.OWNER_BTP, content: 'Bonjour Jean, oui. Envoyez-nous le terrain et nous revenons sous 48h.', read: true }] },
  ];
  for (const c of convos) {
    await prisma.conversation.upsert({
      where: { id: c.id }, update: {},
      create: { id: c.id, type: c.type, subject: c.subject, participants: c.participants, lastMessageAt: new Date('2026-07-10') },
    });
    for (const p of c.participants) {
      await prisma.conversationParticipant.upsert({
        where: { id: `cp-${c.id}-${p.slice(-2)}` }, update: {},
        create: { id: `cp-${c.id}-${p.slice(-2)}`, conversationId: c.id, userId: p, role: 'member' },
      });
    }
    for (const m of c.messages) {
      await prisma.message.upsert({ where: { id: m.id }, update: {}, create: { id: m.id, conversationId: c.id, ...m } });
    }
  }
  console.log(`✓ ${convos.length} conversations client ↔ business`);
}

// ============================================================
// 9bis. WHATSAPP BUSINESS (templates + sessions pour le resto)
// ============================================================
async function seedWhatsApp() {
  const businessId = B.RESTO;

  // ── Templates : 5 modèles approuvés (catalogue WhatsApp Business) ──
  const templates = [
    {
      id: 'wa-tpl-1', name: 'confirmation_commande', category: 'UTILITY', language: 'fr',
      header: 'Confirmation de commande',
      body: 'Bonjour {{1}} 👋 Votre commande est bien reçue. Notre équipe prépare vos plats et vous livre très vite. Total à régler : voir votre commande sur AfriBiz. — Saveur d\'Abidjan',
      footer: 'Répondez CONFIRMER pour valider', buttons: [{ type: 'QUICK_REPLY', text: 'CONFIRMER' }, { type: 'QUICK_REPLY', text: 'ANNULER' }],
      status: 'APPROVED', templateId: 'wa-tpl-1-meta',
    },
    {
      id: 'wa-tpl-2', name: 'livraison_en_cours', category: 'UTILITY', language: 'fr',
      header: '🚚 Votre commande est en route',
      body: 'Bonjour {{1}} 🚚 Votre commande est en route ! Le livreur arrive dans quelques minutes. Suivez votre commande sur AfriBiz. — Saveur d\'Abidjan',
      footer: 'Suivez votre commande sur AfriBiz', buttons: null,
      status: 'APPROVED', templateId: 'wa-tpl-2-meta',
    },
    {
      id: 'wa-tpl-3', name: 'plat_du_jour', category: 'MARKETING', language: 'fr',
      header: '🍛 Le plat du jour',
      body: 'Bonjour {{1}} 🍛 Le plat du jour est là ! Commandez avant 14h et profitez de la réduction spéciale. — Saveur d\'Abidjan',
      footer: 'Avec ❤️', buttons: [{ type: 'QUICK_REPLY', text: 'Je commande' }, { type: 'QUICK_REPLY', text: 'Voir le menu' }],
      status: 'APPROVED', templateId: 'wa-tpl-3-meta',
    },
    {
      id: 'wa-tpl-4', name: 'rappel_reservation', category: 'UTILITY', language: 'fr',
      header: 'Rappel de votre réservation',
      body: 'Bonjour {{1}}, ceci est un rappel : votre table est réservée comme convenu. Pour modifier ou annuler, répondez simplement à ce message. — Saveur d\'Abidjan',
      footer: 'Merci de votre confiance', buttons: null,
      status: 'APPROVED', templateId: 'wa-tpl-4-meta',
    },
    {
      id: 'wa-tpl-5', name: 'satisfaction_client', category: 'MARKETING', language: 'fr',
      header: '⭐ Comment s\'est passée votre expérience ?',
      body: 'Bonjour {{1}} ⭐ Comment s\'est passée votre expérience ? Donnez votre avis sur AfriBiz et gagnez des points fidélité. — Saveur d\'Abidjan',
      footer: 'Votre avis nous aide à grandir', buttons: [{ type: 'QUICK_REPLY', text: '😍 Génial' }, { type: 'QUICK_REPLY', text: '😐 Moyen' }, { type: 'QUICK_REPLY', text: '😞 Décevant' }],
      status: 'APPROVED', templateId: 'wa-tpl-5-meta',
    },
  ];
  for (const t of templates) {
    await prisma.whatsAppTemplate.upsert({
      where: { id: t.id }, update: {},
      create: { id: t.id, businessId, name: t.name, category: t.category, language: t.language, header: t.header, body: t.body, footer: t.footer, buttons: t.buttons as any, status: t.status, templateId: t.templateId },
    });
  }
  console.log(`✓ ${templates.length} templates WhatsApp (${businessId})`);

  // ── Sessions : 3 vrais clients du resto + messages ──
  const sessions = [
    {
      id: 'wa-ses-1', clientPhone: '+2250100000002', clientName: 'Awa Coulibaly', status: 'ACTIVE', lastMessageAt: new Date('2026-07-15T13:20:00Z'),
      messages: [
        { id: 'wa-msg-1-1', fromBusiness: true, messageType: 'text', content: 'Bonjour Awa 👋 Votre commande n°CMD-2026-001 (2 attiéké poisson, 1 jus bissap) est confirmée. Total : 6 500 FCFA. Livraison à Cocody Angré estimée à 14h10. — Saveur d\'Abidjan', status: 'delivered', waMessageId: 'wamid-1-1' },
        { id: 'wa-msg-1-2', fromBusiness: false, messageType: 'text', content: 'Merci ! Est-ce que je peux ajouter un dessert ?', status: 'read', waMessageId: 'wamid-1-2' },
        { id: 'wa-msg-1-3', fromBusiness: true, messageType: 'text', content: 'Bien sûr 😊 Nous ajoutons un alloco (500 FCFA) à votre commande. Total mis à jour : 7 000 FCFA. Le livreur arrive dans 20 min !', status: 'delivered', waMessageId: 'wamid-1-3' },
      ],
    },
    {
      id: 'wa-ses-2', clientPhone: '+233202020202', clientName: 'Kofi Mensah', status: 'ACTIVE', lastMessageAt: new Date('2026-07-02T18:45:00Z'),
      messages: [
        { id: 'wa-msg-2-1', fromBusiness: true, messageType: 'text', content: 'Kofi, ne manquez pas notre plat du jour : poulet braisé + alloco à 3 500 FCFA 🍗 Commandez avant 14h et profitez de 500 FCFA de réduction ! — Saveur d\'Abidjan', status: 'delivered', waMessageId: 'wamid-2-1' },
        { id: 'wa-msg-2-2', fromBusiness: false, messageType: 'text', content: 'Je prends ! Une commande poulet braisé pour livraison à Accra.', status: 'read', waMessageId: 'wamid-2-2' },
        { id: 'wa-msg-2-3', fromBusiness: true, messageType: 'text', content: 'Commande n°CMD-2026-003 confirmée ✅ Poulet braisé + alloco — 3 500 FCFA. Merci Kofi, à très vite !', status: 'delivered', waMessageId: 'wamid-2-3' },
      ],
    },
    {
      id: 'wa-ses-3', clientPhone: '+22370000001', clientName: 'Aminata Koné', status: 'ACTIVE', lastMessageAt: new Date('2026-07-05T12:10:00Z'),
      messages: [
        { id: 'wa-msg-3-1', fromBusiness: false, messageType: 'text', content: 'Bonsoir, je voudrais réserver une table pour 4 personnes samedi soir.', status: 'read', waMessageId: 'wamid-3-1' },
        { id: 'wa-msg-3-2', fromBusiness: true, messageType: 'text', content: 'Bonsoir Aminata 🌟 Votre table pour 4 personnes est réservée samedi à 20h00 à Angré. Pour modifier ou annuler, répondez simplement à ce message. — Saveur d\'Abidjan', status: 'delivered', waMessageId: 'wamid-3-2' },
      ],
    },
  ];
  for (const s of sessions) {
    await prisma.whatsAppSession.upsert({
      where: { id: s.id }, update: {},
      create: { id: s.id, businessId, clientPhone: s.clientPhone, clientName: s.clientName, status: s.status, lastMessageAt: s.lastMessageAt },
    });
    for (const m of s.messages) {
      await prisma.whatsAppMessage.upsert({
        where: { id: m.id }, update: {},
        create: { id: m.id, sessionId: s.id, fromBusiness: m.fromBusiness, messageType: m.messageType, content: m.content, status: m.status, waMessageId: m.waMessageId },
      });
    }
  }
  console.log(`✓ ${sessions.length} sessions WhatsApp + ${sessions.reduce((acc, s) => acc + s.messages.length, 0)} messages`);
}

// ============================================================
// 10. WALLETS + TRANSACTIONS (business)
// ============================================================
// ============================================================
// 7a. CAMPAGNES MARKETING (module MARKETING — resto Saveur d'Abidjan)
// Des campagnes réelles avec ouvertures/clics pour alimenter la page marketing
// et le tracking public /api/track/campaign/:id.
// ============================================================
async function seedMarketing() {
  const campaigns: any[] = [
    {
      id: 'cmp-1', businessId: B.RESTO, name: 'Offre plat du jour',
      description: 'Promotion WhatsApp du plat du jour — envoyée aux 3 clients avec téléphone.',
      channels: ['WHATSAPP'], message: 'Bonjour {{1}} 🍛 Le plat du jour est là ! Commandez avant 14h.',
      targetAudience: 'Clients avec téléphone',
      sentAt: new Date('2026-07-20'), status: 'COMPLETED',
      sentCount: 3, openedCount: 2, clickedCount: 1,
    },
    {
      id: 'cmp-2', businessId: B.RESTO, name: 'Satisfaction client Août',
      description: 'Campagne de satisfaction envoyée en début de mois.',
      channels: ['WHATSAPP', 'EMAIL'], message: 'Bonjour {{1}} ⭐ Comment s\'est passée votre expérience ?',
      targetAudience: 'Clients fidèles',
      sentAt: new Date('2026-08-02'), status: 'COMPLETED',
      sentCount: 3, openedCount: 1, clickedCount: 1,
    },
    {
      id: 'cmp-3', businessId: B.RESTO, name: 'Promo Rentrée scolaire',
      description: 'Offre spéciale rentrée — brouillon prêt à envoyer.',
      channels: ['WHATSAPP'], message: 'Bonjour {{1}} 🎒 Offre spéciale rentrée : -20% sur les plats à emporter !',
      targetAudience: 'Tous les clients',
      scheduledAt: new Date('2026-09-01'), status: 'DRAFT',
      sentCount: 0, openedCount: 0, clickedCount: 0,
    },
  ];
  for (const c of campaigns) {
    await prisma.marketingCampaign.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, businessId: c.businessId, name: c.name, description: c.description, channels: c.channels, message: c.message, targetAudience: c.targetAudience, scheduledAt: c.scheduledAt || null, sentAt: c.sentAt || null, status: c.status, sentCount: c.sentCount, openedCount: c.openedCount, clickedCount: c.clickedCount },
    });
  }
  console.log('✓ Marketing : 3 campagnes réelles (2 envoyées avec ouvertures/clics + 1 brouillon)');

  // ── Promotions réelles — le calcul s'applique VRAIMENT au checkout ──
  // (classique : coupon OU promo auto ; épargne : coupon à la validation)
  await prisma.coupon.deleteMany({ where: { code: { in: ['WELCOME10', 'TECHX10'] } } });

  // 1. Auto-apply « Attiéké -15% » : remise automatique dès que le plat est au panier
  await prisma.promotion.upsert({
    where: { id: 'prom-res-1' },
    update: {},
    create: {
      id: 'prom-res-1', businessId: B.RESTO, title: 'Attiéké -15% (auto)',
      description: 'Remise automatique de 15% sur l Attiéké Poisson Braisé — appliquée directement au checkout.',
      promotionType: 'PERCENTAGE', discountValue: 15, code: 'ATTIEKE15',
      targetType: 'PRODUCT', targetIds: ['prod-res-1'],
      autoApply: true, isActive: true, badgeLabel: '🔥 -15%', startsAt: null, endsAt: null,
    },
  });

  // 2. Coupon WELCOME10 (resto) — utilisable au panier ET à la validation d'une épargne
  await prisma.coupon.upsert({
    where: { id: 'cpn-res-welcome' },
    update: {},
    create: {
      id: 'cpn-res-welcome', businessId: B.RESTO, code: 'WELCOME10',
      discountType: 'PERCENTAGE', discountValue: 10, maxUses: 500, minOrderAmount: null, status: 'ACTIVE',
    },
  });

  // 3. Coupon TECHX10 (boutique) — test épargne : appliqué à la conversion d'un plan READY
  await prisma.coupon.upsert({
    where: { id: 'cpn-bout-techx' },
    update: {},
    create: {
      id: 'cpn-bout-techx', businessId: B.BOUTIQUE, code: 'TECHX10',
      discountType: 'PERCENTAGE', discountValue: 10, maxUses: 500, minOrderAmount: null, status: 'ACTIVE',
    },
  });

  console.log('✓ Promotions testables : auto-apply Attiéké -15% + coupons WELCOME10 (resto) / TECHX10 (boutique)');

  // ── Achat Groupé — le workflow complet (seuil → REACHED → conversion en commande) ──
  // Resto : Attiéké en groupe (5+ → 2800 FCFA au lieu de 3500) — SEUIL ATTEINT, prêt à convertir
  await prisma.groupBuy.upsert({
    where: { id: 'gb-res-1' },
    update: {},
    create: {
      id: 'gb-res-1', businessId: B.RESTO, productId: 'prod-res-1',
      title: 'Attiéké Poisson en Groupe',
      description: '5 amis, un prix imbattable : l Attiéké Poisson Braisé à 2800 FCFA au lieu de 3500.',
      price: 3500, groupPrice: 2800, currency: 'FCFA',
      minParticipants: 5, maxParticipants: 20, currentCount: 6, discountPercent: 20, savings: 700,
      startAt: new Date('2026-08-01'), endAt: new Date('2026-08-31'),
      status: 'REACHED', isActive: true, whatsappGroup: 'https://chat.whatsapp.com/attieke-groupe',
    },
  });
  // Boutique : Smartphone en groupe (3+ → 135 000 FCFA au lieu de 150 000) — EN COURS
  await prisma.groupBuy.upsert({
    where: { id: 'gb-bout-1' },
    update: {},
    create: {
      id: 'gb-bout-1', businessId: B.BOUTIQUE, productId: 'prod-bout-1',
      title: 'TechX Pro en Groupe',
      description: '3 acheteurs = 135 000 FCFA au lieu de 150 000. Partagez le lien WhatsApp !',
      price: 150000, groupPrice: 135000, currency: 'FCFA',
      minParticipants: 3, maxParticipants: 10, currentCount: 2, discountPercent: 10, savings: 15000,
      startAt: new Date('2026-08-05'), endAt: new Date('2026-08-25'),
      status: 'ACTIVE', isActive: true, whatsappGroup: null,
    },
  });

  // Participants réels (clients AfriBiz + invités WhatsApp)
  const gbParticipants: any[] = [
    { id: 'gbp-res-1', groupBuyId: 'gb-res-1', userId: U.CLIENT_1, name: 'Awa Coulibaly', phone: '+2250100000002', email: 'client1@afribiz.com', quantity: 1, amount: 2800, status: 'PAID', paidAt: new Date('2026-08-06'), paymentRef: 'GB-2026-0001' },
    { id: 'gbp-res-2', groupBuyId: 'gb-res-1', userId: U.CLIENT_2, name: 'Ibrahim Koné', phone: '+2250100000003', email: 'client2@afribiz.com', quantity: 1, amount: 2800, status: 'PAID', paidAt: new Date('2026-08-06'), paymentRef: 'GB-2026-0002' },
    { id: 'gbp-res-3', groupBuyId: 'gb-res-1', userId: U.CLIENT_3, name: 'Fatou Ndiaye', phone: '+221770001122', email: 'client3@afribiz.com', quantity: 1, amount: 2800, status: 'PAID', paidAt: new Date('2026-08-07'), paymentRef: 'GB-2026-0003' },
    { id: 'gbp-res-4', groupBuyId: 'gb-res-1', userId: U.CLIENT_5, name: 'Moussa Traoré', phone: '+2250700000005', email: 'client5@afribiz.com', quantity: 1, amount: 2800, status: 'PAID', paidAt: new Date('2026-08-07'), paymentRef: 'GB-2026-0004' },
    { id: 'gbp-res-5', groupBuyId: 'gb-res-1', userId: null, name: 'Sita Diarra', phone: '+2250555123456', email: null, quantity: 1, amount: 2800, status: 'PENDING', paidAt: null, paymentRef: null },
    { id: 'gbp-res-6', groupBuyId: 'gb-res-1', userId: null, name: 'Yao Nguessan', phone: '+2250555987654', email: null, quantity: 1, amount: 2800, status: 'PENDING', paidAt: null, paymentRef: null },
    { id: 'gbp-bout-1', groupBuyId: 'gb-bout-1', userId: U.CLIENT_2, name: 'Ibrahim Koné', phone: '+2250100000003', email: 'client2@afribiz.com', quantity: 1, amount: 135000, status: 'PENDING', paidAt: null, paymentRef: null },
    { id: 'gbp-bout-2', groupBuyId: 'gb-bout-1', userId: U.CLIENT_4, name: 'Aminata Sissoko', phone: '+2237600000004', email: 'client4@afribiz.com', quantity: 1, amount: 135000, status: 'PENDING', paidAt: null, paymentRef: null },
  ];
  for (const p of gbParticipants) {
    await prisma.groupBuyParticipant.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, groupBuyId: p.groupBuyId, userId: p.userId, name: p.name, phone: p.phone, email: p.email, quantity: p.quantity, amount: p.amount, status: p.status, paidAt: p.paidAt, paymentRef: p.paymentRef },
    });
  }
  console.log('✓ Achat Groupé : Attiéké (6 participants, REACHED) + TechX Pro (2 participants, ACTIVE)');

  // ── Réseaux sociaux connectés (page social-accounts) ──
  const socialAccounts: any[] = [
    { id: 'sa-res-1', businessId: B.RESTO, platform: 'FACEBOOK', accountName: 'Saveur d\'Abidjan', accountId: 'fb-saveur-abidjan', accessToken: 'seed-token-fb-res', isActive: true, autoShare: true, lastPostedAt: new Date('2026-08-05') },
    { id: 'sa-res-2', businessId: B.RESTO, platform: 'INSTAGRAM', accountName: '@saveur.abidjan', accountId: 'ig-saveur-abidjan', accessToken: 'seed-token-ig-res', isActive: true, autoShare: true, lastPostedAt: new Date('2026-08-06') },
    { id: 'sa-res-3', businessId: B.RESTO, platform: 'TIKTOK', accountName: '@saveur.abidjan', accountId: 'tt-saveur-abidjan', accessToken: 'seed-token-tt-res', isActive: true, autoShare: false, lastPostedAt: null },
    { id: 'sa-bout-1', businessId: B.BOUTIQUE, platform: 'FACEBOOK', accountName: 'TechStore Afrique', accountId: 'fb-techstore', accessToken: 'seed-token-fb-bout', isActive: true, autoShare: true, lastPostedAt: new Date('2026-08-04') },
    { id: 'sa-bout-2', businessId: B.BOUTIQUE, platform: 'INSTAGRAM', accountName: '@techstore.afrique', accountId: 'ig-techstore', accessToken: 'seed-token-ig-bout', isActive: true, autoShare: true, lastPostedAt: new Date('2026-08-06') },
  ];
  for (const sa of socialAccounts) {
    await prisma.socialAccount.upsert({
      where: { id: sa.id },
      update: {},
      create: { id: sa.id, businessId: sa.businessId, platform: sa.platform, accountName: sa.accountName, accountId: sa.accountId, accessToken: sa.accessToken, isActive: sa.isActive, autoShare: sa.autoShare, lastPostedAt: sa.lastPostedAt },
    });
  }
  console.log('✓ Réseaux sociaux : 5 comptes connectés (resto : FB/IG/TikTok, boutique : FB/IG)');

  // ── Programme de fidélité + points réels (page loyalty) ──
  await prisma.loyaltyProgram.upsert({
    where: { id: 'lp-res-1' },
    update: {},
    create: {
      id: 'lp-res-1', businessId: B.RESTO,
      name: 'Fidélité Saveur d\'Abidjan',
      description: '10 points par 1 000 FCFA dépensés — Bronze 0, Argent 500, Or 1500 points.',
      pointsPerAmount: 10, amountForPoints: 1000, currency: 'FCFA',
      tiers: ['BRONZE', 'SILVER', 'GOLD'],
      birthdayBonus: 100, referralBonus: 50, isActive: true,
    },
  });
  await prisma.loyaltyProgram.upsert({
    where: { id: 'lp-bout-1' },
    update: {},
    create: {
      id: 'lp-bout-1', businessId: B.BOUTIQUE,
      name: 'TechStore Points',
      description: '10 points par 1 000 FCFA — récompenses sur les accessoires.',
      pointsPerAmount: 10, amountForPoints: 1000, currency: 'FCFA',
      tiers: ['BRONZE', 'SILVER', 'GOLD'],
      birthdayBonus: 100, referralBonus: 50, isActive: true,
    },
  });

  const loyaltyPoints: any[] = [
    { businessId: B.RESTO, clientId: U.CLIENT_1, tier: 'GOLD', totalPoints: 1240, lifetimePoints: 2100, txns: [{ type: 'EARNED', points: 350, description: 'Commande CMD-2026-001', reference: 'order:ord-1' }, { type: 'EARNED', points: 480, description: 'Commandes semaine 30', reference: 'order:ord-2' }, { type: 'EARNED', points: 410, description: 'Achat groupe Attiéké', reference: 'gb:gb-res-1' }] },
    { businessId: B.RESTO, clientId: U.CLIENT_2, tier: 'SILVER', totalPoints: 640, lifetimePoints: 820, txns: [{ type: 'EARNED', points: 250, description: 'Commande CMD-2026-002', reference: 'order:ord-4' }, { type: 'EARNED', points: 390, description: 'Réservation anniversaire', reference: 'booking:bk-res-2' }] },
    { businessId: B.RESTO, clientId: U.CLIENT_3, tier: 'BRONZE', totalPoints: 220, lifetimePoints: 220, txns: [{ type: 'EARNED', points: 220, description: 'Première commande', reference: 'order:ord-3' }] },
  ];
  for (const lp of loyaltyPoints) {
    const created = await prisma.loyaltyPoints.upsert({
      where: { businessId_clientId: { businessId: lp.businessId, clientId: lp.clientId } },
      update: { tier: lp.tier, totalPoints: lp.totalPoints, lifetimePoints: lp.lifetimePoints },
      create: { businessId: lp.businessId, clientId: lp.clientId, tier: lp.tier, totalPoints: lp.totalPoints, lifetimePoints: lp.lifetimePoints },
    });
    for (const t of lp.txns) {
      await prisma.loyaltyTransaction.create({ data: { loyaltyId: created.id, type: t.type, points: t.points, description: t.description, reference: t.reference } });
    }
  }
  console.log('✓ Fidélité : 2 programmes actifs + points réels (Awa 1240 pts GOLD, Ibrahim 640 ARGENT, Fatou 220 BRONZE)');
}

// ============================================================
// 7b. TONTINE / ÉPARGNE (module SAVINGS — salon Kenza Beauté)
// Un vrai groupe de tontine avec membres, cycle en cours et cotisations.
// ============================================================
async function seedSavings() {
  // ── Groupe de tontine du salon ──
  await prisma.savingsGroup.upsert({
    where: { id: 'sg-sal-1' },
    update: {},
    create: {
      id: 'sg-sal-1', businessId: B.SALON, name: 'Tontine Épargne Beauté',
      description: 'Épargne collective des clientes fidèles du salon — tour de rôle chaque fin de mois.',
      type: 'ROTATING', currency: 'FCFA', contributionAmount: 10000,
      frequency: 'weekly', maxMembers: 12,
      startDate: new Date('2026-06-01'), status: 'ACTIVE',
      rules: { contribution: 10000, rotation: 'mensuelle', goal: 'Épargne + projets personnels' },
    },
  });

  // ── Membres (vraies clientes, dont 3 avec un compte AfriBiz) ──
  const members: any[] = [
    { id: 'sm-sal-1', userId: U.CLIENT_1, name: 'Awa Coulibaly', phone: '+2250100000002', email: 'client1@afribiz.com', role: 'admin', totalContributed: 40000, reliabilityScore: 95 },
    { id: 'sm-sal-2', userId: U.CLIENT_3, name: 'Fatou Ndiaye', phone: '+221770001122', email: 'client3@afribiz.com', role: 'member', totalContributed: 30000, reliabilityScore: 90 },
    { id: 'sm-sal-3', userId: U.CLIENT_5, name: 'Aminata Koné', phone: '+22370000001', email: 'client5@afribiz.com', role: 'member', totalContributed: 30000, reliabilityScore: 85 },
    { id: 'sm-sal-4', name: 'Mariam Sow', phone: '+221770001123', role: 'member', totalContributed: 10000, reliabilityScore: 72 },
    { id: 'sm-sal-5', name: 'Khady Fall', phone: '+221770001124', role: 'member', totalContributed: 20000, reliabilityScore: 80 },
  ];
  for (const m of members) {
    await prisma.savingsMember.upsert({
      where: { id: m.id },
      update: {},
      create: { id: m.id, groupId: 'sg-sal-1', ...m },
    });
  }

  // ── Cycle n°1 en cours (juillet 2026) ──
  await prisma.savingsCycle.upsert({
    where: { id: 'sc-sal-1' },
    update: {},
    create: {
      id: 'sc-sal-1', groupId: 'sg-sal-1', cycleNumber: 1,
      startDate: new Date('2026-07-01'), status: 'ACTIVE',
      totalAmount: 50000, totalCollected: 30000, totalDistributed: 10000,
      payoutDate: new Date('2026-07-28'),
    },
  });

  // ── Cotisations du cycle (3 payées, 1 en attente, 1 en retard) ──
  const contributions: any[] = [
    { id: 'cont-sal-1', cycleId: 'sc-sal-1', memberId: 'sm-sal-1', amount: 10000, status: 'PAID', paidAt: new Date('2026-07-03'), method: 'MOBILE_MONEY', reference: 'TRF-TONT-001' },
    { id: 'cont-sal-2', cycleId: 'sc-sal-1', memberId: 'sm-sal-2', amount: 10000, status: 'PAID', paidAt: new Date('2026-07-03'), method: 'MOBILE_MONEY', reference: 'TRF-TONT-002' },
    { id: 'cont-sal-3', cycleId: 'sc-sal-1', memberId: 'sm-sal-3', amount: 10000, status: 'PAID', paidAt: new Date('2026-07-10'), method: 'CASH', reference: 'ESP-TONT-003' },
    { id: 'cont-sal-4', cycleId: 'sc-sal-1', memberId: 'sm-sal-4', amount: 10000, status: 'PENDING', notes: 'À régler cette semaine' },
    { id: 'cont-sal-5', cycleId: 'sc-sal-1', memberId: 'sm-sal-5', amount: 10000, status: 'LATE', notes: 'Rappel envoyé par WhatsApp' },
  ];
  for (const c of contributions) {
    await prisma.savingsContribution.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, ...c },
    });
  }

  console.log('✓ Tontine Épargne : 1 groupe + 5 membres + 1 cycle + 5 cotisations (module SAVINGS du salon)');
}

// ============================================================
// 7c. ÉPARGNE ACHAT (Layaway sécurisé — escrow)
// Offres sur des articles + plans de clients en cours, argent en escrow.
// ============================================================
async function seedLayaway() {
  // ── Purge complète (source de vérité unique : on recrée un état propre, connecté) ──
  // NB: les plans qui référencent des offres créées hors seed (test API, IDs UUID)
  // deviendraient orphelins — on purge tout et on recrée des IDs déterministes.
  await prisma.layawayContribution.deleteMany({});
  await prisma.layawayPlan.deleteMany({});
  await prisma.escrow.deleteMany({ where: { id: { startsWith: 'lw-esc-' } } });
  await prisma.layawayOffer.deleteMany({});

  // ── Offres d'épargne ──
  await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: 'PRODUCT', itemId: 'prod-bout-1' } },
    update: {},
    create: { id: 'lw-off-1', businessId: B.BOUTIQUE, itemType: 'PRODUCT', itemId: 'prod-bout-1', durationDays: 90, minInstallment: 5000, isActive: true, planCount: 1 },
  });
  await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: 'SERVICE', itemId: 'sv-sal-1' } },
    update: {},
    create: { id: 'lw-off-2', businessId: B.SALON, itemType: 'SERVICE', itemId: 'sv-sal-1', durationDays: 60, minInstallment: 2000, isActive: true, planCount: 1 },
  });

  // ── Catalogue complet : chambre, location, billet d'événement ──
  await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: 'ROOM', itemId: 'rm-hot-2' } },
    update: {},
    create: { id: 'lw-off-3', businessId: B.HOTEL, itemType: 'ROOM', itemId: 'rm-hot-2', durationDays: 120, minInstallment: 5000, isActive: true, planCount: 1 },
  });
  await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: 'RENTAL', itemId: 'rn-evt-1' } },
    update: {},
    create: { id: 'lw-off-4', businessId: B.EVENTS, itemType: 'RENTAL', itemId: 'rn-evt-1', durationDays: 90, minInstallment: 10000, isActive: true, planCount: 0 },
  });
  await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: 'EVENT', itemId: 'ev-evt-1' } },
    update: {},
    create: { id: 'lw-off-5', businessId: B.EVENTS, itemType: 'EVENT', itemId: 'ev-evt-1', durationDays: 60, minInstallment: 2000, isActive: true, planCount: 1 },
  });

  // ── Plan client1 : Smartphone TechX Pro (60 000 / 150 000 épargnés) ──
  await prisma.layawayPlan.upsert({
    where: { id: 'lw-plan-1' },
    update: {},
    create: {
      id: 'lw-plan-1', businessId: B.BOUTIQUE, clientId: U.CLIENT_1, offerId: 'lw-off-1',
      itemType: 'PRODUCT', itemId: 'prod-bout-1', itemName: 'Smartphone TechX Pro',
      itemImage: null, targetAmount: 150000, savedAmount: 60000, minInstallment: 5000,
      durationDays: 90, status: 'ACTIVE', escrowId: 'lw-esc-1',
      startedAt: new Date('2026-07-15'), expiresAt: new Date('2026-10-13'),
    },
  });
  await prisma.escrow.upsert({
    where: { id: 'lw-esc-1' },
    update: {},
    create: { id: 'lw-esc-1', businessId: B.BOUTIQUE, amount: 60000, currency: 'FCFA', status: 'HELD', fee: 0, feeRate: 0, notes: 'Épargne Achat — Smartphone TechX Pro (client sécurisé)' },
  });
  const con1: any[] = [
    { id: 'lw-con-1', planId: 'lw-plan-1', amount: 50000, currency: 'FCFA', method: 'WAVE', status: 'PAID', reference: 'TRF-LW-001', createdAt: new Date('2026-07-16') },
    { id: 'lw-con-2', planId: 'lw-plan-1', amount: 10000, currency: 'FCFA', method: 'ORANGE', status: 'PAID', reference: 'TRF-LW-002', createdAt: new Date('2026-08-01') },
  ];
  for (const c of con1) await prisma.layawayContribution.upsert({ where: { id: c.id }, update: {}, create: c });

  // ── Plan client3 : Coupe + Brushing du salon (2 000 / 5 000) ──
  await prisma.layawayPlan.upsert({
    where: { id: 'lw-plan-2' },
    update: {},
    create: {
      id: 'lw-plan-2', businessId: B.SALON, clientId: U.CLIENT_3, offerId: 'lw-off-2',
      itemType: 'SERVICE', itemId: 'sv-sal-1', itemName: 'Coupe + Brushing',
      itemImage: null, targetAmount: 5000, savedAmount: 2000, minInstallment: 2000,
      durationDays: 60, status: 'ACTIVE', escrowId: 'lw-esc-2',
      startedAt: new Date('2026-08-01'), expiresAt: new Date('2026-09-30'),
    },
  });
  await prisma.escrow.upsert({
    where: { id: 'lw-esc-2' },
    update: {},
    create: { id: 'lw-esc-2', businessId: B.SALON, amount: 2000, currency: 'FCFA', status: 'HELD', fee: 0, feeRate: 0, notes: 'Épargne Achat — Coupe + Brushing (client sécurisé)' },
  });
  await prisma.layawayContribution.upsert({
    where: { id: 'lw-con-3' }, update: {},
    create: { id: 'lw-con-3', planId: 'lw-plan-2', amount: 2000, currency: 'FCFA', method: 'WAVE', status: 'PAID', reference: 'TRF-LW-003', createdAt: new Date('2026-08-02') },
  });

  // ── Plan client4 : Chambre Deluxe de l'Hôtel Palmier (15 000 / 45 000 épargnés) ──
  // La conversion finale créera une VRAIE réservation (Booking) avec dates.
  await prisma.layawayPlan.upsert({
    where: { id: 'lw-plan-3' },
    update: {},
    create: {
      id: 'lw-plan-3', businessId: B.HOTEL, clientId: U.CLIENT_4, offerId: 'lw-off-3',
      itemType: 'ROOM', itemId: 'rm-hot-2', itemName: 'Chambre Deluxe',
      itemImage: null, targetAmount: 45000, savedAmount: 15000, minInstallment: 5000,
      durationDays: 120, status: 'ACTIVE', escrowId: 'lw-esc-3',
      startedAt: new Date('2026-07-20'), expiresAt: new Date('2026-11-17'),
    },
  });
  await prisma.escrow.upsert({
    where: { id: 'lw-esc-3' },
    update: {},
    create: { id: 'lw-esc-3', businessId: B.HOTEL, amount: 15000, currency: 'FCFA', status: 'HELD', fee: 0, feeRate: 0, notes: 'Épargne Achat — Chambre Deluxe (client sécurisé)' },
  });
  const con3: any[] = [
    { id: 'lw-con-4', planId: 'lw-plan-3', amount: 10000, currency: 'FCFA', method: 'ORANGE', status: 'PAID', reference: 'TRF-LW-004', createdAt: new Date('2026-07-22') },
    { id: 'lw-con-5', planId: 'lw-plan-3', amount: 5000, currency: 'FCFA', method: 'WAVE', status: 'PAID', reference: 'TRF-LW-005', createdAt: new Date('2026-08-03') },
  ];
  for (const c of con3) await prisma.layawayContribution.upsert({ where: { id: c.id }, update: {}, create: c });

  // ── Plan client2 : Pass Concert Afrique Festival (5 000 / 10 000 épargnés) ──
  // La conversion finale créera un VRAI billet (EventParticipant + QR).
  await prisma.layawayPlan.upsert({
    where: { id: 'lw-plan-4' },
    update: {},
    create: {
      id: 'lw-plan-4', businessId: B.EVENTS, clientId: U.CLIENT_2, offerId: 'lw-off-5',
      itemType: 'EVENT', itemId: 'ev-evt-1', itemName: 'Concert Afrique Festival',
      itemImage: null, targetAmount: 10000, savedAmount: 5000, minInstallment: 2000,
      durationDays: 60, status: 'ACTIVE', escrowId: 'lw-esc-4',
      startedAt: new Date('2026-07-25'), expiresAt: new Date('2026-09-23'),
    },
  });
  await prisma.escrow.upsert({
    where: { id: 'lw-esc-4' },
    update: {},
    create: { id: 'lw-esc-4', businessId: B.EVENTS, amount: 5000, currency: 'FCFA', status: 'HELD', fee: 0, feeRate: 0, notes: 'Épargne Achat — Concert Afrique Festival (client sécurisé)' },
  });
  await prisma.layawayContribution.upsert({
    where: { id: 'lw-con-6' }, update: {},
    create: { id: 'lw-con-6', planId: 'lw-plan-4', amount: 5000, currency: 'FCFA', method: 'WAVE', status: 'PAID', reference: 'TRF-LW-006', createdAt: new Date('2026-07-28') },
  });

  // ── Formation : offre + plan ──
  await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: 'TRAINING', itemId: 'tr-btp-1' } },
    update: {},
    create: { id: 'lw-off-6', businessId: B.BTP, itemType: 'TRAINING', itemId: 'tr-btp-1', durationDays: 90, minInstallment: 5000, isActive: true, planCount: 1 },
  });

  // ── Plan client5 : Formation Rénovation Express (10 000 / 25 000 épargnés) ──
  // La conversion finale créera une VRAIE inscription (UserTraining) déjà payée.
  await prisma.layawayPlan.upsert({
    where: { id: 'lw-plan-5' },
    update: {},
    create: {
      id: 'lw-plan-5', businessId: B.BTP, clientId: U.CLIENT_5, offerId: 'lw-off-6',
      itemType: 'TRAINING', itemId: 'tr-btp-1', itemName: 'Formation Rénovation Express',
      itemImage: null, targetAmount: 25000, savedAmount: 10000, minInstallment: 5000,
      durationDays: 90, status: 'ACTIVE', escrowId: 'lw-esc-5',
      startedAt: new Date('2026-07-30'), expiresAt: new Date('2026-10-28'),
    },
  });
  await prisma.escrow.upsert({
    where: { id: 'lw-esc-5' },
    update: {},
    create: { id: 'lw-esc-5', businessId: B.BTP, amount: 10000, currency: 'FCFA', status: 'HELD', fee: 0, feeRate: 0, notes: 'Épargne Achat — Formation Rénovation Express (client sécurisé)' },
  });
  const con5: any[] = [
    { id: 'lw-con-7', planId: 'lw-plan-5', amount: 5000, currency: 'FCFA', method: 'ORANGE', status: 'PAID', reference: 'TRF-LW-007', createdAt: new Date('2026-08-01') },
    { id: 'lw-con-8', planId: 'lw-plan-5', amount: 5000, currency: 'FCFA', method: 'WAVE', status: 'PAID', reference: 'TRF-LW-008', createdAt: new Date('2026-08-05') },
  ];
  for (const c of con5) await prisma.layawayContribution.upsert({ where: { id: c.id }, update: {}, create: c });

  console.log('✓ Épargne Achat : 6 offres (produit, service, chambre, location, événement, formation) + 5 plans clients en cours (92 000 FCFA en escrow)');
}

async function seedWallets() {
  const txs: any[] = [
    { id: 'wtx-1', walletId: 'wallet-techstore-afrique', type: 'PAYMENT', amount: 160000, balanceBefore: 2000000, balanceAfter: 2160000, reference: 'CMD-2026-004', description: 'Vente smartphone TechX Pro', status: 'COMPLETED' },
    { id: 'wtx-2', walletId: 'wallet-techstore-afrique', type: 'COMMISSION', amount: 1600, balanceBefore: 2160000, balanceAfter: 2158400, reference: 'commission-1', description: 'Commission plateforme 1%', status: 'COMPLETED' },
    { id: 'wtx-3', walletId: 'wallet-saveur-dabidjan', type: 'PAYMENT', amount: 9500, balanceBefore: 1000000, balanceAfter: 1009500, reference: 'CMD-2026-001', description: 'Vente plats', status: 'COMPLETED' },
  ];
  for (const t of txs) {
    await prisma.walletTransaction.upsert({
      where: { id: t.id }, update: {},
      create: { id: t.id, walletId: t.walletId, type: t.type, amount: t.amount, balanceBefore: t.balanceBefore, balanceAfter: t.balanceAfter, currency: 'FCFA', reference: t.reference, description: t.description, status: t.status },
    });
  }
  console.log(`✓ ${txs.length} transactions wallet`);
}

// ============================================================
// 11. CONTENU PLATEFORME (FAQ, témoignages, stats — alimente l accueil)
// ============================================================
async function seedCms() {
  const faqs: any[] = [
    { id: 'faq-1', question: 'Comment créer mon business sur AfriBiz ?', answer: 'Inscrivez-vous, activez votre espace business, puis remplissez votre profil et vos produits. Votre page publique est générée automatiquement.', sortOrder: 1 },
    { id: 'faq-2', question: 'Quels moyens de paiement sont acceptés ?', answer: 'Mobile Money (Orange, Wave), espèces et paiement sécurisé via notre système de séquestre escrow.', sortOrder: 2 },
    { id: 'faq-3', question: 'Que se passe-t-il si un vendeur ne livre pas ?', answer: 'L argent reste bloqué sur le compte séquestre jusqu à la confirmation de livraison. Vous êtes remboursé en cas de litige.', sortOrder: 3 },
    { id: 'faq-4', question: 'Comment devenir développeur et publier un module ?', answer: 'Activez votre espace développeur, soumettez votre module. Après validation, il est disponible sur le marketplace.', sortOrder: 4 },
    { id: 'faq-5', question: 'Combien coûte AfriBiz ?', answer: 'Le plan Gratuit est sans frais. AfriBiz à 5 000 FCFA/mois débloque les fonctionnalités avancées.', sortOrder: 5 },
  ];
  for (const f of faqs) {
    await prisma.faqEntry.upsert({ where: { id: f.id }, update: {}, create: { id: f.id, ...f, isPublished: true } });
  }

  const testimonials: any[] = [
    { id: 'tm-1', name: 'Awa Coulibaly', title: 'Cliente fidèle', company: 'Saveur d\'Abidjan', content: 'Je commande chaque semaine, livraison toujours rapide et plats excellents.', rating: 5, isFeatured: true, isPublished: true, sortOrder: 1 },
    { id: 'tm-2', name: 'Ismaël Bamba', title: 'Gérant', company: 'Saveur d\'Abidjan', content: 'AfriBiz m a permis de doubler mes commandes en ligne en 3 mois.', rating: 5, isFeatured: true, isPublished: true, sortOrder: 2 },
    { id: 'tm-3', name: 'Lydia Owusu', title: 'Fondatrice', company: 'TechStore Afrique', content: 'Le système de séquestre rassure mes clients. Les ventes ont explosé.', rating: 5, isFeatured: true, isPublished: true, sortOrder: 3 },
    { id: 'tm-4', name: 'Fatou Ndiaye', title: 'Cliente', company: 'Hôtel Palmier', content: 'Réservation de chambre en 2 minutes, paiement sécurisé. Parfait.', rating: 4, isFeatured: true, isPublished: true, sortOrder: 4 },
    { id: 'tm-5', name: 'Mamadou Traoré', title: 'Développeur', company: 'DevPro CI', content: 'Le marketplace m a permis de vendre mes modules à des dizaines de business.', rating: 5, isFeatured: true, isPublished: true, sortOrder: 5 },
  ];
  for (const t of testimonials) {
    await prisma.testimonial.upsert({ where: { id: t.id }, update: {}, create: { id: t.id, ...t } });
  }

  const stats: any[] = [
    { key: 'businesses', label: 'Business actifs', value: '1 250+', suffix: '', isActive: true, sortOrder: 1 },
    { key: 'users', label: 'Utilisateurs', value: '8 500+', suffix: '', isActive: true, sortOrder: 2 },
    { key: 'orders', label: 'Commandes traitées', value: '45 000+', suffix: '', isActive: true, sortOrder: 3 },
    { key: 'countries', label: 'Pays couverts', value: '12', suffix: '', isActive: true, sortOrder: 4 },
  ];
  for (const s of stats) {
    await prisma.siteStat.upsert({ where: { key: s.key }, update: {}, create: { id: `stat-${s.key}`, ...s } });
  }
  console.log(`✓ CMS : ${faqs.length} FAQ + ${testimonials.length} témoignages + ${stats.length} stats`);
}

// ============================================================
// 10b. CRM (segments dynamiques, pipeline + deals, tags, notes, automation)
// Chaque segment/deal/règle est lié à un vrai business et à de vrais clients.
// ============================================================
async function seedCrm() {
  // ── TAGS ──
  const tags: any[] = [
    // Resto
    { id: 'tag-res-1', businessId: B.RESTO, name: 'VIP', color: '#f59e0b' },
    { id: 'tag-res-2', businessId: B.RESTO, name: 'Livraison fréquente', color: '#10b981' },
    { id: 'tag-res-3', businessId: B.RESTO, name: 'Nouveau', color: '#6366f1' },
    // Boutique
    { id: 'tag-bout-1', businessId: B.BOUTIQUE, name: 'VIP', color: '#f59e0b' },
    { id: 'tag-bout-2', businessId: B.BOUTIQUE, name: 'High-tech', color: '#8b5cf6' },
    // Salon
    { id: 'tag-sal-1', businessId: B.SALON, name: 'Fidèle', color: '#ec4899' },
    // Hôtel
    { id: 'tag-hot-1', businessId: B.HOTEL, name: 'Entreprise', color: '#0ea5e9' },
    // Events
    { id: 'tag-evt-1', businessId: B.EVENTS, name: 'Pass VIP', color: '#f97316' },
  ];
  for (const t of tags) {
    await prisma.businessTag.upsert({ where: { id: t.id }, update: {}, create: t });
  }

  // ── Assignation tags → vrais clients ──
  const tagAssignments: any[] = [
    // Resto : Awa (VIP, livraison fréquente), Kofi (nouveau), Aminata (nouveau)
    { clientId: 'bc-res-1', tagId: 'tag-res-1' },
    { clientId: 'bc-res-1', tagId: 'tag-res-2' },
    { clientId: 'bc-res-2', tagId: 'tag-res-3' },
    { clientId: 'bc-res-3', tagId: 'tag-res-3' },
    // Boutique : Kofi (VIP, high-tech), Fatou (high-tech)
    { clientId: 'bc-bout-1', tagId: 'tag-bout-1' },
    { clientId: 'bc-bout-1', tagId: 'tag-bout-2' },
    { clientId: 'bc-bout-2', tagId: 'tag-bout-2' },
    // Salon : Awa (fidèle)
    { clientId: 'bc-sal-1', tagId: 'tag-sal-1' },
    // Hôtel : Fatou (entreprise)
    { clientId: 'bc-hot-1', tagId: 'tag-hot-1' },
    // Events : Fatou (pass VIP)
    { clientId: 'bc-evt-1', tagId: 'tag-evt-1' },
  ];
  for (const a of tagAssignments) {
    await prisma.businessClientTag.upsert({
      where: { clientId_tagId: { clientId: a.clientId, tagId: a.tagId } },
      update: {},
      create: a,
    });
  }

  // ── NOTES CLIENTS (écrites par le business, liées à un vrai client) ──
  const notes: any[] = [
    { id: 'nt-res-1', businessClientId: 'bc-res-1', content: 'Préfère la livraison avant 13h. Client VIP à fidéliser.', createdBy: U.OWNER_RESTO, createdAt: new Date('2026-07-01') },
    { id: 'nt-res-2', businessClientId: 'bc-res-2', content: 'A découvert le resto via recommandation — offrir un dessert la prochaine fois.', createdBy: U.OWNER_RESTO, createdAt: new Date('2026-07-03') },
    { id: 'nt-bout-1', businessClientId: 'bc-bout-1', content: 'Achète les flagships dès la sortie. Sensible aux bundles.', createdBy: U.OWNER_BOUTIQUE, createdAt: new Date('2026-06-25') },
    { id: 'nt-bout-2', businessClientId: 'bc-bout-2', content: 'Client de Dakar — vérifier les frais de livraison avant envoi.', createdBy: U.OWNER_BOUTIQUE, createdAt: new Date('2026-06-30') },
    { id: 'nt-hot-1', businessClientId: 'bc-hot-1', content: 'Vient souvent pour séminaires — proposer le forfait entreprise.', createdBy: U.OWNER_HOTEL, createdAt: new Date('2026-08-02') },
  ];
  for (const n of notes) {
    await prisma.clientNote.upsert({ where: { id: n.id }, update: {}, create: n });
  }

  // ── SEGMENTS DYNAMIQUES (recalculés par recalculateAllDynamicSegments) ──
  const segments: any[] = [
    // Resto
    { id: 'seg-res-1', businessId: B.RESTO, name: 'VIP (>20k FCFA)', description: 'Clients ayant dépensé plus de 20 000 FCFA', color: '#f59e0b', isDynamic: true, conditions: { minSpent: 20000 } },
    { id: 'seg-res-2', businessId: B.RESTO, name: 'Fidèles (2+ commandes)', description: 'Clients ayant commandé au moins 2 fois', color: '#10b981', isDynamic: true, conditions: { minOrders: 2 } },
    { id: 'seg-res-3', businessId: B.RESTO, name: 'Actifs 30 jours', description: 'Clients ayant commandé dans les 30 derniers jours', color: '#6366f1', isDynamic: true, conditions: { lastOrderDays: 30 } },
    // Boutique
    { id: 'seg-bout-1', businessId: B.BOUTIQUE, name: 'Gros acheteurs (>100k)', description: 'Plus de 100 000 FCFA dépensés', color: '#8b5cf6', isDynamic: true, conditions: { minSpent: 100000 } },
    { id: 'seg-bout-2', businessId: B.BOUTIQUE, name: 'High-tech', description: 'Achètent des accessoires tech', color: '#0ea5e9', isDynamic: false },
    // Salon
    { id: 'seg-sal-1', businessId: B.SALON, name: 'Fidèles', description: '2+ visites ou 1+ commande', color: '#ec4899', isDynamic: true, conditions: { minOrders: 1 } },
  ];
  for (const s of segments) {
    await prisma.clientSegment.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, businessId: s.businessId, name: s.name, description: s.description, color: s.color, isDynamic: s.isDynamic, conditions: s.conditions },
    });
  }

  // ── Assignation segments → vrais clients (basée sur les VRAIES données seedées) ──
  const segmentAssignments: any[] = [
    // Resto : Awa = VIP + Fidèle ; Kofi = Fidèle ; Aminata = Actif
    { segmentId: 'seg-res-1', clientId: 'bc-res-1' },
    { segmentId: 'seg-res-2', clientId: 'bc-res-1' },
    { segmentId: 'seg-res-2', clientId: 'bc-res-2' },
    { segmentId: 'seg-res-3', clientId: 'bc-res-3' },
    // Boutique : Kofi = Gros acheteur ; Fatou = High-tech
    { segmentId: 'seg-bout-1', clientId: 'bc-bout-1' },
    { segmentId: 'seg-bout-2', clientId: 'bc-bout-1' },
    { segmentId: 'seg-bout-2', clientId: 'bc-bout-2' },
    // Salon : Awa = Fidèle
    { segmentId: 'seg-sal-1', clientId: 'bc-sal-1' },
  ];
  for (const s of segmentAssignments) {
    await prisma.segmentClient.upsert({
      where: { segmentId_clientId: { segmentId: s.segmentId, clientId: s.clientId } },
      update: {},
      create: s,
    });
  }

  // ── PIPELINE : étapes par défaut + deals réels ──
  const stageDefs: any[] = [
    { name: 'Nouveau', order: 0, color: '#6366f1' },
    { name: 'Qualifié', order: 1, color: '#8b5cf6' },
    { name: 'Proposition', order: 2, color: '#ec4899' },
    { name: 'Négociation', order: 3, color: '#f59e0b' },
    { name: 'Gagné', order: 4, color: '#10b981' },
    { name: 'Perdu', order: 5, color: '#ef4444' },
  ];
  for (const bizId of [B.RESTO, B.BOUTIQUE, B.HOTEL, B.BTP]) {
    for (const [i, st] of stageDefs.entries()) {
      const id = `pst-${bizId.slice(-2)}-${i}`;
      await prisma.pipelineStage.upsert({
        where: { id },
        update: {},
        create: { id, businessId: bizId, name: st.name, order: st.order, color: st.color },
      });
    }
  }

  // Deals réels : BTP (gros contrats), Resto (traiteurs), Boutique (B2B), Hôtel (séminaires)
  const deals: any[] = [
    // Resto : traiteur pour une entreprise
    { id: 'dl-res-1', businessId: B.RESTO, stageId: 'pst-20-3', clientName: 'Awa Coulibaly', clientEmail: 'client1@afribiz.com', title: 'Traiteur événement famille (25 pers.)', value: 175000, source: 'REFERRAL', probability: 70, expectedCloseDate: new Date('2026-09-01'), createdAt: new Date('2026-07-15'), tags: ['traiteur'] },
    // Boutique : B2B lot de smartphones
    { id: 'dl-bout-1', businessId: B.BOUTIQUE, stageId: 'pst-23-2', clientName: 'Kofi Mensah', clientEmail: 'client2@afribiz.com', title: 'Lot 10 smartphones TechX Pro (entreprise)', value: 1400000, source: 'DIRECT', probability: 50, expectedCloseDate: new Date('2026-09-15'), createdAt: new Date('2026-07-20'), tags: ['B2B'] },
    { id: 'dl-bout-2', businessId: B.BOUTIQUE, stageId: 'pst-23-4', clientName: 'Fatou Ndiaye', clientEmail: 'client3@afribiz.com', title: 'Casques Bluetooth × 20 (team building)', value: 500000, source: 'SOCIAL_MEDIA', probability: 100, expectedCloseDate: new Date('2026-08-10'), wonAt: new Date('2026-08-05'), createdAt: new Date('2026-07-10'), tags: ['B2B'] },
    // Hôtel : séminaire entreprise
    { id: 'dl-hot-1', businessId: B.HOTEL, stageId: 'pst-22-3', clientName: 'Fatou Ndiaye', clientEmail: 'client3@afribiz.com', title: 'Séminaire 2 jours (40 pers.)', value: 1200000, source: 'WEBSITE', probability: 60, expectedCloseDate: new Date('2026-10-01'), createdAt: new Date('2026-07-25'), tags: ['séminaire'] },
    // BTP : gros chantier
    { id: 'dl-btp-1', businessId: B.BTP, stageId: 'pst-24-1', clientName: 'Jean Kouadio', clientEmail: 'client4@afribiz.com', title: 'Construction villa R+2 (Bouaké)', value: 25000000, source: 'REFERRAL', probability: 35, expectedCloseDate: new Date('2026-12-01'), createdAt: new Date('2026-07-05'), tags: ['chantier'] },
  ];
  for (const d of deals) {
    await prisma.deal.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, businessId: d.businessId, stageId: d.stageId, clientName: d.clientName, clientEmail: d.clientEmail, title: d.title, value: d.value, source: d.source as any, probability: d.probability, expectedCloseDate: d.expectedCloseDate, wonAt: d.wonAt, createdAt: d.createdAt, tags: d.tags },
    });
  }

  // ── AUTOMATION RULES (déclenchées par RuleEngineService sur événements réels) ──
  const rules: any[] = [
    // Resto : notifier le gérant à chaque commande + féliciter les nouveaux clients
    { id: 'ar-res-1', businessId: B.RESTO, name: 'Alerte nouvelle commande', description: 'Notifier le gérant quand une commande est passée', trigger: 'ORDER_PLACED', conditions: [], actionType: 'SEND_NOTIFICATION', actionConfig: { title: '🛎️ Nouvelle commande', description: 'Une nouvelle commande vient d être passée', link: '/dashboard/business/orders' }, status: 'ACTIVE' },
    { id: 'ar-res-2', businessId: B.RESTO, name: 'Bienvenue nouveau client', description: 'Notifier et tagger les nouveaux clients', trigger: 'NEW_CLIENT', conditions: [], actionType: 'ASSIGN_TAG', actionConfig: { tagName: 'Nouveau' }, status: 'ACTIVE' },
    // Boutique : alerte stock bas + relance paiement
    { id: 'ar-bout-1', businessId: B.BOUTIQUE, name: 'Alerte stock bas', description: 'Prévenir quand un produit passe sous le seuil', trigger: 'STOCK_LOW', conditions: [], actionType: 'SEND_NOTIFICATION', actionConfig: { title: '📦 Stock bas', description: 'Un produit passe sous son seuil de stock', link: '/dashboard/products' }, status: 'ACTIVE' },
    { id: 'ar-bout-2', businessId: B.BOUTIQUE, name: 'Merci pour le paiement', description: 'Remercier le client à chaque paiement reçu', trigger: 'PAYMENT_RECEIVED', conditions: [], actionType: 'SEND_NOTIFICATION', actionConfig: { title: '💳 Paiement reçu', description: 'Merci pour votre confiance !', link: '/dashboard' }, status: 'ACTIVE' },
    // Hôtel : relance après réservation
    { id: 'ar-hot-1', businessId: B.HOTEL, name: 'Confirmation réservation', description: 'Confirmer au client quand une réservation est faite', trigger: 'BOOKING_MADE', conditions: [], actionType: 'SEND_EMAIL', actionConfig: { subject: 'Réservation confirmée', template: 'booking-confirmation' }, status: 'ACTIVE' },
  ];
  for (const r of rules) {
    await prisma.automationRule.upsert({
      where: { id: r.id },
      update: {},
      create: { id: r.id, businessId: r.businessId, name: r.name, description: r.description, trigger: r.trigger as any, conditions: r.conditions, actionType: r.actionType as any, actionConfig: r.actionConfig, status: 'ACTIVE' as any },
    });
  }

  console.log('✓ CRM : tags + notes + segments dynamiques + pipeline (deals) + automation rules');
}

// ============================================================
// 11. OPÉRATIONS MÉTIER (chaque page de la sidebar business est alimentée)
// Employés, Planning, Livraisons, Dettes, Devis/Factures, Promotions/Coupons,
// Billets événement, Partenaires, CRM clients, Documents.
// ============================================================
async function seedOperations() {
  // ── 1. EMPLOYÉS (module Employés) ──
  const employees: any[] = [
    // RESTO
    { id: 'emp-res-1', businessId: B.RESTO, firstName: 'Adjoua', lastName: 'Kouassi', phone: '+2250701010101', position: 'Cheffe de cuisine', department: 'Cuisine', salary: 150000, hireDate: new Date('2024-01-15') },
    { id: 'emp-res-2', businessId: B.RESTO, firstName: 'Yao', lastName: 'N\'Guessan', phone: '+2250701010102', position: 'Serveur', department: 'Salle', salary: 90000, hireDate: new Date('2024-03-01') },
    { id: 'emp-res-3', businessId: B.RESTO, firstName: 'Serge', lastName: 'Aka', phone: '+2250701010103', position: 'Livreur', department: 'Livraison', salary: 85000, hireDate: new Date('2024-06-10') },
    // SALON
    { id: 'emp-sal-1', businessId: B.SALON, firstName: 'Fatou', lastName: 'Diagne', phone: '+221771010101', position: 'Coiffeuse senior', department: 'Coiffure', salary: 120000, hireDate: new Date('2024-02-01') },
    { id: 'emp-sal-2', businessId: B.SALON, firstName: 'Aïcha', lastName: 'Ba', phone: '+221771010102', position: 'Esthéticienne', department: 'Soins', salary: 110000, hireDate: new Date('2024-04-15') },
    // HOTEL
    { id: 'emp-hot-1', businessId: B.HOTEL, firstName: 'Grâce', lastName: 'Kouamé', phone: '+2250702020201', position: 'Réceptionniste', department: 'Réception', salary: 130000, hireDate: new Date('2023-09-01') },
    { id: 'emp-hot-2', businessId: B.HOTEL, firstName: 'Mariam', lastName: 'Traoré', phone: '+2250702020202', position: 'Gouvernante', department: 'Housekeeping', salary: 100000, hireDate: new Date('2023-11-20') },
    // BOUTIQUE
    { id: 'emp-bout-1', businessId: B.BOUTIQUE, firstName: 'Kwame', lastName: 'Asante', phone: '+233202030301', position: 'Vendeur principal', department: 'Vente', salary: 95000, hireDate: new Date('2024-05-01') },
    { id: 'emp-bout-2', businessId: B.BOUTIQUE, firstName: 'Efua', lastName: 'Mensah', phone: '+233202030302', position: 'Logisticienne', department: 'Stock', salary: 88000, hireDate: new Date('2024-07-12') },
    // BTP
    { id: 'emp-btp-1', businessId: B.BTP, firstName: 'Ibrahim', lastName: 'Touré', phone: '+2250703030301', position: 'Chef de chantier', department: 'Chantier', salary: 220000, hireDate: new Date('2023-05-10') },
    { id: 'emp-btp-2', businessId: B.BTP, firstName: 'Lassina', lastName: 'Ouattara', phone: '+2250703030302', position: 'Maçon', department: 'Chantier', salary: 140000, hireDate: new Date('2023-08-15') },
    // EVENTS
    { id: 'emp-evt-1', businessId: B.EVENTS, firstName: 'Boris', lastName: 'Dossou', phone: '+22997010101', position: 'Coordinateur événementiel', department: 'Production', salary: 160000, hireDate: new Date('2024-01-20') },
    { id: 'emp-evt-2', businessId: B.EVENTS, firstName: 'Gaston', lastName: 'Ahouansou', phone: '+22997010102', position: 'Technicien son & lumière', department: 'Technique', salary: 120000, hireDate: new Date('2024-06-01') },
  ];
  for (const e of employees) {
    await prisma.employee.upsert({ where: { id: e.id }, update: {}, create: { id: e.id, ...e, status: 'ACTIVE' as any, isActive: true } });
  }

  // ── 2. PLANNING & TÂCHES (modules Planning / Tâches avancées) ──
  await prisma.taskCategory.upsert({ where: { id: 'tc-btp-1' }, update: {}, create: { id: 'tc-btp-1', businessId: B.BTP, name: 'Construction', color: '#0f766e' } });
  await prisma.taskCategory.upsert({ where: { id: 'tc-btp-2' }, update: {}, create: { id: 'tc-btp-2', businessId: B.BTP, name: 'Rénovation', color: '#b45309' } });
  await prisma.taskCategory.upsert({ where: { id: 'tc-res-1' }, update: {}, create: { id: 'tc-res-1', businessId: B.RESTO, name: 'Cuisine', color: '#dc2626' } });
  await prisma.taskCategory.upsert({ where: { id: 'tc-evt-1' }, update: {}, create: { id: 'tc-evt-1', businessId: B.EVENTS, name: 'Préparation', color: '#7c3aed' } });

  const tasks: any[] = [
    // RESTO : tâche liée à une commande (préparation CMD-2026-002)
    { id: 'ptk-1', businessId: B.RESTO, title: 'Préparer commande CMD-2026-002', orderId: 'ord-2', assigneeId: 'emp-res-1', categoryId: 'tc-res-1', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: new Date('2026-08-06T11:00:00Z'), description: 'Mafé poulet + bissap, prévoir le packaging.', requiresValidation: true },
    { id: 'ptk-2', businessId: B.RESTO, title: 'Nettoyage cuisine hebdomadaire', assigneeId: 'emp-res-2', categoryId: 'tc-res-1', priority: 'MEDIUM', status: 'TODO', dueDate: new Date('2026-08-07T08:00:00Z'), notes: 'Désinfection complète des plans de travail.' },
    // SALON : tâche liée à une réservation
    { id: 'ptk-3', businessId: B.SALON, title: 'Préparer matériel manucure RSV-2026-001', bookingId: 'bk-1', assigneeId: 'emp-sal-2', priority: 'MEDIUM', status: 'TODO', dueDate: new Date('2026-07-20T09:00:00Z') },
    // HOTEL : tâche liée à une réservation (séjour Deluxe)
    { id: 'ptk-4', businessId: B.HOTEL, title: 'Préparer suite Deluxe RSV-2026-003', bookingId: 'bk-3', assigneeId: 'emp-hot-2', priority: 'HIGH', status: 'TODO', dueDate: new Date('2026-08-01T12:00:00Z') },
    // BTP : tâches avancées (module ADVANCED_TASKS)
    { id: 'ptk-5', businessId: B.BTP, title: 'Coulage dalle villa R+1 Cocody', categoryId: 'tc-btp-1', assigneeId: 'emp-btp-1', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: new Date('2026-08-10T07:00:00Z'), estimatedHours: 8, clientName: 'Jean Kouadio', requiresPhoto: true, description: 'Dalle 120 m², béton dosé 350 kg/m³.' },
    { id: 'ptk-6', businessId: B.BTP, title: 'Électricité phase 2 immeuble Yopougon', categoryId: 'tc-btp-2', assigneeId: 'emp-btp-2', priority: 'MEDIUM', status: 'TODO', dueDate: new Date('2026-08-14T08:00:00Z'), estimatedHours: 12, requiresValidation: true },
    // EVENTS : préparation du concert
    { id: 'ptk-7', businessId: B.EVENTS, title: 'Montage scène Concert Afrique', categoryId: 'tc-evt-1', assigneeId: 'emp-evt-2', priority: 'HIGH', status: 'TODO', dueDate: new Date('2026-08-15T12:00:00Z'), estimatedHours: 6 },
    { id: 'ptk-8', businessId: B.EVENTS, title: 'Sécurité & accueil participants', categoryId: 'tc-evt-1', assigneeId: 'emp-evt-1', priority: 'MEDIUM', status: 'TODO', dueDate: new Date('2026-08-15T14:00:00Z'), clientName: 'Concert Afrique Festival' },
  ];
  for (const t of tasks) {
    await prisma.planningTask.upsert({ where: { id: t.id }, update: {}, create: { id: t.id, ...t } });
  }

  // ── 2b. CONGÉS & PAIES (module Employés : Leave + Payroll) ──
  const leaves: any[] = [
    { id: 'lv-res-1', businessId: B.RESTO, employeeId: 'emp-res-2', type: 'VACATION', startDate: new Date('2026-07-01T00:00:00Z'), endDate: new Date('2026-07-07T00:00:00Z'), reason: 'Vacances familiales', status: 'APPROVED', approvedAt: new Date('2026-06-20T10:00:00Z') },
    { id: 'lv-res-2', businessId: B.RESTO, employeeId: 'emp-res-1', type: 'SICK', startDate: new Date('2026-07-15T00:00:00Z'), endDate: new Date('2026-07-16T00:00:00Z'), reason: 'Repos médical', status: 'APPROVED', approvedAt: new Date('2026-07-14T09:00:00Z') },
    { id: 'lv-res-3', businessId: B.RESTO, employeeId: 'emp-res-3', type: 'PERSONAL', startDate: new Date('2026-08-10T00:00:00Z'), endDate: new Date('2026-08-12T00:00:00Z'), reason: 'Démarches administratives', status: 'PENDING' },
    { id: 'lv-sal-1', businessId: B.SALON, employeeId: 'emp-sal-1', type: 'VACATION', startDate: new Date('2026-08-01T00:00:00Z'), endDate: new Date('2026-08-05T00:00:00Z'), reason: 'Congés annuels', status: 'APPROVED', approvedAt: new Date('2026-07-25T11:00:00Z') },
    { id: 'lv-btp-1', businessId: B.BTP, employeeId: 'emp-btp-1', type: 'VACATION', startDate: new Date('2026-08-15T00:00:00Z'), endDate: new Date('2026-08-22T00:00:00Z'), reason: 'Congés payés', status: 'PENDING' },
  ];
  for (const lv of leaves) {
    await prisma.leave.upsert({ where: { id: lv.id }, update: {}, create: lv });
  }

  const payrolls: any[] = [
    // RESTO : paie de juillet 2026
    { id: 'pr-res-1', businessId: B.RESTO, employeeId: 'emp-res-1', periodStart: new Date('2026-07-01T00:00:00Z'), periodEnd: new Date('2026-07-31T00:00:00Z'), baseSalary: 150000, bonuses: 15000, deductions: 5000, netAmount: 160000, status: 'PAID', paidAt: new Date('2026-07-31T12:00:00Z') },
    { id: 'pr-res-2', businessId: B.RESTO, employeeId: 'emp-res-2', periodStart: new Date('2026-07-01T00:00:00Z'), periodEnd: new Date('2026-07-31T00:00:00Z'), baseSalary: 90000, bonuses: 8000, deductions: 3000, netAmount: 95000, status: 'PAID', paidAt: new Date('2026-07-31T12:00:00Z') },
    { id: 'pr-res-3', businessId: B.RESTO, employeeId: 'emp-res-3', periodStart: new Date('2026-07-01T00:00:00Z'), periodEnd: new Date('2026-07-31T00:00:00Z'), baseSalary: 85000, bonuses: 5000, deductions: 2000, netAmount: 88000, status: 'DRAFT' },
    // SALON : paie de juillet
    { id: 'pr-sal-1', businessId: B.SALON, employeeId: 'emp-sal-1', periodStart: new Date('2026-07-01T00:00:00Z'), periodEnd: new Date('2026-07-31T00:00:00Z'), baseSalary: 120000, bonuses: 20000, deductions: 4000, netAmount: 136000, status: 'PAID', paidAt: new Date('2026-07-31T12:00:00Z') },
    // BOUTIQUE : paie de juillet
    { id: 'pr-bout-1', businessId: B.BOUTIQUE, employeeId: 'emp-bout-1', periodStart: new Date('2026-07-01T00:00:00Z'), periodEnd: new Date('2026-07-31T00:00:00Z'), baseSalary: 95000, bonuses: 10000, deductions: 2500, netAmount: 102500, status: 'PAID', paidAt: new Date('2026-07-31T12:00:00Z') },
  ];
  for (const p of payrolls) {
    await prisma.payroll.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  // ── 2c. ACTIVITÉS EMPLOYÉS (page Activités : journal des actions) ──
  const activities: any[] = [
    { id: 'act-1', businessId: B.RESTO, employeeId: 'emp-res-1', action: 'CREATE', module: 'Commandes', description: 'Préparer commande CMD-2026-002 (préparation)', createdAt: new Date('2026-08-06T09:12:00Z') },
    { id: 'act-2', businessId: B.RESTO, employeeId: 'emp-res-2', action: 'CLOCK_IN', module: 'Pointage', description: 'Arrivée 08:02', createdAt: new Date('2026-08-06T08:02:00Z') },
    { id: 'act-3', businessId: B.RESTO, employeeId: 'emp-res-3', action: 'CLOCK_IN', module: 'Pointage', description: 'Départ livraison Cocody', createdAt: new Date('2026-08-06T10:15:00Z') },
    { id: 'act-4', businessId: B.RESTO, employeeId: 'emp-res-1', action: 'UPDATE', module: 'Menu', description: 'Mise à jour prix Attiéké', createdAt: new Date('2026-08-05T16:40:00Z') },
    { id: 'act-5', businessId: B.RESTO, employeeId: 'emp-res-2', action: 'CLOCK_OUT', module: 'Pointage', description: 'Départ 15:00', createdAt: new Date('2026-08-05T15:00:00Z') },
    { id: 'act-6', businessId: B.SALON, employeeId: 'emp-sal-1', action: 'CREATE', module: 'Réservations', description: 'Confirmation rendez-vous RSV-2026-001', createdAt: new Date('2026-07-19T11:30:00Z') },
    { id: 'act-7', businessId: B.BTP, employeeId: 'emp-btp-1', action: 'UPDATE', module: 'Tâches', description: 'Coulage dalle villa R+1 : avancement 60%', createdAt: new Date('2026-08-06T07:45:00Z') },
    { id: 'act-8', businessId: B.EVENTS, employeeId: 'emp-evt-1', action: 'CREATE', module: 'Événements', description: 'Plan de sécurité Concert Afrique', createdAt: new Date('2026-08-05T14:20:00Z') },
  ];
  for (const a of activities) {
    await prisma.employeeActivity.create({ data: a });
  }

  // ── 3. LIVRAISONS (module Livraisons : zones + livreurs + livraisons) ──
  const zones: any[] = [
    { id: 'dz-res-1', businessId: B.RESTO, name: 'Cocody', fee: 1000, minOrder: 2000, estimatedTime: 30, isActive: true },
    { id: 'dz-res-2', businessId: B.RESTO, name: 'Plateau', fee: 1500, minOrder: 3000, estimatedTime: 40, isActive: true },
    { id: 'dz-res-3', businessId: B.RESTO, name: 'Yopougon', fee: 2000, minOrder: 5000, estimatedTime: 55, isActive: true },
    { id: 'dz-bout-1', businessId: B.BOUTIQUE, name: 'Accra Centre', fee: 2000, minOrder: 10000, estimatedTime: 45, isActive: true },
    { id: 'dz-bout-2', businessId: B.BOUTIQUE, name: 'East Legon', fee: 2500, minOrder: 15000, estimatedTime: 60, isActive: true },
  ];
  for (const z of zones) {
    await prisma.deliveryZone.upsert({ where: { id: z.id }, update: {}, create: { id: z.id, ...z } });
  }
  const drivers: any[] = [
    { id: 'drv-res-1', businessId: B.RESTO, name: 'Serge Aka', phone: '+2250701010103', vehicleType: 'MOTORCYCLE' as any, status: 'AVAILABLE' as any, zones: ['Cocody', 'Plateau'] },
    { id: 'drv-bout-1', businessId: B.BOUTIQUE, name: 'Kojo Boateng', phone: '+233202030303', vehicleType: 'MOTORCYCLE' as any, status: 'AVAILABLE' as any, zones: ['Accra Centre'] },
  ];
  for (const d of drivers) {
    await prisma.driver.upsert({ where: { id: d.id }, update: {}, create: { id: d.id, ...d } });
  }
  const deliveries: any[] = [
    { id: 'dlv-1', businessId: B.RESTO, orderId: 'ord-1', deliveryNumber: 'LIV-2026-001', status: 'DELIVERED' as any, address: 'Angré 7e tranche, Abidjan', city: 'Abidjan', zoneId: 'dz-res-1', zoneName: 'Cocody', fee: 1000, recipientName: 'Awa Coulibaly', recipientPhone: '+2250100000002', driverId: 'drv-res-1', deliveredAt: new Date('2026-06-15T13:00:00Z') },
    { id: 'dlv-2', businessId: B.RESTO, orderId: 'ord-3', deliveryNumber: 'LIV-2026-002', status: 'PREPARING' as any, address: 'Bamako, Faladié', city: 'Bamako', zoneId: null, zoneName: 'Hors zone', fee: 0, recipientName: 'Aminata Koné', recipientPhone: '+22370000001', scheduledAt: new Date('2026-08-06T18:00:00Z') },
    { id: 'dlv-3', businessId: B.BOUTIQUE, orderId: 'ord-4', deliveryNumber: 'LIV-2026-003', status: 'DELIVERED' as any, address: 'Osu, Accra', city: 'Accra', zoneId: 'dz-bout-1', zoneName: 'Accra Centre', fee: 2000, recipientName: 'Kofi Mensah', recipientPhone: '+233202020202', driverId: 'drv-bout-1', deliveredAt: new Date('2026-06-22T15:30:00Z') },
  ];
  for (const d of deliveries) {
    await prisma.delivery.upsert({ where: { deliveryNumber: d.deliveryNumber }, update: {}, create: { id: d.id, ...d } });
  }

  // ── 4. DETTES (module Créances) ──
  const debts: any[] = [
    { id: 'debt-1', businessId: B.RESTO, buyerId: U.CLIENT_5, orderId: 'ord-3', totalAmount: 3500, amountPaid: 0, remainingAmount: 3500, currency: 'FCFA', dueDate: new Date('2026-08-20'), status: 'ACTIVE' as any, priority: 'MEDIUM' as any, sourceType: 'ORDER' as any, notes: 'Commande livrée à Bamako, paiement à la livraison attendu.' },
    { id: 'debt-2', businessId: B.BOUTIQUE, buyerId: U.CLIENT_2, totalAmount: 30000, amountPaid: 10000, remainingAmount: 20000, currency: 'FCFA', dueDate: new Date('2026-08-15'), status: 'ACTIVE' as any, priority: 'HIGH' as any, sourceType: 'ORDER' as any, notes: 'Solde du paiement échelonné du casque Bluetooth.' },
  ];
  for (const d of debts) {
    await prisma.debt.upsert({ where: { id: d.id }, update: {}, create: { id: d.id, ...d } });
  }

  // ── 5. DEVIS & FACTURES (module Devis & Factures) ──
  const quotes: any[] = [
    { id: 'qte-1', quoteNumber: 'DEV-2026-001', businessId: B.BTP, clientId: U.CLIENT_4, clientName: 'Jean Kouadio', clientPhone: '+2250100000004', clientEmail: 'client4@afribiz.com', title: 'Devis villa R+1 Cocody', description: 'Construction neuve 4 pièces, hors terrain', items: [{ label: 'Gros œuvre (fondations, dalle, élévation)', qty: 1, unitPrice: 9000000, total: 9000000 }, { label: 'Toiture + charpente', qty: 1, unitPrice: 3500000, total: 3500000 }, { label: 'Finitions (carrelage, peinture)', qty: 1, unitPrice: 2500000, total: 2500000 }], subtotal: 15000000, taxAmount: 0, totalAmount: 15000000, currency: 'FCFA', status: 'SENT' as any, validUntil: new Date('2026-09-01'), notes: 'Devis détaillé suite à votre demande du 08/07.' },
    { id: 'qte-2', quoteNumber: 'DEV-2026-002', businessId: B.RESTO, clientId: U.CLIENT_1, clientName: 'Awa Coulibaly', clientPhone: '+2250100000002', title: 'Traiteur mariage (30 pers.)', description: 'Buffet ivoirien complet', items: [{ label: 'Formule banquet 30 personnes', qty: 30, unitPrice: 8000, total: 240000 }], subtotal: 240000, taxAmount: 0, totalAmount: 240000, currency: 'FCFA', status: 'DRAFT' as any },
  ];
  for (const q of quotes) {
    await prisma.quote.upsert({ where: { quoteNumber: q.quoteNumber }, update: {}, create: { id: q.id, ...q } });
  }
  const invoices: any[] = [
    { id: 'inv-1', invoiceNumber: 'FAC-2026-001', businessId: B.BOUTIQUE, clientId: U.CLIENT_3, clientName: 'Fatou Ndiaye', clientPhone: '+221770001122', title: 'Facture casques Bluetooth', items: [{ label: 'Casque Bluetooth Pro x2', qty: 2, unitPrice: 25000, total: 50000 }], subtotal: 50000, taxAmount: 0, totalAmount: 50000, amountPaid: 50000, currency: 'FCFA', status: 'PAID' as any, paidAt: new Date('2026-06-29'), dueDate: new Date('2026-07-15') },
    { id: 'inv-2', invoiceNumber: 'FAC-2026-002', businessId: B.RESTO, clientId: U.CLIENT_2, clientName: 'Kofi Mensah', clientPhone: '+233202020202', title: 'Facture repas entreprise (juillet)', items: [{ label: 'Packs déjeuner entreprise (juillet)', qty: 20, unitPrice: 5000, total: 100000 }], subtotal: 100000, taxAmount: 0, totalAmount: 100000, amountPaid: 0, currency: 'FCFA', status: 'SENT' as any, dueDate: new Date('2026-08-31') },
  ];
  for (const i of invoices) {
    await prisma.invoice.upsert({ where: { invoiceNumber: i.invoiceNumber }, update: {}, create: { id: i.id, ...i } });
  }

  // ── 6. PROMOTIONS & COUPONS (module Promotions) ──
  const promos: any[] = [
    { id: 'pro-1', businessId: B.RESTO, title: 'Semaine du Garba', description: 'Le plat du terroir à -20% toute la semaine', promotionType: 'PERCENTAGE' as any, discountValue: 20, code: 'GARBA20', targetType: 'ALL' as any, startsAt: new Date('2026-08-03'), endsAt: new Date('2026-08-10'), isActive: true, isFeatured: true, badgeLabel: '🔥 Populaire' },
    { id: 'pro-2', businessId: B.BOUTIQUE, title: 'Solde casques audio', description: 'Réduction sur tous les casques Bluetooth', promotionType: 'PERCENTAGE' as any, discountValue: 10, code: 'CASQUE10', targetType: 'ALL' as any, startsAt: new Date('2026-08-01'), endsAt: new Date('2026-08-31'), isActive: true, isFeatured: true, badgeLabel: 'SOLDES' },
    { id: 'pro-3', businessId: B.SALON, title: 'Parrainage bienvenue', description: '-20% pour les nouveaux clients', promotionType: 'PERCENTAGE' as any, discountValue: 20, code: 'WELCOME20', targetType: 'ALL' as any, startsAt: new Date('2026-08-01'), endsAt: new Date('2026-12-31'), isActive: true, isFeatured: false },
  ];
  for (const p of promos) {
    await prisma.promotion.upsert({ where: { id: p.id }, update: {}, create: { id: p.id, ...p } });
  }
  const coupons: any[] = [
    { id: 'cpn-1', businessId: B.RESTO, promotionId: 'pro-1', code: 'GARBA20', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 3000, maxUses: 100, useCount: 37, status: 'ACTIVE' as any, expiresAt: new Date('2026-08-10') },
    { id: 'cpn-2', businessId: B.BOUTIQUE, promotionId: 'pro-2', code: 'CASQUE10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 15000, maxUses: 50, useCount: 12, status: 'ACTIVE' as any, expiresAt: new Date('2026-08-31') },
    { id: 'cpn-3', businessId: B.SALON, promotionId: 'pro-3', clientId: U.CLIENT_3, code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20, maxUses: 1, useCount: 0, isNewCustomer: true, status: 'ACTIVE' as any, expiresAt: new Date('2026-12-31') },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: { id: c.id, ...c } });
  }

  // ── 7. BILLETS & PARTICIPANTS (module Événements) ──
  await prisma.eventTicket.upsert({ where: { id: 'tkt-1' }, update: {}, create: { id: 'tkt-1', eventId: 'ev-evt-1', name: 'Standard', description: 'Accès à la fosse', type: 'STANDARD' as any, price: 10000, currency: 'FCFA', quantity: 500, remaining: 458, benefits: ['Accès fosse'], saleStatus: 'ACTIVE' as any, isActive: true } });
  await prisma.eventTicket.upsert({ where: { id: 'tkt-2' }, update: {}, create: { id: 'tkt-2', eventId: 'ev-evt-1', name: 'VIP', description: 'Accès backstage + espace VIP', type: 'VIP' as any, price: 25000, currency: 'FCFA', quantity: 100, remaining: 78, benefits: ['Backstage', 'Espace VIP'], saleStatus: 'ACTIVE' as any, isActive: true } });
  const participants: any[] = [
    { id: 'ptc-1', eventId: 'ev-evt-1', ticketId: 'tkt-1', clientId: U.CLIENT_3, firstName: 'Fatou', lastName: 'Ndiaye', email: 'client3@afribiz.com', phone: '+221770001122', ticketRef: 'TKT-CONC-001', ticketType: 'STANDARD' as any, price: 20000, isPaid: true, paidAt: new Date('2026-07-08'), status: 'REGISTERED' as any },
    { id: 'ptc-2', eventId: 'ev-evt-1', ticketId: 'tkt-2', clientId: U.CLIENT_1, firstName: 'Awa', lastName: 'Coulibaly', email: 'client1@afribiz.com', phone: '+2250100000002', ticketRef: 'TKT-CONC-002', ticketType: 'VIP' as any, price: 25000, isPaid: true, paidAt: new Date('2026-07-12'), status: 'REGISTERED' as any },
    { id: 'ptc-3', eventId: 'ev-evt-1', ticketId: 'tkt-1', clientId: U.CLIENT_5, firstName: 'Aminata', lastName: 'Koné', email: 'client5@afribiz.com', phone: '+22370000001', ticketRef: 'TKT-CONC-003', ticketType: 'STANDARD' as any, price: 10000, isPaid: false, status: 'REGISTERED' as any },
  ];
  for (const p of participants) {
    await prisma.eventParticipant.upsert({ where: { id: p.id }, update: {}, create: { id: p.id, ...p } });
  }

  // ── 8. PARTENAIRES (module Partenaires) ──
  const partners: any[] = [
    { id: 'ptn-1', businessId: B.BTP, name: 'CimAfrika', description: 'Fournisseur ciment et agrégats', category: 'FOURNISSEUR' as any, type: 'Fournisseur', phone: '+2250704040401', email: 'contact@cimafrika.ci', website: 'https://cimafrika.ci', isActive: true, sortOrder: 1 },
    { id: 'ptn-2', businessId: B.BTP, name: 'Elek CI', description: 'Entreprise d electricite', category: 'TECHNIQUE' as any, type: 'Sous-traitant', phone: '+2250704040402', email: 'contact@elekci.ci', isActive: true, sortOrder: 2 },
  ];
  for (const p of partners) {
    await prisma.partner.upsert({ where: { id: p.id }, update: {}, create: { id: p.id, ...p } });
  }

  // ── 9. CRM CLIENTS (module CRM : chaque business voit ses vrais clients) ──
  const crmClients: any[] = [
    { id: 'bc-res-1', businessId: B.RESTO, clientId: U.CLIENT_1, firstName: 'Awa', lastName: 'Coulibaly', email: 'client1@afribiz.com', phone: '+2250100000002', city: 'Abidjan', totalOrders: 2, totalSpent: 33000, lastOrderAt: new Date('2026-06-15'), visitCount: 6, isActive: true },
    { id: 'bc-res-2', businessId: B.RESTO, clientId: U.CLIENT_2, firstName: 'Kofi', lastName: 'Mensah', email: 'client2@afribiz.com', phone: '+233202020202', city: 'Accra', totalOrders: 1, totalSpent: 6000, lastOrderAt: new Date('2026-07-02'), visitCount: 3, isActive: true },
    { id: 'bc-res-3', businessId: B.RESTO, clientId: U.CLIENT_5, firstName: 'Aminata', lastName: 'Koné', email: 'client5@afribiz.com', phone: '+22370000001', city: 'Bamako', totalOrders: 1, totalSpent: 3500, lastOrderAt: new Date('2026-07-05'), visitCount: 2, isActive: true },
    { id: 'bc-sal-1', businessId: B.SALON, clientId: U.CLIENT_1, firstName: 'Awa', lastName: 'Coulibaly', email: 'client1@afribiz.com', phone: '+2250100000002', city: 'Abidjan', totalOrders: 1, totalSpent: 8000, lastOrderAt: new Date('2026-07-20'), visitCount: 4, isActive: true },
    { id: 'bc-sal-2', businessId: B.SALON, clientId: U.CLIENT_3, firstName: 'Fatou', lastName: 'Ndiaye', email: 'client3@afribiz.com', phone: '+221770001122', city: 'Dakar', totalOrders: 1, totalSpent: 5000, lastOrderAt: new Date('2026-07-25'), visitCount: 2, isActive: true },
    { id: 'bc-hot-1', businessId: B.HOTEL, clientId: U.CLIENT_3, firstName: 'Fatou', lastName: 'Ndiaye', email: 'client3@afribiz.com', phone: '+221770001122', city: 'Dakar', totalOrders: 1, totalSpent: 90000, lastOrderAt: new Date('2026-08-01'), visitCount: 2, isActive: true },
    { id: 'bc-hot-2', businessId: B.HOTEL, clientId: U.CLIENT_1, firstName: 'Awa', lastName: 'Coulibaly', email: 'client1@afribiz.com', phone: '+2250100000002', city: 'Abidjan', totalOrders: 1, totalSpent: 25000, lastOrderAt: new Date('2026-07-10'), visitCount: 1, isActive: true },
    { id: 'bc-bout-1', businessId: B.BOUTIQUE, clientId: U.CLIENT_2, firstName: 'Kofi', lastName: 'Mensah', email: 'client2@afribiz.com', phone: '+233202020202', city: 'Accra', totalOrders: 2, totalSpent: 190000, lastOrderAt: new Date('2026-06-22'), visitCount: 5, isActive: true },
    { id: 'bc-bout-2', businessId: B.BOUTIQUE, clientId: U.CLIENT_3, firstName: 'Fatou', lastName: 'Ndiaye', email: 'client3@afribiz.com', phone: '+221770001122', city: 'Dakar', totalOrders: 1, totalSpent: 50000, lastOrderAt: new Date('2026-06-29'), visitCount: 3, isActive: true },
    { id: 'bc-btp-1', businessId: B.BTP, clientId: U.CLIENT_4, firstName: 'Jean', lastName: 'Kouadio', email: 'client4@afribiz.com', phone: '+2250100000004', city: 'Bouaké', totalOrders: 0, totalSpent: 0, lastOrderAt: null, visitCount: 1, isActive: true },
    { id: 'bc-evt-1', businessId: B.EVENTS, clientId: U.CLIENT_3, firstName: 'Fatou', lastName: 'Ndiaye', email: 'client3@afribiz.com', phone: '+221770001122', city: 'Dakar', totalOrders: 1, totalSpent: 20000, lastOrderAt: new Date('2026-07-08'), visitCount: 2, isActive: true },
  ];
  for (const c of crmClients) {
    await prisma.businessClient.upsert({
      where: { businessId_clientId: { businessId: c.businessId, clientId: c.clientId } },
      update: {},
      create: { id: c.id, businessId: c.businessId, clientId: c.clientId, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, city: c.city, totalOrders: c.totalOrders, totalSpent: c.totalSpent, lastOrderAt: c.lastOrderAt, visitCount: c.visitCount, isActive: true },
    });
  }

  // ── 10. DOCUMENTS (module Documents) ──
  const docs: any[] = [
    { id: 'doc-1', businessId: B.RESTO, type: 'LICENCE' as any, title: 'Licence d exploitation', description: 'Autorisation municipale 2026', fileUrl: '/uploads/documents/licence-resto.pdf', mimeType: 'application/pdf' },
    { id: 'doc-2', businessId: B.RESTO, type: 'CONTRAT' as any, title: 'Assurance responsabilité civile', description: 'Contrat annuel SUNU Assurance', fileUrl: '/uploads/documents/assurance-resto.pdf', mimeType: 'application/pdf', expiresAt: new Date('2027-03-01') },
    { id: 'doc-3', businessId: B.HOTEL, type: 'LICENCE' as any, title: 'Registre de commerce', description: 'RC Abidjan 2026', fileUrl: '/uploads/documents/rc-hotel.pdf', mimeType: 'application/pdf' },
    { id: 'doc-4', businessId: B.BOUTIQUE, type: 'FACTURE' as any, title: 'Facture import TechX (juin)', description: 'Facture fournisseur 250 smartphones', fileUrl: '/uploads/documents/import-techx.pdf', mimeType: 'application/pdf' },
    { id: 'doc-5', businessId: B.BTP, type: 'CONTRAT' as any, title: 'Contrat villa Cocody', description: 'Contrat signé avec J. Kouadio', fileUrl: '/uploads/documents/contrat-villa.pdf', mimeType: 'application/pdf' },
  ];
  for (const d of docs) {
    await prisma.businessDocument.upsert({ where: { id: d.id }, update: {}, create: { id: d.id, ...d } });
  }

  console.log('✓ Opérations métier : ' + employees.length + ' employés, ' + tasks.length + ' tâches, ' + deliveries.length + ' livraisons, ' + debts.length + ' dettes, ' + quotes.length + ' devis, ' + invoices.length + ' factures, ' + promos.length + ' promotions, ' + participants.length + ' participants, ' + partners.length + ' partenaires, ' + crmClients.length + ' clients CRM, ' + docs.length + ' documents');
}

// ============================================================
// 11b. PURGE ANCIEN SEED (.test / test2026 / wen / business fantômes)
// ============================================================
async function purgeLegacyData() {
  // Comptes système à préserver (utilisés par le backend pour les tâches internes)
  const SYSTEM_EMAILS = ['system@afribiz.local', 'system@afribiz.com'];

  // ── 1. Anciens comptes utilisateurs parasites (hors seed réaliste + hors système) ──
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true },
    where: { email: { notIn: SYSTEM_EMAILS } },
  });
  const legacyUserIds = allUsers
    .filter((u) => !ALL_USER_IDS.includes(u.id)) // tout user hors IDs déterministes du seed
    .map((u) => u.id);

  // ── 2. Business fantômes (ancien seed) : TOUS les business hors nouveau seed, sauf ceux du système ──
  const allBiz = await prisma.business.findMany({ select: { id: true, ownerId: true, name: true } });
  const systemOwners = await prisma.user.findMany({
    where: { email: { in: SYSTEM_EMAILS } },
    select: { id: true },
  });
  const systemOwnerIds = systemOwners.map((u) => u.id);
  const legacyBizIds = allBiz
    .filter((b) => !ALL_BIZ_IDS.includes(b.id))
    .filter((b) => !systemOwnerIds.includes(b.ownerId)) // garder AfriBiz System
    .map((b) => b.id);

  if (legacyUserIds.length === 0 && legacyBizIds.length === 0) {
    console.log('--- Aucun résidu d ancien seed détecté ---');
    return;
  }

  // Suppression des données liées (FK-safe : enfants avant parents)
  const userWhere = { userId: { in: legacyUserIds } };
  const bizWhere = { businessId: { in: legacyBizIds } };

  // ── Conversations/messages orphelins de l ancien seed (hors conv du nouveau seed) ──
  const keepConvs = ['conv-1', 'conv-2', 'conv-3'];
  await prisma.message.deleteMany({ where: { conversation: { id: { notIn: keepConvs } } } });
  await prisma.conversationParticipant.deleteMany({ where: { conversation: { id: { notIn: keepConvs } } } });
  await prisma.conversation.deleteMany({ where: { id: { notIn: keepConvs } } });
  // ── Commandes/réservations orphelines (référence nulle, résidus d anciens tests) ──
  await prisma.orderItem.deleteMany({ where: { OR: [{ order: { businessId: null } }, { order: { buyerId: null } }] } });
  await prisma.order.deleteMany({ where: { OR: [{ businessId: null }, { buyerId: null }] } });
  await prisma.booking.deleteMany({ where: { businessId: null } });

  // ── BUSINESS fantômes d abord (FK ownerId → User, enfants en Restrict → ordre critique) ──
  if (legacyBizIds.length) {
    // Enfants profonds d abord
    await prisma.orderItem.deleteMany({ where: { order: { businessId: { in: legacyBizIds } } } });
    await prisma.order.deleteMany({ where: bizWhere });
    await prisma.booking.deleteMany({ where: bizWhere });
    // Avis + favoris pointant vers les produits/services fantômes (FK Restrict)
    const ghostProducts = await prisma.product.findMany({ where: { businessId: { in: legacyBizIds } }, select: { id: true } });
    const ghostServices = await prisma.service.findMany({ where: { businessId: { in: legacyBizIds } }, select: { id: true } });
    const ghostProductIds = ghostProducts.map((p) => p.id);
    const ghostServiceIds = ghostServices.map((s) => s.id);
    if (ghostProductIds.length) {
      await prisma.review.deleteMany({ where: { productId: { in: ghostProductIds } } });
      await prisma.favorite.deleteMany({ where: { productId: { in: ghostProductIds } } });
    }
    if (ghostServiceIds.length) {
      await prisma.review.deleteMany({ where: { serviceId: { in: ghostServiceIds } } });
    }
    await prisma.productVariant.deleteMany({ where: { product: { businessId: { in: legacyBizIds } } } });
    await prisma.product.deleteMany({ where: bizWhere });
    await prisma.productCategory.deleteMany({ where: bizWhere });
    await prisma.serviceEmployee.deleteMany({ where: { service: { businessId: { in: legacyBizIds } } } });
    await prisma.service.deleteMany({ where: bizWhere });
    await prisma.serviceCategory.deleteMany({ where: bizWhere });
    await prisma.menuItemVariant.deleteMany({ where: { menuItem: { businessId: { in: legacyBizIds } } } });
    await prisma.menuItem.deleteMany({ where: bizWhere });
    await prisma.menuCategory.deleteMany({ where: bizWhere });
    await prisma.room.deleteMany({ where: bizWhere });
    await prisma.portfolioItem.deleteMany({ where: bizWhere });
    await prisma.portfolioCategory.deleteMany({ where: bizWhere });
    await prisma.rental.deleteMany({ where: bizWhere });
    await prisma.eventParticipant.deleteMany({ where: { event: { businessId: { in: legacyBizIds } } } });
    await prisma.eventTicket.deleteMany({ where: { event: { businessId: { in: legacyBizIds } } } });
    await prisma.event.deleteMany({ where: bizWhere });
    await prisma.quoteItem.deleteMany({ where: { quote: { businessId: { in: legacyBizIds } } } });
    await prisma.quote.deleteMany({ where: bizWhere });
    await prisma.invoiceItem.deleteMany({ where: { invoice: { businessId: { in: legacyBizIds } } } });
    await prisma.invoice.deleteMany({ where: bizWhere });
    await prisma.escrow.deleteMany({ where: bizWhere });
    await prisma.debt.deleteMany({ where: bizWhere });
    await prisma.expense.deleteMany({ where: bizWhere });
    await prisma.businessClientTag.deleteMany({ where: { clientId: { in: legacyBizIds } } });
    await prisma.clientNote.deleteMany({ where: { businessClient: { businessId: { in: legacyBizIds } } } });
    await prisma.businessClient.deleteMany({ where: bizWhere });
    await prisma.businessTag.deleteMany({ where: bizWhere });
    await prisma.businessModuleAssignment.deleteMany({ where: bizWhere });
    await prisma.businessPaymentMethod.deleteMany({ where: bizWhere });
    await prisma.businessHour.deleteMany({ where: bizWhere });
    await prisma.businessSettings.deleteMany({ where: bizWhere });
    await prisma.businessBadge.deleteMany({ where: bizWhere });
    await prisma.walletTransaction.deleteMany({ where: { wallet: { businessId: { in: legacyBizIds } } } });
    await prisma.wallet.deleteMany({ where: bizWhere });
    await prisma.delivery.deleteMany({ where: bizWhere });
    await prisma.driver.deleteMany({ where: bizWhere });
    await prisma.deliveryZone.deleteMany({ where: bizWhere });
    await prisma.employee.deleteMany({ where: bizWhere });
    await prisma.planningTask.deleteMany({ where: bizWhere });
    await prisma.partner.deleteMany({ where: bizWhere });
    await prisma.post.deleteMany({ where: bizWhere });
    await prisma.story.deleteMany({ where: bizWhere });
    await prisma.short.deleteMany({ where: bizWhere });
    await prisma.live.deleteMany({ where: bizWhere });
    await prisma.deal.deleteMany({ where: bizWhere });
    await prisma.offerFlash.deleteMany({ where: bizWhere });
    await prisma.marketingCampaign.deleteMany({ where: bizWhere });
    await prisma.campaign.deleteMany({ where: bizWhere });
    await prisma.pipelineStage.deleteMany({ where: bizWhere });
    await prisma.business.deleteMany({ where: { id: { in: legacyBizIds } } });
  }

  // ── USERS parasites ensuite ──
  if (legacyUserIds.length) {
    await prisma.notificationDelivery.deleteMany({ where: { notification: { userId: { in: legacyUserIds } } } });
    await prisma.notification.deleteMany({ where: userWhere });
    await prisma.session.deleteMany({ where: userWhere });
    await prisma.refreshToken.deleteMany({ where: userWhere });
    await prisma.otpCode.deleteMany({ where: userWhere });
    await prisma.securityLog.deleteMany({ where: userWhere });
    await prisma.favorite.deleteMany({ where: { userId: { in: legacyUserIds } } });
    await prisma.follow.deleteMany({ where: { followerId: { in: legacyUserIds } } });
    await prisma.review.deleteMany({ where: { userId: { in: legacyUserIds } } });
    await prisma.payment.deleteMany({ where: userWhere });
    await prisma.orderItem.deleteMany({ where: { order: { buyerId: { in: legacyUserIds } } } });
    await prisma.order.deleteMany({ where: { buyerId: { in: legacyUserIds } } });
    await prisma.booking.deleteMany({ where: { clientId: { in: legacyUserIds } } });
    await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: legacyUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: legacyUserIds } } });
  }

  console.log(`--- Purge : ${legacyUserIds.length} users + ${legacyBizIds.length} business anciens supprimés ---`);
}

// ============================================================
// 12. NETTOYAGE (idempotent, FK-safe)
// ============================================================
async function cleanupExisting() {
  const all = [...ALL_USER_IDS, ...ALL_BIZ_IDS];
  const bizWhere = { businessId: { in: ALL_BIZ_IDS } };
  const userWhere = { userId: { in: ALL_USER_IDS } };
  // ── Résidus de l ancien seed (tables enfants d User/Business) ──
  await prisma.notificationDelivery.deleteMany({ where: { notification: { userId: { in: ALL_USER_IDS } } } });
  await prisma.notification.deleteMany({ where: userWhere });
  await prisma.loyaltyTransaction.deleteMany({ where: { loyalty: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.loyaltyPoints.deleteMany({ where: { OR: [{ businessId: { in: ALL_BIZ_IDS } }, { clientId: { in: ALL_USER_IDS } }] } });
  await prisma.loyaltyProgram.deleteMany({ where: bizWhere });
  await prisma.payment.deleteMany({ where: userWhere });
  await prisma.escrow.deleteMany({ where: bizWhere });
  await prisma.debt.deleteMany({ where: bizWhere });
  await prisma.expense.deleteMany({ where: bizWhere });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.invoice.deleteMany({ where: bizWhere });
  await prisma.quoteItem.deleteMany({ where: { quote: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.quote.deleteMany({ where: bizWhere });
  await prisma.segmentClient.deleteMany({ where: { segment: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.clientSegment.deleteMany({ where: bizWhere });
  await prisma.businessClientTag.deleteMany({ where: { clientId: { in: ALL_USER_IDS } } });
  await prisma.clientNote.deleteMany({ where: { businessClientId: { in: all } } });
  await prisma.businessClient.deleteMany({ where: bizWhere });
  await prisma.businessTag.deleteMany({ where: bizWhere });
  await prisma.deliveryProof.deleteMany({ where: bizWhere });
  await prisma.deliveryTracking.deleteMany({ where: bizWhere });
  await prisma.delivery.deleteMany({ where: bizWhere });
  await prisma.driver.deleteMany({ where: bizWhere });
  await prisma.deliveryZone.deleteMany({ where: bizWhere });
  // ── Menu ops (module MENU) + témoignages portfolio ──
  await prisma.menuOrder.deleteMany({ where: bizWhere });
  await prisma.restaurantTable.deleteMany({ where: bizWhere });
  await prisma.ingredient.deleteMany({ where: bizWhere });
  await prisma.portfolioMedia.deleteMany({ where: bizWhere });
  await prisma.portfolioTestimonial.deleteMany({ where: bizWhere });
  await prisma.partnerContract.deleteMany({ where: { partner: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.partnerTransaction.deleteMany({ where: { partner: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.partnerAssignment.deleteMany({ where: { partner: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.partnerReview.deleteMany({ where: { partner: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.partnerDocument.deleteMany({ where: { partner: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.partnerPermission.deleteMany({ where: { partner: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.partner.deleteMany({ where: bizWhere });
  await prisma.attendance.deleteMany({ where: bizWhere });
  await prisma.employeeDocument.deleteMany({ where: { employee: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.employeePerformance.deleteMany({ where: bizWhere });
  await prisma.employeeActivity.deleteMany({ where: bizWhere });
  await prisma.employeeSchedule.deleteMany({ where: bizWhere });
  await prisma.employee.deleteMany({ where: bizWhere });
  await prisma.planningLog.deleteMany({ where: bizWhere });
  await prisma.planningTask.deleteMany({ where: bizWhere });
  await prisma.post.deleteMany({ where: bizWhere });
  await prisma.story.deleteMany({ where: bizWhere });
  await prisma.short.deleteMany({ where: bizWhere });
  await prisma.live.deleteMany({ where: bizWhere });
  await prisma.offerFlash.deleteMany({ where: bizWhere });
  await prisma.deal.deleteMany({ where: bizWhere });
  await prisma.pipelineStage.deleteMany({ where: bizWhere });
  await prisma.campaignExecutionLog.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.campaignStep.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.campaign.deleteMany({ where: bizWhere });
  await prisma.marketingCampaign.deleteMany({ where: bizWhere });
  await prisma.businessBadge.deleteMany({ where: bizWhere });
  await prisma.menuItemVariant.deleteMany({ where: { menuItem: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.serviceEmployee.deleteMany({ where: { service: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.eventParticipant.deleteMany({ where: { event: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.eventTicket.deleteMany({ where: { event: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.session.deleteMany({ where: userWhere });
  await prisma.refreshToken.deleteMany({ where: userWhere });
  await prisma.otpCode.deleteMany({ where: userWhere });
  await prisma.securityLog.deleteMany({ where: userWhere });
  // Résidus de l ancien seed : numéros uniques (orderNumber / bookingNumber / quote / invoice / delivery / coupon)
  const legacyOrderNumbers = ['CMD-2026-001', 'CMD-2026-002', 'CMD-2026-003', 'CMD-2026-004', 'CMD-2026-005', 'CMD-2026-006'];
  await prisma.orderItem.deleteMany({ where: { order: { orderNumber: { in: legacyOrderNumbers } } } });
  await prisma.order.deleteMany({ where: { orderNumber: { in: legacyOrderNumbers } } });
  await prisma.quoteItem.deleteMany({ where: { quote: { quoteNumber: { in: ['DEV-2026-001', 'DEV-2026-002'] } } } });
  await prisma.quote.deleteMany({ where: { quoteNumber: { in: ['DEV-2026-001', 'DEV-2026-002'] } } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { invoiceNumber: { in: ['FAC-2026-001', 'FAC-2026-002'] } } } });
  await prisma.invoice.deleteMany({ where: { invoiceNumber: { in: ['FAC-2026-001', 'FAC-2026-002'] } } });
  await prisma.deliveryTracking.deleteMany({ where: { delivery: { deliveryNumber: { in: ['LIV-2026-001', 'LIV-2026-002', 'LIV-2026-003'] } } } });
  await prisma.deliveryProof.deleteMany({ where: { delivery: { deliveryNumber: { in: ['LIV-2026-001', 'LIV-2026-002', 'LIV-2026-003'] } } } });
  await prisma.delivery.deleteMany({ where: { deliveryNumber: { in: ['LIV-2026-001', 'LIV-2026-002', 'LIV-2026-003'] } } });
  await prisma.booking.deleteMany({ where: { bookingNumber: { in: ['RSV-2026-001', 'RSV-2026-002', 'RSV-2026-003', 'RSV-2026-004', 'RSV-2026-005'] } } });
  // ── Nettoyage principal du seed réaliste ──
  await prisma.walletTransaction.deleteMany({ where: { wallet: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: ['conv-1', 'conv-2', 'conv-3'] } } });
  await prisma.conversationParticipant.deleteMany({ where: { conversationId: { in: ['conv-1', 'conv-2', 'conv-3'] } } });
  await prisma.conversation.deleteMany({ where: { id: { in: ['conv-1', 'conv-2', 'conv-3'] } } });
  await prisma.orderItem.deleteMany({ where: { order: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.order.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.booking.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.review.deleteMany({ where: { userId: { in: ALL_USER_IDS } } });
  await prisma.favorite.deleteMany({ where: { userId: { in: ALL_USER_IDS } } });
  await prisma.follow.deleteMany({ where: { followerId: { in: ALL_USER_IDS } } });
  await prisma.developerModuleInstallation.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.developerModule.deleteMany({ where: { developer: { userId: { in: [U.DEV_1, U.DEV_2, U.DEV_3, U.DEV_4] } } } });
  await prisma.developerProfile.deleteMany({ where: { userId: { in: [U.DEV_1, U.DEV_2, U.DEV_3, U.DEV_4] } } });
  await prisma.portfolioItem.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.portfolioCategory.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.rental.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.event.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.room.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.service.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.serviceCategory.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.menuItem.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.menuCategory.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.productVariant.deleteMany({ where: { product: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.product.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.productCategory.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.businessModuleAssignment.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.businessPaymentMethod.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.businessHour.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.businessSettings.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.wallet.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.business.deleteMany({ where: { id: { in: ALL_BIZ_IDS } } });
  await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: ALL_USER_IDS } } });
  await prisma.adConversion.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.adClick.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.adImpression.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.adCreative.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.adInvoice.deleteMany({ where: { campaign: { businessId: { in: ALL_BIZ_IDS } } } });
  await prisma.adCampaign.deleteMany({ where: { businessId: { in: ALL_BIZ_IDS } } });
  await prisma.adSlot.deleteMany({});
  await prisma.adPackage.deleteMany({});
  // ── Média social commerce (shorts, stories, lives, offres flash) ──
  await prisma.liveProduct.deleteMany({ where: { liveId: { in: ['live-1', 'live-2'] } } });
  await prisma.liveReaction.deleteMany({ where: { liveId: { in: ['live-1', 'live-2'] } } });
  await prisma.liveChat.deleteMany({ where: { liveId: { in: ['live-1', 'live-2'] } } });
  await prisma.liveParticipant.deleteMany({ where: { liveId: { in: ['live-1', 'live-2'] } } });
  await prisma.live.deleteMany({ where: { id: { in: ['live-1', 'live-2'] } } });
  await prisma.claimedOffer.deleteMany({ where: { offerId: { in: ['offer-1', 'offer-2', 'offer-3'] } } });
  await prisma.offerFlash.deleteMany({ where: { id: { in: ['offer-1', 'offer-2', 'offer-3'] } } });
  await prisma.shortLike.deleteMany({ where: { shortId: { in: ['short-1', 'short-2', 'short-3', 'short-4', 'short-5'] } } });
  await prisma.shortComment.deleteMany({ where: { shortId: { in: ['short-1', 'short-2', 'short-3', 'short-4', 'short-5'] } } });
  await prisma.shortView.deleteMany({ where: { shortId: { in: ['short-1', 'short-2', 'short-3', 'short-4', 'short-5'] } } });
  await prisma.shortSave.deleteMany({ where: { shortId: { in: ['short-1', 'short-2', 'short-3', 'short-4', 'short-5'] } } });
  await prisma.short.deleteMany({ where: { id: { in: ['short-1', 'short-2', 'short-3', 'short-4', 'short-5'] } } });
  await prisma.storyView.deleteMany({ where: { storyId: { in: ['story-1', 'story-2', 'story-3', 'story-4'] } } });
  await prisma.story.deleteMany({ where: { id: { in: ['story-1', 'story-2', 'story-3', 'story-4'] } } });
  await prisma.user.deleteMany({ where: { id: { in: ALL_USER_IDS } } });
  console.log('--- Nettoyage terminé ---');
}

// ============================================================
// MAIN
// ============================================================
export async function seedRealistic() {
  console.log('\n🌍 Seed réaliste — Zéro fiction, tout connecté\n');
  await purgeLegacyData();
  await cleanupExisting();
  await seedUsers();
  await seedPlatformPlans();
  await seedBusinesses();
  await seedCatalogs();
  await seedMenuOps();
  await seedOrders();
  await seedBookings();
  await seedReviews();
  await seedBusinessReviews();
  await seedSocial();
  await seedDevelopers();
  await seedMessages();
  await seedWhatsApp();
  await seedMarketing();
  await seedSavings();
  await seedLayaway();
  await seedWallets();
  await seedCms();
  await seedOperations();
  await seedCrm();
  await seedFraud();
  await seedFinance();
  await seedSatisfaction();
  await seedAdSlots();
  await seedAdCampaigns();
  await seedMediaCommerce();
  console.log('\n✅ Seed réaliste terminé. Mdp unique : ' + PASSWORD);
}

// ============================================================
// PUBLICITÉ (emplacements + campagnes de démo)
// ============================================================

// ============================================================
// 24. MÉDIA SOCIAL COMMERCE (Shorts shoppables, Stories stickers, Lives, Offres Flash)
// ============================================================

// Vidéos de démonstration (échantillons publics courts — à remplacer par l'hébergement vidéo réel)
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

async function seedMediaCommerce() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);

  // ── Shorts shoppables (chaque vidéo = une boutique) ──
  const shorts: any[] = [
    {
      id: 'short-1',
      businessId: B.RESTO,
      title: 'Le vrai Attiéké Poisson Braisé 🐟',
      description: "Notre plat signature préparé à la commande. Commandez en 1 tap depuis la vidéo !",
      videoUrl: SAMPLE_VIDEOS[0],
      thumbnailUrl: '/images/products/attieke.svg',
      duration: 15,
      linkTargetType: 'PRODUCT',
      linkTargetId: 'prod-res-1',
      likesCount: 128,
      viewsCount: 1240,
      sharesCount: 34,
      commentsCount: 12,
    },
    {
      id: 'short-2',
      businessId: B.RESTO,
      title: 'Mafé Poulet onctueux 🥜',
      description: "La recette traditionnelle de la maison. -15% aujourd'hui !",
      videoUrl: SAMPLE_VIDEOS[1],
      thumbnailUrl: '/images/products/mafe.svg',
      duration: 15,
      linkTargetType: 'PRODUCT',
      linkTargetId: 'prod-res-2',
      likesCount: 96,
      viewsCount: 890,
      sharesCount: 21,
      commentsCount: 8,
    },
    {
      id: 'short-3',
      businessId: B.RESTO,
      title: 'Bissap glacé maison 🧃',
      description: 'Rafraîchissant, naturel, sans colorant. 1 500 FCFA.',
      videoUrl: SAMPLE_VIDEOS[2],
      thumbnailUrl: '/images/products/bissap.svg',
      duration: 15,
      linkTargetType: 'PRODUCT',
      linkTargetId: 'prod-res-3',
      likesCount: 210,
      viewsCount: 2450,
      sharesCount: 67,
      commentsCount: 19,
    },
    {
      id: 'short-4',
      businessId: B.SALON,
      title: 'Relooking 2027 ✨',
      description: 'Venez découvrir la nouvelle expérience de notre salon.',
      videoUrl: SAMPLE_VIDEOS[3],
      thumbnailUrl: '/images/portfolio/villa-r1-salon.svg',
      duration: 15,
      linkTargetType: 'BUSINESS_PAGE',
      linkTargetId: B.SALON,
      likesCount: 64,
      viewsCount: 540,
      sharesCount: 9,
      commentsCount: 5,
    },
    {
      id: 'short-5',
      businessId: B.EVENTS,
      title: 'Vos événements, notre passion 🎉',
      description: 'Organisation complète : traiteur, déco, animation.',
      videoUrl: SAMPLE_VIDEOS[4],
      thumbnailUrl: '/images/portfolio/mariage-awa.svg',
      duration: 15,
      linkTargetType: 'BUSINESS_PAGE',
      linkTargetId: B.EVENTS,
      likesCount: 41,
      viewsCount: 380,
      sharesCount: 6,
      commentsCount: 3,
    },
  ];
  for (const s of shorts) {
    await prisma.short.upsert({ where: { id: s.id }, update: {}, create: s });
  }
  console.log(`✓ ${shorts.length} shorts shoppables`);

  // ── Stories 24h avec stickers produits ──
  const stories: any[] = [
    {
      id: 'story-1',
      businessId: B.RESTO,
      mediaType: 'IMAGE',
      mediaUrl: '/images/products/attieke.svg',
      caption: '🔥 Plat du jour : Attiéké Poisson Braisé',
      linkTargetType: 'PRODUCT',
      linkTargetId: 'prod-res-1',
      stickers: [
        {
          id: 'stk-1',
          type: 'PRODUCT',
          value: 'prod-res-1',
          label: 'Attiéké Poisson',
          positionX: 62,
          positionY: 26,
          style: { rotation: -6 },
        },
      ],
      expiresAt: tomorrow,
    },
    {
      id: 'story-2',
      businessId: B.RESTO,
      mediaType: 'IMAGE',
      mediaUrl: '/images/products/mafe.svg',
      caption: '🥜 Mafé Poulet -15% aujourd\'hui',
      linkTargetType: 'PROMOTION',
      linkTargetId: 'promo-1',
      stickers: [
        {
          id: 'stk-2',
          type: 'PROMO',
          value: '15',
          label: '-15%',
          positionX: 30,
          positionY: 32,
          style: { rotation: 8 },
        },
      ],
      expiresAt: tomorrow,
    },
    {
      id: 'story-3',
      businessId: B.RESTO,
      mediaType: 'IMAGE',
      mediaUrl: '/images/products/bissap.svg',
      caption: 'Bissap glacé maison 🧃 1 500 F',
      linkTargetType: 'PRODUCT',
      linkTargetId: 'prod-res-3',
      stickers: [
        {
          id: 'stk-3',
          type: 'PRODUCT',
          value: 'prod-res-3',
          label: 'Bissap',
          positionX: 38,
          positionY: 66,
          style: { rotation: 4 },
        },
      ],
      expiresAt: tomorrow,
    },
    {
      id: 'story-4',
      businessId: B.SALON,
      mediaType: 'IMAGE',
      mediaUrl: '/images/portfolio/villa-r1-salon.svg',
      caption: 'Résultats relooking ✨ Prenez rendez-vous',
      linkTargetType: 'BUSINESS_PAGE',
      linkTargetId: B.SALON,
      stickers: [
        {
          id: 'stk-4',
          type: 'HASHTAG',
          value: '#Relooking2027',
          label: '#Relooking2027',
          positionX: 50,
          positionY: 78,
          style: { rotation: 0 },
        },
      ],
      expiresAt: tomorrow,
    },
  ];
  for (const s of stories) {
    await prisma.story.upsert({ where: { id: s.id }, update: {}, create: s });
  }
  console.log(`✓ ${stories.length} stories avec stickers`);

  // ── Lives (1 en direct + 1 programmé) ──
  const live1 = await prisma.live.upsert({
    where: { id: 'live-1' },
    update: {},
    create: {
      id: 'live-1',
      businessId: B.RESTO,
      title: 'LIVE Cuisine : spécial Attiéké ! 🍳',
      description: "On vous montre comment on prépare nos plats. Commandez pendant le direct !",
      coverImage: '/images/products/attieke.svg',
      streamUrl: SAMPLE_VIDEOS[2],
      status: 'LIVE',
      hasEscrow: true,
      viewerCount: 47,
      viewerCountPeak: 120,
      startedAt: new Date(now.getTime() - 30 * 60000),
    },
  });
  await prisma.live.upsert({
    where: { id: 'live-2' },
    update: {},
    create: {
      id: 'live-2',
      businessId: B.SALON,
      title: 'Live Relooking : conseils beauté ✨',
      description: 'Astuces coiffure et soins par nos expertes.',
      coverImage: '/images/portfolio/villa-r1-salon.svg',
      status: 'SCHEDULED',
      hasEscrow: true,
      scheduledAt: tomorrow,
    },
  });

  // Produits du live (LiveProduct) — live shopping
  const liveProducts = [
    {
      liveId: live1.id,
      productId: 'prod-res-1',
      name: 'Attiéké Poisson Braisé',
      description: 'Plat signature servi avec alloco.',
      price: 3500,
      currency: 'FCFA',
      image: '/images/products/attieke.svg',
      stock: 20,
      remainingStock: 14,
      sortOrder: 1,
    },
    {
      liveId: live1.id,
      productId: 'prod-res-2',
      name: 'Mafé Poulet',
      description: 'Sauce arachide onctueuse, riz blanc.',
      price: 4500,
      currency: 'FCFA',
      image: '/images/products/mafe.svg',
      stock: 15,
      remainingStock: 9,
      sortOrder: 2,
    },
    {
      liveId: live1.id,
      productId: 'prod-res-3',
      name: 'Jus de Bissap',
      description: 'Fait maison, 1L.',
      price: 1500,
      currency: 'FCFA',
      image: '/images/products/bissap.svg',
      stock: 40,
      remainingStock: 25,
      sortOrder: 3,
    },
  ];
  for (const lp of liveProducts) {
    await prisma.liveProduct.create({ data: lp as any });
  }
  console.log(`✓ ${liveProducts.length} produits dans le live + 1 live programmé`);

  // ── Offres Flash ──
  const offers: any[] = [
    {
      id: 'offer-1',
      businessId: B.RESTO,
      title: 'Attiéké Poisson Braisé -20%',
      description: 'Offre flash du jour sur notre plat signature.',
      image: '/images/products/attieke.svg',
      discountPercent: 20,
      originalPrice: 3500,
      flashPrice: 2800,
      quantity: 50,
      soldCount: 18,
      maxPerCustomer: 2,
      startAt: new Date(now.getTime() - 3600000),
      endAt: new Date(now.getTime() + 20 * 3600000),
      isActive: true,
      isFeatured: true,
    },
    {
      id: 'offer-2',
      businessId: B.RESTO,
      title: 'Mafé Poulet -15%',
      description: 'La recette traditionnelle à prix réduit.',
      image: '/images/products/mafe.svg',
      discountPercent: 15,
      originalPrice: 4500,
      flashPrice: 3825,
      quantity: 30,
      soldCount: 7,
      maxPerCustomer: 2,
      startAt: new Date(now.getTime() - 3600000),
      endAt: new Date(now.getTime() + 14 * 3600000),
      isActive: true,
      isFeatured: false,
    },
    {
      id: 'offer-3',
      businessId: B.RESTO,
      title: 'Bissap 1L -33%',
      description: 'Jus de bissap maison, naturel et rafraîchissant.',
      image: '/images/products/bissap.svg',
      discountPercent: 33,
      originalPrice: 1500,
      flashPrice: 1000,
      quantity: 100,
      soldCount: 42,
      maxPerCustomer: 3,
      startAt: new Date(now.getTime() - 3600000),
      endAt: new Date(now.getTime() + 28 * 3600000),
      isActive: true,
      isFeatured: false,
    },
  ];
  for (const o of offers) {
    await prisma.offerFlash.upsert({ where: { id: o.id }, update: {}, create: o });
  }
  console.log(`✓ ${offers.length} offres flash actives`);
}

async function seedAdSlots() {
  const slots = [
    { page: 'HOMEPAGE', position: 'HERO_BANNER', label: 'Hero sponsorisé', description: 'Bannière large en haut de la page d\'accueil', width: 1200, height: 140, price1Day: 50000, price7Days: 250000, price30Days: 750000, maxPerSlot: 10 },
    { page: 'HOMEPAGE', position: 'FEATURED_BLOCK', label: 'Mis en avant', description: 'Carte sponsorisée dans les carrousels de la page d\'accueil', width: 280, height: 320, price1Day: 20000, price7Days: 100000, price30Days: 300000, maxPerSlot: 10 },
    { page: 'HOMEPAGE', position: 'TOP_BANNER', label: 'Bandeau inter-sections', description: 'Bannière au milieu de la page d\'accueil', width: 728, height: 90, price1Day: 15000, price7Days: 75000, price30Days: 225000, maxPerSlot: 10 },
    { page: 'HOMEPAGE', position: 'BOTTOM_BANNER', label: 'Bandeau bas', description: 'Bannière pied de page d\'accueil', width: 728, height: 90, price1Day: 8000, price7Days: 40000, price30Days: 120000, maxPerSlot: 10 },
    { page: 'MARKETPLACE', position: 'SPONSORED_RESULT', label: 'Résultat sponsorisé', description: 'Premier résultat de la liste marketplace', width: 300, height: 160, price1Day: 30000, price7Days: 150000, price30Days: 450000, maxPerSlot: 10 },
    { page: 'MARKETPLACE', position: 'TOP_BANNER', label: 'Bandeau marketplace', description: 'Bannière sous les filtres du marketplace', width: 728, height: 90, price1Day: 10000, price7Days: 50000, price30Days: 150000, maxPerSlot: 10 },
    { page: 'PRODUCT_PAGE', position: 'BOTTOM_BANNER', label: 'Produits sponsorisés', description: 'Bandeau bas de la fiche produit', width: 728, height: 90, price1Day: 8000, price7Days: 40000, price30Days: 120000, maxPerSlot: 10 },
    { page: 'EVENT_PAGE', position: 'SIDEBAR', label: 'Sponsors événement', description: 'Encart sidebar des pages événements', width: 300, height: 250, price1Day: 10000, price7Days: 50000, price30Days: 150000, maxPerSlot: 5 },
    { page: 'ABOUT', position: 'BOTTOM_BANNER', label: 'Bandeau pages vitrine', description: 'Bannière bas de page (about, pricing, contact, legal, media)', width: 728, height: 90, price1Day: 5000, price7Days: 25000, price30Days: 75000, maxPerSlot: 5 },
    { page: 'PRICING', position: 'BOTTOM_BANNER', label: 'Bandeau tarifs', description: 'Bannière bas de la page tarifs', width: 728, height: 90, price1Day: 5000, price7Days: 25000, price30Days: 75000, maxPerSlot: 5 },
    { page: 'CONTACT', position: 'BOTTOM_BANNER', label: 'Bandeau contact', description: 'Bannière bas de la page contact', width: 728, height: 90, price1Day: 5000, price7Days: 25000, price30Days: 75000, maxPerSlot: 5 },
    { page: 'LEGAL', position: 'BOTTOM_BANNER', label: 'Bandeau légal', description: 'Bannière bas des pages légales', width: 728, height: 90, price1Day: 5000, price7Days: 25000, price30Days: 75000, maxPerSlot: 5 },
    { page: 'MEDIA', position: 'BOTTOM_BANNER', label: 'Bandeau média', description: 'Bannière bas de la page média', width: 728, height: 90, price1Day: 5000, price7Days: 25000, price30Days: 75000, maxPerSlot: 5 },
  ];
  for (const s of slots) {
    await prisma.adSlot.upsert({
      where: { page_position: { page: s.page, position: s.position } },
      update: {},
      create: { ...s, isActive: true },
    });
  }
  console.log('✓ Publicité : ' + slots.length + ' emplacements créés avec tarifs configurables');
}

async function seedAdCampaigns() {
  const now = new Date();
  const heroSlot = await prisma.adSlot.findFirst({ where: { page: 'HOMEPAGE', position: 'HERO_BANNER' } });
  const sponsorSlot = await prisma.adSlot.findFirst({ where: { page: 'MARKETPLACE', position: 'SPONSORED_RESULT' } });
  const eventSlot = await prisma.adSlot.findFirst({ where: { page: 'EVENT_PAGE', position: 'SIDEBAR' } });

  const campaigns = [
    {
      id: 'ad-camp-1', slotId: heroSlot?.id, advertiserType: 'BUSINESS', businessId: B.RESTO,
      name: 'Saveur d\'Abidjan — Hero', objective: 'BRAND_AWARENESS',
      startDate: now, endDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      budget: 250000, status: 'ACTIVE',
      creatives: [{
        placementPage: 'HOMEPAGE', placementPosition: 'HERO_BANNER', format: 'BANNER_HORIZONTAL',
        adText: 'Découvrez la cuisine ivoirienne authentique à Abidjan. Plats traditionnels, ambiance chaleureuse, livraison gratuite.',
        destinationUrl: '/business/saveur-dabidjan', cta: 'Découvrir', ctaColor: '#EAB308',
        targetCountries: ['Côte d\'Ivoire'], targetCities: ['Abidjan'], isActive: true,
      }],
    },
    {
      id: 'ad-camp-2', slotId: sponsorSlot?.id, advertiserType: 'BUSINESS', businessId: B.SALON,
      name: 'Kenza Beauté — Sponsor', objective: 'PROMOTION',
      startDate: now, endDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000),
      budget: 30000, status: 'ACTIVE',
      creatives: [{
        placementPage: 'MARKETPLACE', placementPosition: 'SPONSORED_RESULT', format: 'SPONSORED_CARD',
        adText: '✨ Offre spéciale première visite : -30% sur tous les soins visage. Prenez rendez-vous en ligne.',
        destinationUrl: '/business/kenza-beaute', cta: 'Je réserve', ctaColor: '#EC4899',
        targetCountries: ['Côte d\'Ivoire'], targetCities: ['Abidjan'], isActive: true,
      }],
    },
    {
      id: 'ad-camp-3', slotId: eventSlot?.id, advertiserType: 'BUSINESS', businessId: B.EVENTS,
      name: 'Événements Konnect — Sidebar', objective: 'PROMOTION',
      startDate: now, endDate: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      budget: 50000, status: 'ACTIVE',
      creatives: [{
        placementPage: 'EVENT_PAGE', placementPosition: 'SIDEBAR', format: 'BANNER_VERTICAL',
        adText: '🎤 Concerts & Festivals à Abidjan — Toute l\'actu des événements près de chez vous.',
        destinationUrl: '/events/concerts', cta: 'Voir le programme', ctaColor: '#8B5CF6',
        targetCountries: ['Côte d\'Ivoire'], targetCities: ['Abidjan'], isActive: true,
      }],
    },
  ];

  for (const c of campaigns) {
    const { creatives, ...campaignData } = c;
    await prisma.adCampaign.upsert({
      where: { id: c.id },
      update: {},
      create: {
        ...campaignData,
        creatives: { create: creatives.map((cr: any) => ({ ...cr })) },
      },
    });
  }
  console.log('✓ Publicité : ' + campaigns.length + ' campagnes de démonstration actives');
}

// ============================================================
// FRAUDE (événements de détection réalistes, liés à de vrais comptes)
// ============================================================
async function seedFraud() {
  const rules = [
    { id: 'fr-1', name: 'Vitesse de commande anormale', type: 'VELOCITY', action: 'FLAG', severity: 'HIGH', priority: 10 },
    { id: 'fr-2', name: 'Incohérence géographique', type: 'GEO', action: 'CHALLENGE_2FA', severity: 'MEDIUM', priority: 5 },
  ];
  for (const r of rules) {
    await prisma.fraudRule.upsert({
      where: { id: r.id },
      update: {
        name: r.name, type: r.type, action: r.action as any, severity: r.severity as any, priority: r.priority, config: {},
      },
      create: {
        id: r.id, name: r.name, type: r.type,
        action: r.action as any, severity: r.severity as any, priority: r.priority, config: {},
      },
    });
  }

  const events = [
    {
      id: 'fr-ev-1', userId: U.CLIENT_3, ruleId: 'fr-1', ruleName: 'Vitesse de commande anormale',
      eventType: 'FRAUD_VELOCITY_ORDER', severity: 'HIGH', action: 'FLAG',
      metadata: { ordersInHour: 4, amount: 250000 }, createdAt: new Date('2026-07-20'),
    },
    {
      id: 'fr-ev-2', userId: U.CLIENT_2, ruleId: 'fr-2', ruleName: 'Incohérence géographique',
      eventType: 'FAUX_PROFILS_GEO_MISMATCH', severity: 'MEDIUM', action: 'CHALLENGE_2FA',
      metadata: { country: 'GH', expected: 'CI' }, createdAt: new Date('2026-07-18'),
    },
  ];
  for (const e of events) {
    await prisma.fraudEvent.upsert({
      where: { id: e.id },
      update: {
        userId: e.userId, ruleId: e.ruleId, ruleName: e.ruleName, eventType: e.eventType,
        severity: e.severity as any, action: e.action as any, blocked: false, metadata: e.metadata,
      },
      create: {
        id: e.id, userId: e.userId, ruleId: e.ruleId, ruleName: e.ruleName, eventType: e.eventType,
        severity: e.severity as any, action: e.action as any, blocked: false, metadata: e.metadata,
        createdAt: e.createdAt,
      },
    });
  }
  console.log('✓ Fraude : 2 règles + 2 événements créés');
}

// ============================================================
// FINANCE (paiements + escrow liés à de vraies commandes)
// ============================================================
async function seedFinance() {
  const [ord1, ord3, ord4] = await Promise.all([
    prisma.order.findUnique({ where: { id: 'ord-1' } }),
    prisma.order.findUnique({ where: { id: 'ord-3' } }),
    prisma.order.findUnique({ where: { id: 'ord-4' } }),
  ]);
  const amt = (o: any) => (o ? Number(o.totalAmount) || 0 : 0);

  await prisma.payment.upsert({
    where: { id: 'pay-1' },
    update: {},
    create: {
      id: 'pay-1', userId: U.CLIENT_1, businessId: B.RESTO, orderId: 'ord-1',
      amount: amt(ord1), currency: 'FCFA', method: 'MOBILE_MONEY', status: 'COMPLETED',
      reference: 'REF-PAY-2026-001', description: 'Paiement CMD-2026-001',
      paidAt: new Date('2026-06-15'),
    },
  });
  await prisma.payment.upsert({
    where: { id: 'pay-2' },
    update: {},
    create: {
      id: 'pay-2', userId: U.CLIENT_2, businessId: B.BOUTIQUE, orderId: 'ord-4',
      amount: amt(ord4), currency: 'FCFA', method: 'CASH', status: 'COMPLETED',
      reference: 'REF-PAY-2026-002', description: 'Paiement CMD-2026-004',
      paidAt: new Date('2026-07-02'),
    },
  });
  await prisma.payment.upsert({
    where: { id: 'pay-3' },
    update: {},
    create: {
      id: 'pay-3', userId: U.CLIENT_5, businessId: B.RESTO, orderId: 'ord-3',
      amount: amt(ord3), currency: 'FCFA', method: 'MOBILE_MONEY', status: 'PENDING',
      reference: 'REF-PAY-2026-003', description: 'Paiement CMD-2026-003',
    },
  });
  await prisma.escrow.upsert({
    where: { id: 'esc-1' },
    update: {},
    create: {
      id: 'esc-1', businessId: B.RESTO, orderId: 'ord-2',
      amount: 12000, currency: 'FCFA', status: 'HELD', fee: 600, feeRate: 5,
      notes: 'Séquestre CMD-2026-002 en attente de livraison',
    },
  });
  console.log('✓ Finance : 3 paiements + 1 escrow liés à de vraies commandes');
}

// ============================================================
// SATISFACTION (réponses d'enquête liées à de vraies commandes/séjours)
// ============================================================
async function seedSatisfaction() {
  // Réponses + flag dédup : chaque référence n'a été enquêtée qu'une fois.
  const responses = [
    {
      id: 'sat-1', userId: U.CLIENT_1, businessId: B.RESTO, orderId: 'ord-1',
      score: 5, feedback: 'L\'attiéké était délicieux et la livraison rapide. Je recommande !',
      createdAt: new Date('2026-07-25T18:30:00Z'),
    },
    {
      id: 'sat-2', userId: U.CLIENT_5, businessId: B.RESTO, orderId: 'ord-3',
      score: 4, feedback: 'Très bon mafé, petit délai sur la livraison mais ça vaut le coup.',
      createdAt: new Date('2026-07-28T19:10:00Z'),
    },
    {
      id: 'sat-3', userId: U.CLIENT_2, businessId: B.BOUTIQUE, orderId: 'ord-4',
      score: 4, feedback: 'Pagne de qualité conforme à la photo. Service client réactif.',
      createdAt: new Date('2026-08-01T15:45:00Z'),
    },
    {
      id: 'sat-4', userId: U.CLIENT_3, businessId: B.BOUTIQUE, orderId: 'ord-5',
      score: 5, feedback: 'Commande reçue en 2 jours, emballage soigné. Parfait !',
      createdAt: new Date('2026-08-05T11:20:00Z'),
    },
    {
      id: 'sat-5', userId: U.CLIENT_3, businessId: B.HOTEL, bookingId: 'bk-3',
      score: 4, feedback: 'Séjour agréable, chambre spacieuse. Petit déjeuner à améliorer.',
      createdAt: new Date('2026-08-03T09:15:00Z'),
    },
    {
      id: 'sat-6', userId: U.CLIENT_1, businessId: B.SALON, bookingId: 'bk-1',
      score: 5, feedback: 'Manucure magnifique, équipe adorable. Je reviendrai !',
      createdAt: new Date('2026-07-21T17:00:00Z'),
    },
  ];
  for (const r of responses) {
    await prisma.satisfactionSurveyResponse.upsert({
      where: { id: r.id },
      update: {
        userId: r.userId, businessId: r.businessId, score: r.score,
        feedback: r.feedback, createdAt: r.createdAt,
      },
      create: {
        id: r.id, userId: r.userId, businessId: r.businessId,
        orderId: r.orderId || null, bookingId: r.bookingId || null,
        score: r.score, feedback: r.feedback, createdAt: r.createdAt,
      },
    });
  }

  // Flags dédup : seules les références LIVRÉES / SÉJOUR TERMINÉ ont été enquêtées.
  await prisma.order.updateMany({
    where: { id: { in: ['ord-1', 'ord-3', 'ord-4', 'ord-5'] } },
    data: { satisfactionSurveySentAt: new Date('2026-07-26T08:00:00Z') },
  });
  await prisma.booking.updateMany({
    where: { id: { in: ['bk-3', 'bk-1'] } },
    data: { satisfactionSurveySentAt: new Date('2026-08-04T08:00:00Z') },
  });

  // Hygiène : réinitialise les flags posés lors de tests (références non seedées)
  // pour que l'enquête soit re-déclenchée au prochain DELIVERED / check-out réel.
  await prisma.order.updateMany({
    where: { id: { notIn: ['ord-1', 'ord-3', 'ord-4', 'ord-5'] }, satisfactionSurveySentAt: { not: null } },
    data: { satisfactionSurveySentAt: null },
  });
  await prisma.booking.updateMany({
    where: { id: { notIn: ['bk-3', 'bk-1'] }, satisfactionSurveySentAt: { not: null } },
    data: { satisfactionSurveySentAt: null },
  });
  console.log('✓ Satisfaction : 6 réponses d\'enquête liées à de vraies commandes/séjours');
}

// Exécution directe (npx tsx prisma/seedRealistic.ts)
if (require.main === module) {
  seedRealistic()
    .catch((e) => {
      console.error('❌ Seed échoué:', e.message || e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

