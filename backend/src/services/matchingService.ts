import { prisma } from '../lib/db';
import { BusinessType } from '@prisma/client';

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function scoreTags(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const matches = a.filter((s) => setB.has(s.toLowerCase()));
  return Math.round((matches.length / Math.max(a.length, b.length)) * 100);
}

function scoreTextSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aWords = a
    .toLowerCase()
    .split(/[\s,_-]+/)
    .filter(Boolean);
  const aWordSet = new Set(aWords);
  const bWords = b
    .toLowerCase()
    .split(/[\s,_-]+/)
    .filter(Boolean);
  const matches = bWords.filter((w) => aWordSet.has(w)).length;
  return Math.round((matches / Math.max(aWords.length, bWords.length)) * 100);
}

// ──────────────────────────────────────────────
// 1. BUSINESS → DEVELOPER MATCHING
// ──────────────────────────────────────────────

export interface DevMatchResult {
  developerId: string;
  userId: string;
  companyName: string | null;
  description: string | null;
  logo: string | null;
  country: string | null;
  city: string | null;
  skills: string[];
  specialties: string[];
  technologies: string[];
  experience: number | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  matchingScore: number;
  matchReasons: string[];
  matchingModules: {
    id: string;
    name: string;
    slug: string;
    price: number;
    category: string | null;
  }[];
}

export async function getDevMatches(businessId: string, limit = 10): Promise<DevMatchResult[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { type: true, city: true, country: true, skills: true, modules: true },
  });
  if (!business) return [];

  const devs = await prisma.developerProfile.findMany({
    where: { isActive: true, isVerified: true },
    select: {
      id: true,
      userId: true,
      companyName: true,
      description: true,
      logo: true,
      country: true,
      city: true,
      skills: true,
      specialties: true,
      technologies: true,
      experience: true,
      rating: true,
      reviewCount: true,
      isVerified: true,
    },
    take: 50,
  });

  const allModules = await prisma.developerModule.findMany({
    where: { developerId: { in: devs.map((d) => d.id) }, isActive: true, isPublished: true },
    select: {
      id: true,
      developerId: true,
      name: true,
      slug: true,
      price: true,
      category: true,
      tags: true,
    },
  });
  const modulesByDev: Record<string, typeof allModules> = {};
  for (const m of allModules) {
    if (!modulesByDev[m.developerId]) modulesByDev[m.developerId] = [];
    modulesByDev[m.developerId].push(m);
  }

  const results: DevMatchResult[] = [];

  for (const dev of devs) {
    let score = 0;
    const reasons: string[] = [];

    // Geo match
    if (
      dev.country &&
      business.country &&
      dev.country.toLowerCase() === business.country.toLowerCase()
    )
      score += 15;
    if (dev.city && business.city && dev.city.toLowerCase() === business.city.toLowerCase()) {
      score += 10;
      reasons.push('Même ville');
    }

    // Skills match
    const skillScore = scoreTags(business.skills, dev.skills);
    if (skillScore > 0) {
      score += skillScore * 0.2;
      reasons.push(`Compétences: ${Math.round(skillScore)}% correspondance`);
    }

    // Specialties match
    const specScore = scoreTags(business.skills, dev.specialties);
    if (specScore > 0) {
      score += specScore * 0.15;
    }

    // Technologies match
    const techScore = scoreTags(business.skills, dev.technologies);
    if (techScore > 0) {
      score += techScore * 0.1;
    }

    // Module match — modules whose category/tags match business type
    const devModules = modulesByDev[dev.id] || [];
    const matchingModules = devModules.filter((m) => {
      if (m.category) {
        const catMatch = scoreTextSimilarity(m.category, business.type);
        if (catMatch > 20) return true;
      }
      const tagMatch = scoreTags(m.tags, [business.type]);
      return tagMatch > 0;
    });
    if (matchingModules.length > 0) {
      score += Math.min(matchingModules.length * 10, 30);
      reasons.push(`${matchingModules.length} module(s) adapté(s) à votre activité`);
    }

    // Experience bonus
    if (dev.experience && dev.experience >= 3) score += 10;
    if (dev.experience && dev.experience >= 5) score += 5;

    // Rating bonus
    if (dev.rating >= 4) score += 10;
    if (dev.rating >= 4.5) score += 5;

    // Verified bonus
    if (dev.isVerified) score += 5;

    if (score >= 20) {
      results.push({
        developerId: dev.id,
        userId: dev.userId,
        companyName: dev.companyName,
        description: dev.description,
        logo: dev.logo,
        country: dev.country,
        city: dev.city,
        skills: dev.skills,
        specialties: dev.specialties,
        technologies: dev.technologies,
        experience: dev.experience,
        rating: dev.rating,
        reviewCount: dev.reviewCount,
        isVerified: dev.isVerified,
        matchingScore: Math.min(score, 100),
        matchReasons: reasons,
        matchingModules: matchingModules.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          price: Number(m.price),
          category: m.category,
        })),
      });
    }
  }

  return results.sort((a, b) => b.matchingScore - a.matchingScore).slice(0, limit);
}

