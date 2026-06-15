import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

// ===================== PORTFOLIO ITEMS =====================

export async function listPortfolioItems(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.PortfolioItemWhereInput = { businessId: business.id };
  const { categoryId, featured, search, page = '1', limit = '20' } = filters;

  if (categoryId) where.categoryId = categoryId;
  if (featured !== undefined) where.featured = featured === 'true';
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [items, total] = await Promise.all([
    prisma.portfolioItem.findMany({
      where, skip, take,
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        testimonials: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 3 },
        _count: { select: { interactions: true } },
      },
    }),
    prisma.portfolioItem.count({ where }),
  ]);

  return { items, total, page: parseInt(page), limit: take };
}

export async function getPortfolioItem(ownerId: string, itemId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const item = await prisma.portfolioItem.findFirst({
    where: { id: itemId, businessId: business.id },
    include: {
      category: true,
      media: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      testimonials: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      interactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!item) throw new AppError('Élément portfolio introuvable', 404);

  // Increment views
  await prisma.portfolioItem.update({
    where: { id: itemId },
    data: { viewsCount: { increment: 1 } },
  });

  return item;
}

export async function createPortfolioItem(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const item = await prisma.portfolioItem.create({
    data: {
      businessId: business.id,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      content: data.content,
      coverImage: data.coverImage,
      images: data.images || [],
      video: data.video,
      beforeImage: data.beforeImage,
      afterImage: data.afterImage,
      clientName: data.clientName,
      location: data.location,
      budget: data.budget,
      currency: data.currency || 'FCFA',
      duration: data.duration,
      resultsText: data.resultsText,
      tags: data.tags || [],
      projectDate: data.projectDate ? new Date(data.projectDate) : undefined,
      sortOrder: data.sortOrder || 0,
      featured: data.featured || false,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return item;
}

export async function updatePortfolioItem(ownerId: string, itemId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });
  if (!existing) throw new AppError('Élément portfolio introuvable', 404);

  const updateData: any = {};
  const fields = ['title', 'description', 'content', 'coverImage', 'images', 'video',
    'beforeImage', 'afterImage', 'clientName', 'location', 'budget', 'currency',
    'duration', 'resultsText', 'tags', 'categoryId', 'sortOrder', 'featured', 'isActive', 'legacyCategory'];
  fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });
  if (data.projectDate !== undefined) updateData.projectDate = new Date(data.projectDate);

  return prisma.portfolioItem.update({
    where: { id: itemId },
    data: updateData,
    include: {
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function deletePortfolioItem(ownerId: string, itemId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioItem.findFirst({
    where: { id: itemId, businessId: business.id },
  });
  if (!existing) throw new AppError('Élément portfolio introuvable', 404);

  await prisma.portfolioItem.update({
    where: { id: itemId },
    data: { isActive: false, deletedAt: new Date() },
  });
  return { message: 'Élément portfolio supprimé' };
}

// ===================== CATEGORIES =====================

export async function listPortfolioCategories(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  return prisma.portfolioCategory.findMany({
    where: { businessId: business.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { items: true } },
      children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function createPortfolioCategory(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return prisma.portfolioCategory.create({
    data: {
      businessId: business.id,
      name: data.name,
      slug,
      description: data.description,
      icon: data.icon,
      image: data.image,
      parentId: data.parentId,
      sortOrder: data.sortOrder || 0,
    },
    include: { _count: { select: { items: true } } },
  });
}

export async function updatePortfolioCategory(ownerId: string, categoryId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioCategory.findFirst({
    where: { id: categoryId, businessId: business.id },
  });
  if (!existing) throw new AppError('Catégorie introuvable', 404);

  const updateData: any = {};
  const fields = ['name', 'slug', 'description', 'icon', 'image', 'parentId', 'sortOrder', 'isActive'];
  fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

  return prisma.portfolioCategory.update({
    where: { id: categoryId },
    data: updateData,
    include: { _count: { select: { items: true } } },
  });
}

export async function deletePortfolioCategory(ownerId: string, categoryId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioCategory.findFirst({
    where: { id: categoryId, businessId: business.id },
  });
  if (!existing) throw new AppError('Catégorie introuvable', 404);

  // Unlink children categories
  await prisma.portfolioCategory.updateMany({
    where: { parentId: categoryId, businessId: business.id },
    data: { parentId: null },
  });

  // Unlink items
  await prisma.portfolioItem.updateMany({
    where: { categoryId },
    data: { categoryId: null },
  });

  await prisma.portfolioCategory.update({
    where: { id: categoryId },
    data: { isActive: false },
  });
  return { message: 'Catégorie supprimée' };
}

// ===================== MEDIA =====================

export async function addPortfolioMedia(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  return prisma.portfolioMedia.create({
    data: {
      businessId: business.id,
      portfolioItemId: data.portfolioItemId,
      type: data.type || 'IMAGE',
      url: data.url,
      title: data.title,
      description: data.description,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      width: data.width,
      height: data.height,
      sortOrder: data.sortOrder || 0,
    },
  });
}

export async function deletePortfolioMedia(ownerId: string, mediaId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioMedia.findFirst({
    where: { id: mediaId, businessId: business.id },
  });
  if (!existing) throw new AppError('Média introuvable', 404);

  await prisma.portfolioMedia.delete({ where: { id: mediaId } });
  return { message: 'Média supprimé' };
}

// ===================== TESTIMONIALS =====================

export async function listPortfolioTestimonials(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.PortfolioTestimonialWhereInput = { businessId: business.id, isActive: true };
  const { portfolioItemId, isPinned } = filters;

  if (portfolioItemId) where.portfolioItemId = portfolioItemId;
  if (isPinned !== undefined) where.isPinned = isPinned === 'true';

  return prisma.portfolioTestimonial.findMany({
    where,
    orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: {
      portfolioItem: { select: { id: true, title: true, coverImage: true } },
    },
  });
}

export async function createPortfolioTestimonial(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  return prisma.portfolioTestimonial.create({
    data: {
      businessId: business.id,
      portfolioItemId: data.portfolioItemId,
      clientName: data.clientName,
      clientPhoto: data.clientPhoto,
      clientCompany: data.clientCompany,
      text: data.text,
      rating: data.rating || 5,
      projectDate: data.projectDate ? new Date(data.projectDate) : undefined,
      isPinned: data.isPinned || false,
      sortOrder: data.sortOrder || 0,
    },
  });
}

export async function updatePortfolioTestimonial(ownerId: string, testimonialId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioTestimonial.findFirst({
    where: { id: testimonialId, businessId: business.id },
  });
  if (!existing) throw new AppError('Témoignage introuvable', 404);

  const updateData: any = {};
  const fields = ['clientName', 'clientPhoto', 'clientCompany', 'text', 'rating',
    'portfolioItemId', 'isPinned', 'sortOrder', 'isActive'];
  fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });
  if (data.projectDate !== undefined) updateData.projectDate = new Date(data.projectDate);

  return prisma.portfolioTestimonial.update({
    where: { id: testimonialId },
    data: updateData,
  });
}

export async function deletePortfolioTestimonial(ownerId: string, testimonialId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.portfolioTestimonial.findFirst({
    where: { id: testimonialId, businessId: business.id },
  });
  if (!existing) throw new AppError('Témoignage introuvable', 404);

  await prisma.portfolioTestimonial.delete({ where: { id: testimonialId } });
  return { message: 'Témoignage supprimé' };
}

// ===================== INTERACTIONS =====================

export async function recordInteraction(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const item = await prisma.portfolioItem.findFirst({
    where: { id: data.portfolioItemId, businessId: business.id },
  });
  if (!item) throw new AppError('Élément portfolio introuvable', 404);

  const interaction = await prisma.portfolioInteraction.create({
    data: {
      businessId: business.id,
      portfolioItemId: data.portfolioItemId,
      type: data.type,
      visitorId: data.visitorId,
      visitorName: data.visitorName,
      comment: data.comment,
      metadata: data.metadata,
    },
  });

  // Update counts
  if (data.type === 'LIKE') {
    await prisma.portfolioItem.update({
      where: { id: data.portfolioItemId },
      data: { likesCount: { increment: 1 } },
    });
  } else if (data.type === 'SHARE') {
    await prisma.portfolioItem.update({
      where: { id: data.portfolioItemId },
      data: { sharesCount: { increment: 1 } },
    });
  }

  return interaction;
}

// ===================== PUBLIC API =====================

export async function getPublicPortfolio(slug: string) {
  const business = await prisma.business.findFirst({
    where: { slug, isActive: true },
    select: { id: true, modules: true },
  });
  if (!business) return [];
  if (!business.modules.includes('PORTFOLIO')) return [];

  const [items, categories, testimonials] = await Promise.all([
    prisma.portfolioItem.findMany({
      where: { businessId: business.id, isActive: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        media: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        testimonials: {
          where: { isActive: true },
          orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }],
          take: 5,
        },
      },
    }),
    prisma.portfolioCategory.findMany({
      where: { businessId: business.id, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: { where: { isActive: true } } } } },
    }),
    prisma.portfolioTestimonial.findMany({
      where: { businessId: business.id, isActive: true, portfolioItemId: null },
      orderBy: [{ isPinned: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  return { items, categories, testimonials };
}

// ===================== STATS =====================

export async function getPortfolioStats(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const bizId = business.id;

  const [totalItems, activeItems, featuredItems, totalCategories, totalTestimonials,
    totalViews, totalLikes, totalShares, totalInteractions] = await Promise.all([
    prisma.portfolioItem.count({ where: { businessId: bizId } }),
    prisma.portfolioItem.count({ where: { businessId: bizId, isActive: true } }),
    prisma.portfolioItem.count({ where: { businessId: bizId, featured: true, isActive: true } }),
    prisma.portfolioCategory.count({ where: { businessId: bizId, isActive: true } }),
    prisma.portfolioTestimonial.count({ where: { businessId: bizId, isActive: true } }),
    prisma.portfolioItem.aggregate({ where: { businessId: bizId }, _sum: { viewsCount: true } }),
    prisma.portfolioItem.aggregate({ where: { businessId: bizId }, _sum: { likesCount: true } }),
    prisma.portfolioItem.aggregate({ where: { businessId: bizId }, _sum: { sharesCount: true } }),
    prisma.portfolioInteraction.count({ where: { businessId: bizId } }),
  ]);

  return {
    totalItems, activeItems, featuredItems, totalCategories, totalTestimonials,
    totalViews: totalViews._sum.viewsCount || 0,
    totalLikes: totalLikes._sum.likesCount || 0,
    totalShares: totalShares._sum.sharesCount || 0,
    totalInteractions,
  };
}
