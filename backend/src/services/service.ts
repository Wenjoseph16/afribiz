import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { calculatePagination } from '../utils/helpers';

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
}

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('SERVICES')) {
    throw new AppError('Module Services not activated', 403);
  }
  return business;
}

const serviceInclude = {
  category: true,
  employees: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
  _count: { select: { reviews: true, bookings: true } },
} as const;

export async function listServices(ownerId: string, params: any) {
  const business = await getBusinessByOwner(ownerId);
  const { skip, take } = calculatePagination(params.page || 1, params.limit || 20);
  const where: Prisma.ServiceWhereInput = { businessId: business.id, deletedAt: null };
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.isActive !== undefined) where.isActive = params.isActive === true || params.isActive === 'true';
  if (params.featured) where.featured = params.featured === true || params.featured === 'true';
  if (params.search) where.OR = [{ name: { contains: params.search, mode: 'insensitive' } }];
  const orderBy: any = {};
  if (params.sortBy === 'price') orderBy.price = params.sortOrder || 'asc';
  else if (params.sortBy === 'duration') orderBy.duration = params.sortOrder || 'asc';
  else if (params.sortBy === 'rating') orderBy.rating = 'desc';
  else if (params.sortBy === 'popular') orderBy.bookingCount = 'desc';
  else orderBy.createdAt = 'desc';
  const [services, total] = await Promise.all([
    prisma.service.findMany({ where, include: serviceInclude, orderBy, skip, take }),
    prisma.service.count({ where }),
  ]);
  return {
    services,
    pagination: { page: params.page || 1, limit: params.limit || 20, total, totalPages: Math.ceil(total / (params.limit || 20)) },
  };
}

export async function getService(ownerId: string, serviceId: string) {
  const business = await getBusinessByOwner(ownerId);
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, deletedAt: null },
    include: {
      ...serviceInclude,
      reviews: { where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
    },
  });
  if (!service) throw new AppError('Service not found', 404);
  return service;
}

export async function createService(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.$transaction(async (tx) => {
    const cleaned: any = {};
    Object.keys(data).forEach(k => { if (!['categoryId', 'employees'].includes(k)) cleaned[k] = data[k]; });
    if (data.categoryId) {
      const cat = await tx.serviceCategory.findFirst({ where: { id: data.categoryId, businessId: business.id } });
      if (!cat) throw new AppError('Category not found', 400);
      cleaned.category = { connect: { id: data.categoryId } };
    }
    if (data.promotionEndsAt) cleaned.promotionEndsAt = new Date(data.promotionEndsAt);
    const created = await tx.service.create({
      data: { businessId: business.id, ...cleaned, tags: data.tags || [], images: data.images || [], isPromotional: data.isPromotional ?? false, bookingRequired: data.bookingRequired ?? true },
    });
    if (data.employees?.length > 0) {
      await tx.serviceEmployee.createMany({
        data: data.employees.map((e: any, i: number) => ({ serviceId: created.id, name: e.name, title: e.title || null, photo: e.photo || null, bio: e.bio || null, sortOrder: i })),
      });
    }
    return tx.service.findUnique({ where: { id: created.id }, include: serviceInclude });
  });
}

export async function updateService(ownerId: string, serviceId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Service not found', 404);
  return prisma.$transaction(async (tx) => {
    const cleaned: any = {};
    Object.keys(data).forEach(k => { if (!['categoryId', 'employees'].includes(k)) cleaned[k] = data[k]; });
    if (data.categoryId) {
      const cat = await tx.serviceCategory.findFirst({ where: { id: data.categoryId, businessId: business.id } });
      if (!cat) throw new AppError('Category not found', 400);
      cleaned.category = { connect: { id: data.categoryId } };
    } else if (data.categoryId === null) cleaned.category = { disconnect: true };
    if (data.promotionEndsAt) cleaned.promotionEndsAt = new Date(data.promotionEndsAt);
    await tx.service.update({ where: { id: serviceId }, data: cleaned });
    if (data.employees !== undefined) {
      await tx.serviceEmployee.deleteMany({ where: { serviceId } });
      if (data.employees.length > 0) {
        await tx.serviceEmployee.createMany({
          data: data.employees.map((e: any, i: number) => ({ serviceId, name: e.name, title: e.title || null, photo: e.photo || null, bio: e.bio || null, sortOrder: i })),
        });
      }
    }
    return tx.service.findUnique({ where: { id: serviceId }, include: serviceInclude });
  });
}