// ──────────────────────────────────────────────
// 2. BUSINESS → BUSINESS MATCHING (PARTNERSHIPS)
// ──────────────────────────────────────────────

export interface BizMatchResult {
  businessId: string;
  name: string;
  slug: string;
  type: BusinessType;
  description: string | null;
  logo: string | null;
  city: string | null;
  country: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  matchingScore: number;
  matchReasons: string[];
  complementaryServices: string[];
  existingPartnersCount: number;
}

const COMPLEMENTARY_MAP: Partial<Record<BusinessType, BusinessType[]>> = {
  RESTAURANT: ['FAST_FOOD', 'PATISSERIE', 'BOULANGERIE', 'CAFE', 'BAR', 'ORGANISATION_EVENEMENTS'],
  FAST_FOOD: ['RESTAURANT', 'CAFE', 'BAR'],
  PATISSERIE: ['RESTAURANT', 'CAFE', 'ORGANISATION_EVENEMENTS'],
  BOULANGERIE: ['RESTAURANT', 'SUPERMARCHE', 'EPICERIE'],
  CAFE: ['RESTAURANT', 'PATISSERIE', 'LIBRAIRIE', 'PAPETERIE'],
  BAR: ['RESTAURANT', 'ORGANISATION_EVENEMENTS', 'HOTEL'],
  HOTEL: ['RESTAURANT', 'BAR', 'ORGANISATION_EVENEMENTS', 'LOCATION_VEHICULES', 'AGENCE_MARKETING'],
  AUBERGE: ['RESTAURANT', 'ORGANISATION_EVENEMENTS', 'LOCATION_VEHICULES'],
  BOUTIQUE_VETEMENTS: ['SUPERMARCHE', 'ENTREPRISE_AGRICOLE', 'IMPORT_EXPORT'],
  SUPERMARCHE: ['BOULANGERIE', 'PATISSERIE', 'EPICERIE', 'LIBRAIRIE'],
  PHARMACIE: ['CABINET_MEDICAL', 'CLINIQUE'],
  SALON_COIFFURE: ['SALON_BEAUTE', 'SPA', 'INSTITUT_ESTHETIQUE'],
  SALON_BEAUTE: ['SALON_COIFFURE', 'SPA', 'INSTITUT_ESTHETIQUE'],
  SPA: ['SALON_COIFFURE', 'SALON_BEAUTE', 'HOTEL'],
  PHOTOGRAPHE: ['ORGANISATION_EVENEMENTS', 'AGENCE_MARKETING', 'AGENCE_COMMUNICATION'],
  AGENCE_MARKETING: [
    'AGENCE_COMMUNICATION',
    'AGENCE_DIGITALE',
    'PHOTOGRAPHE',
    'VIDEOASTE',
    'DESIGNER_GRAPHIQUE',
  ],
  AGENCE_COMMUNICATION: ['AGENCE_MARKETING', 'AGENCE_DIGITALE', 'PHOTOGRAPHE', 'VIDEOASTE'],
  AGENCE_DIGITALE: [
    'AGENCE_MARKETING',
    'AGENCE_COMMUNICATION',
    'DEVELOPPEUR',
    'DESIGNER_GRAPHIQUE',
  ],
  AGENCE_IMMOBILIERE: ['CABINET_JURIDIQUE', 'CABINET_COMPTABLE', 'MACON', 'ELECTRICIEN'],
  CABINET_JURIDIQUE: ['CABINET_COMPTABLE', 'AGENCE_IMMOBILIERE', 'ENTREPRISE_PRIVEE'],
  CABINET_COMPTABLE: ['CABINET_JURIDIQUE', 'ENTREPRISE_PRIVEE', 'AGENCE_IMMOBILIERE'],
  CABINET_CONSEIL: ['AGENCE_MARKETING', 'AGENCE_COMMUNICATION', 'ENTREPRISE_PRIVEE'],
  CABINET_MEDICAL: ['PHARMACIE', 'CLINIQUE'],
  CLINIQUE: ['PHARMACIE', 'CABINET_MEDICAL'],
  CENTRE_FORMATION: ['ECOLE_PRIVEE', 'ORGANISATION_EVENEMENTS', 'ENTREPRISE_PRIVEE'],
  ECOLE_PRIVEE: ['CENTRE_FORMATION', 'LIBRAIRIE', 'PAPETERIE'],
  ORGANISATION_EVENEMENTS: [
    'RESTAURANT',
    'HOTEL',
    'PHOTOGRAPHE',
    'VIDEOASTE',
    'LOCATION_VEHICULES',
    'LOCATION_EQUIPEMENTS',
  ],
  LOCATION_VEHICULES: ['HOTEL', 'ORGANISATION_EVENEMENTS', 'TRANSPORT'],
  LOCATION_EQUIPEMENTS: ['ORGANISATION_EVENEMENTS', 'MACON', 'ELECTRICIEN'],
};

