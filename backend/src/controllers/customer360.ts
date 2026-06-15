import { Response } from 'express';
import { prisma } from '../lib/db';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as customer360Service from '../services/customer360';

async function getBusinessId(req: AuthenticatedRequest) {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id }, select: { id: true } });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

export const getCustomer360 = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const data = await customer360Service.getCustomer360(businessId, req.params.clientId);
  res.json({ success: true, data });
});

export const trackPageView = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const { userId, visitorId, referrer, duration } = req.body;
  await customer360Service.trackPageView({ businessId, userId, visitorId, referrer, duration });
  res.status(201).json({ success: true, data: null });
});

export const trackProductView = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const { productId, userId, visitorId, referrer, source } = req.body;
  if (!productId) throw new AppError('productId requis', 400);
  await customer360Service.trackProductView({ businessId, productId, userId, visitorId, referrer, source });
  res.status(201).json({ success: true, data: null });
});

export const trackProductClick = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await getBusinessId(req);
  const { productId, userId, visitorId, source } = req.body;
  if (!productId) throw new AppError('productId requis', 400);
  await customer360Service.trackProductClick({ businessId, productId, userId, visitorId, source });
  res.status(201).json({ success: true, data: null });
});
