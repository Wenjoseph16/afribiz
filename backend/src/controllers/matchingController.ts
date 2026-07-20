import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import { prisma } from '../lib/db';
import * as matching from '../services/matchingService';

export const getDevMatches = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) {
    throw new AppError('businessId requis', 400);
  }
  const limit = Number(req.query.limit) || 10;
  const result = await matching.getDevMatches(businessId, limit);
  res.json(successResponse(result));
});

export const getBusinessMatches = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }
    const limit = Number(req.query.limit) || 10;
    const result = await matching.getBusinessMatches(businessId, limit);
    res.json(successResponse(result));
  }
);

export const getBizForDevMatches = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const developerId = req.query.developerId as string;
    if (!developerId) {
      throw new AppError('developerId requis', 400);
    }
    const limit = Number(req.query.limit) || 10;
    const result = await matching.getBizForDevMatches(developerId, limit);
    res.json(successResponse(result));
  }
);

export const getSuggestedMatches = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const userRole = req.user.primaryRole;
    const limit = Number(req.query.limit) || 10;

    let result: any[] = [];
    if (userRole === 'BUSINESS') {
      const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
      if (business) {
        // Suggérer des développeurs
        result = await matching.getDevMatches(business.id, limit);
      }
    } else if (userRole === 'DEVELOPER') {
      result = await matching.getBizForDevMatches(req.user.id, limit);
    } else {
      // Pour les clients: suggérer des businesses populaires
      const businesses = await prisma.business.findMany({
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          country: true,
          rating: true,
          reviewCount: true,
          logo: true,
          shortDescription: true,
        },
        take: limit,
        orderBy: { rating: 'desc' },
      });
      result = businesses.map((b) => ({
        ...b,
        matchScore: Math.round((b.rating || 0) * 20),
      }));
    }

    res.json(successResponse(result));
  }
);
