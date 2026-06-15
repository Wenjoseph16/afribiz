import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as serviceService from '../services/service';

export const listServices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await serviceService.listServices(req.user.id, { page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20, categoryId: req.query.categoryId as string, search: req.query.search as string, isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined, featured: req.query.featured !== undefined ? req.query.featured === 'true' : undefined, sortBy: req.query.sortBy as string, sortOrder: req.query.sortOrder as string });
  res.json({ success: true, data: result });
});

export const getService = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const service = await serviceService.getService(req.user.id, req.params.id);
  res.json({ success: true, data: service });
});

export const createService = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const service = await serviceService.createService(req.user.id, req.body);
  res.status(201).json({ success: true, data: service });
});

export const updateService = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const service = await serviceService.updateService(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: service });
});

export const deleteService = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await serviceService.deleteService(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

export const toggleServiceActive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const service = await serviceService.toggleServiceActive(req.user.id, req.params.id);
  res.json({ success: true, data: service });
});

export const getServiceStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const stats = await serviceService.getServiceStats(req.user.id);
  res.json({ success: true, data: stats });
});

export const duplicateService = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const service = await serviceService.duplicateService(req.user.id, req.params.id);
  res.status(201).json({ success: true, data: service });
});

export const exportServices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await serviceService.exportServices(req.user.id, req.query.format as string || 'csv');
  res.json({ success: true, data: result });
});

export const importServices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await serviceService.importServices(req.user.id, req.body.services);
  res.json({ success: true, data: result });
});

export const bulkDeleteServices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await serviceService.bulkDeleteServices(req.user.id, req.body.ids);
  res.json({ success: true, ...result });
});

export const bulkToggleServices = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await serviceService.bulkToggleServices(req.user.id, req.body.ids, req.body.isActive);
  res.json({ success: true, data: result });
});

export const listCategories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const categories = await serviceService.listCategories(req.user.id);
  res.json({ success: true, data: categories });
});

export const createCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const category = await serviceService.createCategory(req.user.id, req.body);
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const category = await serviceService.updateCategory(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: category });
});

export const deleteCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await serviceService.deleteCategory(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});
