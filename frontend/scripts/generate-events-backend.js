const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = 'backend/src';

// ============================================
// SERVICE
// ============================================
const serviceContent = `import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

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
  const ticketRef = \`TKT-\${String(count + 1).padStart(8, '0')}\`;
  const qrData = \`EVENT:\${eventId}:TKT:\${ticketRef}\`;

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

  const [active, upcoming, completed, totalTickets, totalRevenue, totalParticipants] = await Promise.all([
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
    totalRevenue: totalTickets._sum?.price || 0,
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
      const ticketRef = \`TKT-\${String(count2 + 1).padStart(8, '0')}\`;
      return prisma.eventParticipant.create({
        data: { eventId, ticketRef, isOnWaitlist: true, ...data },
      });
    }
  }

  const count = await prisma.eventParticipant.count();
  const ticketRef = \`TKT-\${String(count + 1).padStart(8, '0')}\`;
  const qrData = \`EVENT:\${eventId}:TKT:\${ticketRef}\`;

  return prisma.eventParticipant.create({
    data: { eventId, ticketRef, qrData, ...data },
  });
}
`;

// ============================================
// CONTROLLER
// ============================================
const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as eventService from '../services/events';

// ===== Events =====
export const listEvents = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listEvents(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.getEvent(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const createEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.createEvent(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.updateEvent(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const deleteEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.deleteEvent(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

// ===== Tickets =====
export const createTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.createTicket(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.updateTicket(req.user.id, req.params.id, req.params.ticketId, req.body);
  res.json({ success: true, data: result });
});

export const deleteTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.deleteTicket(req.user.id, req.params.id, req.params.ticketId);
  res.json({ success: true, data: result });
});

// ===== Participants =====
export const listParticipants = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listParticipants(req.user.id, req.params.id, req.query);
  res.json({ success: true, data: result });
});

export const registerParticipant = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.registerParticipant(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateParticipantStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { status } = req.body;
  const result = await eventService.updateParticipantStatus(req.user.id, req.params.id, req.params.participantId, status);
  res.json({ success: true, data: result });
});

// ===== Scans =====
export const scanTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { ticketRef } = req.body;
  const result = await eventService.scanTicket(req.user.id, req.params.id, ticketRef, req.user.id);
  res.json({ success: true, data: result });
});

export const listScans = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listScans(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

// ===== Promotions =====
export const listPromotions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listPromotions(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const createPromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.createPromotion(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const deletePromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.deletePromotion(req.user.id, req.params.id, req.params.promoId);
  res.json({ success: true, data: result });
});

// ===== Gallery =====
export const listGallery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listGallery(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const addGalleryItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.addGalleryItem(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const deleteGalleryItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.deleteGalleryItem(req.user.id, req.params.id, req.params.itemId);
  res.json({ success: true, data: result });
});

// ===== Partners =====
export const listPartners = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listPartners(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const addPartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.addPartner(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const removePartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.removePartner(req.user.id, req.params.id, req.params.partnerId);
  res.json({ success: true, data: result });
});

// ===== Stats =====
export const getEventStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.getEventStats(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const getDashboardStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.getDashboardStats(req.user.id);
  res.json({ success: true, data: result });
});
`;

// ============================================
// ROUTES
// ============================================
const routesContent = `import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listEvents, getEvent, createEvent, updateEvent, deleteEvent,
  createTicket, updateTicket, deleteTicket,
  listParticipants, registerParticipant, updateParticipantStatus,
  scanTicket, listScans,
  listPromotions, createPromotion, deletePromotion,
  listGallery, addGalleryItem, deleteGalleryItem,
  listPartners, addPartner, removePartner,
  getEventStats, getDashboardStats,
} from '../controllers/events';

const router = Router();
router.use(authMiddleware);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Event stats (must be before /:id)
router.get('/:id/stats', getEventStats);

// Sub-resources under event (must be before /:id)
router.get('/:id/tickets', listParticipants); // tickets = participants list
router.post('/:id/tickets', createTicket);
router.patch('/:id/tickets/:ticketId', updateTicket);
router.delete('/:id/tickets/:ticketId', deleteTicket);

router.get('/:id/participants', listParticipants);
router.post('/:id/participants', registerParticipant);
router.patch('/:id/participants/:participantId/status', updateParticipantStatus);

router.post('/:id/scan', scanTicket);
router.get('/:id/scans', listScans);

router.get('/:id/promotions', listPromotions);
router.post('/:id/promotions', createPromotion);
router.delete('/:id/promotions/:promoId', deletePromotion);

router.get('/:id/gallery', listGallery);
router.post('/:id/gallery', addGalleryItem);
router.delete('/:id/gallery/:itemId', deleteGalleryItem);

router.get('/:id/partners', listPartners);
router.post('/:id/partners', addPartner);
router.delete('/:id/partners/:partnerId', removePartner);

// CRUD events
router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:id', getEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
`;

// Write files
const files = [
  { name: 'services/events.ts', content: serviceContent },
  { name: 'controllers/events.ts', content: controllerContent },
  { name: 'routes/events.ts', content: routesContent },
];

for (const file of files) {
  const fullPath = path.join(backendDir, file.name);
  fs.writeFileSync(fullPath, file.content, 'utf-8');
  console.log('✅ Created:', file.name);
}

console.log('\\n🎉 All event backend files created!');
