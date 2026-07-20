import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as smartSearchService from '../services/smartSearchService';

export const search = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { q, type, categoryId, businessType, city, minPrice, maxPrice, sort, page, limit } =
    req.query;
  const result = await smartSearchService.searchMarketplace((q as string) || '', {
    type: type as string,
    categoryId: categoryId as string,
    businessType: businessType as string,
    city: city as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sort as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, ...result });
});

export const suggestions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { q } = req.query;
  const results = await smartSearchService.getSearchSuggestions((q as string) || '');
  res.json({ success: true, data: results });
});

export const getHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const history = await smartSearchService.getSearchHistory(userId);
  res.json({ success: true, data: { history } });
});