export async function getBusinessMatches(
  businessId: string,
  limit = 10
): Promise<BizMatchResult[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, type: true, city: true, country: true, modules: true, isActive: true },
  });
  if (!business) return [];

  const complementaryTypes = COMPLEMENTARY_MAP[business.type as BusinessType] || [];
  const sameCategoryTypes = getAllSameCategoryTypes(business.type as BusinessType);

  const candidates = await prisma.business.findMany({
    where: {
      id: { not: businessId },
      isActive: true,
      OR: [
        { type: { in: complementaryTypes } },
        { type: { in: sameCategoryTypes }, city: business.city || undefined },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      logo: true,
      city: true,
      country: true,
      rating: true,
      reviewCount: true,
      isVerified: true,
      isPremium: true,
    },
    take: 50,
  });

  const candidateIds = candidates.map((c) => c.id);

  const [partnerCounts, scores] = await Promise.all([
    prisma.partner.groupBy({
      by: ['businessId'],
      where: { businessId: { in: candidateIds } },
      _count: { id: true },
    }),
    prisma.businessScore.findMany({
      where: { businessId: { in: candidateIds } },
      select: { businessId: true, overallScore: true },
    }),
  ]);
  const partnerCountMap = new Map(partnerCounts.map((p) => [p.businessId, p._count.id]));
  const scoreMap = new Map(scores.map((s) => [s.businessId, s.overallScore]));

  const results: BizMatchResult[] = [];

  for (const c of candidates) {
    let score = 0;
    const reasons: string[] = [];

    const type = c.type as BusinessType;

    // Complementary type match
    if (complementaryTypes.includes(type)) {
      score += 30;
      reasons.push("Type d'activité complémentaire");
    }

    // Same category + same city
    if (
      sameCategoryTypes.includes(type) &&
      c.city &&
      business.city &&
      c.city.toLowerCase() === business.city.toLowerCase()
    ) {
      score += 25;
      reasons.push('Même catégorie dans votre ville');
    }

    // Geo match
    if (c.country && business.country && c.country.toLowerCase() === business.country.toLowerCase())
      score += 5;
    if (c.city && business.city && c.city.toLowerCase() === business.city.toLowerCase()) {
      if (!reasons.includes('Même catégorie dans votre ville')) reasons.push('Même ville');
    }

    // Rating
    if (c.rating >= 4) {
      score += 10;
      reasons.push('Bonne réputation');
    } else if (c.rating >= 3) score += 5;

    // Verified & Premium
    if (c.isVerified) score += 5;
    if (c.isPremium) {
      score += 5;
      reasons.push('Business Premium');
    }

    // Score
    const bizScore = scoreMap.get(c.id);
    if (bizScore && bizScore >= 500) {
      score += 10;
      reasons.push('AfriScore élevé');
    } else if (bizScore && bizScore >= 300) score += 5;

    // Existing partners (fewer partners = more opportunity)
    const partnerCount = partnerCountMap.get(c.id) || 0;

    if (score >= 25) {
      results.push({
        businessId: c.id,
        name: c.name,
        slug: c.slug,
        type,
        description: c.description,
        logo: c.logo,
        city: c.city,
        country: c.country,
        rating: c.rating,
        reviewCount: c.reviewCount,
        isVerified: c.isVerified,
        isPremium: c.isPremium,
        matchingScore: Math.min(score, 100),
        matchReasons: reasons,
        complementaryServices: complementaryTypes.slice(0, 3).map((t) => t.toString()),
        existingPartnersCount: partnerCount,
      });
    }
  }

  return results.sort((a, b) => b.matchingScore - a.matchingScore).slice(0, limit);
}

