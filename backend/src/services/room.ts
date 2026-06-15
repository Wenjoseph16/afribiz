import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('ROOMS')) throw new AppError('Module Logements non activé', 403);
  return business;
}

const roomInclude = {
  bookings: {
    where: { status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING', 'COMPLETED'] } },
    orderBy: { startDate: 'asc' as const },
    take: 20,
    include: { client: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  },
  _count: { select: { bookings: true } },
} satisfies Prisma.RoomInclude;

interface ListFilters {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export async function listRooms(ownerId: string, filters: ListFilters) {
  const business = await getBusinessByOwner(ownerId);
  const { page, limit, search, minPrice, maxPrice, capacity, isActive, isAvailable, sortBy, sortOrder } = filters;
  const where: Prisma.RoomWhereInput = { businessId: business.id, deletedAt: null };
  if (isActive !== undefined) where.isActive = isActive;
  if (isAvailable !== undefined) where.isAvailable = isAvailable;
  if (capacity !== undefined) where.capacity = { gte: capacity };
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: any = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    where.price = priceFilter;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Prisma.RoomOrderByWithRelationInput[] = [];
  if (sortBy === 'price') orderBy.push({ price: (sortOrder as 'asc' | 'desc') || 'asc' });
  else orderBy.push({ sortOrder: 'asc' as const }, { name: 'asc' as const });

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({ where, include: roomInclude, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.room.count({ where }),
  ]);

  return { rooms, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getRoom(ownerId: string, roomId: string) {
  const business = await getBusinessByOwner(ownerId);
  const room = await prisma.room.findFirst({
    where: { id: roomId, businessId: business.id, deletedAt: null },
    include: roomInclude,
  });
  if (!room) throw new AppError('Chambre non trouvée', 404);
  return room;
}

export async function createRoom(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.room.create({
    data: {
      businessId: business.id,
      name: data.name,
      roomNumber: data.roomNumber ?? null,
      type: data.type || 'STANDARD',
      shortDescription: data.shortDescription ?? null,
      description: data.description ?? null,
      images: data.images || [],
      video: data.video ?? null,
      price: data.price,
      priceWeekend: data.priceWeekend ?? null,
      priceHighSeason: data.priceHighSeason ?? null,
      priceLowSeason: data.priceLowSeason ?? null,
      currency: data.currency || 'FCFA',
      isPromotional: data.isPromotional ?? false,
      promotionalPrice: data.isPromotional && data.promotionalPrice ? data.promotionalPrice : null,
      discountPercent: data.discountPercent ?? 0,
      promotionEndsAt: data.promotionEndsAt ? new Date(data.promotionEndsAt) : null,
      capacity: data.capacity ?? 1,
      adults: data.adults ?? 1,
      children: data.children ?? 0,
      beds: data.beds ?? 1,
      size: data.size ?? null,
      bathroom: data.bathroom || 'PRIVATE',
      amenities: data.amenities || [],
      breakfastIncluded: data.breakfastIncluded ?? false,
      checkInTime: data.checkInTime || '14:00',
      checkOutTime: data.checkOutTime || '12:00',
      quantity: data.quantity ?? 1,
      featured: data.featured ?? false,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      sortOrder: data.sortOrder ?? 0,
    },
    include: roomInclude,
  });
}

export async function updateRoom(ownerId: string, roomId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.room.findFirst({ where: { id: roomId, businessId: business.id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new AppError('Chambre non trouvée', 404);
  const upd: any = {};
  ['name','roomNumber','type','shortDescription','description','video','price','priceWeekend','priceHighSeason','priceLowSeason','currency','isPromotional','promotionalPrice','discountPercent','capacity','adults','children','beds','size','bathroom','breakfastIncluded','checkInTime','checkOutTime','quantity','featured','isActive','isAvailable','sortOrder','seoTitle','seoDescription'].forEach(k => {
    if (data[k] !== undefined) upd[k] = data[k];
  });
  if (data.images !== undefined) upd.images = { set: data.images };
  if (data.amenities !== undefined) upd.amenities = { set: data.amenities };

  return prisma.room.update({ where: { id: roomId }, data: upd, include: roomInclude });
}

export async function deleteRoom(ownerId: string, roomId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.room.findFirst({ where: { id: roomId, businessId: business.id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new AppError('Chambre non trouvée', 404);
  await prisma.room.update({ where: { id: roomId }, data: { deletedAt: new Date(), isActive: false, isAvailable: false } });
  return { deleted: true };
}

export async function toggleRoomActive(ownerId: string, roomId: string) {
  const business = await getBusinessByOwner(ownerId);
  const room = await prisma.room.findFirst({ where: { id: roomId, businessId: business.id, deletedAt: null }, select: { id: true, isActive: true } });
  if (!room) throw new AppError('Chambre non trouvée', 404);
  return prisma.room.update({
    where: { id: roomId },
    data: { isActive: !room.isActive, isAvailable: !room.isActive },
    include: roomInclude,
  });
}

export async function updateRoomStatus(ownerId: string, roomId: string, status: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.room.findFirst({ where: { id: roomId, businessId: business.id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new AppError('Chambre non trouvée', 404);
  return prisma.room.update({ where: { id: roomId }, data: { isAvailable: status === 'AVAILABLE' }, include: roomInclude });
}

export async function blockRoomDates(ownerId: string, roomId: string, data: { startDate: string; endDate: string; reason: string; notes?: string }) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.room.findFirst({ where: { id: roomId, businessId: business.id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new AppError('Chambre non trouvée', 404);
  throw new AppError('Blocage de dates non pris en charge par le schéma actuel', 400);
}

export async function duplicateRoom(ownerId: string, roomId: string) {
  const business = await getBusinessByOwner(ownerId);
  const original = await prisma.room.findFirst({ where: { id: roomId, businessId: business.id, deletedAt: null } });
  if (!original) throw new AppError('Chambre non trouvée', 404);
  const { id, createdAt, updatedAt, deletedAt, ...data } = original;
  return prisma.room.create({
    data: {
      ...data,
      name: original.name + ' (copie)',
      isActive: false,
      isAvailable: true,
      images: original.images,
      amenities: original.amenities,
      seoTitle: undefined as any,
      seoDescription: undefined as any,
    },
    include: roomInclude,
  });
}

export async function exportRooms(ownerId: string, format: string = 'csv') {
  const business = await getBusinessByOwner(ownerId);
  const rooms = await prisma.room.findMany({
    where: { businessId: business.id, deletedAt: null },
    orderBy: { name: 'asc' },
  });
  const rows = rooms.map(r => ({
    name: r.name,
    roomNumber: r.roomNumber || '',
    type: r.type,
    price: r.price.toString(),
    capacity: r.capacity,
    beds: r.beds,
    amenities: r.amenities.join(', '),
    isActive: r.isActive ? 'Oui' : 'Non',
    isAvailable: r.isAvailable ? 'Oui' : 'Non',
  }));
  return { rooms: rows, total: rows.length };
}

export async function importRooms(ownerId: string, rooms: any[]) {
  const business = await getBusinessByOwner(ownerId);
  if (!rooms?.length) throw new AppError('Aucune chambre à importer', 400);
  const results = { imported: 0, errors: 0, errors_detail: [] as string[] };
  for (let i = 0; i < rooms.length; i++) {
    try {
      const item = rooms[i];
      if (!item.name) throw new AppError('Nom requis', 400);
      await prisma.room.create({
        data: {
          businessId: business.id,
          name: item.name,
          roomNumber: item.roomNumber || null,
          type: item.type || 'STANDARD',
          shortDescription: item.shortDescription || '',
          description: item.description || '',
          images: item.images || [],
          price: Number(item.price) || 0,
          capacity: Number(item.capacity) || 1,
          beds: Number(item.beds) || 1,
          amenities: item.amenities || [],
          isActive: item.isActive !== false,
          isAvailable: item.isAvailable !== false,
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

export async function bulkDeleteRooms(ownerId: string, ids: string[]) {
  const business = await getBusinessByOwner(ownerId);
  if (!ids?.length) throw new AppError('Aucun ID fourni', 400);
  const deleted = await prisma.room.updateMany({
    where: { id: { in: ids }, businessId: business.id, deletedAt: null },
    data: { deletedAt: new Date(), isActive: false, isAvailable: false },
  });
  return { message: `${deleted.count} chambre(s) supprimée(s)` };
}

export async function bulkToggleRooms(ownerId: string, ids: string[], isActive: boolean) {
  const business = await getBusinessByOwner(ownerId);
  if (!ids?.length) throw new AppError('Aucun ID fourni', 400);
  const updated = await prisma.room.updateMany({
    where: { id: { in: ids }, businessId: business.id, deletedAt: null },
    data: { isActive, isAvailable: isActive },
  });
  return { message: `${updated.count} chambre(s) mise(s) à jour` };
}

export async function getRoomStats(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, modules: true, ownerId: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('ROOMS')) throw new AppError('Module Logements non activé', 403);
  const bid = business.id;
  const [total, active, available, featured, bookings, promo] = await Promise.all([
    prisma.room.count({ where: { businessId: bid, deletedAt: null } }),
    prisma.room.count({ where: { businessId: bid, deletedAt: null, isActive: true } }),
    prisma.room.count({ where: { businessId: bid, deletedAt: null, isAvailable: true, isActive: true } }),
    prisma.room.count({ where: { businessId: bid, deletedAt: null, featured: true } }),
    prisma.booking.count({ where: { providerId: business.ownerId, status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } } }),
    prisma.room.count({ where: { businessId: bid, deletedAt: null, isPromotional: true } }),
  ]);

  return {
    totalRooms: total,
    activeRooms: active,
    availableRooms: available,
    featuredRooms: featured,
    promoRooms: promo,
    totalBookings: bookings,
  };
}
