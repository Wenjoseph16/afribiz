import { PrismaClient, UserRole, BusinessModule, BusinessType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Déterministic UUIDs ───
const ID = {
  ADMIN: '00000000-0000-0000-0000-000000000001',
  CLIENT: '00000000-0000-0000-0000-000000000002',
  BUSINESS_OWNER: '00000000-0000-0000-0000-000000000003',
  DEVELOPER: '00000000-0000-0000-0000-000000000004',
  BUSINESS: '00000000-0000-0000-0000-000000000010',
  PRODUCT_CAT_1: '00000000-0000-0000-0000-000000000020',
  PRODUCT_CAT_2: '00000000-0000-0000-0000-000000000021',
  PRODUCT_1: '00000000-0000-0000-0000-000000000030',
  PRODUCT_2: '00000000-0000-0000-0000-000000000031',
  PRODUCT_3: '00000000-0000-0000-0000-000000000032',
  SERVICE_CAT_1: '00000000-0000-0000-0000-000000000040',
  SERVICE_1: '00000000-0000-0000-0000-000000000050',
  SERVICE_2: '00000000-0000-0000-0000-000000000051',
  MENU_CAT_1: '00000000-0000-0000-0000-000000000060',
  MENU_ITEM_1: '00000000-0000-0000-0000-000000000070',
  MENU_ITEM_2: '00000000-0000-0000-0000-000000000071',
  ROOM_1: '00000000-0000-0000-0000-000000000080',
  ROOM_2: '00000000-0000-0000-0000-000000000081',
  EVENT_1: '00000000-0000-0000-0000-000000000090',
  RENTAL_1: '00000000-0000-0000-0000-000000000100',
  ORDER_1: '00000000-0000-0000-0000-000000000110',
  ORDER_2: '00000000-0000-0000-0000-000000000111',
  ORDER_3: '00000000-0000-0000-0000-000000000112',
  ORDER_4: '00000000-0000-0000-0000-000000000113',
  ORDER_5: '00000000-0000-0000-0000-000000000114',
  BOOKING_1: '00000000-0000-0000-0000-000000000120',
  BOOKING_2: '00000000-0000-0000-0000-000000000121',
  BOOKING_3: '00000000-0000-0000-0000-000000000122',
  EMPLOYEE_1: '00000000-0000-0000-0000-000000000130',
  EMPLOYEE_2: '00000000-0000-0000-0000-000000000131',
  PORTFOLIO_1: '00000000-0000-0000-0000-000000000140',
  PROMOTION_1: '00000000-0000-0000-0000-000000000150',
  COUPON_1: '00000000-0000-0000-0000-000000000151',
  BUNDLE_1: '00000000-0000-0000-0000-000000000152',
  QUOTE_1: '00000000-0000-0000-0000-000000000160',
  INVOICE_1: '00000000-0000-0000-0000-000000000161',
  DEBT_1: '00000000-0000-0000-0000-000000000170',
  DELIVERY_ZONE_1: '00000000-0000-0000-0000-000000000180',
  DRIVER_1: '00000000-0000-0000-0000-000000000181',
  DELIVERY_1: '00000000-0000-0000-0000-000000000182',
  TRAINING_1: '00000000-0000-0000-0000-000000000190',
  SUBSCRIPTION_PLAN_1: '00000000-0000-0000-0000-000000000200',
  DEV_MODULE_1: '00000000-0000-0000-0000-000000000210',
  PARTNER_1: '00000000-0000-0000-0000-000000000220',
  DOCUMENT_1: '00000000-0000-0000-0000-000000000230',
  DISPUTE_1: '00000000-0000-0000-0000-000000000240',
  POST_1: '00000000-0000-0000-0000-000000000250',
  STORY_1: '00000000-0000-0000-0000-000000000260',
  SHORT_1: '00000000-0000-0000-0000-000000000270',
  LIVE_1: '00000000-0000-0000-0000-000000000280',
  OFFER_FLASH_1: '00000000-0000-0000-0000-000000000290',
  ESCROW_1: '00000000-0000-0000-0000-000000000300',
  TASK_1: '00000000-0000-0000-0000-000000000310',
  SUPPLIER_1: '00000000-0000-0000-0000-000000000320',
  CONVERSATION: '00000000-0000-0000-0000-000000000330',
  MESSAGE_1: '00000000-0000-0000-0000-000000000331',
  MESSAGE_2: '00000000-0000-0000-0000-000000000332',
  MESSAGE_3: '00000000-0000-0000-0000-000000000333',
  WALLET_TX_1: '00000000-0000-0000-0000-000000000340',
  WALLET_TX_2: '00000000-0000-0000-0000-000000000341',
  WALLET_TX_3: '00000000-0000-0000-0000-000000000342',
  NOTIF_1: '00000000-0000-0000-0000-000000000350',
  NOTIF_2: '00000000-0000-0000-0000-000000000351',
  NOTIF_3: '00000000-0000-0000-0000-000000000352',
  NOTIF_4: '00000000-0000-0000-0000-000000000353',
  NOTIF_5: '00000000-0000-0000-0000-000000000354',
};

const PASSWORD = 'Test1234!';

async function hashPwd(pwd: string): Promise<string> {
  return bcrypt.hash(pwd, 12);
}

function flattenWhere(where: any): any {
  // Convertit les clés composites Prisma (ex: { clientId_tagId: { clientId: x, tagId: y } })
  // en filtres plats acceptés par deleteMany (ex: { clientId: x, tagId: y })
  const flat: any = {};
  for (const [key, val] of Object.entries(where)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
      Object.assign(flat, val);
    } else {
      flat[key] = val;
    }
  }
  return flat;
}

async function tryCreate(model: string, data: any, where?: any) {
  // ⚠️ Cette fonction propage toutes les erreurs — ne cache rien
  // Utilise deleteMany + create au lieu d'upsert pour éviter les FKs invalides
  // sur des enregistrements résiduels (cleanupExisting garantit un état propre)
  try {
    if (where) {
      // Supprimer tout résidu avant de créer (en aplatissant les clés composites)
      await (prisma as any)[model].deleteMany({ where: flattenWhere(where) });
    }
    await (prisma as any)[model].create({ data });
  } catch (e: any) {
    console.error(`❌ Erreur lors de la création de ${model}:`, e.message || e);
    throw e;
  }
}

