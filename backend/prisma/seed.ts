import { PrismaClient, UserRole, BusinessType, BusinessModule, BusinessVerificationStatus } from '@prisma/client';


import bcrypt from 'bcryptjs';



const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  const passwordHash = await bcrypt.hash('Test1234!', 10);

  // Create business owner
  const owner = await prisma.user.upsert({
    where: { email: 'business@afribiz.com' },
    update: {
      primaryRole: UserRole.BUSINESS,
      roles: [UserRole.CLIENT, UserRole.BUSINESS],
    },
    create: {
      firstName: 'Jean',
      lastName: 'Mensah',
      email: 'business@afribiz.com',
      phone: '+22812345678',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      primaryRole: UserRole.BUSINESS,
      roles: [UserRole.CLIENT, UserRole.BUSINESS],
    },
  });
  console.log(`✓ Business owner: ${owner.email}`);

  // Create a client
  const client = await prisma.user.upsert({
    where: { email: 'client@afribiz.com' },
    update: {
      primaryRole: UserRole.CLIENT,
      roles: [UserRole.CLIENT],
    },
    create: {
      firstName: 'Koffi',
      lastName: 'Kouassi',
      email: 'client@afribiz.com',
      phone: '+22890123456',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      neighborhood: 'Agoè',
      birthDate: new Date('1995-06-15'),
      primaryRole: UserRole.CLIENT,
      roles: [UserRole.CLIENT],
    },
  });
  console.log(`✓ Client: ${client.email}`);

  // Create demo business
  const modules: BusinessModule[] = [
    'PRODUCTS', 'SERVICES', 'MENU', 'ROOMS', 'BOOKINGS', 'ORDERS',
    'QUOTES_INVOICES', 'DEBTS_PAYMENTS', 'PROMOTIONS', 'PLANNING',
    'EMPLOYEES', 'PORTFOLIO', 'SUBSCRIPTIONS', 'DELIVERIES', 'EVENTS',
    'RENTALS', 'DOCUMENTS', 'PARTNERS', 'DISPUTES', 'MODULE_MARKETPLACE',
    'ADVANCED_TASKS',
  ];

  const business = await prisma.business.upsert({
    where: { slug: 'le-gourmet-togolais' },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Le Gourmet Togolais',
      slug: 'le-gourmet-togolais',
      type: BusinessType.RESTAURANT,
      modules,
      description: 'Le Gourmet Togolais est un restaurant haut de gamme situé au cœur de Lomé, offrant une expérience culinaire unique mêlant saveurs traditionnelles togolaises et cuisine contemporaine. Notre chef étoilé vous propose des plats préparés avec des ingrédients frais et locaux, dans un cadre élégant et chaleureux.',
      shortDescription: 'Restaurant gastronomique togolais - Cuisine traditionnelle et contemporaine',
      email: 'contact@legourmettogolais.com',
      phone: '+22822345678',
      website: 'https://legourmettogolais.com',
      country: 'Togo',
      city: 'Lomé',
      region: 'Lomé',
      address: '123 Boulevard du Mono, Quartier Administratif',
      latitude: 6.1256,
      longitude: 1.2254,
      whatsapp: '+22822345678',
      facebook: 'legourmettogolais',
      instagram: 'legourmettogolais',
      twitter: 'leGourmetTogo',
      linkedin: 'company/le-gourmet-togolais',
      youtube: '@legourmettogolais',
      mission: 'Offrir une expérience gastronomique exceptionnelle qui célèbre la richesse culinaire togolaise tout en respectant les normes internationales de qualité et de service.',
      vision: 'Devenir la référence de la gastronomie togolaise en Afrique de l\'Ouest d\'ici 2030.',
      values: 'Qualité, Authenticité, Innovation, Respect des traditions, Service irréprochable',
      foundedYear: 2015,
      employeeCount: 25,
      rating: 4.5,
      reviewCount: 3,
      isActive: true,
      isVerified: true,
      verificationStatus: BusinessVerificationStatus.VERIFIED,
    },
  });
  console.log(`✓ Business: ${business.name} (slug: ${business.slug})`);

  // Hours
  const days = [
    { day: 1, open: '08:00', close: '22:00' },
    { day: 2, open: '08:00', close: '22:00' },
    { day: 3, open: '08:00', close: '22:00' },
    { day: 4, open: '08:00', close: '23:00' },
    { day: 5, open: '08:00', close: '23:00' },
    { day: 6, open: '09:00', close: '23:00' },
    { day: 0, isClosed: true },
  ];
  for (const d of days) {
    await prisma.businessHour.upsert({
      where: { businessId_day: { businessId: business.id, day: d.day } },
      update: {},
      create: {
        businessId: business.id,
        day: d.day,
        open: (d as any).open || null,
        close: (d as any).close || null,
        isClosed: (d as any).isClosed || false,
      },
    });
  }
  console.log('✓ Hours (7 days)');

  // Payment methods
  const paymentMethods = [
    { method: 'MOBILE_MONEY', name: 'TMoney', number: '*855#', isActive: true },
    { method: 'MOBILE_MONEY', name: 'Flooz', number: '*877#', isActive: true },
    { method: 'CASH', name: 'Espèces', isActive: true },
    { method: 'BANK_TRANSFER', name: 'Virement bancaire', isActive: true },
    { method: 'CREDIT_CARD', name: 'Carte bancaire', isActive: true },
  ];
  for (const pm of paymentMethods) {
    await prisma.businessPaymentMethod.create({
      data: { businessId: business.id, ...pm },
    });
  }
  console.log('✓ Payment methods (5)');

  // Delivery zones
  const zones = [
    { name: 'Lomé Centre', fee: 1000, minOrder: 5000 },
    { name: 'Agoè', fee: 1500, minOrder: 5000 },
    { name: 'Tokoin', fee: 1500, minOrder: 7000 },
    { name: 'Kégué', fee: 2000, minOrder: 7000 },
  ];
  for (const z of zones) {
    await prisma.deliveryZone.create({
      data: { businessId: business.id, ...z, isActive: true },
    });
  }
  console.log('✓ Delivery zones (4)');

  // Products
  const products = [
    { name: 'Huile de Palme Bio', slug: 'huile-palme-bio', description: 'Huile de palme rouge naturelle issue de l\'agriculture biologique', price: 2500, stock: 50, rating: 4.5, reviewCount: 12 },
    { name: 'Piment Séché', slug: 'piment-seche', description: 'Piment séché au soleil, conditionné sous vide', price: 800, stock: 100, rating: 4.0, reviewCount: 8 },
    { name: 'Tapioca de Qualité', slug: 'tapioca-qualite', description: 'Tapioca pur, idéal pour le dégué et les desserts', price: 1500, stock: 30, rating: 5.0, reviewCount: 5 },
    { name: 'Sauce Gombo', slug: 'sauce-gombo', description: 'Sauce gombo traditionnelle prête à l\'emploi', price: 1800, stock: 20, rating: 4.2, reviewCount: 7 },
    { name: 'Jus de Bissap', slug: 'jus-bissap', description: 'Jus de bissap naturel, sans conservateur', price: 1200, stock: 60, rating: 4.8, reviewCount: 15 },
    { name: 'Beurre de Karité', slug: 'beurre-karite', description: 'Beurre de karité pur, 100% naturel', price: 3500, stock: 25, rating: 4.6, reviewCount: 9 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        sellerId: owner.id,
        businessId: business.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        stock: p.stock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        isActive: true,
        images: [],
      },
    });
  }
  console.log('✓ Products (6)');

  // Services
  const services = [
    { name: 'Traiteur pour événements', description: 'Service traiteur pour mariages, anniversaires, séminaires', price: 50000, duration: 480 },
    { name: 'Cours de cuisine togolaise', description: 'Apprenez à préparer les plats traditionnels togolais', price: 15000, duration: 180 },
    { name: 'Livraison à domicile', description: 'Livraison de nos plats dans tout Lomé', price: null, duration: null },
    { name: 'Service de table', description: 'Location de vaisselle et personnel de service', price: 25000, duration: 360 },
  ];
  for (const s of services) {
    await prisma.service.create({
      data: { businessId: business.id, ...s, currency: 'FCFA', images: [], isActive: true },
    });
  }
  console.log('✓ Services (4)');

  // Menu categories (upsert pour éviter les doublons)
  const catDefs = [
    { name: 'Entrées', description: 'Nos entrées traditionnelles', sortOrder: 1 },
    { name: 'Plats Principaux', description: 'Plats signature du Chef', sortOrder: 2 },
    { name: 'Desserts', description: 'Desserts gourmands', sortOrder: 3 },
    { name: 'Boissons', description: 'Boissons fraîches et locales', sortOrder: 4 },
  ];
  const catMap: Record<string, { id: string }> = {};
  for (const c of catDefs) {
    const cat = await prisma.menuCategory.upsert({
      where: { businessId_name: { businessId: business.id, name: c.name } },
      update: { ...c },
      create: { businessId: business.id, ...c },
    });
    catMap[c.name] = { id: cat.id };
  }
  const entreeCat = catMap['Entrées'];
  const platCat = catMap['Plats Principaux'];
  const dessertCat = catMap['Desserts'];
  const boissonCat = catMap['Boissons'];
  console.log('✓ Menu categories (4)');

  // Menu items
  const menuItems = [
    { categoryId: entreeCat.id, name: 'Samoussas au Bœuf', description: 'Samoussas croustillantes farcies au bœuf épicé', price: 2500, allergens: ['Gluten'] },
    { categoryId: entreeCat.id, name: 'Salade d\'Avocat aux Crevettes', description: 'Avocat frais accompagné de crevettes sautées', price: 3500, allergens: ['Crustacés'] },
    { categoryId: platCat.id, name: 'Fufu Sauce Gombo', description: 'Fufu de maniac accompagné de sauce gombo et poisson fumé', price: 4500, allergens: [] },
    { categoryId: platCat.id, name: 'Riz Sauce Arachide', description: 'Riz blanc nappé d\'une sauce arachide au poulet', price: 4000, allergens: ['Arachides'] },
    { categoryId: platCat.id, name: 'Pâtes Carbonara', description: 'Pâtes fraîches à la carbonara façon togolaise', price: 3800, allergens: ['Gluten', 'Œufs', 'Lait'] },
    { categoryId: dessertCat.id, name: 'Dégué à la Mangue', description: 'Semoule au lait, mangue fraîche et cannelle', price: 2000, allergens: ['Gluten', 'Lait'] },
    { categoryId: dessertCat.id, name: 'Crème Brûlée à la Vanille', description: 'Crème brûlée onctueuse à la vanille de Madagascar', price: 2500, allergens: ['Œufs', 'Lait'] },
    { categoryId: boissonCat.id, name: 'Bissap Frais', description: 'Jus de bissap glacé à la menthe', price: 1500, allergens: [] },
    { categoryId: boissonCat.id, name: 'Jus de Baobab', description: 'Jus de fruit de baobab vitaminé', price: 1800, allergens: [] },
    { categoryId: boissonCat.id, name: 'Bière Togolaise', description: 'Bière locale pression', price: 2000, allergens: ['Gluten'] },
  ];
  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: { businessId: business.id, ...item, currency: 'FCFA', images: [], isAvailable: true, isActive: true, sortOrder: 0 },
    });
  }
  console.log('✓ Menu items (10)');

  // Rooms
  const rooms = [
    { name: 'Chambre Standard', description: 'Chambre climatisée avec lit double, TV et salle de bain privative', price: 25000, capacity: 2, amenities: ['Climatisation', 'TV', 'WiFi', 'Salle de bain'] },
    { name: 'Chambre Deluxe', description: 'Chambre spacieuse avec vue sur la ville, mini-bar et coin salon', price: 40000, capacity: 2, amenities: ['Climatisation', 'TV', 'WiFi', 'Mini-bar', 'Salle de bain', 'Balcon'] },
    { name: 'Suite Présidentielle', description: 'Suite luxueuse avec salon séparé, jacuzzi et service de conciergerie', price: 80000, capacity: 4, amenities: ['Climatisation', 'TV', 'WiFi', 'Mini-bar', 'Jacuzzi', 'Salon', 'Balcon'] },
  ];
  for (const r of rooms) {
    await prisma.room.create({
      data: { businessId: business.id, ...r, images: [], isAvailable: true, isActive: true },
    });
  }
  console.log('✓ Rooms (3)');

  // Events
  const events = [
    { title: 'Soirée Gastronomique Togolaise', description: 'Une soirée exceptionnelle avec un menu dégustation de 7 plats', startDate: new Date('2026-06-20'), endDate: new Date('2026-06-20'), address: 'Restaurant Le Gourmet Togolais', price: 25000, capacity: 50 },
    { title: 'Atelier Cuisine Traditionnelle', description: 'Apprenez à préparer les plats traditionnels togolais avec notre chef', startDate: new Date('2026-07-05'), endDate: new Date('2026-07-05'), address: 'Cuisine du restaurant', price: 15000, capacity: 15 },
    { title: 'Dégustation de Vins & Mets', description: 'Soirée d\'accords mets et vins avec sélection de vins africains', startDate: new Date('2026-07-15'), address: 'Terrasse du restaurant', price: 20000, capacity: 30 },
  ];
  for (const e of events) {
    await prisma.event.create({
      data: { businessId: business.id, ...e, images: [], isActive: true },
    });
  }
  console.log('✓ Events (3)');

  // Rentals
  const rentals = [
    { name: 'Tente de Réception 50 places', description: 'Tente premium pour réceptions et cérémonies', price: 50000, unit: 'day', quantity: 3, deposit: 75000 },
    { name: 'Table et Chaises (lot de 10)', description: 'Lot de 10 tables rondes + 10 chaises', price: 15000, unit: 'day', quantity: 20, deposit: 25000 },
    { name: 'Sonorisation Complète', description: 'Système de sonorisation avec micros et enceintes', price: 35000, unit: 'day', quantity: 2, deposit: 50000 },
  ];
  for (const r of rentals) {
    await prisma.rental.create({
      data: { businessId: business.id, ...r, images: [], isActive: true },
    });
  }
  console.log('✓ Rentals (3)');

  // Portfolio
  const portfolioItems = [
    { title: 'Mariage Traditionnel Ewe', description: 'Cérémonie de mariage pour 200 invités', legacyCategory: 'Mariages', projectDate: new Date('2026-01-15') },
    { title: 'Séminaire Entreprise', description: 'Cocktail déjeunatoire pour 100 personnes', legacyCategory: 'Professionnel', projectDate: new Date('2026-02-20') },
    { title: 'Anniversaire Surprise', description: 'Dîner privé pour 30 personnes', legacyCategory: 'Privé', projectDate: new Date('2026-03-10') },
  ];
  for (const p of portfolioItems) {
    await prisma.portfolioItem.create({
      data: { businessId: business.id, ...p, images: [], isActive: true },
    });
  }
  console.log('✓ Portfolio (3)');

  // Promotions
  const promotions = [
    { title: 'Menu Découverte', description: 'Menu 3 plats à prix réduit', promotionType: 'FIXED', discountValue: 5000, code: 'MENU5K', startsAt: new Date('2026-06-01'), endsAt: new Date('2026-08-31') },
    { title: 'Fidélité -10%', description: '10% de réduction pour les clients fidèles', promotionType: 'PERCENTAGE', discountValue: 10, code: 'FIDELITE10', startsAt: new Date('2026-01-01'), endsAt: new Date('2026-12-31') },
  ];
  for (const p of promotions) {
    await prisma.promotion.create({
      data: { businessId: business.id, ...p, image: null, isActive: true },
    });
  }
  console.log('✓ Promotions (2)');

  // Partners
  const partners = [
    { name: 'Brasserie du Togo', description: 'Partenaire bière officiel', website: 'https://brasserietogo.tg' },
    { name: 'Ferme Bio d\'Agou', description: 'Fournisseur de produits frais bio', website: 'https://fermeagou.tg' },
    { name: 'Vins d\'Afrique', description: 'Importateur de vins africains', website: 'https://vinsafrique.com' },
  ];
  for (const p of partners) {
    await prisma.partner.create({
      data: { businessId: business.id, ...p, logo: null, isActive: true },
    });
  }
  console.log('✓ Partners (3)');

  // Reviews
  const reviews = [
    { userId: client.id, rating: 5, title: 'Excellent !', comment: 'Un cadre magnifique, une cuisine délicieuse. Le fufu sauce gombo est un vrai délice. Service impeccable.' },
    { userId: owner.id, rating: 4, title: 'Très bonne table', comment: 'Les saveurs sont authentiques et le personnel est très professionnel. Je recommande les samoussas.' },
  ];
  for (const r of reviews) {
    await prisma.businessReview.create({
      data: { businessId: business.id, ...r },
    });
  }
  console.log('✓ Reviews (2)');

  // ============================================
  // ADMIN + DEVELOPER ACCOUNT (unified ID)
  // ============================================
  const adminDev = await prisma.user.upsert({
    where: { email: 'admin@afribiz.com' },
    update: {
      primaryRole: UserRole.ADMIN,
      roles: [UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER],
    },
    create: {
      firstName: 'Mawuli',
      lastName: 'Sénam',
      email: 'admin@afribiz.com',
      phone: '+22899887766',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      primaryRole: UserRole.ADMIN,
      roles: [UserRole.ADMIN, UserRole.CLIENT, UserRole.DEVELOPER],
    },
  });
  console.log(`✓ Admin+Developer: ${adminDev.email}`);

  // Create developer profile for admin
  const adminDevProfile = await prisma.developerProfile.upsert({
    where: { userId: adminDev.id },
    update: {},
    create: {
      userId: adminDev.id,
      companyName: 'AfriBiz Studio',
      country: 'Togo',
      city: 'Lomé',
      description: 'Compte admin + développeur - Tous les accès pour tester la plateforme.',
      skills: ['Administration', 'Développement Full-Stack', 'React', 'Node.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Mobile Money', 'UI/UX'],
      experience: 8,
      verificationStatus: 'VERIFIED',
      isVerified: true,
    },
  });
  console.log(`✓ Admin+Developer profile: ${adminDevProfile.companyName}`);

  // Create MULTIPLE developer modules for admin+dev
  const adminModules = [
    {
      name: 'Factura Pro', slug: 'factura-pro', category: 'Finance', price: 25000,
      description: 'Module de facturation et devis complet pour PME africaines',
      fullDescription: 'Gérez facilement vos factures, devis et avoirs. Support multi-devises (FCFA, Naira, Cedi, etc.), TVA personnalisable, relances automatiques, export PDF. Intégration Mobile Money et virement bancaire.',
      isFeatured: true,
    },
    {
      name: 'Stock Master', slug: 'stock-master', category: 'Gestion', price: 15000,
      description: 'Gestion de stock intelligente avec alertes et réapprovisionnement automatique',
      fullDescription: 'Suivez votre inventaire en temps réel. Alertes de stock bas, réapprovisionnement automatique, code-barres, rapports d\'inventaire, et intégration avec vos fournisseurs.',
      isFeatured: false,
    },
    {
      name: 'CRM Client Plus', slug: 'crm-client-plus', category: 'CRM', price: 20000,
      description: 'CRM complet pour fidéliser vos clients et automatiser le marketing',
      fullDescription: 'Gérez vos relations clients, segmentez votre audience, automatisez les campagnes marketing, suivez les interactions. Idéal pour booster vos ventes.',
      isFeatured: true,
    },
    {
      name: 'Booking Manager', slug: 'booking-manager', category: 'Réservations', price: 18000,
      description: 'Système de réservation avancé avec calendrier et paiement en ligne',
      fullDescription: 'Gérez les réservations en ligne, calendrier interactif, rappels SMS/email, paiement Mobile Money intégré. Parfait pour hôtels, restaurants et services.',
      isFeatured: false,
    },
    {
      name: 'Marketing Auto', slug: 'marketing-auto', category: 'Marketing', price: 0,
      description: 'Module gratuit d\'automatisation marketing : campagnes, newsletters, SMS',
      fullDescription: 'Créez des campagnes marketing automatisées, newsletters, campagnes SMS/WhatsApp. Segmentation client et reporting détaillé.',
      isFeatured: false,
    },
  ];
  for (const mod of adminModules) {
    await prisma.developerModule.upsert({
      where: { slug: mod.slug },
      update: {},
      create: {
        developerId: adminDevProfile.id,
        name: mod.name,
        slug: mod.slug,
        description: mod.description,
        fullDescription: mod.fullDescription,
        category: mod.category,
        price: mod.price,
        currency: 'FCFA',
        status: 'PUBLISHED',
        isFeatured: mod.isFeatured,
        isVerified: true,
      },
    });
  }
  console.log(`✓ Admin+Developer modules (${adminModules.length})`);

  // ============================================
  // DEVELOPPER ACCOUNT (standalone dev)
  // ============================================
  const dev = await prisma.user.upsert({
    where: { email: 'dev@afribiz.com' },
    update: {
      primaryRole: UserRole.DEVELOPER,
      roles: [UserRole.CLIENT, UserRole.DEVELOPER],
    },
    create: {
      firstName: 'Komlan',
      lastName: 'Amegble',
      email: 'dev@afribiz.com',
      phone: '+22856789012',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      primaryRole: UserRole.DEVELOPER,
      roles: [UserRole.CLIENT, UserRole.DEVELOPER],
    },
  });
  console.log(`✓ Developer: ${dev.email}`);

  const devProfile = await prisma.developerProfile.upsert({
    where: { userId: dev.id },
    update: {},
    create: {
      userId: dev.id,
      companyName: 'CodeAfrica Dev',
      country: 'Togo',
      city: 'Lomé',
      description: 'Développeur passionné par l\'écosystème tech africain. Créateur de solutions SaaS innovantes pour les PME.',
      skills: ['Développement Web', 'SaaS', 'API', 'Mobile', 'React', 'Node.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
      experience: 5,
      verificationStatus: 'VERIFIED',
      isVerified: true,
    },
  });
  console.log(`✓ Developer profile: ${devProfile.companyName}`);

  // Create a demo module for standalone dev
  await prisma.developerModule.upsert({
    where: { slug: 'ecommerce-pro' },
    update: {},
    create: {
      developerId: devProfile.id,
      name: 'E-Commerce Pro',
      slug: 'ecommerce-pro',
      description: 'Plateforme e-commerce complète pour boutique en ligne',
      fullDescription: 'Créez votre boutique en ligne avec panier, paiement Mobile Money, livraison, et catalogue produits. Multi-devises et multi-langues.',
      category: 'E-Commerce',
      price: 35000,
      currency: 'FCFA',
      status: 'PUBLISHED',
      isFeatured: true,
      isVerified: true,
    },
  });
  console.log('✓ Developer module: E-Commerce Pro');

  // ============================================
  // AD PACKAGES (seed data for advertising)
  // ============================================
  const adPackages = [
    {
      name: 'Découverte',
      slug: 'decouverte',
      description: 'Parfait pour tester AfriBiz Ads — bannière sur les pages business pendant 24h',
      advertiserType: 'BUSINESS',
      placements: ['BUSINESS_PUBLIC_PAGE:HERO_BANNER', 'BUSINESS_PUBLIC_PAGE:SIDEBAR'],
      durationHours: 24,
      price: 10000,
      currency: 'FCFA',
    },
    {
      name: 'Standard',
      slug: 'standard',
      description: 'Visibilité accrue : bannière + sidebar + carrousel pendant 48h',
      advertiserType: 'BUSINESS',
      placements: ['BUSINESS_PUBLIC_PAGE:HERO_BANNER', 'BUSINESS_PUBLIC_PAGE:SIDEBAR', 'BUSINESS_PUBLIC_PAGE:PROMO_WIDGET', 'MARKETPLACE:SPONSORED_CARD'],
      durationHours: 48,
      price: 25000,
      currency: 'FCFA',
    },
    {
      name: 'Premium',
      slug: 'premium',
      description: 'Pack complet : toutes les positions sur toutes les pages publiques pendant 48h',
      advertiserType: 'BUSINESS',
      placements: ['BUSINESS_PUBLIC_PAGE:HERO_BANNER', 'BUSINESS_PUBLIC_PAGE:SIDEBAR', 'BUSINESS_PUBLIC_PAGE:PROMO_WIDGET', 'MARKETPLACE:SPONSORED_CARD', 'MARKETPLACE:SPONSORED_RESULT', 'HOMEPAGE:FEATURED_BLOCK', 'DASHBOARD_CLIENT:SIDEBAR', 'DASHBOARD_BUSINESS:SIDEBAR'],
      durationHours: 48,
      price: 100000,
      currency: 'FCFA',
    },
    {
      name: 'Développeur Boost',
      slug: 'developpeur-boost',
      description: 'Pour promouvoir vos modules sur le marketplace développeur pendant 48h',
      advertiserType: 'DEVELOPER',
      placements: ['MARKETPLACE:SPONSORED_CARD', 'MODULE_PAGE:SIDEBAR', 'DASHBOARD_DEVELOPER:SIDEBAR'],
      durationHours: 48,
      price: 35000,
      currency: 'FCFA',
    },
    {
      name: 'Externe Pro',
      slug: 'externe-pro',
      description: 'Pour les annonceurs externes — audience large sur tout l\'écosystème AfriBiz',
      advertiserType: 'EXTERNAL',
      placements: ['HOMEPAGE:HERO_BANNER', 'HOMEPAGE:FEATURED_BLOCK', 'MARKETPLACE:SPONSORED_RESULT', 'EVENT_PAGE:SIDEBAR', 'DASHBOARD_CLIENT:SIDEBAR'],
      durationHours: 48,
      price: 100000,
      currency: 'FCFA',
    },
  ];

  for (const pkg of adPackages) {
    await prisma.adPackage.upsert({
      where: { slug: pkg.slug },
      update: {},
      create: {
        ...pkg,
        isActive: true,
      },
    });
  }
  console.log('✓ Ad Packages (5)');

  // ============================================
  // DEMO AD CAMPAIGNS (for testing the carousel)
  // ============================================
  const standardPkg = await prisma.adPackage.findUnique({ where: { slug: 'standard' } });

  // Demo campaign 1: Active - for business promo
  const campaign1 = await prisma.adCampaign.upsert({
    where: { id: 'demo-campaign-1' },
    update: {},
    create: {
      id: 'demo-campaign-1',
      packageId: standardPkg?.id || null,
      advertiserType: 'BUSINESS',
      businessId: business.id,
      name: 'Menu Découverte - Offre Spéciale',
      objective: 'PROMOTION',
      description: 'Découvrez notre menu 3 plats à seulement 10 000 FCFA au lieu de 15 000 FCFA. Offre valable jusqu\'à fin juillet.',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-08-01'),
      budget: 50000,
      status: 'ACTIVE',
      validatedAt: new Date('2026-05-25'),
      activatedAt: new Date('2026-06-01'),
      geoTarget: ['Togo', 'Benin'],
      createdAt: new Date('2026-05-20'),
    },
  });

  // Creative for campaign 1
  await prisma.adCreative.upsert({
    where: { id: 'demo-creative-1' },
    update: {},
    create: {
      id: 'demo-creative-1',
      campaignId: campaign1.id,
      placementPage: 'BUSINESS_PUBLIC_PAGE',
      placementPosition: 'HERO_BANNER',
      format: 'BANNER_HORIZONTAL',
      adText: 'Menu Découverte - 3 plats à 10 000 FCFA seulement ! Offre limitée.',
      cta: 'Réserver maintenant',
      destinationUrl: 'https://legourmettogolais.com/menu-decouverte',
      targetCountries: ['Togo', 'Benin'],
      targetCities: ['Lomé', 'Cotonou'],
      isActive: true,
      sortOrder: 1,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
    },
  });

  // Demo campaign 2: Active - for caterer promo
  await prisma.adCampaign.upsert({
    where: { id: 'demo-campaign-2' },
    update: {},
    create: {
      id: 'demo-campaign-2',
      packageId: standardPkg?.id || null,
      advertiserType: 'BUSINESS',
      businessId: business.id,
      name: 'Service Traiteur -20%',
      objective: 'SALES',
      description: 'Profitez de 20% de réduction sur notre service traiteur pour vos événements (mariages, anniversaires, séminaires).',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-09-15'),
      budget: 75000,
      status: 'ACTIVE',
      validatedAt: new Date('2026-06-10'),
      activatedAt: new Date('2026-06-15'),
      geoTarget: ['Togo'],
    },
  });

  // Creative for campaign 2
  await prisma.adCreative.upsert({
    where: { id: 'demo-creative-2' },
    update: {},
    create: {
      id: 'demo-creative-2',
      campaignId: 'demo-campaign-2',
      placementPage: 'BUSINESS_PUBLIC_PAGE',
      placementPosition: 'HERO_BANNER',
      format: 'BANNER_HORIZONTAL',
      adText: 'Besoin d\'un traiteur pour votre événement ? -20% sur toutes nos prestations !',
      cta: 'Commander',
      destinationUrl: 'https://legourmettogolais.com/traiteur',
      targetCountries: ['Togo'],
      targetCities: ['Lomé'],
      isActive: true,
      sortOrder: 2,
    },
  });

  // Demo campaign 3: Pending - to show validation flow
  await prisma.adCampaign.upsert({
    where: { id: 'demo-campaign-3' },
    update: {},
    create: {
      id: 'demo-campaign-3',
      packageId: standardPkg?.id || null,
      advertiserType: 'BUSINESS',
      businessId: business.id,
      name: 'Cours de Cuisine - Promotion',
      objective: 'LEADS',
      description: 'Inscrivez-vous à nos cours de cuisine togolaise et bénéficiez de 15% de réduction.',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-15'),
      budget: 30000,
      status: 'PENDING',
      geoTarget: ['Togo', 'Benin', 'Côte d\'Ivoire'],
    },
  });

  await prisma.adCreative.upsert({
    where: { id: 'demo-creative-3' },
    update: {},
    create: {
      id: 'demo-creative-3',
      campaignId: 'demo-campaign-3',
      placementPage: 'BUSINESS_PUBLIC_PAGE',
      placementPosition: 'PROMO_WIDGET',
      format: 'WIDGET',
      adText: 'Apprenez la cuisine togolaise - 15% de réduction !',
      cta: 'S\'inscrire',
      destinationUrl: 'https://legourmettogolais.com/cours-cuisine',
      targetCountries: ['Togo', 'Benin', 'Côte d\'Ivoire'],
      isActive: true,
      sortOrder: 1,
    },
  });

  console.log('✓ Demo Ad Campaigns (3 active creatives for carousel)');

  // ============================================
  // TEST ACCOUNT 1: CLIENT + DEVELOPEUR
  // ============================================
  const testDev = await prisma.user.upsert({
    where: { email: 'test-dev@afribiz.com' },
    update: {
      primaryRole: UserRole.DEVELOPER,
      roles: [UserRole.CLIENT, UserRole.DEVELOPER],
    },
    create: {
      firstName: 'Test',
      lastName: 'Developpeur',
      email: 'test-dev@afribiz.com',
      phone: '+22811111111',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      neighborhood: 'Adidogomé',
      birthDate: new Date('1995-06-15'),
      primaryRole: UserRole.DEVELOPER,
      roles: [UserRole.CLIENT, UserRole.DEVELOPER],
    },
  });

  await prisma.developerProfile.upsert({
    where: { userId: testDev.id },
    update: {},
    create: {
      userId: testDev.id,
      companyName: 'TestDev Solutions',
      country: 'Togo',
      city: 'Lomé',
      description: 'Compte de test - Développeur',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      experience: 3,
      verificationStatus: 'VERIFIED',
      isVerified: true,
    },
  });
  console.log(`✓ Test Account (Client+Dev): ${testDev.email}`);

  // ============================================
  // ACCOUNT 2: BUSINESS + DEVELOPER (tous les modules, toutes les fonctionnalités)
  // ============================================
  const testBizDev = await prisma.user.upsert({
    where: { email: 'test-biz-dev@afribiz.com' },
    update: {
      primaryRole: UserRole.BUSINESS,
      roles: [UserRole.CLIENT, UserRole.BUSINESS, UserRole.DEVELOPER],
    },
    create: {
      firstName: 'Kossi',
      lastName: 'Matcha',
      email: 'test-biz-dev@afribiz.com',
      phone: '+22822222222',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      neighborhood: 'Agoè',
      birthDate: new Date('1990-03-20'),
      primaryRole: UserRole.BUSINESS,
      roles: [UserRole.CLIENT, UserRole.BUSINESS, UserRole.DEVELOPER],
    },
  });

  // Supprimer l'ancien business s'il existe (slug a changé)
  const oldBizDev = await prisma.business.findUnique({ where: { ownerId: testBizDev.id } });
  if (oldBizDev && oldBizDev.slug !== 'maxi-marche-afribiz') {
    await prisma.business.delete({ where: { id: oldBizDev.id } });
  }

  // ALL 21 BusinessModules
  const allModules: BusinessModule[] = [
    'PRODUCTS', 'SERVICES', 'MENU', 'ROOMS', 'BOOKINGS', 'ORDERS',
    'QUOTES_INVOICES', 'DEBTS_PAYMENTS', 'PROMOTIONS', 'PLANNING',
    'EMPLOYEES', 'PORTFOLIO', 'SUBSCRIPTIONS', 'DELIVERIES', 'EVENTS',
    'RENTALS', 'DOCUMENTS', 'PARTNERS', 'DISPUTES', 'MODULE_MARKETPLACE',
    'ADVANCED_TASKS',
  ];

  // Business principal avec TOUS les modules
  const bizDevBusiness = await prisma.business.upsert({
    where: { ownerId: testBizDev.id },
    update: { slug: 'maxi-marche-afribiz', modules: { set: allModules } },
    create: {
      ownerId: testBizDev.id,
      name: 'Maxi Marché AfriBiz',
      slug: 'maxi-marche-afribiz',
      type: BusinessType.SUPERMARCHE,
      modules: { set: allModules },
      description: 'Supermarché complet avec tous les modules AfriBiz activés. Boutique de test couvrant produits, services, menu, réservations, chambres, événements, locations, portfolio, livraisons et plus.',
      shortDescription: 'Supermarché complet - Tous modules activés',
      email: 'maxi@afribiz.com',
      phone: '+22822445566',
      website: 'https://maxi-marche.afribiz.com',
      whatsapp: '+22822445566',
      facebook: 'maximarcheafribiz',
      instagram: 'maximarcheafribiz',
      country: 'Togo',
      city: 'Lomé',
      region: 'Lomé',
      address: '200 Boulevard de la République',
      latitude: 6.1300,
      longitude: 1.2200,
      isActive: true,
      isVerified: true,
      verificationStatus: BusinessVerificationStatus.VERIFIED,
    },
  });

  // Heures d'ouverture
  const bizDevDays = [
    { day: 1, open: '07:00', close: '21:00' },
    { day: 2, open: '07:00', close: '21:00' },
    { day: 3, open: '07:00', close: '21:00' },
    { day: 4, open: '07:00', close: '22:00' },
    { day: 5, open: '07:00', close: '22:00' },
    { day: 6, open: '08:00', close: '22:00' },
    { day: 0, open: '09:00', close: '18:00' },
  ];
  for (const d of bizDevDays) {
    await prisma.businessHour.upsert({
      where: { businessId_day: { businessId: bizDevBusiness.id, day: d.day } },
      update: {},
      create: { businessId: bizDevBusiness.id, day: d.day, open: d.open, close: d.close, isClosed: false },
    });
  }
  console.log('✓ Biz+Dev: Hours (7 days)');

  // Moyens de paiement (vider + recréer pour éviter les doublons)
  await prisma.businessPaymentMethod.deleteMany({ where: { businessId: bizDevBusiness.id } });
  const pmData = [
    { businessId: bizDevBusiness.id, method: 'MOBILE_MONEY', name: 'TMoney', number: '*855#', isActive: true },
    { businessId: bizDevBusiness.id, method: 'MOBILE_MONEY', name: 'Flooz', number: '*877#', isActive: true },
    { businessId: bizDevBusiness.id, method: 'MOBILE_MONEY', name: 'Wave', number: '*878#', isActive: true },
    { businessId: bizDevBusiness.id, method: 'CASH', name: 'Espèces', isActive: true },
    { businessId: bizDevBusiness.id, method: 'BANK_TRANSFER', name: 'Virement bancaire', isActive: true },
    { businessId: bizDevBusiness.id, method: 'CREDIT_CARD', name: 'Carte Visa/Mastercard', isActive: true },
  ];
  for (const pm of pmData) await prisma.businessPaymentMethod.create({ data: pm });
  console.log('✓ Biz+Dev: Payment methods (6)');

  // Zones de livraison
  await prisma.deliveryZone.deleteMany({ where: { businessId: bizDevBusiness.id } });
  const zoneData = [
    { businessId: bizDevBusiness.id, name: 'Lomé Centre', fee: 1000, minOrder: 3000, isActive: true },
    { businessId: bizDevBusiness.id, name: 'Agoè', fee: 1500, minOrder: 5000, isActive: true },
    { businessId: bizDevBusiness.id, name: 'Tokoin', fee: 1500, minOrder: 5000, isActive: true },
    { businessId: bizDevBusiness.id, name: 'Kégué', fee: 2000, minOrder: 7000, isActive: true },
    { businessId: bizDevBusiness.id, name: 'Adidogomé', fee: 2000, minOrder: 7000, isActive: true },
  ];
  for (const z of zoneData) await prisma.deliveryZone.create({ data: z });
  console.log('✓ Biz+Dev: Delivery zones (5)');

  // Produits
  const productData = [
    { sellerId: testBizDev.id, businessId: bizDevBusiness.id, name: 'Riz Parfumé 5kg', slug: 'biz-riz-parfume-5kg', description: 'Riz long grain parfumé, qualité supérieure', price: 4500, stock: 200, isActive: true, images: [] },
    { sellerId: testBizDev.id, businessId: bizDevBusiness.id, name: 'Huile Olive Vierge 1L', slug: 'biz-huile-olive-1l', description: 'Huile d\'olive extra vierge', price: 6500, stock: 80, isActive: true, images: [] },
    { sellerId: testBizDev.id, businessId: bizDevBusiness.id, name: 'Lait Concentré Sucré', slug: 'biz-lait-concentre', description: 'Lait concentré sucré 397g', price: 900, stock: 500, isActive: true, images: [] },
  ];
  for (const p of productData) await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
  console.log('✓ Biz+Dev: Products (3)');

  // Services
  await prisma.service.deleteMany({ where: { businessId: bizDevBusiness.id } });
  const svcData = [
    { businessId: bizDevBusiness.id, name: 'Livraison Express', description: 'Livraison en 2h dans tout Lomé', price: 2000, currency: 'FCFA', duration: 120, images: [], isActive: true },
    { businessId: bizDevBusiness.id, name: 'Emballage Cadeau', description: 'Emballage cadeau', price: 500, currency: 'FCFA', duration: 10, images: [], isActive: true },
  ];
  for (const s of svcData) await prisma.service.create({ data: s });
  console.log('✓ Biz+Dev: Services (2)');

  // Menu / Restauration
  await prisma.menuItem.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.menuCategory.deleteMany({ where: { businessId: bizDevBusiness.id } });
  const bizDevCat = await prisma.menuCategory.create({
    data: { businessId: bizDevBusiness.id, name: 'Plats du Jour', description: 'Nos plats préparés du jour', sortOrder: 1 },
  });
  await prisma.menuItem.create({
    data: { businessId: bizDevBusiness.id, categoryId: bizDevCat.id, name: 'Riz Sauce Arachide', description: 'Riz blanc sauce arachide au poulet', price: 3000, currency: 'FCFA', images: [], isAvailable: true, isActive: true, sortOrder: 1 },
  });
  await prisma.menuItem.create({
    data: { businessId: bizDevBusiness.id, categoryId: bizDevCat.id, name: 'Pâtes Bolognaise', description: 'Spaghetti bolognaise maison', price: 3500, currency: 'FCFA', images: [], isAvailable: true, isActive: true, sortOrder: 2 },
  });
  console.log('✓ Biz+Dev: Menu (2)');

  // Chambres (hébergement)
  await prisma.room.deleteMany({ where: { businessId: bizDevBusiness.id } });
  const roomData = [
    { businessId: bizDevBusiness.id, name: 'Chambre Économique', description: 'Chambre simple avec ventilateur', price: 12000, capacity: 1, amenities: ['Ventilateur', 'WiFi'], images: [], isAvailable: true, isActive: true },
    { businessId: bizDevBusiness.id, name: 'Chambre Affaires', description: 'Chambre climatisée avec bureau', price: 25000, capacity: 2, amenities: ['Climatisation', 'WiFi', 'TV', 'Bureau'], images: [], isAvailable: true, isActive: true },
  ];
  for (const r of roomData) await prisma.room.create({ data: r });
  console.log('✓ Biz+Dev: Rooms (2)');

  // Événements
  await prisma.event.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.event.create({
    data: { businessId: bizDevBusiness.id, title: 'Promo Rentrée Scolaire', description: 'Réductions sur toutes les fournitures', startDate: new Date('2026-09-01'), endDate: new Date('2026-10-15'), address: 'Maxi Marché Lomé', price: 0, capacity: 9999, images: [], isActive: true },
  });
  await prisma.event.create({
    data: { businessId: bizDevBusiness.id, title: 'Dégustation Produits Locaux', description: 'Découvrez nos producteurs locaux', startDate: new Date('2026-07-20'), endDate: new Date('2026-07-20'), address: 'Parking du marché', price: 0, capacity: 100, images: [], isActive: true },
  });
  console.log('✓ Biz+Dev: Events (2)');

  // Locations
  await prisma.rental.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.rental.create({
    data: { businessId: bizDevBusiness.id, name: 'Chariot de Courses', description: 'Grand chariot', price: 0, unit: 'hour', quantity: 50, images: [], isActive: true },
  });
  await prisma.rental.create({
    data: { businessId: bizDevBusiness.id, name: 'Glacière Portable', description: 'Glacière 20L', price: 2000, unit: 'day', quantity: 10, deposit: 5000, images: [], isActive: true },
  });
  console.log('✓ Biz+Dev: Rentals (2)');

  // Portfolio
  await prisma.portfolioItem.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.portfolioItem.create({
    data: { businessId: bizDevBusiness.id, title: 'Rayon Épicerie Rénové', description: 'Nouveau rayon épicerie fine', legacyCategory: 'Aménagement', projectDate: new Date('2026-01-15'), images: [], isActive: true },
  });
  console.log('✓ Biz+Dev: Portfolio (1)');

  // Promotions
  await prisma.promotion.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.promotion.create({
    data: { businessId: bizDevBusiness.id, title: 'Pack Économique', description: 'Pack de produits à -15%', promotionType: 'PERCENTAGE', discountValue: 15, code: 'PACK15', startsAt: new Date('2026-06-01'), endsAt: new Date('2026-12-31'), image: null, isActive: true },
  });
  await prisma.promotion.create({
    data: { businessId: bizDevBusiness.id, title: 'Fidélité Premium', description: '-5% sur tous les achats', promotionType: 'PERCENTAGE', discountValue: 5, code: 'FIDELITE5', startsAt: new Date('2026-01-01'), endsAt: new Date('2026-12-31'), image: null, isActive: true },
  });
  console.log('✓ Biz+Dev: Promotions (2)');

  // Partenaires
  await prisma.partner.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.partner.create({
    data: { businessId: bizDevBusiness.id, name: 'Ferme Bio d\'Agou', description: 'Fruits et légumes bio', website: 'https://fermeagou.tg', logo: null, isActive: true },
  });
  await prisma.partner.create({
    data: { businessId: bizDevBusiness.id, name: 'Brasserie du Togo', description: 'Boissons et bières', website: 'https://brasserietogo.tg', logo: null, isActive: true },
  });
  console.log('✓ Biz+Dev: Partners (2)');

  // Employés
  await prisma.employee.deleteMany({ where: { businessId: bizDevBusiness.id } });
  await prisma.employee.create({
    data: { businessId: bizDevBusiness.id, firstName: 'Afi', lastName: 'Sodokin', email: 'afi@maxi-marche.com', phone: '+22890102030', position: 'CAISSIER', salary: 80000, hireDate: new Date('2025-01-15'), isActive: true },
  });
  await prisma.employee.create({
    data: { businessId: bizDevBusiness.id, firstName: 'Kodjo', lastName: 'Bocco', email: 'kodjo@maxi-marche.com', phone: '+22890203040', position: 'MANAGER', salary: 150000, hireDate: new Date('2024-06-01'), isActive: true },
  });
  await prisma.employee.create({
    data: { businessId: bizDevBusiness.id, firstName: 'Yawa', lastName: 'Dossou', email: 'yawa@maxi-marche.com', phone: '+22890304050', position: 'RAYONNISTE', salary: 70000, hireDate: new Date('2025-03-10'), isActive: true },
  });
  console.log('✓ Biz+Dev: Employees (3)');

  // Profil développeur
  const bizDevProfile = await prisma.developerProfile.upsert({
    where: { userId: testBizDev.id },
    update: {},
    create: {
      userId: testBizDev.id,
      companyName: 'BizDev Studio',
      country: 'Togo',
      city: 'Lomé',
      description: 'Compte double Business + Développeur - Toutes les fonctionnalités activées pour tester la plateforme.',
      skills: ['Business Management', 'Commerce', 'E-Commerce', 'Développement', 'React', 'Node.js', 'Microservices'],
      experience: 6,
      verificationStatus: 'VERIFIED',
      isVerified: true,
    },
  });

  // Module développeur pour ce compte (utilise profile.id, pas user.id)
  await prisma.developerModule.upsert({
    where: { slug: 'gestion-stock-pro' },
    update: {},
    create: {
      developerId: bizDevProfile.id,
      name: 'Gestion Stock Pro',
      slug: 'gestion-stock-pro',
      description: 'Gestion de stock avancée pour supermarchés',
      fullDescription: 'Gestion avancée des stocks avec alertes, réapprovisionnement automatique, code-barres, et rapports.',
      category: 'Gestion',
      price: 12000,
      currency: 'FCFA',
      status: 'PUBLISHED',
      isFeatured: false,
      isVerified: true,
    },
  });

  console.log(`✓ Account (Business+Dev): ${testBizDev.email} — ALL ${allModules.length} modules + full features`);

  // ============================================
  // COMPTE DE TEST SIMPLE : CLIENT + BUSINESS (SANS DEVELOPEUR, SANS 2FA)
  // ============================================
  const testBiz = await prisma.user.upsert({
    where: { email: 'demo@afribiz.com' },
    update: {
      primaryRole: UserRole.BUSINESS,
      roles: [UserRole.CLIENT, UserRole.BUSINESS],
    },
    create: {
      firstName: 'Demo',
      lastName: 'AfriBiz',
      email: 'demo@afribiz.com',
      phone: '+22833333333',
      passwordHash,
      emailVerified: true,
      phoneVerified: true,
      country: 'Togo',
      region: 'Lomé',
      city: 'Lomé',
      primaryRole: UserRole.BUSINESS,
      roles: [UserRole.CLIENT, UserRole.BUSINESS],
    },
  });

  await prisma.business.upsert({
    where: { slug: 'demo-business-afribiz' },
    update: {},
    create: {
      ownerId: testBiz.id,
      name: 'Demo Business AfriBiz',
      slug: 'demo-business-afribiz',
      type: BusinessType.SUPERMARCHE,
      modules: ['PRODUCTS', 'ORDERS', 'PROMOTIONS', 'SERVICES', 'BOOKINGS', 'EVENTS', 'RENTALS', 'MENU'],
      description: 'Business de démonstration pour les tests',
      shortDescription: 'Business de démo',
      email: 'demo@afribiz.com',
      phone: '+22833333333',
      country: 'Togo',
      city: 'Lomé',
      region: 'Lomé',
      address: '456 Avenue de la Démo',
      isActive: true,
      isVerified: true,
      verificationStatus: BusinessVerificationStatus.VERIFIED,
    },
  });
  console.log(`✓ Test Account (Client+Business, sans 2FA): ${testBiz.email}`);

  // ============================================
  // DEMO SEED DATA: ORDERS, BOOKINGS, MESSAGES, NOTIFICATIONS
  // ============================================

  // Seed orders from client to Le Gourmet Togolais (upsert pour idempotence)
  const order1 = await prisma.order.upsert({
    where: { orderNumber: 'CMD-2026-0001' },
    update: {},
    create: {
      businessId: business.id,
      buyerId: client.id,
      orderNumber: 'CMD-2026-0001',
      type: 'DELIVERY',
      source: 'WEB_SITE',
      status: 'DELIVERED',
      totalAmount: 12500,
      subtotal: 11500,
      deliveryFee: 1000,
      currency: 'FCFA',
      deliveryAddress: '123 Rue de la Paix, Quartier Administratif, Lomé',
      notes: 'Sonner à l\'interphone, 3ème étage',
      createdAt: new Date('2026-06-10T12:30:00Z'),
    },
  });
  await prisma.orderItem.create({
    data: { orderId: order1.id, name: 'Fufu Sauce Gombo', quantity: 2, unitPrice: 4500, total: 9000 },
  });
  await prisma.orderItem.create({
    data: { orderId: order1.id, name: 'Jus de Bissap', quantity: 2, unitPrice: 1250, total: 2500 },
  });

  const order2 = await prisma.order.upsert({
    where: { orderNumber: 'CMD-2026-0002' },
    update: {},
    create: {
      businessId: business.id,
      buyerId: client.id,
      orderNumber: 'CMD-2026-0002',
      type: 'PICKUP',
      source: 'WEB_SITE',
      status: 'CONFIRMED',
      totalAmount: 8500,
      subtotal: 8000,
      deliveryFee: 500,
      currency: 'FCFA',
      createdAt: new Date('2026-06-14T09:15:00Z'),
    },
  });
  await prisma.orderItem.create({
    data: { orderId: order2.id, name: 'Pâtes Carbonara', quantity: 1, unitPrice: 3800, total: 3800 },
  });
  await prisma.orderItem.create({
    data: { orderId: order2.id, name: 'Samoussas au Bœuf', quantity: 2, unitPrice: 2100, total: 4200 },
  });

  const order3 = await prisma.order.upsert({
    where: { orderNumber: 'CMD-2026-0003' },
    update: {},
    create: {
      businessId: business.id,
      buyerId: client.id,
      orderNumber: 'CMD-2026-0003',
      type: 'DELIVERY',
      source: 'MARKETPLACE',
      status: 'PREPARING',
      totalAmount: 15000,
      subtotal: 14000,
      deliveryFee: 1000,
      currency: 'FCFA',
      deliveryAddress: '456 Avenue des Artisans, Tokoin, Lomé',
      notes: 'Appeler avant de livrer',
      createdAt: new Date('2026-06-15T18:45:00Z'),
    },
  });
  await prisma.orderItem.create({
    data: { orderId: order3.id, name: 'Menu Découverte (3 plats)', quantity: 1, unitPrice: 10000, total: 10000 },
  });
  await prisma.orderItem.create({
    data: { orderId: order3.id, name: 'Dégué à la Mangue', quantity: 2, unitPrice: 2000, total: 4000 },
  });

  console.log('✓ Demo orders (3)');

  // Seed bookings (upsert pour idempotence)
  await prisma.booking.upsert({
    where: { bookingNumber: 'RES-2026-0001' },
    update: {},
    create: {
      businessId: business.id,
      clientId: client.id,
      bookingNumber: 'RES-2026-0001',
      title: 'Dîner en amoureux',
      description: 'Table pour 2 personnes, côté terrasse',
      type: 'TABLE',
      source: 'AFRIBIZ_SITE',
      status: 'CONFIRMED',
      price: 15000,
      startDate: new Date('2026-06-18T19:00:00Z'),
      endDate: new Date('2026-06-18T21:00:00Z'),
      createdAt: new Date('2026-06-12T10:00:00Z'),
    },
  });
  await prisma.booking.upsert({
    where: { bookingNumber: 'RES-2026-0002' },
    update: {},
    create: {
      businessId: business.id,
      clientId: client.id,
      bookingNumber: 'RES-2026-0002',
      title: 'Réunion professionnelle',
      description: 'Salle privée pour 6 personnes, besoin vidéoprojecteur',
      type: 'RESOURCE',
      source: 'AFRIBIZ_SITE',
      status: 'PENDING',
      price: 25000,
      startDate: new Date('2026-06-20T14:00:00Z'),
      endDate: new Date('2026-06-20T17:00:00Z'),
      createdAt: new Date('2026-06-15T08:30:00Z'),
    },
  });
  console.log('✓ Demo bookings (2)');

  // Seed conversation & messages
  const conv = await prisma.conversation.create({
    data: {
      type: 'business',
      subject: 'Question sur le menu',
      participants: [client.id, owner.id],
      createdAt: new Date('2026-06-10T14:00:00Z'),
      updatedAt: new Date('2026-06-11T10:30:00Z'),
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: client.id,
      content: 'Bonjour ! Est-ce que le Fufu Sauce Gombo est disponible sans gluten ? Merci !',
      createdAt: new Date('2026-06-10T14:00:00Z'),
      read: true,
      readAt: new Date('2026-06-10T14:30:00Z'),
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: owner.id,
      content: 'Bonjour Koffi ! Oui, notre Fufu est préparé avec de la farine de manioc pur, sans gluten. Vous pouvez commander en toute sérénité. 😊',
      createdAt: new Date('2026-06-10T14:30:00Z'),
      read: true,
      readAt: new Date('2026-06-10T15:00:00Z'),
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderId: client.id,
      content: 'Super, merci beaucoup ! Je passe commande tout de suite.',
      createdAt: new Date('2026-06-10T15:00:00Z'),
      read: true,
      readAt: new Date('2026-06-10T15:10:00Z'),
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      type: 'business',
      subject: 'Réservation anniversaire',
      participants: [client.id, owner.id],
      createdAt: new Date('2026-06-14T11:00:00Z'),
      updatedAt: new Date('2026-06-14T11:30:00Z'),
    },
  });
  await prisma.message.create({
    data: {
      conversationId: conv2.id,
      senderId: client.id,
      content: 'Bonjour, je souhaiterais réserver pour l\'anniversaire de ma femme samedi prochain. Est-ce que vous avez une table avec vue sur la terrasse ?',
      createdAt: new Date('2026-06-14T11:00:00Z'),
      read: false,
    },
  });

  console.log('✓ Demo conversations & messages (2 conversations, 4 messages)');

  // Seed notifications for business dashboard (using correct NotificationType enum)
  const notifTemplates: { type: string; title: string; description: string }[] = [
    { type: 'ORDER_PLACED', title: 'Nouvelle commande reçue', description: 'Client Koffi K. a commandé pour 12 500 FCFA' },
    { type: 'ORDER_CONFIRMED', title: 'Commande confirmée', description: 'Commande #CMD-0002 confirmée par le client' },
    { type: 'ORDER_DELIVERED', title: 'Commande livrée', description: 'Commande #CMD-0001 livrée avec succès' },
    { type: 'BOOKING_CONFIRMED', title: 'Réservation confirmée', description: 'Réservation confirmée : Dîner en amoureux le 18/06' },
    { type: 'BOOKING_REMINDER', title: 'Rappel réservation', description: 'Rappel : Réservation demain à 19h (Dîner en amoureux)' },
    { type: 'PAYMENT_RECEIVED', title: 'Paiement reçu', description: 'Paiement de 12 500 FCFA reçu (Mobile Money)' },
    { type: 'PAYMENT_REMINDER', title: 'Paiement en attente', description: 'Paiement de 8 500 FCFA en attente de confirmation' },
    { type: 'NEW_MESSAGE', title: 'Nouveau message client', description: 'Koffi K. vous a envoyé un message à propos du menu' },
    { type: 'REVIEW_RESPONSE', title: 'Nouvel avis client', description: 'Koffi K. a laissé un avis 5⭐ : "Excellent !"' },
    { type: 'SYSTEM', title: 'Bienvenue sur AfriBiz', description: 'Votre business est maintenant en ligne !' },
  ];

  for (let i = 0; i < notifTemplates.length; i++) {
    const daysAgo = Math.floor(Math.random() * 7) + 1;
    await prisma.notification.create({
      data: {
        userId: owner.id,
        type: notifTemplates[i].type as any,
        title: notifTemplates[i].title,
        description: notifTemplates[i].description,
        read: daysAgo > 3,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Notifications for client
  const clientNotifs = [
    { type: 'ORDER_DELIVERED', title: 'Commande livrée !', description: 'Votre commande #CMD-0001 a été livrée. Bon appétit ! 🎉' },
    { type: 'ORDER_CONFIRMED', title: 'Commande en préparation', description: 'Votre Menu Découverte est en cours de préparation par Le Gourmet Togolais' },
    { type: 'BOOKING_CONFIRMED', title: 'Réservation confirmée', description: 'Votre dîner du 18/06 à 19h est confirmé au Gourmet Togolais' },
    { type: 'NEW_MESSAGE', title: 'Réponse du restaurant', description: 'Jean M. vous a répondu : "Oui, notre Fufu est sans gluten"' },
    { type: 'PAYMENT_RECEIVED', title: 'Paiement confirmé', description: 'Votre paiement de 12 500 FCFA a été confirmé' },
  ];
  for (let i = 0; i < clientNotifs.length; i++) {
    const daysAgo = Math.floor(Math.random() * 5) + 1;
    await prisma.notification.create({
      data: {
        userId: client.id,
        type: clientNotifs[i].type as any,
        title: clientNotifs[i].title,
        description: clientNotifs[i].description,
        read: daysAgo > 2,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✓ Demo notifications (15 for business, 5 for client)');

  // Seed favorites for client (using correct unique constraint: userId + referenceId)
  const demoProducts = await prisma.product.findMany({ where: { businessId: business.id }, take: 3 });
  for (const p of demoProducts) {
    await prisma.favorite.upsert({
      where: { userId_referenceId: { userId: client.id, referenceId: p.id } },
      update: {},
      create: { userId: client.id, productId: p.id, type: 'PRODUCT', referenceId: p.id },
    });
  }
  console.log('✓ Demo favorites (3)');

  console.log('\n========================================');
  console.log('  Seed completed successfully!');
  console.log('========================================');
  console.log('\n  Test Credentials:');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    admin@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     ADMIN + DEVELOPEUR ✅ (tous accès)');
  console.log('  ├ Modules: Factura Pro, Stock Master, CRM Client Plus,');
  console.log('  │          Booking Manager, Marketing Auto');
  console.log('  └ 5 modules développeur + admin complet');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    test-biz-dev@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     BUSINESS + DEVELOPEUR ✅ (tout modules)');
  console.log('  ├ Business: Maxi Marché AfriBiz');
  console.log('  ├ Modules: 21/21 (tous activés)');
  console.log('  ├ Features: produits, services, menu, rooms, events,');
  console.log('  │           rentals, portfolio, promos, employees...');
  console.log('  └ Dev:     Gestion Stock Pro module');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    dev@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     DEVELOPEUR');
  console.log('  └ Module: E-Commerce Pro');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    business@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     BUSINESS');
  console.log('  └ Business: Le Gourmet Togolais (restaurant)');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    client@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     CLIENT');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    test-dev@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     CLIENT + DEVELOPEUR');
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('  Email:    demo@afribiz.com');
  console.log('  Password: Test1234!');
  console.log('  Role:     CLIENT + BUSINESS (sans 2FA)');
  console.log('  ─────────────────────────────────────────────────────────');
  // Seed default subscription plan
  const existingPlan = await prisma.subscriptionPlan.findFirst({ where: { type: 'STANDARD' } });
  if (!existingPlan) {
    await prisma.subscriptionPlan.create({
      data: {
        businessId: business.id,
        name: 'AfriBiz Standard',
        description: 'Accès à toutes les fonctionnalités de la plateforme',
        type: 'STANDARD',
        price: 5000,
        currency: 'FCFA',
        billingCycle: 'MONTHLY',
        trialDays: 14,
        isPublic: true,
        isActive: true,
        featured: true,
        badge: 'POPULAIRE',
        benefits: [
          'Tous les modules de gestion',
          'Paiement Mobile Money intégré',
          'Page publique personnalisée',
          'Statistiques et rapports',
          'Support prioritaire',
        ],
      },
    });
    console.log('✓ Abonnement Standard créé (5000 FCFA/mois)');
  }

  // Seed commission config
  const existingCommission = await prisma.commissionConfig.findUnique({ where: { key: 'escrow_fee' } });
  if (!existingCommission) {
    await prisma.commissionConfig.create({
      data: {
        key: 'escrow_fee',
        label: 'Commission Escrow',
        description: 'Frais prélevés sur chaque transaction sécurisée',
        rate: 0.01,
        scope: 'global',
        minFee: null,
        maxFee: null,
        currency: 'FCFA',
        isActive: true,
      },
    });
    console.log('✓ Commission Escrow créée (1%)');
  }

  const existingDevCommission = await prisma.commissionConfig.findUnique({ where: { key: 'marketplace_dev_fee' } });
  if (!existingDevCommission) {
    await prisma.commissionConfig.create({
      data: {
        key: 'marketplace_dev_fee',
        label: 'Commission Marketplace Développeurs',
        description: 'Part AfriBiz sur les ventes de modules développeurs',
        rate: 0.15,
        scope: 'global',
        minFee: null,
        maxFee: null,
        currency: 'FCFA',
        isActive: true,
      },
    });
    console.log('✓ Commission Marketplace Développeurs créée (15%)');
  }

  // ============================================
  // DEFAULT MONETIZATION SETTINGS (PlatformSetting)
  // ============================================
  const defaultMonetizationSettings = [
    { key: 'monetization_transactionCommissionRate', value: 0.01, category: 'general', label: 'Commission transactions', description: '1% sur chaque transaction' },
    { key: 'monetization_escrowCommissionRate', value: 0.02, category: 'general', label: 'Commission escrow', description: '2% sur chaque libération escrow' },
    { key: 'monetization_developerModuleCommissionRate', value: 0.20, category: 'general', label: 'Commission modules développeur', description: '20% sur les ventes de modules' },
    { key: 'monetization_minimumEscrowFee', value: 0, category: 'general', label: 'Frais escrow min', description: '0 FCFA minimum' },
    { key: 'monetization_maximumEscrowFee', value: null, category: 'general', label: 'Frais escrow max', description: 'Pas de maximum' },
    { key: 'monetization_currency', value: 'FCFA', category: 'general', label: 'Devise', description: 'FCFA' },
  ];
  for (const setting of defaultMonetizationSettings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✓ Default monetization settings (6)');

  console.log('\n  Demo Business Page:');
  console.log('  http://localhost:3000/business/le-gourmet-togolais');
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