export async function deleteService(ownerId: string, serviceId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Service not found', 404);
  await prisma.service.update({ where: { id: serviceId }, data: { deletedAt: new Date(), isActive: false } });
  return { message: 'Service deleted' };
}

export async function toggleServiceActive(ownerId: string, serviceId: string) {
  const business = await getBusinessByOwner(ownerId);
  const s = await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id, deletedAt: null } });
  if (!s) throw new AppError('Service not found', 404);
  return prisma.service.update({ where: { id: serviceId }, data: { isActive: !s.isActive }, include: serviceInclude });
}

export async function listCategories(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.serviceCategory.findMany({
    where: { businessId: business.id, deletedAt: null },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } }, _count: { select: { services: true } } },
    orderBy: { sortOrder: 'asc' as const },
  });
}

export async function createCategory(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const slug = slugify(data.name);
  const existing = await prisma.serviceCategory.findUnique({ where: { businessId_slug: { businessId: business.id, slug } } });
  if (existing) throw new AppError('Category already exists', 409);
  if (data.parentId) {
    const parent = await prisma.serviceCategory.findFirst({ where: { id: data.parentId, businessId: business.id } });
    if (!parent) throw new AppError('Parent category not found', 404);
  }
  return prisma.serviceCategory.create({
    data: { businessId: business.id, name: data.name, slug, description: data.description, icon: data.icon, image: data.image, parentId: data.parentId || null, sortOrder: data.sortOrder || 0 },
    include: { _count: { select: { services: true } } },
  });
}

export async function updateCategory(ownerId: string, categoryId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const cat = await prisma.serviceCategory.findFirst({ where: { id: categoryId, businessId: business.id, deletedAt: null } });
  if (!cat) throw new AppError('Category not found', 404);
  const updateData: any = { ...data };
  if (data.name) updateData.slug = slugify(data.name);
  if (data.parentId === null) updateData.parentId = null;
  else if (data.parentId) {
    if (data.parentId === categoryId) throw new AppError('Circular reference', 400);
    const parent = await prisma.serviceCategory.findFirst({ where: { id: data.parentId, businessId: business.id } });
    if (!parent) throw new AppError('Parent category not found', 404);
  }
  return prisma.serviceCategory.update({
    where: { id: categoryId },
    data: updateData,
    include: { children: { where: { isActive: true } }, _count: { select: { services: true } } },
  });
}

export async function deleteCategory(ownerId: string, categoryId: string) {
  const business = await getBusinessByOwner(ownerId);
  const cat = await prisma.serviceCategory.findFirst({ where: { id: categoryId, businessId: business.id, deletedAt: null }, include: { _count: { select: { services: true } } } });
  if (!cat) throw new AppError('Category not found', 404);
  if (cat._count.services > 0) throw new AppError('Cannot delete: has services', 400);
  await prisma.serviceCategory.update({ where: { id: categoryId }, data: { deletedAt: new Date(), isActive: false } });
  return { message: 'Category deleted' };
}

export async function duplicateService(ownerId: string, serviceId: string) {
  const business = await getBusinessByOwner(ownerId);
  const original = await prisma.service.findFirst({ where: { id: serviceId, businessId: business.id, deletedAt: null } });
  if (!original) throw new AppError('Service not found', 404);
  return prisma.$transaction(async (tx) => {
    const { id, createdAt, updatedAt, deletedAt, bookingCount, reviewCount, rating, ...data } = original;
    const created = await tx.service.create({
      data: {
        ...data,
        name: original.name + ' (copie)',
        isActive: false,
        images: original.images,
        tags: original.tags,
        seoTitle: undefined,
        seoDescription: undefined,
      },
    });
    const employees = await tx.serviceEmployee.findMany({ where: { serviceId: original.id, isActive: true } });
    if (employees.length > 0) {
      await tx.serviceEmployee.createMany({
        data: employees.map((e, i) => ({
          serviceId: created.id,
          name: e.name,
          title: e.title,
          photo: e.photo,
          bio: e.bio,
          sortOrder: i,
        })),
      });
    }
    return tx.service.findUnique({ where: { id: created.id }, include: serviceInclude });
  });
}