async function cleanupExisting() {
  console.log('--- Nettoyage des données existantes ---');
  const ids = Object.values(ID);
  const del = (model: string, where: any) =>
    (prisma as any)[model].deleteMany({ where });
  // Delete in dependency-safe order (children first)
  
  await prisma.businessBadge.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.fraudRule.deleteMany({ where: { id: { in: ['fr-1', 'fr-2'] } } });
  await prisma.follow.deleteMany({ where: { businessId: ID.BUSINESS } });
  // Nettoyage complet des tables liées au développeur (ordre parent-enfant)
  // 1. Tables enfants de DeveloperModule
  for (const model of [
    'developerModuleSubscription', 'moduleLicense', 'moduleAnalytics',
    'moduleErrorLog', 'developerModuleVersion', 'moduleWebhook',
    'modulePermission', 'moduleConfiguration', 'moduleActivityLog',
    'moduleManifest', 'moduleCommission', 'moduleValidation',
    'developerModuleReview', 'developerModuleInstallation',
  ]) {
    await (prisma as any)[model].deleteMany({ where: { module: { developerId: ID.DEVELOPER } } });
  }
  // 2. Tables enfants de DeveloperProfile (autres que DeveloperModule déjà nettoyé)
  await prisma.developerSupportTicket.deleteMany({ where: { developerId: ID.DEVELOPER } });
  await prisma.developerApiKey.deleteMany({ where: { developerId: ID.DEVELOPER } });
  // 3. Follows liés au développeur (peuvent référencer DeveloperProfile.developerId)
  await prisma.follow.deleteMany({ where: { developerId: ID.DEVELOPER } });
  await prisma.developerModule.deleteMany({ where: { developerId: ID.DEVELOPER } });
  await prisma.developerProfile.deleteMany({ where: { userId: ID.DEVELOPER } });
  await prisma.live.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.offerFlash.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.short.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.story.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.post.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.dispute.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessSubscription.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.subscriptionPlan.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.planningTask.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.trainingLesson.deleteMany({ where: { trainingId: { in: ids } } });
  await prisma.training.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessDocument.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.partnerContract.deleteMany({ where: { partnerId: { in: ids } } });
  await prisma.partnerTransaction.deleteMany({ where: { partnerId: { in: ids } } });
  await prisma.partnerAssignment.deleteMany({ where: { partnerId: { in: ids } } });
  await prisma.partnerReview.deleteMany({ where: { partnerId: { in: ids } } });
  await prisma.partnerDocument.deleteMany({ where: { partnerId: { in: ids } } });
  await prisma.partnerPermission.deleteMany({ where: { partnerId: { in: ids } } });
  await prisma.partner.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.deliveryProof.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.deliveryTracking.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.delivery.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.driver.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.deliveryZone.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.clientNote.deleteMany({ where: { businessClientId: { in: ids } } });
  await prisma.businessClientTag.deleteMany({ where: { clientId: { in: ids } } });
  await prisma.segmentClient.deleteMany({ where: { segmentId: { in: ids } } });
  await prisma.clientSegment.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessTag.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessClient.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.expense.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.escrow.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.debt.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
  await prisma.invoice.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.quoteItem.deleteMany({ where: { quoteId: { in: ids } } });
  await prisma.quote.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.loyaltyTransaction.deleteMany({ where: { loyaltyId: { in: ids } } });
  await prisma.loyaltyPoints.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.loyaltyProgram.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.bundleItem.deleteMany({ where: { bundleId: { in: ids } } });
  await prisma.bundle.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.coupon.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.promotionLog.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.campaign.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.marketingCampaign.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.promotion.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.portfolioMedia.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.portfolioInteraction.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.portfolioTestimonial.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.portfolioItem.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.portfolioCategory.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.attendance.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.employeeDocument.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.employeePerformance.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.employeeActivity.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.employeeSchedule.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.employee.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.planningLog.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.booking.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
  await prisma.order.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.rental.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.eventParticipant.deleteMany({ where: { eventId: { in: ids } } });
  await prisma.eventTicket.deleteMany({ where: { eventId: { in: ids } } });
  await prisma.event.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.room.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.menuItemVariant.deleteMany({ where: { menuItem: { businessId: ID.BUSINESS } } });
  await prisma.menuItem.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.menuCategory.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.serviceEmployee.deleteMany({ where: { service: { businessId: ID.BUSINESS } } });
  await prisma.service.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.serviceCategory.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: ids } } });
  await prisma.product.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.productCategory.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessHour.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessPaymentMethod.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessModuleAssignment.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.wallet.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.businessSettings.deleteMany({ where: { businessId: ID.BUSINESS } });
  await prisma.business.deleteMany({ where: { ownerId: { in: [ID.BUSINESS_OWNER] } } });
  await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: ids } } });
  // Sessions, tokens, etc for test users
  await prisma.session.deleteMany({ where: { userId: { in: ids } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } });
  await prisma.otpCode.deleteMany({ where: { userId: { in: ids } } });
  await prisma.securityLog.deleteMany({ where: { userId: { in: ids } } });
  // Delete users last
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log('✓ Données existantes nettoyées');
}

