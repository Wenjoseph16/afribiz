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
write('services/menu.ts', `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('MENU')) throw new AppError('Module Menu non activé', 403);
  return business;
}

function generateOrderNumber(): string {
  const d = new Date();
  const ds = \`\${d.getFullYear()}\${String(d.getMonth()+1).padStart(2,'0')}\${String(d.getDate()).padStart(2,'0')}\`;
  return \`CMD-\${ds}-\${String(Math.floor(Math.random()*99999)).padStart(5,'0')}\`;
}

const menuItemInclude = {
  category: true,
  variants: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' as const } },
  _count: { select: { orders: true } },
} satisfies Prisma.MenuItemInclude;

export async function listMenuItems(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, categoryId, status, search, type, isPopular, isStar, featured, sortBy, sortOrder } = filters;
  const where: Prisma.MenuItemWhereInput = { businessId: business.id, deletedAt: null };
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status as any;
  if (type) where.type = type as any;
  if (isPopular !== undefined) where.isPopular = isPopular;
  if (isStar !== undefined) where.isStar = isStar;
  if (featured !== undefined) where.featured = featured;
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { tags: { has: search } }];
  const orderBy: Prisma.MenuItemOrderByWithRelationInput = {};
  if (sortBy === 'price') orderBy.price = (sortOrder as Prisma.SortOrder) || 'asc';
  else if (sortBy === 'name') orderBy.name = (sortOrder as Prisma.SortOrder) || 'asc';
  else if (sortBy === 'sold') orderBy.soldCount = (sortOrder as Prisma.SortOrder) || 'desc';
  else if (sortBy === 'rating') orderBy.rating = (sortOrder as Prisma.SortOrder) || 'desc';
  else orderBy.sortOrder = 'asc';
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({ where, include: menuItemInclude, skip, take: limit, orderBy }),
    prisma.menuItem.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getMenuItem(ownerId: string, itemId: string) {
  const business = await getBusinessByOwner(ownerId);
  const item = await prisma.menuItem.findFirst({
    where: { id: itemId, businessId: business.id, deletedAt: null },
    include: { ...menuItemInclude, stockMovements: { orderBy: { createdAt: 'desc' as const }, take: 10 } },
  });
  if (!item) throw new AppError('Plat non trouvé', 404);
  return item;
}

export async function createMenuItem(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const { variants, ...itemData } = data;
  return prisma.menuItem.create({
    data: {
      ...itemData,
      business: { connect: { id: business.id } },
      images: itemData.images || [],
      tags: itemData.tags || [],
      allergens: itemData.allergens || [],
      variants: variants?.length ? { createMany: { data: variants.map((v: any) => ({ ...v, currency: v.currency || 'FCFA' })) } } : undefined,
      hasVariants: variants?.length > 0 || false,
    },
    include: menuItemInclude,
  });
}

export async function updateMenuItem(ownerId: string, itemId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Plat non trouvé', 404);
  const { variants, ...itemData } = data;
  return prisma.$transaction(async (tx) => {
    if (variants !== undefined) {
      await tx.menuItemVariant.deleteMany({ where: { menuItemId: itemId } });
      if (variants.length > 0) await tx.menuItemVariant.createMany({ data: variants.map((v: any) => ({ menuItemId: itemId, ...v, currency: v.currency || 'FCFA' })) });
    }
    const upd: any = { ...itemData };
    if (upd.images) upd.images = { set: upd.images as string[] };
    if (upd.tags) upd.tags = { set: upd.tags as string[] };
    if (upd.allergens) upd.allergens = { set: upd.allergens as string[] };
    if (variants !== undefined) upd.hasVariants = variants.length > 0;
    return tx.menuItem.update({ where: { id: itemId }, data: upd, include: menuItemInclude });
  });
}

export async function deleteMenuItem(ownerId: string, itemId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Plat non trouvé', 404);
  await prisma.menuItem.update({ where: { id: itemId }, data: { deletedAt: new Date(), isActive: false } });
}

export async function toggleMenuItemActive(ownerId: string, itemId: string) {
  const business = await getBusinessByOwner(ownerId);
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null } });
  if (!item) throw new AppError('Plat non trouvé', 404);
  return prisma.menuItem.update({ where: { id: itemId }, data: { isActive: !item.isActive }, include: menuItemInclude });
}

export async function updateMenuItemStatus(ownerId: string, itemId: string, status: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.menuItem.update({
    where: { id: itemId, businessId: business.id },
    data: { status: status as any, isAvailable: status !== 'OUT_OF_STOCK' && status !== 'DISABLED' },
    include: menuItemInclude,
  });
}

export async function getMenuItemStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id, deletedAt: null };
  const [total, active, outOfStock, popular, star, totalSold, byStatus] = await Promise.all([
    prisma.menuItem.count({ where }),
    prisma.menuItem.count({ where: { ...where, isActive: true } }),
    prisma.menuItem.count({ where: { ...where, status: 'OUT_OF_STOCK' as any } }),
    prisma.menuItem.count({ where: { ...where, isPopular: true } }),
    prisma.menuItem.count({ where: { ...where, isStar: true } }),
    prisma.menuItem.aggregate({ where, _sum: { soldCount: true } }),
    prisma.menuItem.groupBy({ by: ['status'], where, _count: true }),
  ]);
  return { total, active, outOfStock, popular, star, totalSold: totalSold._sum.soldCount || 0, byStatus };
}

// Categories
export async function listCategories(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.menuCategory.findMany({
    where: { businessId: business.id, deletedAt: null },
    include: { _count: { select: { items: true } }, children: { include: { _count: { select: { items: true } } } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createCategory(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuCategory.findUnique({ where: { businessId_name: { businessId: business.id, name: data.name } } });
  if (existing) throw new AppError('Cette catégorie existe déjà', 409);
  const catData: any = { ...data, business: { connect: { id: business.id } } };
  if (data.parentId) catData.parent = { connect: { id: data.parentId } };
  delete catData.parentId;
  return prisma.menuCategory.create({ data: catData, include: { _count: { select: { items: true } }, children: true } });
}

export async function updateCategory(ownerId: string, categoryId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuCategory.findFirst({ where: { id: categoryId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Catégorie non trouvée', 404);
  const upd: any = { ...data };
  if (data.parentId === null) upd.parent = null;
  else if (data.parentId) { if (data.parentId === categoryId) throw new AppError('Auto-référence impossible', 400); upd.parent = { connect: { id: data.parentId } }; }
  delete upd.parentId;
  return prisma.menuCategory.update({ where: { id: categoryId }, data: upd, include: { _count: { select: { items: true } }, children: true } });
}

export async function deleteCategory(ownerId: string, categoryId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuCategory.findFirst({ where: { id: categoryId, businessId: business.id, deletedAt: null }, include: { _count: { select: { items: true } } } });
  if (!existing) throw new AppError('Catégorie non trouvée', 404);
  if (existing._count.items > 0) throw new AppError('Supprimez d\\'abord les plats de cette catégorie', 400);
  await prisma.menuCategory.update({ where: { id: categoryId }, data: { deletedAt: new Date() } });
}

// Orders
const orderInclude = { table: true, items: { include: { menuItem: { select: { name: true, images: true } }, variant: { select: { name: true } } } } } satisfies Prisma.MenuOrderInclude;

export async function listOrders(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, status, type, search, dateFrom, dateTo } = filters;
  const where: Prisma.MenuOrderWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (type) where.type = type as any;
  if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z'); }
  if (search) where.OR = [{ orderNumber: { contains: search, mode: 'insensitive' } }, { customerName: { contains: search, mode: 'insensitive' } }, { customerPhone: { contains: search, mode: 'insensitive' } }];
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.menuOrder.findMany({ where, include: orderInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.menuOrder.count({ where }),
  ]);
  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOrder(ownerId: string, orderId: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.menuOrder.findFirst({ where: { id: orderId, businessId: business.id }, include: orderInclude });
  if (!order) throw new AppError('Commande non trouvée', 404);
  return order;
}

export async function createOrder(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const orderNumber = generateOrderNumber();
  const subtotal = data.items.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = data.deliveryFee || 0;
  const discount = data.discount || 0;
  const total = subtotal + deliveryFee - discount;
  return prisma.$transaction(async (tx) => {
    const order = await tx.menuOrder.create({
      data: {
        orderNumber, business: { connect: { id: business.id } },
        table: data.tableId ? { connect: { id: data.tableId } } : undefined,
        type: data.type || 'DINE_IN', source: data.source || 'MANUAL',
        customerName: data.customerName, customerPhone: data.customerPhone, customerEmail: data.customerEmail,
        deliveryAddress: data.deliveryAddress, notes: data.notes, specialRequests: data.specialRequests,
        paymentMethod: data.paymentMethod, subtotal, deliveryFee, discount, total,
        items: { create: data.items.map((i: any) => ({ menuItemId: i.menuItemId, variantId: i.variantId, name: i.name, variantName: i.variantName, quantity: i.quantity, unitPrice: i.unitPrice, total: i.unitPrice * i.quantity, notes: i.notes })) },
      },
      include: orderInclude,
    });
    if (data.tableId) await tx.restaurantTable.update({ where: { id: data.tableId }, data: { status: 'OCCUPIED' } });
    return order;
  });
}

export async function updateOrderStatus(ownerId: string, orderId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.menuOrder.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouvée', 404);
  const now = new Date();
  const updateData: any = { status: status as any };
  const statusFields: Record<string, string> = { ACCEPTED: 'acceptedAt', PREPARING: 'preparingAt', READY: 'readyAt', DELIVERING: 'deliveringAt', DELIVERED: 'deliveredAt', COMPLETED: 'completedAt', CANCELLED: 'cancelledAt' };
  if (statusFields[status]) updateData[statusFields[status]] = now;
  if (status === 'COMPLETED') { updateData.paymentStatus = 'PAID'; updateData.paidAt = now; }
  if (status === 'CANCELLED') updateData.cancelReason = reason;
  const updated = await prisma.menuOrder.update({ where: { id: orderId }, data: updateData, include: orderInclude });
  if ((status === 'COMPLETED' || status === 'CANCELLED') && order.tableId) {
    await prisma.restaurantTable.update({ where: { id: order.tableId }, data: { status: 'FREE' } });
  }
  return updated;
}

export async function getOrderStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };
  const statuses = ['PENDING','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED'] as const;
  const counts = await Promise.all(statuses.map(s => prisma.menuOrder.count({ where: { ...where, status: s as any } })));
  const [totalRevenue, todayRevenue] = await Promise.all([
    prisma.menuOrder.aggregate({ where: { ...where, status: { in: ['COMPLETED'] as any } }, _sum: { total: true } }),
    prisma.menuOrder.aggregate({ where: { ...where, status: { in: ['COMPLETED'] as any }, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }, _sum: { total: true } }),
  ]);
  const r: any = {}; statuses.forEach((s, i) => r[s.toLowerCase()] = counts[i]);
  r.total = counts.reduce((a,b) => a+b, 0);
  r.totalRevenue = totalRevenue._sum.total || 0;
  r.todayRevenue = todayRevenue._sum.total || 0;
  return r;
}

// Tables
export async function listTables(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.restaurantTable.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { orders: { where: { status: { notIn: ['COMPLETED','CANCELLED'] as any } } } } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createTable(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.restaurantTable.findUnique({ where: { businessId_tableNumber: { businessId: business.id, tableNumber: data.tableNumber } } });
  if (existing) throw new AppError('Ce num\\u00e9ro de table existe d\\u00e9j\\u00e0', 409);
  return prisma.restaurantTable.create({ data: { ...data, business: { connect: { id: business.id } } } });
}

export async function updateTable(ownerId: string, tableId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.restaurantTable.update({ where: { id: tableId, businessId: business.id }, data });
}

export async function deleteTable(ownerId: string, tableId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.restaurantTable.delete({ where: { id: tableId, businessId: business.id } });
}

export async function updateTableStatus(ownerId: string, tableId: string, status: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.restaurantTable.update({ where: { id: tableId, businessId: business.id }, data: { status: status as any } });
}

// Ingredients
export async function listIngredients(ownerId: string, filters: any = {}) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=50, category, search, lowStock } = filters;
  const where: Prisma.IngredientWhereInput = { businessId: business.id, deletedAt: null };
  if (category) where.category = category;
  if (lowStock) where.currentStock = { lte: 0 };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  const skip = (page - 1) * limit;
  const [ingredients, total] = await Promise.all([
    prisma.ingredient.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.ingredient.count({ where }),
  ]);
  return { ingredients, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createIngredient(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.ingredient.create({ data: { ...data, business: { connect: { id: business.id } } } });
}

export async function updateIngredient(ownerId: string, ingredientId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.ingredient.update({ where: { id: ingredientId, businessId: business.id }, data });
}

export async function deleteIngredient(ownerId: string, ingredientId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.ingredient.update({ where: { id: ingredientId, businessId: business.id }, data: { deletedAt: new Date() } });
}

export async function adjustStock(ownerId: string, ingredientId: string, type: string, quantity: number, reason?: string, reference?: string) {
  const business = await getBusinessByOwner(ownerId);
  const ingredient = await prisma.ingredient.findFirst({ where: { id: ingredientId, businessId: business.id, deletedAt: null } });
  if (!ingredient) throw new AppError('Ingr\\u00e9dient non trouv\\u00e9', 404);
  return prisma.$transaction(async (tx) => {
    const newStock = type === 'IN' ? ingredient.currentStock.plus(quantity) : ingredient.currentStock.minus(quantity);
    await tx.ingredient.update({ where: { id: ingredientId }, data: { currentStock: newStock } });
    return tx.kitchenStockMovement.create({ data: { ingredientId, type, quantity, unit: ingredient.unit, reason: reason || null, reference: reference || null } });
  });
}

export async function getIngredientStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id, deletedAt: null };
  const [total, lowStock, byCategory] = await Promise.all([
    prisma.ingredient.count({ where }),
    prisma.ingredient.count({ where: { ...where, currentStock: { lte: 0 } } }),
    prisma.ingredient.groupBy({ by: ['category'], where, _count: true }),
  ]);
  return { total, lowStock, byCategory };
}

// QR Menu
export async function getQrMenuInfo(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.business.findUnique({
    where: { id: business.id },
    select: { id: true, name: true, slug: true, logo: true, type: true, whatsapp: true, phone: true, email: true, address: true, city: true, hours: { orderBy: { day: 'asc' } } },
  });
}
`);