export async function exportServices(ownerId: string, format: string = 'csv') {
  const business = await getBusinessByOwner(ownerId);
  const services = await prisma.service.findMany({
    where: { businessId: business.id, deletedAt: null },
    include: { category: true, _count: { select: { reviews: true, bookings: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const rows = services.map(s => ({
    name: s.name,
    shortDescription: s.shortDescription || '',
    price: s.price?.toString() || '',
    priceType: s.priceType,
    duration: s.duration?.toString() || '',
    category: s.category?.name || '',
    isActive: s.isActive ? 'Oui' : 'Non',
    isPromotional: s.isPromotional ? 'Oui' : 'Non',
    bookingCount: s._count.bookings,
    reviewCount: s._count.reviews,
    createdAt: s.createdAt.toISOString(),
  }));
  return { services: rows, total: rows.length };
}

export async function importServices(ownerId: string, services: any[]) {
  const business = await getBusinessByOwner(ownerId);
  if (!services?.length) throw new AppError('Aucun service à importer', 400);
  const results = { imported: 0, errors: 0, errors_detail: [] as string[] };
  for (let i = 0; i < services.length; i++) {
    try {
      const item = services[i];
      if (!item.name) throw new AppError('Nom requis', 400);
      await prisma.service.create({
        data: {
          businessId: business.id,
          name: item.name,
          shortDescription: item.shortDescription || '',
          description: item.description || '',
          price: item.price ? Number(item.price) : null,
          priceType: item.priceType || 'FIXED',
          duration: item.duration ? Number(item.duration) : null,
          tags: item.tags || [],
          images: item.images || [],
          isActive: item.isActive !== false,
          isVisibleOnPublicPage: item.isVisibleOnPublicPage !== false,
          isVisibleOnMarketplace: item.isVisibleOnMarketplace !== false,
          locationType: item.locationType || 'ON_SITE',
          availability: item.availability || 'ALWAYS',
          bookingRequired: item.bookingRequired !== false,
        },
      });
      results.imported++;
    } catch (err: any) {
      results.errors++;
      results.errors_detail.push(`Ligne ${i + 1}: ${err.message || 'Erreur'}`);
    }
  }
  return results;
}

export async function bulkDeleteServices(ownerId: string, ids: string[]) {
  const business = await getBusinessByOwner(ownerId);
  if (!ids?.length) throw new AppError('Aucun ID fourni', 400);
  const deleted = await prisma.service.updateMany({
    where: { id: { in: ids }, businessId: business.id, deletedAt: null },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { message: `${deleted.count} service(s) supprimé(s)` };
}

export async function bulkToggleServices(ownerId: string, ids: string[], isActive: boolean) {
  const business = await getBusinessByOwner(ownerId);
  if (!ids?.length) throw new AppError('Aucun ID fourni', 400);
  const updated = await prisma.service.updateMany({
    where: { id: { in: ids }, businessId: business.id, deletedAt: null },
    data: { isActive },
  });
  return { message: `${updated.count} service(s) mis à jour` };
}

export async function getServiceStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const [total, active, catCount] = await Promise.all([
    prisma.service.count({ where: { businessId: business.id, deletedAt: null } }),
    prisma.service.count({ where: { businessId: business.id, deletedAt: null, isActive: true } }),
    prisma.serviceCategory.count({ where: { businessId: business.id, deletedAt: null, isActive: true } }),
  ]);
  const bookings = await prisma.service.aggregate({ where: { businessId: business.id, deletedAt: null }, _sum: { bookingCount: true } });
  return { totalServices: total, activeServices: active, inactiveServices: total - active, categoryCount: catCount, totalBookings: bookings._sum.bookingCount || 0 };
}
