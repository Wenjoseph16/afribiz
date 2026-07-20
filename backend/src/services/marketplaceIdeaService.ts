import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

interface CreateIdeaParams {
  businessId: string;
  title: string;
  description?: string;
  category: string;
}

export async function createIdea(params: CreateIdeaParams) {
  return prisma.marketIdea.create({
    data: {
      businessId: params.businessId,
      title: params.title,
      description: params.description,
      category: params.category,
    },
    include: {
      business: { select: { id: true, name: true, logo: true, city: true } },
    },
  });
}

export async function getIdeas(filters: { category?: string; page?: number; limit?: number }) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.category) where.category = filters.category;

  const [items, total] = await Promise.all([
    prisma.marketIdea.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, logo: true, city: true, country: true } },
      },
      orderBy: [{ votes: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.marketIdea.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getIdeaById(ideaId: string) {
  return prisma.marketIdea.findUnique({
    where: { id: ideaId },
    include: {
      business: { select: { id: true, name: true, logo: true, city: true, country: true } },
    },
  });
}

export async function voteIdea(ideaId: string, userId: string) {
  const existing = await prisma.marketVote.findUnique({
    where: { userId_targetType_targetId: { userId, targetType: 'IDEA', targetId: ideaId } },
  });
  if (existing) throw new AppError('Vous avez déjà voté pour cette idée', 409);

  await prisma.marketVote.create({ data: { userId, targetType: 'IDEA', targetId: ideaId } });
  return prisma.marketIdea.update({ where: { id: ideaId }, data: { votes: { increment: 1 } } });
}

export async function unvoteIdea(ideaId: string, userId: string) {
  const existing = await prisma.marketVote.findUnique({
    where: { userId_targetType_targetId: { userId, targetType: 'IDEA', targetId: ideaId } },
  });
  if (!existing) throw new AppError("Vous n'avez pas voté pour cette idée", 404);

  await prisma.marketVote.delete({ where: { id: existing.id } });
  return prisma.marketIdea.update({ where: { id: ideaId }, data: { votes: { decrement: 1 } } });
}

export async function getTopIdeas(limit = 10) {
  return prisma.marketIdea.findMany({
    orderBy: { votes: 'desc' },
    take: limit,
    include: {
      business: { select: { id: true, name: true, logo: true } },
    },
  });
}
