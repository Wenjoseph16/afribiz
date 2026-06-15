import { UserRole, DeveloperVerificationStatus } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { UserRepository } from '../repositories/userRepository';
import { DeveloperRepository } from '../repositories/developerRepository';
import { createTokenPair } from '../lib/jwt';

/**
 * Activate developer role for a user
 */
export async function activateDeveloperRole(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) throw new AppError('Utilisateur non trouvé', 404);

  if (user.primaryRole === UserRole.DEVELOPER) {
    throw new AppError('Vous êtes déjà développeur', 409);
  }

  const updatedUser = await UserRepository.activateDeveloperRole(userId);
  const tokens = createTokenPair({ id: updatedUser.id, email: updatedUser.email, primaryRole: updatedUser.primaryRole, roles: updatedUser.roles });

  let profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) {
    profile = await DeveloperRepository.create({
      userId,
      companyName: `${user.firstName} ${user.lastName}`,
      professionalEmail: user.email,
      phone: user.phone || undefined,
      country: user.country || undefined,
      city: user.city || undefined,
    });
  }

  return {
    user: updatedUser,
    profile,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

function mapProfileToFrontend(profile: any) {
  return {
    id: profile.id,
    userId: profile.userId,
    companyName: profile.companyName,
    photo: profile.photo,
    companyLogo: profile.logo,
    phone: profile.phone,
    professionalEmail: profile.email,
    country: profile.country,
    city: profile.city,
    address: profile.address,
    website: profile.website,
    github: profile.github,
    linkedin: profile.linkedin,
    portfolio: profile.portfolio,
    yearsOfExperience: profile.experience,
    specialties: profile.specialties || [],
    technologies: profile.technologies || [],
    publicDescription: profile.description,
    presentation: profile.description,
    verificationStatus: profile.verificationStatus,
    identityDocument: profile.identityDocument,
    companyDocument: profile.companyDocument,
    responsiblePhoto: profile.responsiblePhoto,
    verifiedAt: profile.verifiedAt,
    rejectedAt: profile.rejectedAt,
    rejectionReason: profile.rejectionReason,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    onboardingCompleted: true,
    onboardingStep: 100,
  };
}

/**
 * Get developer profile with stats
 */
export async function getDeveloperProfile(userId: string) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          developerApiKey: true,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError('Profil développeur non trouvé', 404);
  }

  const stats = await DeveloperRepository.getDeveloperStats(profile.id);
  const mapped = mapProfileToFrontend(profile);

  return { ...mapped, stats, user: profile.user };
}

/**
 * Update developer profile - with field mapping to Prisma schema
 */
export async function updateProfile(userId: string, data: any) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  // Map frontend fields to Prisma schema fields
  const mappedData: Record<string, any> = {};

  if (data.companyName !== undefined) mappedData.companyName = data.companyName;
  if (data.website !== undefined) mappedData.website = data.website;
  if (data.phone !== undefined) mappedData.phone = data.phone;
  if (data.country !== undefined) mappedData.country = data.country;
  if (data.city !== undefined) mappedData.city = data.city;
  if (data.portfolio !== undefined) mappedData.portfolio = data.portfolio;
  if (data.experience !== undefined) mappedData.experience = data.experience;
  if (data.yearsOfExperience !== undefined) mappedData.experience = data.yearsOfExperience;
  if (data.email !== undefined) mappedData.email = data.email;
  if (data.professionalEmail !== undefined) mappedData.email = data.professionalEmail;

  // Map description fields
  if (data.description !== undefined) mappedData.description = data.description;
  if (data.publicDescription !== undefined) mappedData.description = data.publicDescription;
  if (data.presentation !== undefined) mappedData.description = data.presentation;

  // Map logo (frontend companyLogo → Prisma logo)
  if (data.companyLogo !== undefined) mappedData.logo = data.companyLogo;

  // Map skills separately from specialties/technologies
  if (data.skills && Array.isArray(data.skills)) mappedData.skills = [...new Set(data.skills)];
  if (data.specialties && Array.isArray(data.specialties)) mappedData.specialties = [...new Set(data.specialties)];
  if (data.technologies && Array.isArray(data.technologies)) mappedData.technologies = [...new Set(data.technologies)];

  if (data.github !== undefined) mappedData.github = data.github;
  if (data.linkedin !== undefined) mappedData.linkedin = data.linkedin;
  if (data.whatsapp !== undefined) mappedData.whatsapp = data.whatsapp;
  if (data.address !== undefined) mappedData.address = data.address;
  if (data.photo !== undefined) mappedData.photo = data.photo;

  const updated = await DeveloperRepository.update(profile.id, mappedData);
  return mapProfileToFrontend(updated);
}

