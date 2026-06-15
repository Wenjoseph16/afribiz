import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { Prisma } from '@prisma/client';
import { catchAsyncErrors } from '../middlewares/errorHandler';

async function recalculateProductRating(productId: string) {
  const stats = await prisma.review.aggregate({
    where: { productId, isActive: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: { rating: stats._avg.rating || 0, reviewCount: stats._count },
  });
}

async function recalculateServiceRating(serviceId: string) {
  const stats = await prisma.review.aggregate({
    where: { serviceId, isActive: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.service.update({
    where: { id: serviceId },
    data: { rating: stats._avg.rating || 0, reviewCount: stats._count },
  });
}

export const getReviews = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.ReviewWhereInput = { userId: req.user.id };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { product: true, service: true },
    }),
    prisma.review.count({ where }),
  ]);

  res.json(successResponse({
    reviews,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  }));
});

export const createReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { productId, serviceId, rating, title, comment } = req.body;

  if (!productId && !serviceId) {
    res.status(400).json({ success: false, error: 'produitId ou serviceId requis' }); return;
  }

  const whereFilter = productId
    ? { userId: req.user.id, productId }
    : { userId: req.user.id, serviceId };
  const existing = await prisma.review.findFirst({ where: whereFilter as any });
  if (existing) { res.status(409).json({ success: false, error: 'Vous avez déjà noté cet élément' }); return; }

  const files = (req as any).files as Express.Multer.File[] | undefined;
  const images = files
    ? files.map((f) => `/uploads/${f.filename}`)
    : req.body.images
      ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images])
      : [];

  const review = await prisma.review.create({
    data: {
      userId: req.user.id,
      productId: productId || null,
      serviceId: serviceId || null,
      rating: parseFloat(rating) || 5,
      title,
      comment,
      images,
    },
  });

  if (productId) {
    await recalculateProductRating(productId);
  }
  if (serviceId) {
    await recalculateServiceRating(serviceId);
  }

  res.status(201).json(successResponse({ review }, 'Avis publié'));
});

export const updateReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const review = await prisma.review.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!review) { res.status(404).json({ success: false, error: 'Avis introuvable' }); return; }

  const { rating, title, comment } = req.body;
  const files = (req as any).files as Express.Multer.File[] | undefined;
  const data: any = {};
  if (rating !== undefined) data.rating = parseFloat(rating);
  if (title !== undefined) data.title = title;
  if (comment !== undefined) data.comment = comment;
  if (files && files.length > 0) {
    data.images = files.map((f) => `/uploads/${f.filename}`);
  }
  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data,
  });

  if (review.productId) await recalculateProductRating(review.productId);
  if (review.serviceId) await recalculateServiceRating(review.serviceId);

  res.json(successResponse({ review: updated }, 'Avis modifié'));
});

export const deleteReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const review = await prisma.review.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!review) { res.status(404).json({ success: false, error: 'Avis introuvable' }); return; }

  await prisma.review.delete({ where: { id: req.params.id } });

  if (review.productId) await recalculateProductRating(review.productId);
  if (review.serviceId) await recalculateServiceRating(review.serviceId);

  res.json(successResponse(null, 'Avis supprimé'));
});
