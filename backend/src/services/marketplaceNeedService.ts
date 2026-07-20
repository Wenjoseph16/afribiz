import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

interface CreateNeedParams {
  businessId: string;
  title: string;
  description?: string;
  category: string;
  budget?: number;
  urgency?: string;
}

export async function createNeed(params: CreateNeedParams) {
  return prisma.marketNeed.create({
    data: {
      businessId: params.businessId,
      title: params.title,
      description: params.description,
      category: params.category,
      budget: params.budget || undefined,
      urgency: params.urgency || 'MEDIUM',
    },
    include: {
      business: { select: { id: true, name: true, logo: true, city: true } },
    },
  });
}

export async function getNeeds(filters: {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.category) where.category = filters.category;
  if (filters.status) where.status = filters.status;

  const [items, total] = await Promise.all([
    prisma.marketNeed.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, logo: true, city: true, country: true } },
      },
      orderBy: [{ votes: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.marketNeed.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getNeedById(needId: string) {
  return prisma.marketNeed.findUnique({
    where: { id: needId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          logo: true,
          city: true,
          country: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function voteNeed(needId: string, userId: string) {
  const existing = await prisma.marketVote.findUnique({
    where: { userId_targetType_targetId: { userId, targetType: 'NEED', targetId: needId } },
  });
  if (existing) throw new AppError('Vous avez déjà voté pour ce besoin', 409);

  await prisma.marketVote.create({ data: { userId, targetType: 'NEED', targetId: needId } });
  return prisma.marketNeed.update({ where: { id: needId }, data: { votes: { increment: 1 } } });
}

export async function unvoteNeed(needId: string, userId: string) {
  const existing = await prisma.marketVote.findUnique({
    where: { userId_targetType_targetId: { userId, targetType: 'NEED', targetId: needId } },
  });
  if (!existing) throw new AppError("Vous n'avez pas voté pour ce besoin", 404);

  await prisma.marketVote.delete({ where: { id: existing.id } });
  return prisma.marketNeed.update({ where: { id: needId }, data: { votes: { decrement: 1 } } });
}

export async function closeNeed(needId: string, businessId: string) {
  const need = await prisma.marketNeed.findUnique({
    where: { id: needId },
    select: { businessId: true },
  });
  if (!need || need.businessId !== businessId) throw new AppError('Non autorisé', 403);

  return prisma.marketNeed.update({ where: { id: needId }, data: { status: 'CLOSED' } });
}