/**
 * Submit verification documents
 */
export async function submitVerification(
  userId: string,
  documents: { identityDoc: string; companyDoc: string; responsiblePhoto: string }
) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  if (profile.verificationStatus === DeveloperVerificationStatus.VERIFIED) {
    throw new AppError('Vous êtes déjà vérifié', 409);
  }

  const updated = await DeveloperRepository.submitVerification(
    profile.id,
    documents.identityDoc,
    documents.companyDoc,
    documents.responsiblePhoto
  );
  return mapProfileToFrontend(updated);
}

/**
 * Get developer dashboard with aggregated data
 */
export async function getDeveloperDashboard(userId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const [modules, installations, revenues, reviews, tickets] = await Promise.all([
    prisma.developerModule.findMany({
      where: { developerId: profile.id },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        totalInstalls: true,
        totalSales: true,
        totalRevenue: true,
        rating: true,
        reviewCount: true,
        pricingType: true,
        price: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.developerModuleInstallation.findMany({
      where: { module: { developerId: profile.id } },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.developerRevenue.findMany({
      where: { developerId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.developerModuleReview.findMany({
      where: { developerId: profile.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        module: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.developerSupportTicket.findMany({
      where: { developerId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const activeModules = modules.filter((m) => m.status === 'PUBLISHED').length;
  const totalInstalls = modules.reduce((sum, m) => sum + m.totalInstalls, 0);
  const totalDownloads = totalInstalls;
  const totalClients = new Set(
    installations.filter((i) => i.status === 'ACTIVE').map((i) => i.businessId)
  ).size;
  const totalSubs = 0; // Placeholder for subscription count
  const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.netAmount), 0);

  return {
    profile,
    overview: {
      totalModules: modules.length,
      activeModules,
      totalSales: modules.reduce((sum, m) => sum + m.totalSales, 0),
      totalClients,
      totalDownloads,
      totalInstalls,
      totalRevenue,
      totalSubs,
      totalReviews: reviews.length,
      totalTickets: tickets.length,
      averageRating: modules.length > 0
        ? modules.reduce((sum, m) => sum + m.rating, 0) / modules.length
        : 0,
    },
    recentModules: modules.slice(0, 5),
    recentInstallations: installations,
    recentRevenues: revenues,
    recentReviews: reviews,
    recentTickets: tickets,
  };
}

/**
 * Get developer profile by user ID
 */
export async function getDeveloperByUserId(userId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);
  return profile;
}

/**
 * Get public developer profile with published modules
 */
export async function getPublicDeveloperProfile(developerId: string) {
  const profile = await prisma.developerProfile.findUnique({
    where: { id: developerId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      modules: {
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          name: true,
          slug: true,
          version: true,
          category: true,
          subcategory: true,
          description: true,
          logo: true,
          images: true,
          pricingType: true,
          price: true,
          currency: true,
          totalInstalls: true,
          totalSales: true,
          rating: true,
          reviewCount: true,
          isFeatured: true,
          isVerified: true,
          createdAt: true,
          publishedAt: true,
        },
        orderBy: { rating: 'desc' },
      },
    },
  });

  if (!profile) {
    throw new AppError('Profil développeur non trouvé', 404);
  }

  return profile;
}
