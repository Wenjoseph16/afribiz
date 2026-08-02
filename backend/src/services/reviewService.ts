import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishReviewPublished } from '../events/publishers';

const reviewInclude = {
  user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
} as const;

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

export async function createReview(
  userId: string,
  data: {
    productId?: string;
    serviceId?: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
  }
) {
  if (!data.productId && !data.serviceId) throw new AppError('productId ou serviceId requis', 400);
  const existing = await prisma.review.findFirst({
    where: {
      userId,
      ...(data.productId ? { productId: data.productId } : { serviceId: data.serviceId }),
    },
  });
  if (existing) throw new AppError('Vous avez déjà évalué ce contenu', 409);
  if (data.rating < 1 || data.rating > 5) throw new AppError('La note doit être entre 1 et 5', 400);
  const review = await prisma.review.create({
    data: {
      userId,
      productId: data.productId || null,
      serviceId: data.serviceId || null,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment || null,
      images: data.images || [],
    },
    include: reviewInclude,
  });
  if (data.productId) await recalculateProductRating(data.productId);
  if (data.serviceId) await recalculateServiceRating(data.serviceId);
  // Résoudre le vrai businessId (le produit/service appartient à un commerce)
  let targetBusinessId = '';
  let targetBusinessName = '';
  try {
    if (data.productId) {
      const p = await prisma.product.findUnique({
        where: { id: data.productId },
        select: { businessId: true, business: { select: { name: true } } },
      });
      targetBusinessId = p?.businessId || '';
      targetBusinessName = p?.business?.name || '';
    } else if (data.serviceId) {
      const s = await prisma.service.findUnique({
        where: { id: data.serviceId },
        select: { businessId: true, business: { select: { name: true } } },
      });
      targetBusinessId = s?.businessId || '';
      targetBusinessName = s?.business?.name || '';
    }
  } catch {
    // silencieux : la résolution ne doit jamais bloquer la publication de l'avis
  }
  publishReviewPublished({
    userId,
    businessId: targetBusinessId || data.productId || data.serviceId || '',
    businessName: targetBusinessName || review.title || 'Avis',
    rating: data.rating,
  });
  return review;
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: {
    rating?: number;
    title?: string;
    comment?: string;
    images?: string[];
  }
) {
  const existing = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!existing) throw new AppError('Avis non trouvé', 404);
  const updateData: any = {};
  if (data.rating !== undefined) {
    if (data.rating < 1 || data.rating > 5)
      throw new AppError('La note doit être entre 1 et 5', 400);
    updateData.rating = data.rating;
  }
  if (data.title !== undefined) updateData.title = data.title;
  if (data.comment !== undefined) updateData.comment = data.comment;
  if (data.images !== undefined) updateData.images = data.images;
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    include: reviewInclude,
  });
  if (existing.productId) await recalculateProductRating(existing.productId);
  if (existing.serviceId) await recalculateServiceRating(existing.serviceId);
  return review;
}

export async function deleteReview(userId: string, reviewId: string) {
  const existing = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!existing) throw new AppError('Avis non trouvé', 404);
  await prisma.review.update({ where: { id: reviewId }, data: { isActive: false } });
  if (existing.productId) await recalculateProductRating(existing.productId);
  if (existing.serviceId) await recalculateServiceRating(existing.serviceId);
}

export async function getReviews(params: {
  productId?: string;
  serviceId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  const where: Prisma.ReviewWhereInput = { isActive: true };
  if (params.productId) where.productId = params.productId;
  if (params.serviceId) where.serviceId = params.serviceId;
  if (params.userId) where.userId = params.userId;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);
  return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
}