// ===================== CONTROLLER =====================
write('controllers/menu.ts', `import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as menuService from '../services/menu';

export const listMenuItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
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
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.getMenuItem(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const createMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.createMenuItem(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'Plat cr\\u00e9\\u00e9 avec succ\\u00e8s' });
});

export const updateMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateMenuItem(req.user.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Plat mis \\u00e0 jour avec succ\\u00e8s' });
});

export const deleteMenuItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await menuService.deleteMenuItem(req.user.id, req.params.id);
  res.json({ success: true, message: 'Plat supprim\\u00e9 avec succ\\u00e8s' });
});

export const toggleMenuItemActive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.toggleMenuItemActive(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const updateMenuItemStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateMenuItemStatus(req.user.id, req.params.id, req.body.status);
  res.json({ success: true, data, message: 'Statut mis \\u00e0 jour' });
});

export const getMenuItemStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.getMenuItemStats(req.user.id);
  res.json({ success: true, data });
});

// Categories
export const listCategories = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.listCategories(req.user.id);
  res.json({ success: true, data });
});

export const createCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.createCategory(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'Cat\\u00e9gorie cr\\u00e9\\u00e9e' });
});

export const updateCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateCategory(req.user.id, req.params.id, req.body);
  res.json({ success: true, data, message: 'Cat\\u00e9gorie mise \\u00e0 jour' });
});

export const deleteCategory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await menuService.deleteCategory(req.user.id, req.params.id);
  res.json({ success: true, message: 'Cat\\u00e9gorie supprim\\u00e9e' });
});

// Orders
export const listOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const result = await menuService.listOrders(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20,
    status: req.query.status as string, type: req.query.type as string,
    search: req.query.search as string, dateFrom: req.query.dateFrom as string, dateTo: req.query.dateTo as string,
  });
  res.json({ success: true, data: result });
});

export const getOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.getOrder(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const createOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.createOrder(req.user.id, req.body);
  res.status(201).json({ success: true, data, message: 'Commande cr\\u00e9\\u00e9e' });
});

export const updateOrderStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateOrderStatus(req.user.id, req.params.id, req.body.status, req.body.cancelReason);
  res.json({ success: true, data, message: 'Statut mis \\u00e0 jour' });
});

export const getOrderStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.getOrderStats(req.user.id);
  res.json({ success: true, data });
});

// Tables
export const listTables = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.listTables(req.user.id);
  res.json({ success: true, data });
});

export const createTable = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.createTable(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateTable = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateTable(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteTable = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await menuService.deleteTable(req.user.id, req.params.id);
  res.json({ success: true, message: 'Table supprim\\u00e9e' });
});

export const updateTableStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateTableStatus(req.user.id, req.params.id, req.body.status);
  res.json({ success: true, data });
});

// Ingredients
export const listIngredients = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const result = await menuService.listIngredients(req.user.id, {
    page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 50,
    category: req.query.category as string, search: req.query.search as string,
    lowStock: req.query.lowStock === 'true',
  });
  res.json({ success: true, data: result });
});

export const createIngredient = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.createIngredient(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateIngredient = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.updateIngredient(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteIngredient = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  await menuService.deleteIngredient(req.user.id, req.params.id);
  res.json({ success: true, message: 'Ingr\\u00e9dient supprim\\u00e9' });
});

export const adjustStock = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.adjustStock(req.user.id, req.params.id, req.body.type, req.body.quantity, req.body.reason, req.body.reference);
  res.json({ success: true, data, message: 'Stock mis \\u00e0 jour' });
});

export const getIngredientStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.getIngredientStats(req.user.id);
  res.json({ success: true, data });
});

// QR Menu
export const getQrMenuInfo = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' });
  const data = await menuService.getQrMenuInfo(req.user.id);
  res.json({ success: true, data });
});
`);

