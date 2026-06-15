import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../lib/db';
import * as bookingService from '../services/bookings';

export const listBusinessBookings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await bookingService.listBusinessBookings(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20,
    status: req.query.status as string, type: req.query.type as string, source: req.query.source as string,
    search: req.query.search as string, dateFrom: req.query.dateFrom as string, dateTo: req.query.dateTo as string,
    resourceId: req.query.resourceId as string, serviceId: req.query.serviceId as string,
  });
  res.json({ success: true, data: result });
});

export const getBusinessBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.getBusinessBooking(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const createBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.createBooking(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'R\u00e9servation cr\u00e9\u00e9e' });
});

export const updateBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.updateBooking(req.user.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'R\u00e9servation mise \u00e0 jour' });
});

export const updateBookingStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.updateBookingStatus(req.user.id, req.params.id, req.body.status, req.body.cancelReason);
  res.json({ success: true, data, message: 'Statut mis \u00e0 jour' });
});

export const deleteBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await bookingService.deleteBooking(req.user.id, req.params.id);
  res.json({ success: true, message: 'R\u00e9servation supprim\u00e9e' });
});

export const getBookingStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.getBookingStats(req.user.id);
  res.json({ success: true, data });
});

export const listTimeSlots = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.listTimeSlots(req.user.id);
  res.json({ success: true, data });
});

export const createTimeSlot = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.createTimeSlot(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateTimeSlot = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.updateTimeSlot(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteTimeSlot = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await bookingService.deleteTimeSlot(req.user.id, req.params.id);
  res.json({ success: true, message: 'Cr\u00e9neau supprim\u00e9' });
});

export const listResources = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.listResources(req.user.id);
  res.json({ success: true, data });
});

export const createResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.createResource(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.updateResource(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteResource = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await bookingService.deleteResource(req.user.id, req.params.id);
  res.json({ success: true, message: 'Ressource supprim\u00e9e' });
});

export const getCalendarBookings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.getCalendarBookings(req.user.id, req.query.dateFrom as string, req.query.dateTo as string);
  res.json({ success: true, data });
});

export const sendReminder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await bookingService.sendReminder(req.user.id, req.params.id, req.body.type, req.body.channel);
  res.json({ success: true, data, message: 'Rappel envoy\u00e9' });
});

// ============ CLIENT-FACING BOOKINGS ============

export const getMyBookings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const where: any = { clientId: req.user.id };
  if (status) where.status = status;
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({ where, skip: (pageNum-1)*limitNum, take: limitNum, orderBy: { startDate: 'desc' }, include: { service: { select: { name: true } } } }),
    prisma.booking.count({ where }),
  ]);
  res.json({ success: true, data: { bookings, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum) } });
});

export const getMyBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const booking = await prisma.booking.findFirst({ where: { id: req.params.id, clientId: req.user.id } });
  if (!booking) return res.status(404).json({ success: false, error: 'R\u00e9servation introuvable' });
  res.json({ success: true, data: { booking } });
});

export const cancelMyBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const booking = await prisma.booking.findFirst({ where: { id: req.params.id, clientId: req.user.id } });
  if (!booking) return res.status(404).json({ success: false, error: 'R\u00e9servation introuvable' });
  if (booking.status === 'CANCELLED') return res.status(400).json({ success: false, error: 'D\u00e9j\u00e0 annul\u00e9e' });
  await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: 'Annul\u00e9 par le client' } });
  res.json({ success: true, message: 'R\u00e9servation annul\u00e9e' });
});

export const rescheduleMyBooking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const booking = await prisma.booking.findFirst({ where: { id: req.params.id, clientId: req.user.id } });
  if (!booking) return res.status(404).json({ success: false, error: 'R\u00e9servation introuvable' });
  if (booking.status === 'CANCELLED') return res.status(400).json({ success: false, error: 'Impossible de reporter une r\u00e9servation annul\u00e9e' });
  const { startDate, endDate } = req.body;
  const updated = await prisma.booking.update({ where: { id: req.params.id }, data: { startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, status: 'RESCHEDULED' } });
  res.json({ success: true, data: { booking: updated }, message: 'R\u00e9servation modifi\u00e9e' });
});
