import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as deliveryService from '../services/delivery';

export const listDeliveryZones = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.listDeliveryZones(req.user.id);
  res.json({ success: true, data: result });
});

export const createDeliveryZone = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.createDeliveryZone(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateDeliveryZone = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.updateDeliveryZone(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const deleteDeliveryZone = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.deleteDeliveryZone(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listDrivers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.listDrivers(req.user.id);
  res.json({ success: true, data: result });
});

export const createDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.createDriver(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.updateDriver(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const deleteDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.deleteDriver(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listDeliveries = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.listDeliveries(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDelivery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.getDelivery(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const createDelivery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.createDelivery(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateDelivery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.updateDelivery(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const assignDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { driverId } = req.body;
  const result = await deliveryService.assignDriver(req.user.id, req.params.id, driverId);
  res.json({ success: true, data: result });
});

export const updateDeliveryStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { status, notes } = req.body;
  const result = await deliveryService.updateDeliveryStatus(req.user.id, req.params.id, status, notes);
  res.json({ success: true, data: result });
});

export const addTrackingEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.addTrackingEvent(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const addDeliveryProof = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await deliveryService.addDeliveryProof(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const getDeliveryStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const period = req.query.period as string | undefined;
  const result = await deliveryService.getDeliveryStats(req.user.id, period);
  res.json({ success: true, data: result });
});
