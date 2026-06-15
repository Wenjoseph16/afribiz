import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('RENTALS')) throw new AppError('Module Locations non activé', 403);
  return business;
}

const rentalInclude = {
} satisfies Prisma.RentalInclude;

export async function listRentals(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, search, isActive } = filters;
  const where: Prisma.RentalWhereInput = { businessId: business.id, deletedAt: null };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where.name = { contains: search, mode: 'insensitive' };
  const skip = (page - 1) * limit;
  const [rentals, total] = await Promise.all([
    prisma.rental.findMany({ where, skip, take: limit, orderBy: { sortOrder: 'asc' } }),
    prisma.rental.count({ where }),
  ]);
  return { rentals, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getRental(ownerId: string, rentalId: string) {
  const business = await getBusinessByOwner(ownerId);
  const rental = await prisma.rental.findFirst({
    where: { id: rentalId, businessId: business.id, deletedAt: null },
  });
  if (!rental) throw new AppError('Location introuvable', 404);
  return rental;
}

export async function createRental(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const rental = await prisma.rental.create({
    data: {
      businessId: business.id,
      name: data.name,
      description: data.description,
      images: data.images || [],
      price: data.price,
      unit: data.unit,
      deposit: data.deposit,
      priceUnit: data.priceUnit || 'day',
      currency: data.currency || 'FCFA',
      quantity: data.quantity || 1,
      availableQty: data.availableQty || data.quantity || 1,
      isActive: data.isActive !== undefined ? data.isActive : true,
      sortOrder: data.sortOrder || 0,
    },
  });
  return rental;
}

export async function updateRental(ownerId: string, rentalId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.rental.findFirst({
    where: { id: rentalId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Location introuvable', 404);
  const upd: any = {};
  if (data.name !== undefined) upd.name = data.name;
  if (data.description !== undefined) upd.description = data.description;
  if (data.images !== undefined) upd.images = data.images;
  if (data.price !== undefined) upd.price = data.price;
  if (data.unit !== undefined) upd.unit = data.unit;
  if (data.deposit !== undefined) upd.deposit = data.deposit;
  if (data.priceUnit !== undefined) upd.priceUnit = data.priceUnit;
  if (data.currency !== undefined) upd.currency = data.currency;
  if (data.quantity !== undefined) { upd.quantity = data.quantity; upd.availableQty = data.quantity; }
  if (data.sortOrder !== undefined) upd.sortOrder = data.sortOrder;
  const rental = await prisma.rental.update({ where: { id: rentalId }, data: upd });
  return rental;
}

export async function deleteRental(ownerId: string, rentalId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.rental.findFirst({
    where: { id: rentalId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Location introuvable', 404);
  await prisma.rental.update({ where: { id: rentalId }, data: { deletedAt: new Date() } });
  return { deleted: true };
}

export async function toggleRentalActive(ownerId: string, rentalId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.rental.findFirst({
    where: { id: rentalId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Location introuvable', 404);
  const rental = await prisma.rental.update({
    where: { id: rentalId },
    data: { isActive: !existing.isActive },
  });
  return rental;
}

export async function createRentalBooking(userId: string, data: { rentalId: string; startDate: string; endDate: string; notes?: string }) {
  const rental = await prisma.rental.findUnique({ where: { id: data.rentalId, isActive: true, deletedAt: null } });
  if (!rental) throw new AppError('Location non trouvée', 404);

  const days = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) throw new AppError('La date de fin doit être après la date de début', 400);

  const totalPrice = Number(rental.price) * days;

  const booking = await prisma.booking.create({
    data: {
      bookingNumber: `RNT-${Date.now().toString(36).toUpperCase()}`,
      businessId: rental.businessId,
      clientId: userId,
      title: `Location: ${rental.name}`,
      type: 'SERVICE',
      source: 'AFRIBIZ_SITE',
      status: 'PENDING',
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      price: totalPrice,
      currency: rental.currency,
      depositAmount: rental.deposit ? Number(rental.deposit) : null,
      rentalId: rental.id,
      notes: data.notes,
    },
    include: { rental: true },
  });

  return booking;
}

export async function prolongRentalBooking(userId: string, bookingId: string, data: { newEndDate: string; additionalNotes?: string }) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, clientId: userId, rentalId: { not: null } },
    include: { rental: true },
  });
  if (!booking) throw new AppError('Réservation non trouvée', 404);
  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') {
    throw new AppError('Impossible de prolonger cette réservation', 400);
  }

  const newEnd = new Date(data.newEndDate);
  if (newEnd <= booking.endDate!) throw new AppError('La nouvelle date doit être après la date actuelle', 400);

  const additionalDays = Math.ceil((newEnd.getTime() - booking.endDate!.getTime()) / (1000 * 60 * 60 * 24));
  const additionalPrice = booking.rental ? Number(booking.rental.price) * additionalDays : 0;

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      endDate: newEnd,
      price: Number(booking.price) + additionalPrice,
      notes: data.additionalNotes
        ? `${booking.notes || ''}\nProlongation: ${additionalDays}j, +${additionalPrice} FCFA. ${data.additionalNotes}`
        : `${booking.notes || ''}\nProlongation: ${additionalDays}j, +${additionalPrice} FCFA`,
    },
    include: { rental: true },
  });

  return updated;
}

export async function getRentalStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id, deletedAt: null };
  const [total, active, inactive] = await Promise.all([
    prisma.rental.count({ where }),
    prisma.rental.count({ where: { ...where, isActive: true } }),
    prisma.rental.count({ where: { ...where, isActive: false } }),
  ]);
  return { total, active, inactive };
}
