import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import * as productService from '../services/product';

export const listProducts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const result = await productService.listProducts(req.user.id, {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
    categoryId: req.query.categoryId as string,
    search: req.query.search as string,
    stock: req.query.stock as string | undefined,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    isPromotional:
      req.query.isPromotional !== undefined ? req.query.isPromotional === 'true' : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string | undefined,
  });
  res.json(successResponse(result));
});

export const getProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const product = await productService.getProduct(req.user.id, req.params.id);
  res.json({ success: true, data: product });
});

export const createProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const product = await productService.createProduct(req.user.id, req.body);
  res
    .status(201)
    .json({ success: true, data: product, message: 'Produit cr\u00e9\u00e9 avec succ\u00e8s' });
});

export const updateProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const product = await productService.updateProduct(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: product, message: 'Produit mis \u00e0 jour' });
});

export const deleteProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const result = await productService.deleteProduct(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

export const duplicateProduct = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const product = await productService.duplicateProduct(req.user.id, req.params.id);
    res.status(201).json({ success: true, data: product, message: 'Produit dupliqu\u00e9' });
  }
);

export const toggleProductActive = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const product = await productService.toggleProductActive(req.user.id, req.params.id);
    res.json({ success: true, data: product });
  }
);

export const updateStock = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const { stock } = req.body;
  if (typeof stock !== 'number' || stock < 0) {
    throw new AppError('Stock invalide', 400);
  }
  const product = await productService.updateStock(req.user.id, req.params.id, stock);
  res.json({ success: true, data: product, message: 'Stock mis \u00e0 jour' });
});

export const listCategories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const categories = await productService.listCategories(req.user.id);
  res.json({ success: true, data: categories });
});

export const createCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const category = await productService.createCategory(req.user.id, req.body);
  res
    .status(201)
    .json({ success: true, data: category, message: 'Cat\u00e9gorie cr\u00e9\u00e9e' });
});

export const updateCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const category = await productService.updateCategory(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: category, message: 'Cat\u00e9gorie mise \u00e0 jour' });
});

export const deleteCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const result = await productService.deleteCategory(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

export const getStockAlerts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const alerts = await productService.getStockAlerts(req.user.id);
  res.json({ success: true, data: alerts });
});

export const getProductStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const stats = await productService.getProductStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);

export const exportProducts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const result = await productService.exportProducts(
    req.user.id,
    (req.query.format as string) || 'csv',
    req.query as Record<string, any>
  );
  res.json({ success: true, data: result });
});

export const importProducts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
  const result = await productService.importProducts(req.user.id, req.body.products);
  res.json({ success: true, ...result });
});

export const bulkDeleteProducts = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('IDs requis', 400);
    }
    const result = await productService.bulkDeleteProducts(req.user.id, ids);
    res.json({ success: true, ...result });
  }
);

export const bulkToggleActive = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('IDs requis', 400);
    }
    const result = await productService.bulkToggleActive(req.user.id, ids, isActive);
    res.json({ success: true, ...result });
  }
);

export const bulkUpdateStock = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifi\u00e9', 401);
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Items requis', 400);
    }
    const result = await productService.bulkUpdateStock(req.user.id, items);
    res.json({ success: true, ...result });
  }
);
