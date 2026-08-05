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

async function roleAssign(id: string, userId: string, role: UserRole, source = 'ACTIVATION') {
  await prisma.userRoleAssignment.upsert({
    where: { id },
    update: {},
    create: { id, userId, role, source },
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
    modules: ['SERVICES', 'BOOKINGS', 'CRM', 'PROMOTIONS', 'PORTFOLIO', 'EMPLOYEES', 'PLANNING', 'MARKETING', 'AFRISCORE'],
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
    modules: ['PRODUCTS', 'ORDERS', 'DELIVERIES', 'DEBTS_PAYMENTS', 'PROMOTIONS', 'CRM', 'MARKETING', 'DOCUMENTS', 'QUOTES_INVOICES'],
  },
  {
    id: B.BTP, ownerId: U.OWNER_BTP, name: 'BuildPro BTP', slug: 'buildpro-btp', type: BusinessType.ARTISAN,
    description: 'Entreprise de construction et de rénovation : devis, chantiers, gros œuvre et finitions.',
    shortDescription: 'Construction & rénovation', tagline: 'Construisons l\'avenir',
    email: 'contact@buildpro.ci', phone: '+2250708091011', country: 'Côte d\'Ivoire', city: 'Abidjan', region: 'Yopougon',
    address: 'Zone industrielle Yopougon', foundedYear: 2017, employeeCount: 22, rating: 4.7, reviewCount: 41,
    modules: ['PORTFOLIO', 'QUOTES_INVOICES', 'ADVANCED_TASKS', 'PLANNING', 'EMPLOYEES', 'DOCUMENTS', 'PARTNERS', 'CRM'],
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
        isActive: true, isVerified: true, isPremium: true, isNew: false,
        isTopSeller: true, isTopProvider: true, isRecommended: true,
        onboardingCompleted: true, onboardedAt: new Date('2025-08-01'),
        verificationStatus: 'VERIFIED', rating: d.rating, reviewCount: d.reviewCount,
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
    create: { id: 'prod-res-1', businessId: B.RESTO, sellerId: U.OWNER_RESTO, categoryId: 'cat-res-1', name: 'Attiéké Poisson Braisé', slug: 'attieke-poisson-braise', description: 'Attiéké fin, poisson braisé, sauce graine', shortDescription: 'Notre plat signature', price: 3500, currency: 'FCFA', images: ['/images/products/attieke.jpg'], tags: ['attieke', 'poisson'], stock: 100, lowStockThreshold: 10, unit: 'plat', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: true, rating: 4.8, reviewCount: 45, orderCount: 230 },
  });
  await prisma.product.upsert({
    where: { id: 'prod-res-2' }, update: {},
    create: { id: 'prod-res-2', businessId: B.RESTO, sellerId: U.OWNER_RESTO, categoryId: 'cat-res-1', name: 'Mafé Poulet', slug: 'mafe-poulet', description: 'Poulet mijoté sauce cacahuète, riz blanc', price: 4500, currency: 'FCFA', images: ['/images/products/mafe.jpg'], tags: ['mafe', 'poulet'], stock: 80, lowStockThreshold: 10, unit: 'plat', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: true, rating: 4.6, reviewCount: 32, orderCount: 180, isPromotional: true, promotionalPrice: 3800, discountPercent: 15, promotionEndsAt: new Date('2026-12-31') },
  });
  await prisma.product.upsert({
    where: { id: 'prod-res-3' }, update: {},
    create: { id: 'prod-res-3', businessId: B.RESTO, sellerId: U.OWNER_RESTO, categoryId: 'cat-res-2', name: 'Jus de Bissap', slug: 'jus-de-bissap', description: 'Jus naturel d hibiscus', price: 1500, currency: 'FCFA', images: ['/images/products/bissap.jpg'], tags: ['bissap'], stock: 200, lowStockThreshold: 20, unit: 'verre', isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true, isPhysical: false, featured: false, rating: 4.3, reviewCount: 18, orderCount: 95 },
  });

  // Menu du restaurant (mêmes plats en page menu)
  await prisma.menuCategory.upsert({ where: { id: 'mc-res-1' }, update: {}, create: { id: 'mc-res-1', businessId: B.RESTO, name: 'Plats principaux', description: 'Nos plats signatures' } });
  await prisma.menuItem.upsert({
    where: { id: 'mi-res-1' }, update: {},
    create: { id: 'mi-res-1', businessId: B.RESTO, categoryId: 'mc-res-1', name: 'Attiéké Poisson Braisé', description: 'Attiéké fin, poisson braisé, sauce graine', price: 3500, currency: 'FCFA', images: ['/images/products/attieke.jpg'], isPopular: true, featured: true, rating: 4.8, reviewCount: 45, orderCount: 230 },
  });
  await prisma.menuItem.upsert({
    where: { id: 'mi-res-2' }, update: {},
    create: { id: 'mi-res-2', businessId: B.RESTO, categoryId: 'mc-res-1', name: 'Mafé Poulet', description: 'Poulet mijoté sauce cacahuète', price: 4500, currency: 'FCFA', images: ['/images/products/mafe.jpg'], isPopular: true, rating: 4.6, reviewCount: 32, orderCount: 180 },
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

  console.log('✓ Catalogues (produits, services, menu, chambres, locations, portfolio)');
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
      id: 'ord-3', businessId: B.RESTO, buyerId: U.CLIENT_5, orderNumber: 'CMD-2026-003', type: 'DELIVERY', source: 'WEB_SITE', status: 'PENDING',
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
    { id: 'devmod-1', developerId: 'devprof-1', name: 'Stock Pro', slug: 'stock-pro', description: 'Gestion avancée du stock multi-dépôts', price: 15000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: true, category: 'Gestion', tags: ['stock', 'inventaire'] },
    { id: 'devmod-2', developerId: 'devprof-2', name: 'Loyalty Plus', slug: 'loyalty-plus', description: 'Points de fidélité et parrainage automatiques', price: 10000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: true, category: 'Marketing', tags: ['fidélité', 'parrainage'] },
    { id: 'devmod-3', developerId: 'devprof-3', name: 'Chat Widget', slug: 'chat-widget', description: 'Widget de chat temps réel pour votre site', price: 8000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: false, category: 'Communication', tags: ['chat', 'support'] },
    { id: 'devmod-4', developerId: 'devprof-4', name: 'Analytics Pro', slug: 'analytics-pro', description: 'Rapports avancés et KPI temps réel', price: 12000, currency: 'FCFA', isFree: false, isActive: true, isPublished: true, status: 'PUBLISHED', isVerified: true, isFeatured: true, category: 'Analytics', tags: ['kpi', 'rapports'] },
  ];
  for (const m of modules) {
    await prisma.developerModule.upsert({ where: { id: m.id }, update: {}, create: { id: m.id, ...m } });
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
  console.log(`✓ ${modules.length} modules développeurs + ${installs.length} installations business`);
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
// 10. WALLETS + TRANSACTIONS (business)
// ============================================================
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
  // Résidus de l ancien seed : numéros uniques (orderNumber / bookingNumber)
  const legacyOrderNumbers = ['CMD-2026-001', 'CMD-2026-002', 'CMD-2026-003', 'CMD-2026-004', 'CMD-2026-005', 'CMD-2026-006'];
  await prisma.orderItem.deleteMany({ where: { order: { orderNumber: { in: legacyOrderNumbers } } } });
  await prisma.order.deleteMany({ where: { orderNumber: { in: legacyOrderNumbers } } });
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
  await seedBusinesses();
  await seedCatalogs();
  await seedOrders();
  await seedBookings();
  await seedReviews();
  await seedSocial();
  await seedDevelopers();
  await seedMessages();
  await seedWallets();
  await seedCms();
  console.log('\n✅ Seed réaliste terminé. Mdp unique : ' + PASSWORD);
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

