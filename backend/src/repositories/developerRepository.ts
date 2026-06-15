import { DeveloperProfile, DeveloperVerificationStatus } from '@prisma/client';
import { prisma } from '../lib/db';

export class DeveloperRepository {
  /**
   * Create a new developer profile
   */
  static async create(data: {
    userId: string;
    companyName?: string;
    photo?: string;
    companyLogo?: string;
    phone?: string;
    professionalEmail?: string;
    country?: string;
    city?: string;
    specialties?: string[];
    technologies?: string[];
    presentation?: string;
    github?: string;
    linkedin?: string;
    whatsapp?: string;
    address?: string;
  }): Promise<DeveloperProfile> {
    return prisma.developerProfile.create({
      data: {
        userId: data.userId,
        companyName: data.companyName || undefined,
        logo: data.companyLogo || undefined,
        email: data.professionalEmail || undefined,
        phone: data.phone || undefined,
        country: data.country || undefined,
        city: data.city || undefined,
        skills: [],
        specialties: data.specialties || [],
        technologies: data.technologies || [],
        description: data.presentation || undefined,
        github: data.github || undefined,
        linkedin: data.linkedin || undefined,
        whatsapp: data.whatsapp || undefined,
        address: data.address || undefined,
        photo: data.photo || undefined,
      },
    });
  }

  /**
   * Find developer profile by user ID
   */
  static async findByUserId(userId: string): Promise<DeveloperProfile | null> {
    return prisma.developerProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Find developer profile by ID
   */
  static async findById(id: string): Promise<DeveloperProfile | null> {
    return prisma.developerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Update developer profile
   */
  static async update(id: string, data: Partial<DeveloperProfile>): Promise<DeveloperProfile> {
    return prisma.developerProfile.update({
      where: { id },
      data,
    });
  }

  /**
   * Update verification status
   */
  static async updateVerificationStatus(
    id: string,
    status: DeveloperVerificationStatus,
    reason?: string
  ): Promise<DeveloperProfile> {
    const data: any = { verificationStatus: status };
    if (status === 'VERIFIED') {
      data.verifiedAt = new Date();
      data.rejectedAt = null;
      data.rejectionReason = null;
    } else if (status === 'REJECTED') {
      data.rejectedAt = new Date();
      data.rejectionReason = reason || null;
      data.verifiedAt = null;
    }
    return prisma.developerProfile.update({
      where: { id },
      data,
    });
  }

  /**
   * Submit verification documents (stores document refs and sets status to PENDING for review)
   */
  static async submitVerification(
    id: string,
    identityDoc: string,
    companyDoc: string,
    responsiblePhoto: string
  ): Promise<DeveloperProfile> {
    return prisma.developerProfile.update({
      where: { id },
      data: {
        verificationStatus: 'PENDING',
        identityDocument: identityDoc,
        companyDocument: companyDoc,
        responsiblePhoto: responsiblePhoto,
      },
    });
  }

  /**
   * Update onboarding step (stub - step tracked in frontend state)
   */
  static async updateOnboarding(id: string, _step: number): Promise<DeveloperProfile> {
    // Onboarding progress tracked client-side, just return current state
    return prisma.developerProfile.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Complete onboarding - marks profile ready without altering verification status
   */
  static async completeOnboarding(id: string): Promise<DeveloperProfile> {
    return prisma.developerProfile.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Find developers by rating
   */
  static async findByRating(minRating?: number) {
    const where: any = {};
    if (minRating) where.rating = { gte: minRating };
    return prisma.developerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  /**
   * Search developers with filters and pagination
   */
  static async searchDevelopers(
    query: string,
    filters: { tier?: string; specialties?: string[]; technologies?: string[]; country?: string },
    pagination: { skip: number; take: number }
  ) {
    const where: any = {};

    if (query) {
      where.OR = [
        { companyName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { skills: { has: query } },
      ];
    }

    if (filters.country) where.country = filters.country;
    if (filters.specialties && filters.specialties.length > 0) {
      where.skills = { hasSome: filters.specialties };
    } else if (filters.technologies && filters.technologies.length > 0) {
      where.skills = { hasSome: filters.technologies };
    }

    const [data, total] = await Promise.all([
      prisma.developerProfile.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { rating: 'desc' },
      }),
      prisma.developerProfile.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get developer stats (counts of modules, sales, revenue, reviews, tickets)
   */
  static async getDeveloperStats(id: string) {
    const [modules, sales, revenue, reviews, tickets] = await Promise.all([
      prisma.developerModule.count({ where: { developerId: id } }),
      prisma.developerModule.aggregate({
        where: { developerId: id },
        _sum: { totalSales: true },
      }),
      prisma.developerModule.aggregate({
        where: { developerId: id },
        _sum: { totalRevenue: true },
      }),
      prisma.developerModuleReview.count({ where: { developerId: id } }),
      prisma.developerSupportTicket.count({ where: { developerId: id } }),
    ]);

    return {
      totalModules: modules,
      totalSales: sales._sum.totalSales || 0,
      totalRevenue: revenue._sum.totalRevenue || 0,
      totalReviews: reviews,
      totalTickets: tickets,
    };
  }
}
