import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as menuService from '../services/menu';

export const listMenuItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await menuService.listMenuItems(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20,
    categoryId: req.query.categoryId as string, status: req.query.status as string,
    search: req.query.search as string, type: req.query.type as string,
    isPopular: req.query.isPopular !== undefined ? req.query.isPopular === 'true' : undefined,
    isStar: req.query.isStar !== undefined ? req.query.isStar === 'true' : undefined,
    featured: req.query.featured !== undefined ? req.query.featured === 'true' : undefined,
    sortBy: req.query.sortBy as string, sortOrder: req.query.sortOrder as string,
  });
  res.json({ success: true, data: result });
});

export const getMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.getMenuItem(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const createMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.createMenuItem(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'Plat cr\u00e9\u00e9 avec succ\u00e8s' });
});

export const updateMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateMenuItem(req.user.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Plat mis \u00e0 jour avec succ\u00e8s' });
});

export const deleteMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await menuService.deleteMenuItem(req.user.id, req.params.id);
  res.json({ success: true, message: 'Plat supprim\u00e9 avec succ\u00e8s' });
});

export const toggleMenuItemActive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.toggleMenuItemActive(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const updateMenuItemStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateMenuItemStatus(req.user.id, req.params.id, req.body.status);
  res.json({ success: true, data, message: 'Statut mis \u00e0 jour' });
});

export const getMenuItemStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.getMenuItemStats(req.user.id);
  res.json({ success: true, data });
});

// Categories
export const listCategories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.listCategories(req.user.id);
  res.json({ success: true, data });
});

export const createCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.createCategory(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'Cat\u00e9gorie cr\u00e9\u00e9e' });
});

export const updateCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateCategory(req.user.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Cat\u00e9gorie mise \u00e0 jour' });
});

export const deleteCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await menuService.deleteCategory(req.user.id, req.params.id);
  res.json({ success: true, message: 'Cat\u00e9gorie supprim\u00e9e' });
});

// Orders
export const listOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await menuService.listOrders(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20,
    status: req.query.status as string, type: req.query.type as string,
    search: req.query.search as string, dateFrom: req.query.dateFrom as string, dateTo: req.query.dateTo as string,
  });
  res.json({ success: true, data: result });
});

export const getOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.getOrder(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const createOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.createOrder(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'Commande cr\u00e9\u00e9e' });
});

export const updateOrderStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateOrderStatus(req.user.id, req.params.id, req.body.status, req.body.cancelReason);
  res.json({ success: true, data, message: 'Statut mis \u00e0 jour' });
});

export const getOrderStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.getOrderStats(req.user.id);
  res.json({ success: true, data });
});

// Tables
export const listTables = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.listTables(req.user.id);
  res.json({ success: true, data });
});

export const createTable = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.createTable(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateTable = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateTable(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteTable = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await menuService.deleteTable(req.user.id, req.params.id);
  res.json({ success: true, message: 'Table supprim\u00e9e' });
});

export const updateTableStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateTableStatus(req.user.id, req.params.id, req.body.status);
  res.json({ success: true, data });
});

// Ingredients
export const listIngredients = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const result = await menuService.listIngredients(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 50,
    category: req.query.category as string, search: req.query.search as string,
    lowStock: req.query.lowStock === 'true',
  });
  res.json({ success: true, data: result });
});

export const createIngredient = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.createIngredient(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateIngredient = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.updateIngredient(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteIngredient = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  await menuService.deleteIngredient(req.user.id, req.params.id);
  res.json({ success: true, message: 'Ingr\u00e9dient supprim\u00e9' });
});

export const adjustStock = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.adjustStock(req.user.id, req.params.id, req.body.type, req.body.quantity, req.body.reason, req.body.reference);
  res.json({ success: true, data, message: 'Stock mis \u00e0 jour' });
});

export const getIngredientStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.getIngredientStats(req.user.id);
  res.json({ success: true, data });
});

// QR Menu
export const getQrMenuInfo = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\u00e9' });
  const data = await menuService.getQrMenuInfo(req.user.id);
  res.json({ success: true, data });
});