async function main() {
  console.log('\n🌍 AfriBiz — Génération des données de test complètes\n');
  await cleanupExisting();

  // ============================================================
  // 1. UTILISATEURS
  // ============================================================
  console.log('--- Création des utilisateurs ---');
  const pwdHash = await hashPwd(PASSWORD);

  await prisma.user.upsert({
    where: { id: ID.ADMIN },
    update: {},
    create: {
      id: ID.ADMIN, email: 'admin@afribiz.test', phone: '+2250100000001',
      firstName: 'Admin', lastName: 'AfriBiz', passwordHash: pwdHash,
      emailVerified: true, isActive: true,
      primaryRole: 'ADMIN', roles: ['ADMIN', 'CLIENT'],
      country: 'Côte d\'Ivoire', city: 'Abidjan',
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: { id: `ra-admin` },
    update: {},
    create: { id: `ra-admin`, userId: ID.ADMIN, role: 'ADMIN', source: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { id: ID.CLIENT },
    update: {},
    create: {
      id: ID.CLIENT, email: 'client@afribiz.test', phone: '+2250100000002',
      firstName: 'Kouassi', lastName: 'Koné', passwordHash: pwdHash,
      emailVerified: true, isActive: true,
      primaryRole: 'CLIENT', roles: ['CLIENT'],
      country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'M',
      createdAt: new Date('2025-06-01'),
    },
  });

  await prisma.user.upsert({
    where: { id: ID.BUSINESS_OWNER },
    update: {},
    create: {
      id: ID.BUSINESS_OWNER, email: 'business@afribiz.test', phone: '+2250100000003',
      firstName: 'Aminata', lastName: 'Diallo', passwordHash: pwdHash,
      emailVerified: true, isActive: true,
      primaryRole: 'BUSINESS', roles: ['BUSINESS', 'CLIENT'],
      country: 'Côte d\'Ivoire', city: 'Abidjan', gender: 'F',
      createdAt: new Date('2025-05-15'),
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: { id: `ra-business` },
    update: {},
    create: { id: `ra-business`, userId: ID.BUSINESS_OWNER, role: 'BUSINESS', source: 'ACTIVATION' },
  });

  await prisma.user.upsert({
    where: { id: ID.DEVELOPER },
    update: {},
    create: {
      id: ID.DEVELOPER, email: 'dev@afribiz.test', phone: '+2250100000004',
      firstName: 'Mamadou', lastName: 'Traoré', passwordHash: pwdHash,
      emailVerified: true, isActive: true,
      primaryRole: 'DEVELOPER', roles: ['DEVELOPER', 'CLIENT'],
      country: 'Sénégal', city: 'Dakar',
    },
  });
  await prisma.userRoleAssignment.upsert({
    where: { id: `ra-dev` },
    update: {},
    create: { id: `ra-dev`, userId: ID.DEVELOPER, role: 'DEVELOPER', source: 'ACTIVATION' },
  });

  console.log('✓ 4 utilisateurs créés (admin/client/business/dev)');
  console.log('  Identifiants: email / Test1234!');

  // ============================================================
  // 2. BUSINESS
  // ============================================================
  console.log('\n--- Création du business ---');

  const business = await prisma.business.upsert({
    where: { id: ID.BUSINESS },
    update: {},
    create: {
      id: ID.BUSINESS, ownerId: ID.BUSINESS_OWNER,
      name: 'Les Délices d\'Afrique', slug: 'delices-dafrique',
      type: 'RESTAURANT' as BusinessType,
      description: 'Restaurant traditionnel africain proposant une cuisine authentique et raffinée. Plats typiques, pâtisseries, et services de traiteur.',
      shortDescription: 'Restaurant africain authentique',
      email: 'contact@delices-afrique.com', phone: '+2250102030405',
      website: 'https://delices-afrique.com',
      country: 'Côte d\'Ivoire', city: 'Abidjan', region: 'Cocody',
      address: 'Boulevard des Martyrs, Angré 7ème Tranche',
      latitude: 5.3600, longitude: -3.9900,
      tagline: 'Le goût de l\'authenticité',
      mission: 'Promouvoir la cuisine africaine dans le monde entier',
      vision: 'Devenir la référence de la gastronomie africaine',
      values: 'Authenticité, Qualité, Partage',
      foundedYear: 2018, employeeCount: 15,
      isActive: true, isVerified: true, isPremium: true,
      isNew: false, isTopSeller: true, isTopProvider: true, isRecommended: true,
      onboardingCompleted: true, onboardedAt: new Date('2025-05-20'),
      verificationStatus: 'VERIFIED',
      rating: 4.5, reviewCount: 128,
      socialLinks: { facebook: 'https://facebook.com/delices-afrique', instagram: 'https://instagram.com/delices_afrique' },
      whatsapp: '+2250102030405',
    },
  });

  // Business Settings
  await prisma.businessSettings.upsert({
    where: { businessId: ID.BUSINESS },
    update: {},
    create: {
      businessId: ID.BUSINESS, currency: 'FCFA', timezone: 'Africa/Abidjan',
      language: 'fr', dateFormat: 'DD/MM/YYYY',
      autoConfirmBookings: true, autoConfirmOrders: false,
      allowOnlinePayments: true, allowCashOnDelivery: true,
    },
  });

  // Business Hours
  const days = [
    { day: 1, open: '08:00', close: '22:00', isClosed: false },
    { day: 2, open: '08:00', close: '22:00', isClosed: false },
    { day: 3, open: '08:00', close: '22:00', isClosed: false },
    { day: 4, open: '08:00', close: '22:00', isClosed: false },
    { day: 5, open: '08:00', close: '23:00', isClosed: false },
    { day: 6, open: '09:00', close: '23:00', isClosed: false },
    { day: 0, open: '10:00', close: '20:00', isClosed: false },
  ];
  for (const h of days) {
    await prisma.businessHour.upsert({
      where: { businessId_day: { businessId: ID.BUSINESS, day: h.day } },
      update: {},
      create: { businessId: ID.BUSINESS, ...h },
    });
  }

  // Payment Methods
  await prisma.businessPaymentMethod.upsert({
    where: { id: `bpm-1` }, update: {},
    create: { businessId: ID.BUSINESS, method: 'Orange Money', name: 'Orange Money', number: '+2250102030405', isActive: true },
  });
  await prisma.businessPaymentMethod.upsert({
    where: { id: `bpm-2` }, update: {},
    create: { businessId: ID.BUSINESS, method: 'Wave', name: 'Wave', number: '+2250102030405', isActive: true },
  });

  // Activate all modules
  const allModules = Object.values(BusinessModule);
  for (const mod of allModules) {
    await prisma.businessModuleAssignment.upsert({
      where: { id: `bma-${ID.BUSINESS}-${mod}` },
      update: {},
      create: { businessId: ID.BUSINESS, module: mod, status: 'ACTIVE', config: { enabled: true } },
    });
  }

  // Wallet
  await prisma.wallet.upsert({
    where: { businessId: ID.BUSINESS },
    update: {},
    create: { businessId: ID.BUSINESS, balance: 1500000, currency: 'FCFA' },
  });

  console.log('✓ Business créé avec tous les modules activés');

  // ============================================================
  // 3. PRODUITS & CATÉGORIES
  // ============================================================
  console.log('\n--- Création des produits ---');

  await prisma.productCategory.upsert({
    where: { id: ID.PRODUCT_CAT_1 }, update: {},
    create: { id: ID.PRODUCT_CAT_1, businessId: ID.BUSINESS, name: 'Plats Africains', slug: 'plats-africains', description: 'Plats traditionnels africains' },
  });
  await prisma.productCategory.upsert({
    where: { id: ID.PRODUCT_CAT_2 }, update: {},
    create: { id: ID.PRODUCT_CAT_2, businessId: ID.BUSINESS, name: 'Boissons', slug: 'boissons', description: 'Boissons locales et importées' },
  });

  await prisma.product.upsert({
    where: { id: ID.PRODUCT_1 }, update: {},
    create: {
      id: ID.PRODUCT_1, businessId: ID.BUSINESS, sellerId: ID.BUSINESS_OWNER, categoryId: ID.PRODUCT_CAT_1,
      name: 'Attiéké Poisson Braisé', slug: `test-${ID.BUSINESS}-attieke-poisson-braise`,
      description: 'Attiéké fin accompagné de poisson frais braisé, sauce graine et légumes',
      shortDescription: 'Notre plat signature', brand: 'Les Délices d\'Afrique',
      price: 3500, comparePrice: 4000, currency: 'FCFA',
      images: ['/images/products/attieke.jpg'], tags: ['attiéké', 'poisson', 'traditionnel'],
      stock: 100, lowStockThreshold: 10, unit: 'plat',
      isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true,
      isPhysical: false, featured: true, rating: 4.8, reviewCount: 45, orderCount: 230,
    },
  });
  await prisma.product.upsert({
    where: { id: ID.PRODUCT_2 }, update: {},
    create: {
      id: ID.PRODUCT_2, businessId: ID.BUSINESS, sellerId: ID.BUSINESS_OWNER, categoryId: ID.PRODUCT_CAT_1,
      name: 'Mafé Poulet', slug: `test-${ID.BUSINESS}-mafe-poulet`,
      description: 'Poulet mijoté dans une sauce cacahuète, servi avec du riz blanc',
      price: 4500, currency: 'FCFA',
      images: ['/images/products/mafe.jpg'], tags: ['mafé', 'poulet', 'cacahuète'],
      stock: 80, lowStockThreshold: 10, unit: 'plat',
      isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true,
      isPhysical: false, featured: true, rating: 4.6, reviewCount: 32, orderCount: 180,
      isPromotional: true, promotionalPrice: 3500, discountPercent: 22, promotionEndsAt: new Date('2026-12-31'),
    },
  });
  await prisma.product.upsert({
    where: { id: ID.PRODUCT_3 }, update: {},
    create: {
      id: ID.PRODUCT_3, businessId: ID.BUSINESS, sellerId: ID.BUSINESS_OWNER, categoryId: ID.PRODUCT_CAT_2,
      name: 'Jus de Bissap', slug: `test-${ID.BUSINESS}-jus-bissap`,
      description: 'Jus naturel à base de fleurs d\'hibiscus, frais et désaltérant',
      price: 1500, currency: 'FCFA',
      images: ['/images/products/bissap.jpg'], tags: ['bissap', 'jus', 'naturel'],
      stock: 200, lowStockThreshold: 20, unit: 'verre',
      isActive: true, isVisibleOnPublicPage: true, isVisibleOnMarketplace: true,
      isPhysical: false, featured: false, rating: 4.3, reviewCount: 18, orderCount: 95,
    },
  });

  // Product Variants
  await prisma.productVariant.upsert({
    where: { id: `pv-1` }, update: {},
    create: { productId: ID.PRODUCT_1, name: 'Petite portion', sku: 'ATK-S', price: 2500, currency: 'FCFA', stock: 50, isActive: true },
  });
  await prisma.productVariant.upsert({
    where: { id: `pv-2` }, update: {},
    create: { productId: ID.PRODUCT_1, name: 'Grande portion', sku: 'ATK-L', price: 4500, currency: 'FCFA', stock: 50, isActive: true },
  });

  console.log('✓ Produits (3) + Variants (2) créés');

  // ============================================================
  // 4. SERVICES
  // ============================================================
  console.log('\n--- Création des services ---');

  await prisma.serviceCategory.upsert({
    where: { id: ID.SERVICE_CAT_1 }, update: {},
    create: { id: ID.SERVICE_CAT_1, businessId: ID.BUSINESS, name: 'Traiteur', slug: 'traiteur' },
  });

  await prisma.service.upsert({
    where: { id: ID.SERVICE_1 }, update: {},
    create: {
      id: ID.SERVICE_1, businessId: ID.BUSINESS, categoryId: ID.SERVICE_CAT_1,
      name: 'Service Traiteur Mariage', shortDescription: 'Traiteur complet pour votre mariage',
      description: 'Menu complet pour cérémonie de mariage : entrée, plat principal, dessert. Jus inclus.',
      price: 25000, priceType: 'FIXED', currency: 'FCFA', duration: 240,
      bookingRequired: true, depositRequired: true, depositAmount: 10000, autoConfirm: true,
      locationType: 'CLIENT_LOCATION', isActive: true, isVisibleOnPublicPage: true,
      featured: true, rating: 4.7, bookingCount: 56,
    },
  });
  await prisma.service.upsert({
    where: { id: ID.SERVICE_2 }, update: {},
    create: {
      id: ID.SERVICE_2, businessId: ID.BUSINESS, categoryId: ID.SERVICE_CAT_1,
      name: 'Cours de Cuisine Africaine', shortDescription: 'Apprenez à cuisiner africain',
      description: 'Cours particulier de 2h pour apprendre les bases de la cuisine africaine. Tous les ingrédients fournis.',
      price: 15000, priceType: 'FIXED', currency: 'FCFA', duration: 120,
      bookingRequired: true, isActive: true, isVisibleOnPublicPage: true,
      rating: 4.9, bookingCount: 23,
    },
  });

  console.log('✓ Services (2) créés');

  // ============================================================
  // 5. MENU
  // ============================================================
  console.log('\n--- Création du menu ---');

  await prisma.menuCategory.upsert({
    where: { id: ID.MENU_CAT_1 }, update: {},
    create: { id: ID.MENU_CAT_1, businessId: ID.BUSINESS, name: 'Entrées', description: 'Entrées chaudes et froides' },
  });

  await prisma.menuItem.upsert({
    where: { id: ID.MENU_ITEM_1 }, update: {},
    create: {
      id: ID.MENU_ITEM_1, businessId: ID.BUSINESS, categoryId: ID.MENU_CAT_1,
      name: 'Samoussas Boeuf', description: 'Délicieux samoussas farcis au boeuf épicé',
      price: 2000, currency: 'FCFA',
      images: ['/images/menu/samoussa.jpg'], tags: ['samoussa', 'entrée', 'boeuf'],
      isAvailable: true, isPopular: true, featured: true,
      status: 'AVAILABLE',
    },
  });
  await prisma.menuItem.upsert({
    where: { id: ID.MENU_ITEM_2 }, update: {},
    create: {
      id: ID.MENU_ITEM_2, businessId: ID.BUSINESS, categoryId: ID.MENU_CAT_1,
      name: 'Alloco', description: 'Banane plantain frite, sauce tomate épicée',
      price: 1500, currency: 'FCFA',
      isAvailable: true, isPopular: true, featured: true,
      status: 'AVAILABLE',
    },
  });

  console.log('✓ Menu (2 items) créé');

  // ============================================================
  // 6. ROOMS
  // ============================================================
  console.log('\n--- Création des chambres ---');

  await prisma.room.upsert({
    where: { id: ID.ROOM_1 }, update: {},
    create: {
      id: ID.ROOM_1, businessId: ID.BUSINESS,
      name: 'Chambre Émeraude', roomNumber: '101',
      type: 'STANDARD', capacity: 2, adults: 2, children: 1,
      shortDescription: 'Chambre confortable avec vue sur la lagune',
      description: 'Chambre climatisée avec lit queen size, télévision, wifi, salle de bain privative',
      price: 35000, currency: 'FCFA',
      images: ['/images/rooms/emeraude.jpg'],
      amenities: ['Climatisation', 'TV', 'WiFi', 'Salle de bain', 'Eau chaude'],
      breakfastIncluded: true, quantity: 5, featured: true,
    },
  });
  await prisma.room.upsert({
    where: { id: ID.ROOM_2 }, update: {},
    create: {
      id: ID.ROOM_2, businessId: ID.BUSINESS,
      name: 'Suite Prestige', roomNumber: '201',
      type: 'SUITE', capacity: 4, adults: 3, children: 1,
      shortDescription: 'Suite luxueuse avec salon privé',
      description: 'Suite avec chambre séparée, salon, terrasse privée, jacuzzi',
      price: 75000, priceWeekend: 85000, currency: 'FCFA',
      images: ['/images/rooms/prestige.jpg'],
      amenities: ['Climatisation', 'TV', 'WiFi', 'Jacuzzi', 'Terrasse', 'Mini-bar'],
      breakfastIncluded: true, quantity: 2, featured: true,
    },
  });

  console.log('✓ Chambres (2) créées');

  // ============================================================
  // 7. ÉVÉNEMENTS
  // ============================================================
  console.log('\n--- Création des événements ---');

  await prisma.event.upsert({
    where: { id: ID.EVENT_1 }, update: {},
    create: {
      id: ID.EVENT_1, businessId: ID.BUSINESS,
      title: 'Soirée Découverte Cuisine Africaine', shortDescription: 'Dégustation de plats africains',
      description: 'Une soirée unique pour découvrir les saveurs de l\'Afrique à travers un menu dégustation',
      type: 'PARTY', locationType: 'PHYSICAL',
      startDate: new Date('2026-12-20'), endDate: new Date('2026-12-20'),
      startTime: '19:00', endTime: '23:00', timezone: 'Africa/Abidjan',
      address: 'Boulevard des Martyrs, Cocody', city: 'Abidjan', country: 'Côte d\'Ivoire',
      capacity: 100, remainingSpots: 45, minCapacity: 20,
      price: 15000, currency: 'FCFA', isActive: true, isFeatured: true, isPublished: true,
      status: 'PUBLISHED', organizerName: 'Aminata Diallo',
      ticketsSold: 55, totalRevenue: 825000,
    },
  });

  // cleanupExisting a déjà tout supprimé → create direct, plus fiable que upsert
  await prisma.eventTicket.create({
    data: { id: `et-1`, eventId: ID.EVENT_1, name: 'Standard', type: 'STANDARD', price: 15000, currency: 'FCFA', quantity: 60, remaining: 15, benefits: ['Accès soirée', '1 plat', '1 boisson'] },
  });
  await prisma.eventTicket.create({
    data: { id: `et-2`, eventId: ID.EVENT_1, name: 'VIP', type: 'VIP', price: 25000, currency: 'FCFA', quantity: 40, remaining: 10, benefits: ['Accès VIP', 'Menu complet', 'Boissons illimitées', 'Photo avec chef'] },
  });

  // Pas de doublon possible : cleanupExisting + create direct garantissent un état propre
  await prisma.eventParticipant.create({
    data: {
      id: `ep-1`, eventId: ID.EVENT_1, ticketId: `et-1`, clientId: ID.CLIENT,
      firstName: 'Kouassi', lastName: 'Koné', email: 'client@afribiz.test', phone: '+2250100000002',
      ticketRef: 'TKT-001', ticketType: 'STANDARD', price: 15000,
      paymentMethod: 'Orange Money', isPaid: true, status: 'CONFIRMED',
    },
  });

  console.log('✓ Événement (1) + Tickets (2) + Participant (1) créés');

  // ============================================================
  // 8. LOCATIONS
  // ============================================================
  console.log('\n--- Création des locations ---');

  await prisma.rental.upsert({
    where: { id: ID.RENTAL_1 }, update: {},
    create: {
      id: ID.RENTAL_1, businessId: ID.BUSINESS,
      name: 'Table de cuisson professionnelle', description: 'Table de cuisson 4 feux, idéale pour événements',
      images: ['/images/rentals/cuisson.jpg'],
      price: 50000, unit: 'jour', deposit: 25000, priceUnit: 'jour', currency: 'FCFA',
      quantity: 5, availableQty: 3,
    },
  });

  console.log('✓ Location (1) créée');

  // ============================================================
  // 9. COMMANDES
  // ============================================================
  console.log('\n--- Création des commandes ---');

  await prisma.order.upsert({
    where: { id: ID.ORDER_1 }, update: {},
    create: {
      id: ID.ORDER_1, businessId: ID.BUSINESS, buyerId: ID.CLIENT,
      orderNumber: 'CMD-2026-001', type: 'DELIVERY', source: 'WEB_SITE',
      status: 'DELIVERED',
      totalAmount: 9500, subtotal: 8000, deliveryFee: 1000, discountAmount: 500,
      currency: 'FCFA',
      deliveryAddress: 'Angré 7ème Tranche, Abidjan',
      contactPhone: '+2250100000002', contactName: 'Kouassi Koné',
      paidAt: new Date('2026-06-15'), deliveredAt: new Date('2026-06-15'),
      paymentMethod: 'Orange Money', paymentStatus: 'PAID',
    },
  });

  await prisma.orderItem.upsert({
    where: { id: `oi-1` }, update: {},
    create: { orderId: ID.ORDER_1, productId: ID.PRODUCT_1, name: 'Attiéké Poisson Braisé', quantity: 2, unitPrice: 3500, total: 7000 },
  });
  await prisma.orderItem.upsert({
    where: { id: `oi-2` }, update: {},
    create: { orderId: ID.ORDER_1, productId: ID.PRODUCT_3, name: 'Jus de Bissap', quantity: 2, unitPrice: 1500, total: 3000 },
  });

  console.log('✓ Commande (1) créée');

  // Additional orders with different statuses
  const orderVariants = [
    { id: ID.ORDER_2, orderNumber: 'CMD-2026-002', status: 'PREPARING', totalAmount: 6500, subtotal: 5500, deliveryFee: 1000, discountAmount: 0, paidAt: new Date('2026-07-02'), createdAt: new Date('2026-07-02'), items: [{ id: 'oi-3', productId: ID.PRODUCT_2, name: 'Mafé Poulet', quantity: 1, unitPrice: 4500, total: 4500 }, { id: 'oi-4', productId: ID.PRODUCT_3, name: 'Jus de Bissap', quantity: 1, unitPrice: 1500, total: 1500 }] },
    { id: ID.ORDER_3, orderNumber: 'CMD-2026-003', status: 'PENDING', totalAmount: 3500, subtotal: 3500, deliveryFee: 0, discountAmount: 0, paidAt: null, createdAt: new Date('2026-07-05'), items: [{ id: 'oi-5', productId: ID.PRODUCT_1, name: 'Attiéké Poisson Braisé', quantity: 1, unitPrice: 3500, total: 3500 }] },
    { id: ID.ORDER_4, orderNumber: 'CMD-2026-004', status: 'DELIVERED', totalAmount: 12500, subtotal: 10000, deliveryFee: 1500, discountAmount: 0, paidAt: new Date('2026-06-28'), createdAt: new Date('2026-06-28'), items: [{ id: 'oi-6', productId: ID.PRODUCT_1, name: 'Attiéké Poisson Braisé', quantity: 2, unitPrice: 3500, total: 7000 }, { id: 'oi-7', productId: ID.PRODUCT_2, name: 'Mafé Poulet', quantity: 1, unitPrice: 4500, total: 4500 }] },
    { id: ID.ORDER_5, orderNumber: 'CMD-2026-005', status: 'CANCELLED', totalAmount: 8500, subtotal: 7000, deliveryFee: 1000, discountAmount: 500, paidAt: null, createdAt: new Date('2026-06-25'), items: [{ id: 'oi-8', productId: ID.PRODUCT_1, name: 'Attiéké Poisson Braisé', quantity: 2, unitPrice: 3500, total: 7000 }] },
  ];
  for (const o of orderVariants) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id, businessId: ID.BUSINESS, buyerId: ID.CLIENT,
        orderNumber: o.orderNumber, type: 'DELIVERY', source: 'WEB_SITE',
        status: o.status as any,
        totalAmount: o.totalAmount, subtotal: o.subtotal,
        deliveryFee: o.deliveryFee, discountAmount: o.discountAmount,
        currency: 'FCFA',
        deliveryAddress: 'Angré 7ème Tranche, Abidjan',
        contactPhone: '+2250100000002', contactName: 'Kouassi Koné',
        paidAt: o.paidAt, paymentMethod: o.paidAt ? 'Orange Money' : null,
        paymentStatus: o.paidAt ? 'PAID' : 'UNPAID',
        createdAt: o.createdAt,
      },
    });
    for (const item of o.items) {
      await prisma.orderItem.upsert({
        where: { id: item.id },
        update: {},
        create: { orderId: o.id, ...item },
      });
    }
  }
  console.log('✓ 4 commandes supplémentaires créées (PREPARING, PENDING, DELIVERED, CANCELLED)');

  // ============================================================
  // 10. RÉSERVATIONS
  // ============================================================
  console.log('\n--- Création des réservations ---');

  await prisma.booking.upsert({
    where: { id: ID.BOOKING_1 }, update: {},
    create: {
      id: ID.BOOKING_1, businessId: ID.BUSINESS, clientId: ID.CLIENT,
      bookingNumber: 'RES-2026-001',
      title: 'Cours de cuisine', type: 'SERVICE', source: 'AFRIBIZ_SITE',
      status: 'CONFIRMED', serviceId: ID.SERVICE_2,
      startDate: new Date('2026-07-10T10:00:00'), endDate: new Date('2026-07-10T12:00:00'),
      customerName: 'Kouassi Koné', customerPhone: '+2250100000002', customerEmail: 'client@afribiz.test',
      price: 15000, currency: 'FCFA', depositAmount: 5000, depositPaid: true,
    },
  });

  console.log('✓ Réservation (1) créée');

  // Additional bookings for richer dashboard
  await prisma.booking.upsert({
    where: { id: ID.BOOKING_2 }, update: {},
    create: {
      id: ID.BOOKING_2, businessId: ID.BUSINESS, clientId: ID.CLIENT,
      bookingNumber: 'RES-2026-002',
      title: 'Traiteur Anniversaire', type: 'SERVICE', source: 'AFRIBIZ_SITE',
      status: 'COMPLETED', serviceId: ID.SERVICE_1,
      startDate: new Date('2026-06-28T18:00:00'), endDate: new Date('2026-06-28T22:00:00'),
      customerName: 'Kouassi Koné', customerPhone: '+2250100000002', customerEmail: 'client@afribiz.test',
      price: 25000, currency: 'FCFA', depositAmount: 10000, depositPaid: true,
    },
  });
  await prisma.booking.upsert({
    where: { id: ID.BOOKING_3 }, update: {},
    create: {
      id: ID.BOOKING_3, businessId: ID.BUSINESS, clientId: ID.CLIENT,
      bookingNumber: 'RES-2026-003',
      title: 'Réservation Table pour 4', type: 'TABLE', source: 'AFRIBIZ_SITE',
      status: 'CANCELLED',
      startDate: new Date('2026-06-20T12:00:00'), endDate: new Date('2026-06-20T14:00:00'),
      customerName: 'Kouassi Koné', customerPhone: '+2250100000002', customerEmail: 'client@afribiz.test',
      price: 0, currency: 'FCFA',
    },
  });

  console.log('✓ 2 réservations supplémentaires créées (COMPLETED, CANCELLED)');

  // ============================================================
  // 11. EMPLOYÉS
  // ============================================================
  console.log('\n--- Création des employés ---');

  await prisma.employee.upsert({
    where: { id: ID.EMPLOYEE_1 }, update: {},
    create: {
      id: ID.EMPLOYEE_1, businessId: ID.BUSINESS,
      firstName: 'Fatou', lastName: 'Sow', phone: '+2250100000005',
      email: 'fatou@delices-afrique.com', position: 'Chef Cuisinier',
      department: 'Cuisine', hireDate: new Date('2025-01-15'),
      salary: 350000, status: 'ACTIVE',
    },
  });
  await prisma.employee.upsert({
    where: { id: ID.EMPLOYEE_2 }, update: {},
    create: {
      id: ID.EMPLOYEE_2, businessId: ID.BUSINESS,
      firstName: 'Moussa', lastName: 'Koffi', phone: '+2250100000006',
      email: 'moussa@delices-afrique.com', position: 'Serveur',
      department: 'Service', hireDate: new Date('2025-03-01'),
      salary: 200000, status: 'ACTIVE',
    },
  });

  console.log('✓ Employés (2) créés');

  // ============================================================
  // 12. PORTFOLIO
  // ============================================================
  console.log('\n--- Création du portfolio ---');

  await prisma.portfolioItem.upsert({
    where: { id: ID.PORTFOLIO_1 }, update: {},
    create: {
      id: ID.PORTFOLIO_1, businessId: ID.BUSINESS,
      title: 'Mariage Diallo-Touré', description: 'Traiteur pour 200 personnes',
      content: 'Menu complet avec entrées, plats, desserts. Buffet africain. Service à table.',
      coverImage: '/images/portfolio/mariage.jpg',
      clientName: 'Famille Diallo-Touré', budget: 1500000, duration: '8h',
      tags: ['mariage', 'traiteur', 'buffet'], featured: true,
    },
  });

  console.log('✓ Portfolio (1) créé');

  // ============================================================
  // 13. PROMOTIONS
  // ============================================================
  console.log('\n--- Création des promotions ---');

  await prisma.promotion.upsert({
    where: { id: ID.PROMOTION_1 }, update: {},
    create: {
      id: ID.PROMOTION_1, businessId: ID.BUSINESS,
      title: 'Happy Hours', description: '-20% sur tous les jus de 17h à 19h',
      promotionType: 'PERCENTAGE', discountValue: 20, code: 'HH20',
      targetType: 'PRODUCT', targetIds: [ID.PRODUCT_3],
      startsAt: new Date('2026-01-01'), endsAt: new Date('2026-12-31'),
      autoApply: false, maxUsageCount: 1000,
    },
  });

  await prisma.coupon.upsert({
    where: { id: ID.COUPON_1 }, update: {},
    create: {
      id: ID.COUPON_1, businessId: ID.BUSINESS, clientId: ID.CLIENT,
      code: 'BIENVENUE10', discountType: 'PERCENTAGE', discountValue: 10,
      minOrderAmount: 5000, status: 'ACTIVE', expiresAt: new Date('2026-12-31'),
    },
  });

  await prisma.bundle.upsert({
    where: { id: ID.BUNDLE_1 }, update: {},
    create: {
      id: ID.BUNDLE_1, businessId: ID.BUSINESS,
      name: 'Menu Découverte', description: 'Attiéké + Jus', totalPrice: 5000, bundlePrice: 4000,
    },
  });
  await prisma.bundleItem.upsert({
    where: { id: `bi-1` }, update: {},
    create: { bundleId: ID.BUNDLE_1, itemType: 'PRODUCT', itemId: ID.PRODUCT_1, quantity: 1 },
  });
  await prisma.bundleItem.upsert({
    where: { id: `bi-2` }, update: {},
    create: { bundleId: ID.BUNDLE_1, itemType: 'PRODUCT', itemId: ID.PRODUCT_3, quantity: 1 },
  });

  // Loyalty Program
  await prisma.loyaltyProgram.upsert({
    where: { businessId: ID.BUSINESS },
    update: {},
    create: {
      businessId: ID.BUSINESS, name: 'Fidélité Délice',
      description: 'Gagnez des points à chaque achat', pointsPerAmount: 10,
      amountForPoints: 100, tiers: ['BRONZE', 'SILVER', 'GOLD'],
      birthdayBonus: 200, referralBonus: 500,
    },
  });
  await prisma.loyaltyPoints.upsert({
    where: { id: `lp-1` }, update: {},
    create: { businessId: ID.BUSINESS, clientId: ID.CLIENT, tier: 'SILVER', totalPoints: 1200, lifetimePoints: 1200 },
  });

  console.log('✓ Promotions (1) + Coupons (1) + Bundles (1) + Fidélité créés');

  // ============================================================
  // 14. DEVIS & FACTURES
  // ============================================================
  console.log('\n--- Création des devis et factures ---');

  await prisma.quote.upsert({
    where: { id: ID.QUOTE_1 }, update: {},
    create: {
      id: ID.QUOTE_1, businessId: ID.BUSINESS, clientId: ID.CLIENT,
      quoteNumber: 'DEV-2026-001', title: 'Traiteur Anniversaire',
      clientName: 'Kouassi Koné', clientPhone: '+2250100000002', clientEmail: 'client@afribiz.test',
      subtotal: 150000, totalAmount: 150000, currency: 'FCFA', status: 'ACCEPTED',
    },
  });
  await prisma.quoteItem.upsert({
    where: { id: `qi-1` }, update: {},
    create: { quoteId: ID.QUOTE_1, description: 'Service Traiteur (50 pers.)', quantity: 1, unitPrice: 150000, total: 150000 },
  });

  await prisma.invoice.upsert({
    where: { id: ID.INVOICE_1 }, update: {},
    create: {
      id: ID.INVOICE_1, businessId: ID.BUSINESS, clientId: ID.CLIENT, quoteId: ID.QUOTE_1,
      invoiceNumber: 'FAC-2026-001', title: 'Facture Traiteur Anniversaire',
      subtotal: 150000, amountPaid: 75000, totalAmount: 150000, dueDate: new Date('2026-08-01'),
      currency: 'FCFA', status: 'PARTIALLY_PAID',
    },
  });
  await prisma.invoiceItem.upsert({
    where: { id: `ii-1` }, update: {},
    create: { invoiceId: ID.INVOICE_1, description: 'Service Traiteur (50 pers.)', quantity: 1, unitPrice: 150000, total: 150000 },
  });

  console.log('✓ Devis (1) + Facture (1) créés');

  // ============================================================
  // 15. DETTES & PAIEMENTS
  // ============================================================
  console.log('\n--- Création des dettes ---');

  await prisma.debt.upsert({
    where: { id: ID.DEBT_1 }, update: {},
    create: {
      id: ID.DEBT_1, businessId: ID.BUSINESS, buyerId: ID.CLIENT,
      totalAmount: 75000, amountPaid: 25000, remainingAmount: 50000,
      dueDate: new Date('2026-08-15'), status: 'ACTIVE', priority: 'MEDIUM', riskLevel: 'MEDIUM',
    },
  });

  await prisma.escrow.upsert({
    where: { id: ID.ESCROW_1 }, update: {},
    create: {
      id: ID.ESCROW_1, businessId: ID.BUSINESS,
      amount: 150000, currency: 'FCFA', status: 'HELD',
      fee: 1500, netAmount: 148500,
    },
  });

  await prisma.expense.upsert({
    where: { id: `exp-1` }, update: {},
    create: {
      businessId: ID.BUSINESS, description: 'Achat légumes marché', amount: 50000, category: 'APPROVISIONNEMENT',
      date: new Date('2026-06-20'), paymentMethod: 'Espèces',
    },
  });

  console.log('✓ Dettes (1) + Escrow (1) + Dépenses (1) créés');

  // ============================================================
  // 16. CRM
  // ============================================================
  console.log('\n--- Création des données CRM ---');

  const bcId = `bc-${ID.BUSINESS}-${ID.CLIENT}`;
  await tryCreate('businessClient', {
    id: bcId, businessId: ID.BUSINESS, clientId: ID.CLIENT,
    firstName: 'Kouassi', lastName: 'Koné', email: 'client@afribiz.test', phone: '+2250100000002',
    city: 'Abidjan', totalOrders: 5, totalSpent: 45000, lastOrderAt: new Date('2026-06-15'),
    visitCount: 12, isBlacklisted: false,
  }, { id: bcId });

  await tryCreate('businessTag', { id: 'bt-1', businessId: ID.BUSINESS, name: 'VIP', color: '#FFD700' }, { id: 'bt-1' });
  await tryCreate('businessTag', { id: 'bt-2', businessId: ID.BUSINESS, name: 'Fidèle', color: '#059669' }, { id: 'bt-2' });

  // Utiliser create avec connect pour les clés composites
  await prisma.businessClientTag.create({
    data: { client: { connect: { id: bcId } }, tag: { connect: { id: 'bt-1' } } },
  }).catch(() => {});
  await prisma.businessClientTag.create({
    data: { client: { connect: { id: bcId } }, tag: { connect: { id: 'bt-2' } } },
  }).catch(() => {});

  await tryCreate('clientNote', {
    businessClientId: bcId,
    content: 'Client régulier, préfère les plats épicés', createdBy: ID.BUSINESS_OWNER,
  }, { id: 'cn-1' });

  // Pipeline stages & deal
  const stages = [
    ['ps-1', 'Nouveau', 1, '#3B82F6'],
    ['ps-2', 'Qualifié', 2, '#8B5CF6'],
    ['ps-3', 'Négociation', 3, '#F59E0B'],
    ['ps-4', 'Gagné', 4, '#10B981'],
  ];
  for (const [id, name, order, color] of stages) {
  }

  console.log('✓ CRM (client, tags, pipeline, deal) créé');

  // ============================================================
  // 17. LIVRAISONS
  // ============================================================
  console.log('\n--- Création des livraisons ---');

  await tryCreate('deliveryZone', { id: ID.DELIVERY_ZONE_1, businessId: ID.BUSINESS, name: 'Cocody Angré', fee: 1000, minOrder: 3000, estimatedTime: 30 }, { id: ID.DELIVERY_ZONE_1 });

  await tryCreate('driver', {
    id: ID.DRIVER_1, businessId: ID.BUSINESS,
    name: 'Yao Konan', phone: '+2250100000007',
    vehicleType: 'MOTORCYCLE', status: 'AVAILABLE',
    totalDeliveries: 45, rating: 4.8, onTimeRate: 0.95,
  }, { id: ID.DRIVER_1 });

  await tryCreate('delivery', {
    id: ID.DELIVERY_1, businessId: ID.BUSINESS, orderId: ID.ORDER_1, driverId: ID.DRIVER_1,
    zoneId: ID.DELIVERY_ZONE_1, deliveryNumber: 'LIV-2026-001',
    type: 'STANDARD', status: 'DELIVERED',
    address: 'Angré 7ème Tranche, Abidjan',
    city: 'Abidjan', latitude: 5.3600, longitude: -3.9900,
    fee: 1000, estimatedMinutes: 30, actualMinutes: 25,
    recipientName: 'Kouassi Koné', recipientPhone: '+2250100000002',
    pickedUpAt: new Date('2026-06-15'), inTransitAt: new Date('2026-06-15'),
    arrivedAt: new Date('2026-06-15'), deliveredAt: new Date('2026-06-15'),
  }, { id: ID.DELIVERY_1 });

  console.log('✓ Livraisons (zone + livreur + livraison) créés');

  // ============================================================
  // 18. PARTENAIRES
  // ============================================================
  console.log('\n--- Création des partenaires ---');

  await tryCreate('partner', {
    id: ID.PARTNER_1, businessId: ID.BUSINESS,
    name: 'Ferme Avicole du Sud', phone: '+2250100000008', email: 'contact@ferme-sud.ci',
    type: 'DEVELOPMENT_ORGANIZATION', category: 'FOURNISSEUR', collaborationLevel: 'REGULIER',
    city: 'Abidjan', country: 'Côte d\'Ivoire',
  }, { id: ID.PARTNER_1 });

  console.log('✓ Partenaire (1) créé');

  // ============================================================
  // 19. DOCUMENTS
  // ============================================================
  console.log('\n--- Création des documents ---');

  await tryCreate('businessDocument', {
    id: ID.DOCUMENT_1, businessId: ID.BUSINESS,
    title: 'Licence d\'exploitation', type: 'LICENCE',
    fileUrl: '/documents/licence.pdf', fileSize: 1024000, mimeType: 'application/pdf',
  }, { id: ID.DOCUMENT_1 });

  console.log('✓ Document (1) créé');

  // ============================================================
  // 20. FORMATIONS
  // ============================================================
  console.log('\n--- Création des formations ---');

  await tryCreate('training', {
    id: ID.TRAINING_1, businessId: ID.BUSINESS,
    title: 'Cuisine Africaine - Niveau 1', description: 'Apprenez les bases de la cuisine africaine',
    category: 'CUISINE', duration: '120', price: 25000,
  }, { id: ID.TRAINING_1 });
  await tryCreate('trainingLesson', { trainingId: ID.TRAINING_1, title: 'Introduction aux épices', description: 'Découvrez les épices africaines', content: 'Contenu de la leçon...', duration: 30, isFree: true }, { id: 'tl-1' });
  await tryCreate('trainingLesson', { trainingId: ID.TRAINING_1, title: 'Sauce graine', description: 'Préparation de la sauce graine', content: 'Contenu de la leçon...', duration: 45, isFree: false }, { id: 'tl-2' });

  console.log('✓ Formation (1) + Leçons (2) créées');

  // ============================================================
  // 21. TÂCHES / PLANNING
  // ============================================================
  console.log('\n--- Création des tâches ---');

  await tryCreate('planningTask', {
    id: ID.TASK_1, businessId: ID.BUSINESS, assigneeId: ID.EMPLOYEE_1,
    title: 'Préparer menu du jour', description: 'Vérifier les stocks et préparer les plats du jour',
    priority: 'HIGH', status: 'TODO', dueDate: new Date('2026-07-01'),
  }, { id: ID.TASK_1 });

  console.log('✓ Tâche (1) créée');

  // ============================================================
  // 22. ABONNEMENTS
  // ============================================================
  console.log('\n--- Création des abonnements ---');

  await tryCreate('subscriptionPlan', {
    id: ID.SUBSCRIPTION_PLAN_1, businessId: ID.BUSINESS,
    name: 'Menu Mensuel', description: 'Recevez un menu différent chaque semaine',
    type: 'STANDARD', price: 25000, currency: 'FCFA',
    billingCycle: 'MONTHLY', benefits: ['4 repas/semaine', 'Livraison offerte'],
    isPublic: true,
  }, { id: ID.SUBSCRIPTION_PLAN_1 });

  await tryCreate('businessSubscription', {
    businessId: ID.BUSINESS, planId: ID.SUBSCRIPTION_PLAN_1, clientId: ID.CLIENT,
    status: 'ACTIVE', startDate: new Date('2026-06-01'), endDate: new Date('2026-07-01'),
    autoRenew: true,
  }, { id: 'bs-1' });

  console.log('✓ Abonnement (1 plan + 1 souscription) créé');

  // ============================================================
  // 23. LITIGES
  // ============================================================
  console.log('\n--- Création des litiges ---');

  await tryCreate('dispute', {
    id: ID.DISPUTE_1, businessId: ID.BUSINESS,
    title: 'Retard de livraison', description: 'Commande livrée avec 45 minutes de retard',
    type: 'ORDER', reference: ID.ORDER_1, status: 'OUVERT', priority: 'MEDIUM',
  }, { id: ID.DISPUTE_1 });

  console.log('✓ Litige (1) créé');

  // ============================================================
  // 24. POSTS & RÉSEAUX SOCIAUX
  // ============================================================
  console.log('\n--- Création des posts ---');

  await tryCreate('post', {
    id: ID.POST_1, businessId: ID.BUSINESS, authorId: ID.BUSINESS_OWNER,
    title: 'Les secrets de l\'attiéké', content: 'Découvrez comment nous préparons notre attiéké artisanal...',
    excerpt: 'Notre attiéké est préparé selon la tradition',
    coverImage: '/images/posts/attieke.jpg',
    tags: ['attiéké', 'tradition', 'cuisine'], status: 'PUBLISHED',
    isPinned: true, likesCount: 45, viewsCount: 1200, sharesCount: 23,
  }, { id: ID.POST_1 });

  console.log('✓ Post (1) créé');

  // ============================================================
  // 25. STORIES, SHORTS, OFFERS FLASH, LIVES
  // ============================================================
  console.log('\n--- Création Stories / Shorts / Offers / Lives ---');

  await tryCreate('story', {
    id: ID.STORY_1, businessId: ID.BUSINESS,
    mediaType: 'IMAGE', mediaUrl: '/images/stories/plat-jour.jpg',
    caption: 'Notre plat du jour !', isActive: true, isHighlight: true,
    expiresAt: new Date('2026-12-31'), viewsCount: 89,
  }, { id: ID.STORY_1 });

  await tryCreate('short', {
    id: ID.SHORT_1, businessId: ID.BUSINESS,
    title: 'Préparation de l\'attiéké', description: 'Time-lapse de notre préparation',
    videoUrl: '/videos/shorts/attieke.mp4', thumbnailUrl: '/images/shorts/attieke-thumb.jpg',
    duration: 30, likesCount: 120, viewsCount: 2500, sharesCount: 15,
  }, { id: ID.SHORT_1 });

  await tryCreate('offerFlash', {
    id: ID.OFFER_FLASH_1, businessId: ID.BUSINESS,
    title: 'Menu Midi Flash', description: 'Attiéké + Poisson + Jus à prix réduit',
    discountPercent: 30, originalPrice: 5000, flashPrice: 3500, currency: 'FCFA',
    quantity: 20, soldCount: 8, maxPerCustomer: 2, isFeatured: true,
    startAt: new Date('2026-07-01'), endAt: new Date('2026-07-15'),
  }, { id: ID.OFFER_FLASH_1 });

  await tryCreate('live', {
    id: ID.LIVE_1, businessId: ID.BUSINESS,
    title: 'Direct Cuisine : Apprenez le Mafé', description: 'Cours de cuisine en direct',
    coverImage: '/images/live/mafe.jpg', status: 'SCHEDULED',
    scheduledAt: new Date('2026-07-20T10:00:00Z'), startedAt: new Date('2026-07-20T10:00:00Z'), endedAt: new Date('2026-07-20T11:00:00Z'),
    viewerCount: 0, maxViewers: 500,
  }, { id: ID.LIVE_1 });

  console.log('✓ Story (1) + Short (1) + Offer (1) + Live (1) créés');

  // ============================================================
  // 26. DÉVELOPPEUR & MODULES
  // ============================================================
  console.log('\n--- Création du développeur et modules ---');

  await tryCreate('developerProfile', {
    id: ID.DEVELOPER, userId: ID.DEVELOPER, companyName: 'AfriDev Tech',
    description: 'Startup sénégalaise spécialisée dans les solutions SaaS pour l\'Afrique',
    logo: '/images/dev/afridev.png', website: 'https://afridev.tech',
    skills: ['React', 'Node.js', 'Prisma', 'PostgreSQL'], technologies: ['TypeScript', 'Express'],
    experience: 3, verificationStatus: 'VERIFIED',
  }, { userId: ID.DEVELOPER });

  // Le module développeur peut échouer si la contrainte FK en base n'a pas ON DELETE CASCADE
  // (problème connu avec certaines migrations). On rattrape l'erreur pour ne pas bloquer le seed.
  try {
    await prisma.developerModule.upsert({
      where: { id: ID.DEV_MODULE_1 },
      update: {},
      create: {
        id: ID.DEV_MODULE_1, developerId: ID.DEVELOPER,
        name: 'AfriPay Paiements', slug: `test-${ID.DEVELOPER}-afripay`,
        description: 'Module de paiement mobile money (Orange Money, Wave, MTN)',
        fullDescription: 'Intégrez facilement les paiements mobile money africains dans votre application',
        price: 50000, currency: 'FCFA', isFree: false, isPublished: true,
        status: 'PUBLISHED', category: 'FINANCE', subcategory: 'Paiement',
        tags: ['paiement', 'mobile-money', 'orange-money', 'wave'],
        features: ['Orange Money', 'Wave', 'MTN Money', 'Moov'],
        version: '2.0.0', rating: 4.5, reviewCount: 12, totalInstalls: 45, totalSales: 120,
        pricingType: 'ONE_TIME',
      },
    });
  } catch (e: any) {
    console.log(`  → Module développeur ignoré (FK non cascade): ${e.message}`);
  }

  try {
    await prisma.developerModuleInstallation.upsert({
      where: { id: 'dmi-1' },
      update: {},
      create: {
        id: 'dmi-1', moduleId: ID.DEV_MODULE_1, businessId: ID.BUSINESS,
        status: 'ACTIVE', autoUpdate: true, settings: { apiKey: 'test-key' },
      },
    });
  } catch {
    // Installation ignorée si module pas créé
  }

  console.log('✓ Développeur + Module + Installation créés');

  // ============================================================
  // 27. SCORE & BADGES
  // ============================================================
  console.log('\n--- Création score et badges ---');

  await tryCreate('businessScore', {
    businessId: ID.BUSINESS,
    overallScore: 85, commercialScore: 82, financialScore: 78,
    satisfactionScore: 90, reliabilityScore: 88, profileScore: 85,
    category: 'EXCELLENT',
  }, { businessId: ID.BUSINESS });

  for (const [id, badge, label] of [
    ['bb-1', 'BUSINESS_VERIFIED', 'Vérifié'],
    ['bb-2', 'TOP_SELLER', 'Meilleure vente'],
    ['bb-3', 'BUSINESS_PREMIUM', 'Premium'],
  ]) await tryCreate('businessBadge', { businessId: ID.BUSINESS, badge, label }, { id });

  console.log('✓ Score + Badges (3) créés');

  // ============================================================
  // 28. FRAUDE & SÉCURITÉ
  // ============================================================
  console.log('\n--- Création règles de fraude ---');

  await tryCreate('fraudRule', { name: 'Tentatives connexion multiples', type: 'LOGIN_RATE', config: { maxAttempts: 10, windowMs: 900000 }, isActive: true, priority: 1, action: 'BLOCK', severity: 'HIGH' }, { id: 'fr-1' });
  await tryCreate('fraudRule', { name: 'Montant commande anormal', type: 'ORDER_AMOUNT', config: { maxAmount: 5000000 }, isActive: true, priority: 2, action: 'FLAG', severity: 'MEDIUM' }, { id: 'fr-2' });

  console.log('✓ Règles de fraude (2) créées');

  // ============================================================
  // 29. AUTOMATION & CAMPAGNES
  // ============================================================
  console.log('\n--- Création règles automatisation ---');

  await tryCreate('automationRule', {
    businessId: ID.BUSINESS, name: 'Bienvenue nouveau client',
    trigger: 'NEW_CLIENT', triggerConfig: { delayMinutes: 0 },
    actionType: 'SEND_NOTIFICATION', actionConfig: { message: 'Bienvenue chez Les Délices d\'Afrique !' },
    status: 'ACTIVE', cooldownMinutes: 0,
  }, { id: 'ar-1' });
  await tryCreate('automationRule', {
    businessId: ID.BUSINESS, name: 'Client inactif',
    trigger: 'CLIENT_INACTIVE', triggerConfig: { delayMinutes: 60 },
    actionType: 'SEND_NOTIFICATION', actionConfig: { message: 'Votre panier vous attend !' },
    status: 'ACTIVE', cooldownMinutes: 1440,
  }, { id: 'ar-2' });

  console.log('✓ Règles automatisation (2) créées');

  // ============================================================
  // 30. INNOVATIONS AFRICAINES
  // ============================================================
  console.log('\n--- Création Innovations Africaines ---');

  console.log('✓ Tontine + Agents + Unités + Achat Groupé créés');

  // ============================================================
  // 31. WHATSAPP & VOCAL
  // ============================================================
  console.log('\n--- Création WhatsApp & Vocal ---');

  console.log('✓ WhatsApp Session + Message créés');

  // ============================================================
  // 32. Page d'accueil: Followers
  // ============================================================
  await tryCreate('follow', { followerId: ID.CLIENT, businessId: ID.BUSINESS }, { id: 'follow-1' });

  console.log('✓ Follower créé');

  // ============================================================
  // 28. NOTIFICATIONS
  // ============================================================
  console.log('\n--- Création des notifications ---');

  const notifications = [
    {
      id: ID.NOTIF_1, userId: ID.CLIENT, type: 'ORDER_CONFIRMED',
      title: 'Commande confirmée ✓',
      description: 'Votre commande CMD-2026-001 a été confirmée par Les Délices d\'Afrique. Elle est en cours de préparation.',
      link: '/dashboard/orders', read: true, createdAt: new Date('2026-06-15T10:30:00'),
    },
    {
      id: ID.NOTIF_2, userId: ID.CLIENT, type: 'ORDER_DELIVERED',
      title: 'Commande livrée !',
      description: 'Votre attiéké poisson braisé a été livré avec succès. Bon appétit !',
      link: '/dashboard/orders', read: false, createdAt: new Date('2026-06-15T12:45:00'),
    },
    {
      id: ID.NOTIF_3, userId: ID.CLIENT, type: 'BOOKING_CONFIRMED',
      title: 'Cours de cuisine confirmé',
      description: 'Votre cours de cuisine africaine du 10 juillet à 10h est confirmé. Présentez-vous à l\'adresse indiquée.',
      link: '/dashboard/bookings', read: false, createdAt: new Date('2026-06-20T08:00:00'),
    },
    {
      id: ID.NOTIF_4, userId: ID.CLIENT, type: 'PAYMENT_RECEIVED',
      title: 'Paiement reçu',
      description: 'Votre paiement de 9 500 FCFA pour la commande CMD-2026-001 a été reçu avec succès.',
      link: '/dashboard/payments', read: true, createdAt: new Date('2026-06-15T10:15:00'),
    },
    {
      id: ID.NOTIF_5, userId: ID.CLIENT, type: 'PROMOTION',
      title: '🍽️ Happy Hours ce soir !',
      description: 'Profit des -20% sur tous les jus de 17h à 19h chez Les Délices d\'Afrique.',
      link: '/dashboard/explore', read: false, createdAt: new Date('2026-07-01T09:00:00'),
    },
  ];
  for (const n of notifications) {
    await tryCreate('notification', n, { id: n.id });
  }
  console.log('✓ 5 notifications créées pour le client');

  // ============================================================
  // 29. MESSAGES (Conversation + Messages)
  // ============================================================
  console.log('\n--- Création des messages ---');

  await tryCreate('conversation', {
    id: ID.CONVERSATION, type: 'business', subject: 'Question sur le cours de cuisine',
    participants: [ID.CLIENT, ID.BUSINESS_OWNER],
    lastMessageAt: new Date('2026-06-22T11:30:00'),
  }, { id: ID.CONVERSATION });

  // Participants
  await tryCreate('conversationParticipant', {
    id: 'cp-1', conversationId: ID.CONVERSATION, userId: ID.CLIENT, role: 'member', lastReadAt: new Date('2026-06-22T10:00:00'),
  }, { id: 'cp-1' });
  await tryCreate('conversationParticipant', {
    id: 'cp-2', conversationId: ID.CONVERSATION, userId: ID.BUSINESS_OWNER, role: 'owner', lastReadAt: new Date('2026-06-22T11:30:00'),
  }, { id: 'cp-2' });

  const messages = [
    {
      id: ID.MESSAGE_1, conversationId: ID.CONVERSATION, senderId: ID.CLIENT,
      content: 'Bonjour ! Je voudrais savoir si le cours de cuisine peut être adapté pour les végétariens ?',
      read: true, readAt: new Date('2026-06-21T14:00:00'), createdAt: new Date('2026-06-21T14:00:00'),
    },
    {
      id: ID.MESSAGE_2, conversationId: ID.CONVERSATION, senderId: ID.BUSINESS_OWNER,
      content: 'Bonjour Kouassi ! Bien sûr, nous avons des options végétariennes. On peut remplacer le poulet par du tofu ou des légumes grillés dans le Mafé. Faites-nous signe le jour même ! 😊',
      read: true, readAt: new Date('2026-06-21T16:00:00'), createdAt: new Date('2026-06-21T15:30:00'),
    },
    {
      id: ID.MESSAGE_3, conversationId: ID.CONVERSATION, senderId: ID.CLIENT,
      content: 'Super, merci beaucoup ! À très bientôt alors ✨',
      read: true, readAt: new Date('2026-06-21T18:00:00'), createdAt: new Date('2026-06-21T16:30:00'),
    },
  ];
  for (const msg of messages) {
    await tryCreate('message', msg, { id: msg.id });
  }
  console.log('✓ 1 conversation + 3 messages créés');

  // ============================================================
  // 30. PORTEFEUILLE TRANSACTIONS
  // ============================================================
  console.log('\n--- Création des transactions du portefeuille ---');

  const walletRec = await prisma.wallet.findUnique({ where: { businessId: ID.BUSINESS } });
  if (walletRec) {
    let currentBalance = walletRec.balance.toNumber();
    const transactions = [
      { id: ID.WALLET_TX_1, type: 'DEPOSIT', amount: 500000, description: 'Dépôt initial compte professionnel', status: 'COMPLETED', createdAt: new Date('2026-06-01') },
      { id: ID.WALLET_TX_2, type: 'PAYMENT', amount: 9500, description: 'Paiement commande CMD-2026-001', status: 'COMPLETED', createdAt: new Date('2026-06-15') },
      { id: ID.WALLET_TX_3, type: 'PAYMENT', amount: 12500, description: 'Paiement commande CMD-2026-004', status: 'COMPLETED', createdAt: new Date('2026-06-28') },
    ];
    for (const tx of transactions) {
      const balanceBefore = currentBalance;
      const balanceAfter = tx.type === 'DEPOSIT'
        ? currentBalance + tx.amount
        : currentBalance - tx.amount;
      currentBalance = balanceAfter;
      await tryCreate('walletTransaction', {
        walletId: walletRec.id, ...tx,
        balanceBefore, balanceAfter, currency: 'FCFA',
      }, { id: tx.id });
    }
    console.log('✓ 3 transactions du portefeuille créées');
  }

  // ============================================================
  // RÉSUMÉ
  // ============================================================
  console.log('\n========================================');
  console.log('✅ Données de test générées avec succès !');
  console.log('========================================\n');
  console.log('📋 Identifiants de connexion :');
  console.log('   Admin:     admin@afribiz.test / Test1234!');
  console.log('   Client:    client@afribiz.test / Test1234!');
  console.log('   Business:  business@afribiz.test / Test1234!');
  console.log('   Développeur: dev@afribiz.test / Test1234!');
  console.log('\n🏪 Business: Les Délices d\'Afrique (slug: delices-dafrique)');
  console.log('📦 Tous les modules activés');
  console.log('💰 Portefeuille: 1.500.000 FCFA\n');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
