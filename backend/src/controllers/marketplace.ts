import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as marketplaceService from '../services/marketplace';
import { prisma } from '../lib/db';

export const search = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const {
    q,
    type,
    category,
    country,
    city,
    sort,
    page,
    limit,
    minRating,
    verified,
    premium,
    proximity,
    lat,
    lng,
    availability,
    cursor,
  } = req.query;
  const result = await marketplaceService.searchMarketplace({
    q: q as string,
    type: type as string,
    category: category as string,
    country: country as string,
    city: city as string,
    sort: sort as string,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    minRating: minRating ? parseInt(minRating as string) : undefined,
    verified: verified === 'true',
    premium: premium === 'true',
    proximity: proximity as string,
    lat: lat as string,
    lng: lng as string,
    availability: availability ? (availability as string).split(',') : undefined,
    cursor: cursor as string,
  });

  // Persist search query for opportunity detection
  if (q) {
    prisma.searchLog
      .create({
        data: {
          query: q as string,
          filters: { type, category, country, city } as Record<string, any>,
          resultCount: result.total,
          userId: (req as AuthenticatedRequest).user?.id,
          source: 'marketplace',
        },
      })
      .catch(() => {});
  }

  res.json({
    success: true,
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      nextCursor: result.nextCursor,
    },
  });
});

export const trending = catchAsyncErrors(async (req: Request, res: Response) => {
  const data = await marketplaceService.getTrending();
  res.json({ success: true, data });
});

export const stats = catchAsyncErrors(async (req: Request, res: Response) => {
  const data = await marketplaceService.getMarketplaceStats();
  res.json({ success: true, data });
});

export const similar = catchAsyncErrors(async (req: Request, res: Response) => {
  const { id } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
  const data = await marketplaceService.getSimilarBusinesses(id, limit);
  res.json({ success: true, data });
});

export const productBySlug = catchAsyncErrors(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await marketplaceService.getProductBySlug(slug);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Produit introuvable' });
  }
  res.json({ success: true, data: product });
});

export const priceDistribution = catchAsyncErrors(async (req: Request, res: Response) => {
  const { type, category } = req.query;
  const data = await marketplaceService.getPriceDistribution(type as string, category as string);
  res.json({ success: true, data });
});

export const activeAds = catchAsyncErrors(async (req: Request, res: Response) => {
  const { page, position, country } = req.query;
  const data = await marketplaceService.getActiveMarketplaceAds(
    page as string,
    position as string,
    country as string
  );
  res.json({ success: true, data });
});
