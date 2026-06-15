import { Response } from 'express';
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
export const listTickets = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.listTickets(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

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

export const clientRegisterForEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await eventService.clientRegisterForEvent(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result, message: 'Inscription réussie' });
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

// ===== Public =====
export const getPublicEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const result = await eventService.getPublicEvent(req.params.slug, req.params.eventId);
  res.json({ success: true, data: result });
});

export const registerPublicParticipant = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const result = await eventService.registerPublicParticipant(req.params.slug, req.params.eventId, req.body);
  res.status(201).json({ success: true, data: result });
});
