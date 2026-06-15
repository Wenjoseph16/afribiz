import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

// ===== Helper =====
async function getBusiness(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return business;
}

// ===== EVENTS CRUD =====
export async function listEvents(userId: string, filters: any = {}) {
  const business = await getBusiness(userId);
  const where: any = { businessId: business.id, deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.isPublished === 'true') where.isPublished = true;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { shortDescription: { contains: filters.search } },
    ];
  }
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        _count: { select: { tickets: true, participants: true } },
        tickets: { where: { isActive: true }, select: { id: true, name: true, type: true, price: true, remaining: true, quantity: true } },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getEvent(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({
    where: { id: eventId, businessId: business.id, deletedAt: null },
    include: {
      tickets: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      participants: { orderBy: { createdAt: 'desc' }, take: 50 },
      promotions: { where: { isActive: true } },
      gallery: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      partners: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { participants: true, scans: true } },
    },
  });
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

export async function createEvent(userId: string, data: any) {
  const business = await getBusiness(userId);
  return prisma.event.create({
    data: {
      businessId: business.id,
      title: data.title,
      startDate: data.startDate,
      ...data,
    },
    include: {
      tickets: true,
      _count: { select: { tickets: true, participants: true } },
    },
  });
}

export async function updateEvent(userId: string, eventId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.event.update({
    where: { id: eventId },
    data,
    include: {
      tickets: { where: { isActive: true } },
      _count: { select: { tickets: true, participants: true } },
    },
  });
}

export async function deleteEvent(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  await prisma.event.update({ where: { id: eventId }, data: { deletedAt: new Date(), isActive: false } });
  return { message: 'Event deleted' };
}

