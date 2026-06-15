import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';

export const getFavorites = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { type } = req.query;
  const where: any = { userId: req.user.id };
  if (type) where.type = type;

  const favorites = await prisma.favorite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { id: true, name: true, images: true, price: true, slug: true, businessId: true, currency: true, rating: true } },
    },
  });

  // Resolve referenced entities by type for non-product favorites
  const enriched = await Promise.all(favorites.map(async (fav) => {
    if (fav.productId) return { ...fav, ref: fav.product, _type: 'product' };
    const refId = fav.referenceId;
    if (fav.type === 'BUSINESS') {
      const ref = await prisma.business.findUnique({ where: { id: refId }, select: { id: true, name: true, slug: true, logo: true, type: true, city: true, rating: true } });
      return { ...fav, ref, _type: 'business' };
    }
    if (fav.type === 'SERVICE') {
      const ref = await prisma.service.findUnique({ where: { id: refId }, select: { id: true, name: true, price: true, currency: true, duration: true } });
      return { ...fav, ref, _type: 'service' };
    }
    if (fav.type === 'TRAINING') {
      const ref = await prisma.training.findUnique({ where: { id: refId }, select: { id: true, title: true, category: true, duration: true } });
      return { ...fav, ref, _type: 'training' };
    }
    if (fav.type === 'EVENT') {
      const ref = await prisma.event.findUnique({ where: { id: refId }, select: { id: true, title: true, startDate: true, price: true, images: true, address: true } });
      return { ...fav, ref, _type: 'event' };
    }
    return { ...fav, ref: null, _type: fav.type?.toLowerCase() || 'unknown' };
  }));

  res.json(successResponse({ favorites: enriched }));
});

export const addFavorite = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { type, referenceId } = req.body;

  const existing = await prisma.favorite.findUnique({
    where: { userId_referenceId: { userId: req.user.id, referenceId } },
  });
  if (existing) { res.status(409).json({ success: false, error: 'Déjà dans les favoris' }); return; }

  await prisma.favorite.create({
    data: { userId: req.user.id, type, referenceId },
  });
  res.status(201).json(successResponse(null, 'Ajouté aux favoris'));
});

export const removeFavorite = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const fav = await prisma.favorite.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!fav) { res.status(404).json({ success: false, error: 'Favori introuvable' }); return; }

  await prisma.favorite.delete({ where: { id: req.params.id } });
  res.json(successResponse(null, 'Retiré des favoris'));
});