// ──────────────────────────────────────────────
// 3. DEVELOPER → BUSINESS MATCHING (REVERSE)
// ──────────────────────────────────────────────

export interface BizForDevMatchResult {
  businessId: string;
  name: string;
  slug: string;
  type: BusinessType;
  description: string | null;
  logo: string | null;
  city: string | null;
  country: string | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  matchingScore: number;
  matchReasons: string[];
  neededSkills: string[];
  score?: number | null;
}

export async function getBizForDevMatches(
  developerId: string,
  limit = 10
): Promise<BizForDevMatchResult[]> {
  const dev = await prisma.developerProfile.findUnique({
    where: { id: developerId },
    select: { skills: true, specialties: true, technologies: true, city: true },
  });
  if (!dev) return [];

  // Find businesses that need these skills
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      description: true,
      logo: true,
      city: true,
      country: true,
      rating: true,
      reviewCount: true,
      isVerified: true,
      isPremium: true,
      skills: true,
    },
    take: 50,
  });

  const bizIds = businesses.map((b) => b.id);
  const [scores, installedModules] = await Promise.all([
    prisma.businessScore.findMany({
      where: { businessId: { in: bizIds } },
      select: { businessId: true, overallScore: true },
    }),
    prisma.developerModuleInstallation.findMany({
      where: { businessId: { in: bizIds }, module: { developerId } },
      select: { businessId: true },
    }),
  ]);
  const scoreMap = new Map(scores.map((s) => [s.businessId, s.overallScore]));
  const installedBizIds = new Set(installedModules.map((im) => im.businessId));

  const allDevSkills = [...new Set([...dev.skills, ...dev.specialties, ...dev.technologies])];

  const results: BizForDevMatchResult[] = [];

  for (const b of businesses) {
    let score = 0;
    const reasons: string[] = [];

    const neededSkills = b.skills.filter((s) =>
      allDevSkills.some((ds) => ds.toLowerCase() === s.toLowerCase())
    );
    if (neededSkills.length > 0) {
      score += Math.min(neededSkills.length * 15, 45);
      reasons.push(`${neededSkills.length} compétence(s) recherchée(s) par l'entreprise`);
    }

    const skillScore = scoreTags(allDevSkills, b.skills);
    if (skillScore > 0 && neededSkills.length === 0) {
      score += skillScore * 0.2;
      reasons.push(`${Math.round(skillScore)}% correspondance de compétences`);
    }

    if (b.city && dev.city && b.city.toLowerCase() === dev.city.toLowerCase()) score += 10;
    if (b.rating >= 4) score += 10;
    if (b.isVerified) score += 5;
    if (b.isPremium) score += 5;

    const bizScore = scoreMap.get(b.id);
    if (bizScore && bizScore >= 500) score += 10;

    // Already has modules from this dev = less need
    if (installedBizIds.has(b.id)) score -= 30;

    if (score >= 20) {
      results.push({
        businessId: b.id,
        name: b.name,
        slug: b.slug,
        type: b.type as BusinessType,
        description: b.description,
        logo: b.logo,
        city: b.city,
        country: b.country,
        rating: b.rating,
        reviewCount: b.reviewCount,
        isVerified: b.isVerified,
        isPremium: b.isPremium,
        matchingScore: Math.min(Math.max(score, 0), 100),
        matchReasons: reasons,
        neededSkills,
        score: bizScore,
      });
    }
  }

  return results.sort((a, b) => b.matchingScore - a.matchingScore).slice(0, limit);
}