// ===== TICKETS =====
export async function listTickets(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventTicket.findMany({
    where: { eventId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createTicket(userId: string, eventId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  const ticket = await prisma.eventTicket.create({
    data: { eventId, ...data },
  });
  // Update event remainingSpots
  const totalRemaining = await prisma.eventTicket.aggregate({ where: { eventId }, _sum: { remaining: true } });
  await prisma.event.update({ where: { id: eventId }, data: { remainingSpots: totalRemaining._sum.remaining || 0 } });
  return ticket;
}

export async function updateTicket(userId: string, eventId: string, ticketId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  const ticket = await prisma.eventTicket.findFirst({ where: { id: ticketId, eventId } });
  if (!ticket) throw new AppError('Ticket not found', 404);
  return prisma.eventTicket.update({ where: { id: ticketId }, data });
}

export async function deleteTicket(userId: string, eventId: string, ticketId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  await prisma.eventTicket.update({ where: { id: ticketId }, data: { isActive: false } });
  return { message: 'Ticket deactivated' };
}

// ===== PARTICIPANTS =====
export async function listParticipants(userId: string, eventId: string, filters: any = {}) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  const where: any = { eventId };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { phone: { contains: filters.search } },
      { ticketRef: { contains: filters.search } },
    ];
  }
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 30;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.eventParticipant.findMany({
      where,
      include: { ticket: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.eventParticipant.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function registerParticipant(userId: string, eventId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);

  // Check capacity
  if (event.capacity && event.capacity > 0) {
    const count = await prisma.eventParticipant.count({ where: { eventId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } });
    if (count >= event.capacity) throw new AppError('Event is full', 409);
  }

  // Generate ticket ref
  const count = await prisma.eventParticipant.count();
  const ticketRef = `TKT-${String(count + 1).padStart(8, '0')}`;
  const qrData = `EVENT:${eventId}:TKT:${ticketRef}`;

  return prisma.eventParticipant.create({
    data: {
      eventId,
      ticketRef,
      qrData,
      ...data,
    },
    include: { ticket: { select: { name: true, type: true } } },
  });
}

export async function clientRegisterForEvent(userId: string, eventId: string, data?: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
  const event = await prisma.event.findFirst({ where: { id: eventId, isPublished: true, deletedAt: null } });
  if (!event) throw new AppError('Événement non trouvé', 404);

  const existing = await prisma.eventParticipant.findFirst({
    where: { eventId, OR: [{ clientId: userId }, { email: data?.email }] },
  });
  if (existing) throw new AppError('Vous êtes déjà inscrit à cet événement', 409);

  if (event.capacity && event.capacity > 0) {
    const count = await prisma.eventParticipant.count({ where: { eventId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } });
    if (count >= event.capacity) throw new AppError('Événement complet', 409);
  }

  const count = await prisma.eventParticipant.count();
  const ticketRef = `TKT-${String(count + 1).padStart(8, '0')}`;
  const qrData = `EVENT:${eventId}:TKT:${ticketRef}`;

  return prisma.eventParticipant.create({
    data: {
      eventId,
      clientId: userId,
      ticketRef,
      qrData,
      firstName: data?.firstName || '',
      lastName: data?.lastName || '',
      email: data?.email || '',
      phone: data?.phone || '',
    },
  });
}

export async function updateParticipantStatus(userId: string, eventId: string, participantId: string, status: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  const updateData: any = { status };
  if (status === 'CHECKED_IN') updateData.checkedInAt = new Date();
  return prisma.eventParticipant.update({ where: { id: participantId }, data: updateData });
}

// ===== SCANS =====
export async function scanTicket(userId: string, eventId: string, ticketRef: string, scannerId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);

  const participant = await prisma.eventParticipant.findUnique({ where: { ticketRef } });
  if (!participant) throw new AppError('Invalid ticket', 404);

  // Check if already scanned
  const existingScan = await prisma.eventScan.findFirst({
    where: { eventId, ticketRef, status: 'VALID' },
  });
  const isDuplicate = !!existingScan;
  const scanStatus = isDuplicate ? 'ALREADY_USED' : 'VALID';

  const scan = await prisma.eventScan.create({
    data: {
      eventId,
      participantId: participant.id,
      scannerId,
      ticketRef,
      status: scanStatus,
      isDuplicate,
    },
  });

  // If valid, mark participant as checked in
  if (!isDuplicate) {
    await prisma.eventParticipant.update({
      where: { id: participant.id },
      data: { status: 'CHECKED_IN', checkedInAt: new Date(), checkedInBy: scannerId },
    });
  }

  return scan;
}

export async function listScans(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventScan.findMany({
    where: { eventId },
    include: { scanner: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

// ===== PROMOTIONS =====
export async function listPromotions(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventPromotion.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' } });
}

export async function createPromotion(userId: string, eventId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventPromotion.create({ data: { eventId, ...data } });
}

export async function deletePromotion(userId: string, eventId: string, promoId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  await prisma.eventPromotion.delete({ where: { id: promoId } });
  return { message: 'Promotion deleted' };
}

// ===== GALLERY =====
export async function listGallery(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventGallery.findMany({ where: { eventId, isActive: true }, orderBy: { sortOrder: 'asc' } });
}

export async function addGalleryItem(userId: string, eventId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventGallery.create({ data: { eventId, ...data } });
}

export async function deleteGalleryItem(userId: string, eventId: string, itemId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  await prisma.eventGallery.update({ where: { id: itemId }, data: { isActive: false } });
  return { message: 'Gallery item deleted' };
}

// ===== PARTNERS =====
export async function listPartners(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventPartner.findMany({ where: { eventId }, orderBy: { sortOrder: 'asc' } });
}

export async function addPartner(userId: string, eventId: string, data: any) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  return prisma.eventPartner.create({ data: { eventId, ...data } });
}

export async function removePartner(userId: string, eventId: string, partnerId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);
  await prisma.eventPartner.delete({ where: { id: partnerId } });
  return { message: 'Partner removed' };
}

// ===== STATS =====
export async function getEventStats(userId: string, eventId: string) {
  const business = await getBusiness(userId);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);

  const [totalParticipants, checkedIn, noShow, cancelled, waitlist, scans, ticketSales] = await Promise.all([
    prisma.eventParticipant.count({ where: { eventId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
    prisma.eventParticipant.count({ where: { eventId, status: 'CHECKED_IN' } }),
    prisma.eventParticipant.count({ where: { eventId, status: 'NO_SHOW' } }),
    prisma.eventParticipant.count({ where: { eventId, status: 'CANCELLED' } }),
    prisma.eventParticipant.count({ where: { eventId, isOnWaitlist: true } }),
    prisma.eventScan.count({ where: { eventId } }),
    prisma.eventParticipant.aggregate({ where: { eventId, isPaid: true }, _sum: { price: true } }),
  ]);

  return {
    totalParticipants,
    checkedIn,
    noShow,
    cancelled,
    waitlist,
    scans,
    noShowRate: totalParticipants > 0 ? Math.round((noShow / totalParticipants) * 100) : 0,
    checkInRate: totalParticipants > 0 ? Math.round((checkedIn / totalParticipants) * 100) : 0,
    totalRevenue: ticketSales._sum?.price || 0,
    fillRate: event.capacity && event.capacity > 0 ? Math.round((totalParticipants / event.capacity) * 100) : 0,
  };
}

export async function getDashboardStats(userId: string) {
  const business = await getBusiness(userId);
  const now = new Date();

  const [active, upcoming, completed, ticketSales, totalParticipants] = await Promise.all([
    prisma.event.count({ where: { businessId: business.id, deletedAt: null, status: { notIn: ['CANCELLED', 'COMPLETED'] } } }),
    prisma.event.count({ where: { businessId: business.id, deletedAt: null, startDate: { gt: now }, status: { not: 'CANCELLED' } } }),
    prisma.event.count({ where: { businessId: business.id, deletedAt: null, status: 'COMPLETED' } }),
    prisma.eventParticipant.aggregate({
      where: { event: { businessId: business.id } },
      _sum: { price: true },
    }),
    prisma.eventParticipant.count({ where: { event: { businessId: business.id } } }),
  ]);

  return {
    active,
    upcoming,
    completed,
    totalEvents: active + upcoming + completed,
    totalRevenue: ticketSales._sum?.price || 0,
    totalParticipants,
  };
}

// ===== PUBLIC API =====
export async function getPublicEvents(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('EVENTS')) {
    return { available: false, events: [] };
  }
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { businessId: business.id, isPublished: true, isActive: true, deletedAt: null, startDate: { gte: now } },
    include: {
      tickets: { where: { isActive: true, saleStatus: 'ACTIVE' }, select: { id: true, name: true, type: true, price: true, currency: true, remaining: true } },
      partners: { where: { isSponsor: true }, select: { name: true, logo: true } },
    },
    orderBy: { startDate: 'asc' },
    take: 20,
  });
  return { available: true, events };
}

export async function getPublicEvent(slug: string, eventId: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  const event = await prisma.event.findFirst({
    where: { id: eventId, businessId: business.id, isPublished: true, isActive: true, deletedAt: null },
    include: {
      tickets: { where: { isActive: true, saleStatus: 'ACTIVE' }, orderBy: { sortOrder: 'asc' } },
      gallery: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      partners: { orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!event) throw new AppError('Event not found', 404);
  return event;
}

export async function registerPublicParticipant(slug: string, eventId: string, data: any) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  const event = await prisma.event.findFirst({ where: { id: eventId, businessId: business.id, isPublished: true, isActive: true, deletedAt: null } });
  if (!event) throw new AppError('Event not found', 404);

  // Check capacity
  if (event.capacity && event.capacity > 0) {
    const count = await prisma.eventParticipant.count({ where: { eventId, status: { notIn: ['CANCELLED', 'REFUNDED'] } } });
    if (count >= event.capacity) {
      // Auto-add to waitlist
      const count2 = await prisma.eventParticipant.count();
      const ticketRef = `TKT-${String(count2 + 1).padStart(8, '0')}`;
      return prisma.eventParticipant.create({
        data: { eventId, ticketRef, isOnWaitlist: true, ...data },
      });
    }
  }

  const count = await prisma.eventParticipant.count();
  const ticketRef = `TKT-${String(count + 1).padStart(8, '0')}`;
  const qrData = `EVENT:${eventId}:TKT:${ticketRef}`;

  return prisma.eventParticipant.create({
    data: { eventId, ticketRef, qrData, ...data },
  });
}
