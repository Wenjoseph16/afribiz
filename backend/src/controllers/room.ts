import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as roomService from '../services/room';

export const listRooms = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await roomService.listRooms(req.user.id, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
    type: req.query.type as string,
    status: req.query.status as string,
    search: req.query.search as string,
    minPrice: req.query.minPrice ? parseInt(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice as string) : undefined,
    capacity: req.query.capacity ? parseInt(req.query.capacity as string) : undefined,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    featured: req.query.featured !== undefined ? req.query.featured === 'true' : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  });
  res.json({ success: true, ...result });
});

export const getRoom = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const room = await roomService.getRoom(req.user.id, req.params.id);
  res.json({ success: true, data: room });
});

export const createRoom = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const room = await roomService.createRoom(req.user.id, req.body);
  res.status(201).json({ success: true, data: room, message: 'Chambre cr\u00e9\u00e9e avec succ\u00e8s' });
});

export const updateRoom = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const room = await roomService.updateRoom(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: room, message: 'Chambre mise \u00e0 jour' });
});

export const deleteRoom = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await roomService.deleteRoom(req.user.id, req.params.id);
  res.json({ success: true, message: 'Chambre supprim\u00e9e' });
});

export const toggleRoomActive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const room = await roomService.toggleRoomActive(req.user.id, req.params.id);
  res.json({ success: true, data: room, message: room.isActive ? 'Chambre activ\u00e9e' : 'Chambre d\u00e9sactiv\u00e9e' });
});

export const updateRoomStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const room = await roomService.updateRoomStatus(req.user.id, req.params.id, req.body.status);
  res.json({ success: true, data: room, message: 'Statut mis \u00e0 jour' });
});

export const blockRoomDates = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const block = await roomService.blockRoomDates(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: block, message: 'P\u00e9riode bloqu\u00e9e' });
});

export const duplicateRoom = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const room = await roomService.duplicateRoom(req.user.id, req.params.id);
  res.status(201).json({ success: true, data: room, message: 'Chambre dupliquée' });
});

export const exportRooms = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await roomService.exportRooms(req.user.id, req.query.format as string || 'csv');
  res.json({ success: true, data: result });
});

export const importRooms = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await roomService.importRooms(req.user.id, req.body.rooms);
  res.json({ success: true, data: result });
});

export const bulkDeleteRooms = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await roomService.bulkDeleteRooms(req.user.id, req.body.ids);
  res.json({ success: true, ...result });
});

export const bulkToggleRooms = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await roomService.bulkToggleRooms(req.user.id, req.body.ids, req.body.isActive);
  res.json({ success: true, data: result });
});

export const getRoomStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const stats = await roomService.getRoomStats(req.user.id);
  res.json({ success: true, data: stats });
});