// ===================== VALIDATORS =====================
write('validators/menu.ts', `import { z } from 'zod';

const menuItemTypes = ['BREAKFAST','LUNCH','DINNER','SNACK','DESSERT','DRINK','COCKTAIL','SPECIAL','EVENT'] as const;
const menuItemStatuses = ['AVAILABLE','OUT_OF_STOCK','DISABLED','PROMO'] as const;
const orderTypes = ['DINE_IN','TAKEAWAY','DELIVERY','ONLINE'] as const;
const orderStatuses = ['PENDING','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED'] as const;
const tableStatuses = ['FREE','RESERVED','OCCUPIED','CLEANING'] as const;
const tableLocations = ['SALLE','TERRASSE','VIP','JARDIN','BAR'] as const;
const ingredientCategories = ['LEGUME','VIANDE','POISSON','EPICE','LAITAGE','BOISSON','AUTRE'] as const;
const variantTypes = ['SIZE','PORTION','FLAVOR','SPICE_LEVEL','SUPPLEMENT'] as const;

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(200),
  shortDescription: z.string().max(200).optional(),
  description: z.string().optional(),
  type: z.enum(menuItemTypes).optional().default('LUNCH'),
  categoryId: z.string().uuid().optional(),
  price: z.number().positive(),
  currency: z.string().default('FCFA'),
  images: z.array(z.string()).optional().default([]),
  video: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  calories: z.number().int().positive().optional(),
  isPromotional: z.boolean().default(false),
  promotionalPrice: z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  promotionEndsAt: z.string().optional(),
  status: z.enum(menuItemStatuses).optional().default('AVAILABLE'),
  isPopular: z.boolean().default(false),
  isStar: z.boolean().default(false),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  hasVariants: z.boolean().default(false),
  variants: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(variantTypes).default('SIZE'),
    price: z.number().positive(),
    currency: z.string().default('FCFA'),
    stock: z.number().int().default(0),
    isAvailable: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const updateMenuItemStatusSchema = z.object({
  status: z.enum(menuItemStatuses),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createOrderSchema = z.object({
  tableId: z.string().uuid().optional(),
  type: z.enum(orderTypes).optional().default('DINE_IN'),
  source: z.string().optional().default('MANUAL'),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  paymentMethod: z.string().optional(),
  deliveryFee: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    name: z.string(),
    variantName: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    notes: z.string().optional(),
  })).min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
  cancelReason: z.string().optional(),
});

export const createTableSchema = z.object({
  tableNumber: z.string().min(1),
  capacity: z.number().int().positive().default(2),
  location: z.enum(tableLocations).optional(),
  status: z.enum(tableStatuses).optional().default('FREE'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateTableSchema = createTableSchema.partial();

export const updateTableStatusSchema = z.object({
  status: z.enum(tableStatuses),
});

export const createIngredientSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  category: z.enum(ingredientCategories).optional(),
  unit: z.string().min(1),
  unitPrice: z.number().positive().optional(),
  currentStock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().positive().optional(),
  threshold: z.number().min(0).default(0),
  alertEnabled: z.boolean().default(true),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export const adjustStockSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'WASTE']),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});
`);

