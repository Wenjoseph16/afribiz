import { Request, Response, NextFunction } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as marketplaceService from '../services/marketplace';

export const search = catchAsyncErrors(async (req: Request, res: Response) => {
  const { q, type, category, country, city, sort, page, limit, minRating, verified, premium, proximity, lat, lng, availability } = req.query;
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
  });
  res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, totalPages: result.totalPages } });
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

export const activeAds = catchAsyncErrors(async (req: Request, res: Response) => {
  const { page, position, country } = req.query;
  const data = await marketplaceService.getActiveMarketplaceAds(
    page as string,
    position as string,
    country as string,
  );
  res.json({ success: true, data });
});
