import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishBookingCreated, publishBookingStatusChanged } from '../events/publishers';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('BOOKINGS')) throw new AppError('Module R\u00e9servations non activ\u00e9', 403);
  return business;
}

function generateBookingNumber(): string {
  const d = new Date();
  return `RES-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;
}

const bookingInclude = {
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
  service: { select: { id: true, name: true, price: true, currency: true, duration: true } },
  room: { select: { id: true, name: true, price: true, capacity: true, beds: true, currency: true } },
  resource: { select: { id: true, name: true, type: true } },
  reminders: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.BookingInclude;

async function checkConflict(bookingId: string | undefined, resourceId: string | undefined, roomId: string | undefined, startDate: string, endDate: string | undefined, businessId: string) {
  await checkConflictTx(prisma, bookingId, resourceId, roomId, startDate, endDate, businessId);
}

async function checkConflictTx(
  tx: Prisma.TransactionClient,
  bookingId: string | undefined,
  resourceId: string | undefined,
  roomId: string | undefined,
  startDate: string,
  endDate: string | undefined,
  businessId: string,
) {
  const end = endDate || startDate;
  const where: Prisma.BookingWhereInput = {
    businessId,
    status: { notIn: ['CANCELLED', 'COMPLETED'] as any },
    OR: [
      { startDate: { lt: new Date(end) }, endDate: { gt: new Date(startDate) } },
      { startDate: { lt: new Date(end) }, endDate: null },
    ],
  };
  if (resourceId) where.resourceId = resourceId;
  if (roomId) where.roomId = roomId;
  const conflict = await tx.booking.findFirst({ where });
  if (conflict && conflict.id !== bookingId) throw new AppError('Conflit de r\u00e9servation', 409);
}

// ===================== BOOKINGS =====================

export async function listBusinessBookings(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, status, type, source, search, dateFrom, dateTo, resourceId, serviceId } = filters;
  const where: Prisma.BookingWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (type) where.type = type as any;
  if (source) where.source = source as any;
  if (resourceId) where.resourceId = resourceId;
  if (serviceId) where.serviceId = serviceId;
  if (dateFrom || dateTo) { where.startDate = {}; if (dateFrom) where.startDate.gte = new Date(dateFrom); if (dateTo) where.startDate.lte = new Date(dateTo + 'T23:59:59Z'); }
  if (search) where.OR = [
    { bookingNumber: { contains: search, mode: 'insensitive' } },
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerPhone: { contains: search, mode: 'insensitive' } },
    { title: { contains: search, mode: 'insensitive' } },
  ];
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, include: bookingInclude, skip, take: limit, orderBy: { startDate: 'desc' } }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBusinessBooking(ownerId: string, bookingId: string) {
  const business = await getBusinessByOwner(ownerId);
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId: business.id },
    include: bookingInclude,
  });
  if (!booking) throw new AppError('R\u00e9servation non trouv\u00e9e', 404);
  return booking;
}

export async function createBooking(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const bookingNumber = generateBookingNumber();

  const booking = await prisma.$transaction(async (tx) => {
    // Check conflicts on resource and room (inside transaction for consistency)
    await checkConflictTx(tx, undefined, data.resourceId, data.roomId, data.startDate, data.endDate, business.id);

    const createData: any = {
      bookingNumber,
      businessId: business.id,
      title: data.title,
      description: data.description || null,
      type: data.type || 'SERVICE',
      source: data.source || 'AFRIBIZ_SITE',
      isWalkIn: data.isWalkIn || false,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      guests: data.guests || 1,
      adults: data.adults || 1,
      children: data.children || 0,
      numberOfPeople: data.numberOfPeople || data.guests || 1,
      customerName: data.customerName || null,
      customerPhone: data.customerPhone || null,
      customerEmail: data.customerEmail || null,
      location: data.location || null,
      specialRequests: data.specialRequests || null,
      notes: data.notes || null,
      price: data.price || 0,
      currency: data.currency || business.settings?.currency || 'FCFA',
      depositAmount: data.depositAmount || null,
      depositPaid: data.depositPaid || false,
      cancellationPolicy: data.cancellationPolicy || null,
      status: 'CONFIRMED',
      serviceId: data.serviceId || null,
      roomId: data.roomId || null,
      resourceId: data.resourceId || null,
    };
    if (data.clientId) createData.clientId = data.clientId;

    return tx.booking.create({
      data: createData as any,
      include: bookingInclude,
    });
  });

  publishBookingCreated({
    userId: ownerId,
    bookingId: booking.id,
    businessName: business.name,
    businessId: business.id,
  });

  return booking;
}

export async function updateBooking(ownerId: string, bookingId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.booking.findFirst({ where: { id: bookingId, businessId: business.id } });
  if (!existing) throw new AppError('R\u00e9servation non trouv\u00e9e', 404);

  const upd: any = {};
  if (data.title !== undefined) upd.title = data.title;
  if (data.description !== undefined) upd.description = data.description;
  if (data.type !== undefined) upd.type = data.type;
  if (data.startDate !== undefined) { upd.startDate = new Date(data.startDate); await checkConflict(bookingId, data.resourceId || existing.resourceId, data.roomId || existing.roomId, data.startDate, data.endDate || existing.endDate?.toISOString(), business.id); }
  if (data.endDate !== undefined) upd.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.guests !== undefined) upd.guests = data.guests;
  if (data.adults !== undefined) upd.adults = data.adults;
  if (data.children !== undefined) upd.children = data.children;
  if (data.numberOfPeople !== undefined) upd.numberOfPeople = data.numberOfPeople;
  if (data.customerName !== undefined) upd.customerName = data.customerName;
  if (data.customerPhone !== undefined) upd.customerPhone = data.customerPhone;
  if (data.customerEmail !== undefined) upd.customerEmail = data.customerEmail;
  if (data.specialRequests !== undefined) upd.specialRequests = data.specialRequests;
  if (data.notes !== undefined) upd.notes = data.notes;
  if (data.price !== undefined) upd.price = data.price;
  if (data.depositAmount !== undefined) upd.depositAmount = data.depositAmount;
  if (data.depositPaid !== undefined) upd.depositPaid = data.depositPaid;
  if (data.serviceId !== undefined) upd.serviceId = data.serviceId;
  if (data.roomId !== undefined) upd.roomId = data.roomId;
  if (data.resourceId !== undefined) upd.resourceId = data.resourceId;

  return prisma.booking.update({ where: { id: bookingId }, data: upd, include: bookingInclude });
}

export async function updateBookingStatus(ownerId: string, bookingId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, businessId: business.id } });
  if (!booking) throw new AppError('R\u00e9servation non trouv\u00e9e', 404);

  const now = new Date();
  const upd: any = {};

  switch (status) {
    case 'CONFIRMED':
      upd.status = 'CONFIRMED';
      break;
    case 'ARRIVED':
      upd.status = 'ARRIVED';
      upd.checkedInAt = booking.checkedInAt || now;
      break;
    case 'IN_PROGRESS':
      upd.status = 'IN_PROGRESS';
      upd.checkedInAt = booking.checkedInAt || now;
      break;
    case 'COMPLETED':
      upd.status = 'COMPLETED';
      upd.checkedOutAt = now;
      break;
    case 'CANCELLED':
      upd.status = 'CANCELLED';
      upd.cancelledAt = now;
      upd.cancelReason = reason || null;
      break;
    case 'RESCHEDULED':
      upd.status = 'RESCHEDULED';
      break;
    case 'NO_SHOW':
      upd.status = 'NO_SHOW';
      upd.cancelledAt = now;
      upd.noShowAt = now;
      upd.isNoShow = true;
      upd.cancelReason = reason || 'No-show';
      break;
    default:
      upd.status = status as any;
  }

  const updated = await prisma.booking.update({ where: { id: bookingId }, data: upd, include: bookingInclude });

  publishBookingStatusChanged({
    userId: ownerId,
    bookingId,
    status: status.toLowerCase(),
    businessName: business.name,
    businessId: business.id,
  });

  return updated;
}

export async function deleteBooking(ownerId: string, bookingId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.booking.delete({ where: { id: bookingId, businessId: business.id } });
}

export async function getBookingStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };
  const statuses = ['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','RESCHEDULED','ARRIVED','NO_SHOW'] as const;
  const counts = await Promise.all(statuses.map(s => prisma.booking.count({ where: { ...where, status: s as any } })));
  const [totalRevenue, todayRevenue, popularType] = await Promise.all([
    prisma.booking.aggregate({ where: { ...where, status: { in: ['COMPLETED','IN_PROGRESS'] as any } }, _sum: { price: true } }),
    prisma.booking.aggregate({ where: { ...where, status: { in: ['COMPLETED','IN_PROGRESS'] as any }, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }, _sum: { price: true } }),
    prisma.booking.groupBy({ by: ['type'], where, _count: true, orderBy: { _count: { type: 'desc' } }, take: 1 }),
  ]);
  const r: any = {}; statuses.forEach((s, i) => r[s.toLowerCase()] = counts[i]);
  r.total = counts.reduce((a,b) => a+b, 0);
  r.totalRevenue = totalRevenue._sum.price || 0;
  r.todayRevenue = todayRevenue._sum.price || 0;
  r.mostPopularType = popularType[0]?.type || null;
  return r;
}

// ===================== TIME SLOTS =====================

export async function listTimeSlots(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.timeSlot.findMany({
    where: { businessId: business.id, isActive: true },
    include: { resource: { select: { id: true, name: true, type: true } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function createTimeSlot(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.timeSlot.create({
    data: { ...data, businessId: business.id, resourceId: data.resourceId || null },
  });
}

export async function updateTimeSlot(ownerId: string, slotId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.timeSlot.update({ where: { id: slotId, businessId: business.id }, data });
}

export async function deleteTimeSlot(ownerId: string, slotId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.timeSlot.delete({ where: { id: slotId, businessId: business.id } });
}

// ===================== RESOURCES =====================

export async function listResources(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.bookingResource.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { bookings: true, timeSlots: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createResource(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.bookingResource.create({
    data: { ...data, businessId: business.id },
  });
}

export async function updateResource(ownerId: string, resourceId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.bookingResource.update({ where: { id: resourceId, businessId: business.id }, data });
}

export async function deleteResource(ownerId: string, resourceId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.bookingResource.delete({ where: { id: resourceId, businessId: business.id } });
}

// ===================== CALENDAR =====================

export async function getCalendarBookings(ownerId: string, dateFrom: string, dateTo: string) {
  const business = await getBusinessByOwner(ownerId);
  const from = new Date(dateFrom);
  const to = new Date(dateTo + 'T23:59:59Z');
  return prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: { notIn: ['CANCELLED'] as any },
      // Include bookings that overlap the requested range (supports multi-day bookings)
      OR: [
        // Start and end within range
        { startDate: { gte: from }, endDate: { lte: to } },
        // Start before range, end during/in range
        { startDate: { lt: from }, endDate: { gte: from } },
        // Start during range, end after range
        { startDate: { gte: from, lte: to }, endDate: { gt: to } },
        // Start before range, end after range (spans entire period)
        { startDate: { lt: from }, endDate: { gt: to } },
        // No end date (single time slot) within range
        { startDate: { gte: from, lte: to }, endDate: null },
      ],
    },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      resource: { select: { id: true, name: true, type: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

// ===================== REMINDERS =====================

export async function sendReminder(ownerId: string, bookingId: string, type: string, channel: string) {
  const business = await getBusinessByOwner(ownerId);
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, businessId: business.id } });
  if (!booking) throw new AppError('R\u00e9servation non trouv\u00e9e', 404);

  const reminder = await prisma.bookingReminder.create({
    data: { bookingId, type, channel, status: 'PENDING' },
  });

  await prisma.bookingReminder.update({
    where: { id: reminder.id },
    data: { status: 'SENT', sentAt: new Date() },
  });

  if (!booking.reminderSent) {
    await prisma.booking.update({ where: { id: bookingId }, data: { remindedAt: new Date(), reminderSent: true } });
  }

  return prisma.bookingReminder.findUnique({ where: { id: reminder.id } });
}
