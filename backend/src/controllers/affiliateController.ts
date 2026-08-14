import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as affiliateService from '../services/affiliateService';

export const createLink = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const { itemType, itemId, commissionPercent } = req.body;
  if (!itemType || !itemId) {
    return res.status(400).json(successResponse(null, 'itemType et itemId requis'));
  }
  const link = await affiliateService.createAffiliateLink(req.user.id, {
    itemType,
    itemId,
    commissionPercent,
  });
  res.status(201).json(successResponse(link, 'Lien d\'affiliation créé'));
});

export const listLinks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const links = await affiliateService.listAffiliateLinks(req.user.id);
  res.json(successResponse({ links }));
});

export const deleteLink = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  await affiliateService.deleteAffiliateLink(req.user.id, req.params.id);
  res.json(successResponse(null, 'Lien d\'affiliation supprimé'));
});

export const resolveLink = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const code = String(req.query.code || '');
  if (!code) return res.status(400).json(successResponse(null, 'code requis'));
  const link = await affiliateService.resolveAffiliateLink(code);
  res.json(successResponse(link));
});