// ===================== ROUTES =====================
write('routes/menu.ts', `import { Router } from 'express';
import {
  listMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem,
  toggleMenuItemActive, updateMenuItemStatus, getMenuItemStats,
  listCategories, createCategory, updateCategory, deleteCategory,
  listOrders, getOrder, createOrder, updateOrderStatus, getOrderStats,
  listTables, createTable, updateTable, deleteTable, updateTableStatus,
  listIngredients, createIngredient, updateIngredient, deleteIngredient, adjustStock, getIngredientStats,
  getQrMenuInfo,
} from '../controllers/menu';
import { validateBody } from '../middlewares/validators';
import {
  createMenuItemSchema, updateMenuItemSchema, updateMenuItemStatusSchema,
  createCategorySchema, updateCategorySchema,
  createOrderSchema, updateOrderStatusSchema,
  createTableSchema, updateTableSchema, updateTableStatusSchema,
  createIngredientSchema, updateIngredientSchema, adjustStockSchema,
} from '../validators/menu';
import { authMiddleware, requireRole } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Menu Items
router.get('/stats', getMenuItemStats);
router.get('/items', listMenuItems);
router.post('/items', validateBody(createMenuItemSchema), createMenuItem);
router.get('/items/:id', getMenuItem);
router.put('/items/:id', validateBody(updateMenuItemSchema), updateMenuItem);
router.delete('/items/:id', deleteMenuItem);
router.patch('/items/:id/toggle', toggleMenuItemActive);
router.patch('/items/:id/status', validateBody(updateMenuItemStatusSchema), updateMenuItemStatus);

// Categories
router.get('/categories', listCategories);
router.post('/categories', validateBody(createCategorySchema), createCategory);
router.put('/categories/:id', validateBody(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders/stats', getOrderStats);
router.get('/orders', listOrders);
router.post('/orders', validateBody(createOrderSchema), createOrder);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', validateBody(updateOrderStatusSchema), updateOrderStatus);

// Tables
router.get('/tables', listTables);
router.post('/tables', validateBody(createTableSchema), createTable);
router.put('/tables/:id', validateBody(updateTableSchema), updateTable);
router.delete('/tables/:id', deleteTable);
router.patch('/tables/:id/status', validateBody(updateTableStatusSchema), updateTableStatus);

// Ingredients & Stock
router.get('/ingredients/stats', getIngredientStats);
router.get('/ingredients', listIngredients);
router.post('/ingredients', validateBody(createIngredientSchema), createIngredient);
router.put('/ingredients/:id', validateBody(updateIngredientSchema), updateIngredient);
router.delete('/ingredients/:id', deleteIngredient);
router.post('/ingredients/:id/stock', validateBody(adjustStockSchema), adjustStock);

// QR Menu
router.get('/qr-menu', getQrMenuInfo);

export default router;
`);

console.log('\\nAll backend files created!');
