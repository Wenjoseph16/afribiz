const fs = require('fs');
const path = require('path');
const BASE = 'backend/src';

function write(file, content) {
  const fullPath = path.join(BASE, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓', file);
}

// ===================== SERVICE =====================
write('services/bookings.ts', `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('BOOKINGS')) throw new AppError('Module R\\u00e9servations non activ\\u00e9', 403);
  return business;
}

function generateBookingNumber(): string {
  const d = new Date();
  return \`RES-\${d.getFullYear()}\${String(d.getMonth()+1).padStart(2,'0')}\${String(d.getDate()).padStart(2,'0')}-\${String(Math.floor(Math.random()*99999)).padStart(5,'0')}\`;
}

const bookingInclude = {
  client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
  service: { select: { id: true, name: true, price: true, currency: true, duration: true } },
  room: { select: { id: true, name: true, roomNumber: true, type: true, price: true } },
  resource: { select: { id: true, name: true, type: true } },
  reminders: { orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.BookingInclude;

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
  if (!booking) throw new AppError('R\\u00e9servation non trouv\\u00e9e', 404);
  return booking;
}

export async function createBooking(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const bookingNumber = generateBookingNumber();

  // Check for conflicts
  if (data.resourceId && data.startDate && data.endDate) {
    const conflict = await prisma.booking.findFirst({
      where: {
        resourceId: data.resourceId,
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] as any },
        OR: [
          { startDate: { lt: new Date(data.endDate) }, endDate: { gt: new Date(data.startDate) } },
          { startDate: { lt: new Date(data.endDate) }, endDate: null, startDate: { gte: new Date(data.startDate) } },
        ],
      },
    });
    if (conflict && conflict.id !== data.id) throw new AppError('Conflit de r\\u00e9servation pour cette ressource', 409);
  }

  const booking = await prisma.booking.create({
    data: {
      bookingNumber,
      business: { connect: { id: business.id } },
      client: data.clientId ? { connect: { id: data.clientId } } : undefined,
      title: data.title,
      description: data.description,
      type: data.type || 'SERVICE',
      source: data.source || 'MANUAL',
      isWalkIn: data.isWalkIn || false,
      service: data.serviceId ? { connect: { id: data.serviceId } } : undefined,
      room: data.roomId ? { connect: { id: data.roomId } } : undefined,
      resource: data.resourceId ? { connect: { id: data.resourceId } } : undefined,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      guests: data.guests || 1,
      adults: data.adults || 1,
      children: data.children || 0,
      numberOfPeople: data.numberOfPeople || data.guests || 1,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      location: data.location,
      specialRequests: data.specialRequests,
      notes: data.notes,
      price: data.price || 0,
      currency: data.currency || business.settings?.currency || 'FCFA',
      depositAmount: data.depositAmount,
      depositPaid: data.depositPaid || false,
      cancellationPolicy: data.cancellationPolicy,
      status: 'CONFIRMED',
    },
    include: bookingInclude,
  });
  return booking;
}

export async function updateBooking(ownerId: string, bookingId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.booking.findFirst({ where: { id: bookingId, businessId: business.id } });
  if (!existing) throw new AppError('R\\u00e9servation non trouv\\u00e9e', 404);

  const upd: any = {};
  if (data.title !== undefined) upd.title = data.title;
  if (data.description !== undefined) upd.description = data.description;
  if (data.type !== undefined) upd.type = data.type;
  if (data.startDate !== undefined) upd.startDate = new Date(data.startDate);
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
  if (data.serviceId !== undefined) upd.service = data.serviceId ? { connect: { id: data.serviceId } } : undefined;
  if (data.roomId !== undefined) upd.room = data.roomId ? { connect: { id: data.roomId } } : undefined;
  if (data.resourceId !== undefined) upd.resource = data.resourceId ? { connect: { id: data.resourceId } } : { disconnect: true };

  return prisma.booking.update({ where: { id: bookingId }, data: upd, include: bookingInclude });
}

export async function updateBookingStatus(ownerId: string, bookingId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, businessId: business.id } });
  if (!booking) throw new AppError('R\\u00e9servation non trouv\\u00e9e', 404);

  const now = new Date();
  const upd: any = { status: status as any };

  switch (status) {
    case 'ARRIVED': upd.checkedInAt = now; break;
    case 'IN_PROGRESS': upd.checkedInAt = booking.checkedInAt || now; break;
    case 'COMPLETED': upd.checkedOutAt = now; break;
    case 'CANCELLED': upd.cancelledAt = now; upd.cancelReason = reason; break;
    case 'NO_SHOW': upd.noShowAt = now; upd.isNoShow = true; break;
  }

  return prisma.booking.update({ where: { id: bookingId }, data: upd, include: bookingInclude });
}

export async function deleteBooking(ownerId: string, bookingId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.booking.delete({ where: { id: bookingId, businessId: business.id } });
}

export async function getBookingStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };
  const statuses = ['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW','RESCHEDULED','ARRIVED'] as const;
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
    data: { ...data, business: { connect: { id: business.id } }, resource: data.resourceId ? { connect: { id: data.resourceId } } : undefined },
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
    data: { ...data, business: { connect: { id: business.id } } },
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
  return prisma.booking.findMany({
    where: {
      businessId: business.id,
      status: { notIn: ['CANCELLED', 'NO_SHOW'] as any },
      startDate: { gte: new Date(dateFrom) },
      endDate: { lte: new Date(dateTo + 'T23:59:59Z') },
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
  if (!booking) throw new AppError('R\\u00e9servation non trouv\\u00e9e', 404);

  const reminder = await prisma.bookingReminder.create({
    data: { bookingId, type, channel, status: 'PENDING' },
  });

  // Simulate sending (in real app, dispatch to notification service)
  await prisma.bookingReminder.update({
    where: { id: reminder.id },
    data: { status: 'SENT', sentAt: new Date() },
  });

  if (!booking.reminderSent) {
    await prisma.booking.update({ where: { id: bookingId }, data: { remindedAt: new Date(), reminderSent: true } });
  }

  return prisma.bookingReminder.findUnique({ where: { id: reminder.id } });
}
`);

// ===================== CONTROLLER =====================
write('controllers/bookings.ts', `import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as bookingService from '../services/bookings';

export const listBusinessBookings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const result = await bookingService.listBusinessBookings(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20,
    status: req.query.status as string, type: req.query.type as string, source: req.query.source as string,
    search: req.query.search as string, dateFrom: req.query.dateFrom as string, dateTo: req.query.dateTo as string,
    resourceId: req.query.resourceId as string, serviceId: req.query.serviceId as string,
  });
  res.json({ success: true, data: result });
});

export const getBusinessBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.getBusinessBooking(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const createBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.createBooking(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'R\\u00e9servation cr\\u00e9\\u00e9e' });
});

export const updateBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.updateBooking(req.user.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'R\\u00e9servation mise \\u00e0 jour' });
});

export const updateBookingStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.updateBookingStatus(req.user.id, req.params.id, req.body.status, req.body.cancelReason);
  res.json({ success: true, data, message: 'Statut mis \\u00e0 jour' });
});

export const deleteBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await bookingService.deleteBooking(req.user.id, req.params.id);
  res.json({ success: true, message: 'R\\u00e9servation supprim\\u00e9e' });
});

export const getBookingStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.getBookingStats(req.user.id);
  res.json({ success: true, data });
});

export const listTimeSlots = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.listTimeSlots(req.user.id);
  res.json({ success: true, data });
});

export const createTimeSlot = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.createTimeSlot(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateTimeSlot = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.updateTimeSlot(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteTimeSlot = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await bookingService.deleteTimeSlot(req.user.id, req.params.id);
  res.json({ success: true, message: 'Cr\\u00e9neau supprim\\u00e9' });
});

export const listResources = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.listResources(req.user.id);
  res.json({ success: true, data });
});

export const createResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.createResource(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.updateResource(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await bookingService.deleteResource(req.user.id, req.params.id);
  res.json({ success: true, message: 'Ressource supprim\\u00e9e' });
});

export const getCalendarBookings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.getCalendarBookings(req.user.id, req.query.dateFrom as string, req.query.dateTo as string);
  res.json({ success: true, data });
});

export const sendReminder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await bookingService.sendReminder(req.user.id, req.params.id, req.body.type, req.body.channel);
  res.json({ success: true, data, message: 'Rappel envoy\\u00e9' });
});
`);

// ===================== VALIDATORS =====================
write('validators/bookings.ts', `import { z } from 'zod';

const bookingTypes = ['APPOINTMENT','ROOM','TABLE','EVENT','CONSULTATION','SERVICE','SPACE','EQUIPMENT','VEHICLE','TRAINING'] as const;
const bookingSources = ['AFRIBIZ_SITE','DASHBOARD','QR_CODE','WHATSAPP','PHONE','PHYSICAL','MANUAL'] as const;
const bookingStatuses = ['PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','RESCHEDULED','NO_SHOW','ARRIVED'] as const;
const cancelPolicies = ['FLEXIBLE','MODERATE','STRICT','NON_REFUNDABLE'] as const;
const reminderTypes = ['CONFIRMATION','REMINDER','FOLLOWUP','CANCELLATION'] as const;
const reminderChannels = ['WHATSAPP','SMS','PUSH','EMAIL'] as const;
const resourceTypes = ['ROOM','EMPLOYEE','EQUIPMENT','VEHICLE','SPACE','TABLE'] as const;
const weekDays = [0,1,2,3,4,5,6] as const;

export const createBookingSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  type: z.enum(bookingTypes).optional().default('SERVICE'),
  source: z.enum(bookingSources).optional().default('MANUAL'),
  isWalkIn: z.boolean().optional().default(false),
  serviceId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  guests: z.number().int().positive().optional().default(1),
  adults: z.number().int().positive().optional().default(1),
  children: z.number().int().min(0).optional().default(0),
  numberOfPeople: z.number().int().positive().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  location: z.string().optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().min(0).default(0),
  currency: z.string().optional(),
  depositAmount: z.number().positive().optional(),
  depositPaid: z.boolean().optional().default(false),
  cancellationPolicy: z.enum(cancelPolicies).optional(),
});

export const updateBookingSchema = createBookingSchema.partial();

export const updateBookingStatusSchema = z.object({
  status: z.enum(bookingStatuses),
  cancelReason: z.string().optional(),
});

export const createTimeSlotSchema = z.object({
  resourceId: z.string().uuid().optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\\d{2}:\\d{2}$/),
  endTime: z.string().regex(/^\\d{2}:\\d{2}$/),
  isAvailable: z.boolean().optional().default(true),
  maxCapacity: z.number().int().positive().optional().default(1),
  slotDuration: z.number().int().positive().optional(),
  bufferTime: z.number().int().min(0).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateTimeSlotSchema = createTimeSlotSchema.partial();

export const createResourceSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(resourceTypes),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional().default(1),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateResourceSchema = createResourceSchema.partial();

export const sendReminderSchema = z.object({
  type: z.enum(reminderTypes),
  channel: z.enum(reminderChannels),
});
`);

// ===================== ROUTES =====================
write('routes/bookings.ts', `import { Router } from 'express';
import {
  listBusinessBookings, getBusinessBooking, createBooking, updateBooking, updateBookingStatus, deleteBooking, getBookingStats,
  listTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot,
  listResources, createResource, updateResource, deleteResource,
  getCalendarBookings, sendReminder,
} from '../controllers/bookings';
import { validateBody } from '../middlewares/validators';
import {
  createBookingSchema, updateBookingSchema, updateBookingStatusSchema,
  createTimeSlotSchema, updateTimeSlotSchema,
  createResourceSchema, updateResourceSchema, sendReminderSchema,
} from '../validators/bookings';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Stats
router.get('/stats', getBookingStats);

// Bookings
router.get('/', listBusinessBookings);
router.post('/', validateBody(createBookingSchema), createBooking);
router.get('/calendar', getCalendarBookings);
router.get('/:id', getBusinessBooking);
router.put('/:id', validateBody(updateBookingSchema), updateBooking);
router.patch('/:id/status', validateBody(updateBookingStatusSchema), updateBookingStatus);
router.delete('/:id', deleteBooking);
router.post('/:id/reminder', validateBody(sendReminderSchema), sendReminder);

// Time Slots
router.get('/slots', listTimeSlots);
router.post('/slots', validateBody(createTimeSlotSchema), createTimeSlot);
router.put('/slots/:id', validateBody(updateTimeSlotSchema), updateTimeSlot);
router.delete('/slots/:id', deleteTimeSlot);

// Resources
router.get('/resources', listResources);
router.post('/resources', validateBody(createResourceSchema), createResource);
router.put('/resources/:id', validateBody(updateResourceSchema), updateResource);
router.delete('/resources/:id', deleteResource);

export default router;
`);

console.log('\\nAll backend files created!');