// ──────────────────────────────────────────────
// INTERNAL HELPERS
// ──────────────────────────────────────────────

function getAllSameCategoryTypes(type: BusinessType): BusinessType[] {
  const categories: Record<string, BusinessType[]> = {
    boutique: [
      'BOUTIQUE_VETEMENTS',
      'BOUTIQUE_CHAUSSURES',
      'BOUTIQUE_COSMETIQUES',
      'BOUTIQUE_INFORMATIQUE',
      'BOUTIQUE_TELEPHONIQUE',
      'BOUTIQUE_ELECTRONIQUE',
      'SUPERMARCHE',
      'EPICERIE',
      'PHARMACIE',
      'LIBRAIRIE',
      'PAPETERIE',
    ],
    restauration: ['RESTAURANT', 'FAST_FOOD', 'PATISSERIE', 'BOULANGERIE', 'CAFE', 'BAR'],
    hebergement: ['HOTEL', 'AUBERGE', 'MAISON_D_HOTES', 'LOCATION_SAISONNIERE'],
    beaute: ['SALON_COIFFURE', 'SALON_BEAUTE', 'SPA', 'INSTITUT_ESTHETIQUE'],
    service: [
      'PHOTOGRAPHE',
      'VIDEOASTE',
      'FREELANCE',
      'DEVELOPPEUR',
      'DESIGNER_GRAPHIQUE',
      'COACH_PROFESSIONNEL',
      'CONSULTANT',
      'CABINET_JURIDIQUE',
      'CABINET_COMPTABLE',
      'CABINET_CONSEIL',
    ],
    agence: ['AGENCE_MARKETING', 'AGENCE_COMMUNICATION', 'AGENCE_DIGITALE', 'AGENCE_IMMOBILIERE'],
    sante: ['CABINET_MEDICAL', 'CLINIQUE'],
    formation: ['CENTRE_FORMATION', 'ECOLE_PRIVEE'],
    artisan: ['ARTISAN', 'MENUISIER', 'MACON', 'PLOMBIER', 'ELECTRICIEN', 'SOUDEUR', 'MECANICIEN'],
    transport: ['TRANSPORT', 'LIVRAISON'],
    location: ['LOCATION_VEHICULES', 'LOCATION_EQUIPEMENTS', 'LOCATION_ENGINS'],
    evenements: ['ORGANISATION_EVENEMENTS'],
    entreprise: ['ENTREPRISE_AGRICOLE', 'ELEVAGE', 'IMPORT_EXPORT', 'ENTREPRISE_PRIVEE', 'AUTRE'],
  };

  for (const [, types] of Object.entries(categories)) {
    if (types.includes(type)) return types.filter((t) => t !== type);
  }
  return [];
}
