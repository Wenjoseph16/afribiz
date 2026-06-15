import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import type { MenuItemCreateInput } from '../types/service';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({ where: { ownerId }, select: { id: true, name: true, modules: true } });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('MENU')) throw new AppError('Module Menu non activé', 403);
  return business;
}

function generateOrderNumber(): string {
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `CMD-${ds}-${String(Math.floor(Math.random()*99999)).padStart(5,'0')}`;
}

const menuItemInclude = { category: true, variants: true } as const;

export async function listMenuItems(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, categoryId, status, search, type, isPopular, isStar, featured, sortBy, sortOrder } = filters;
  const where: Prisma.MenuItemWhereInput = { businessId: business.id };
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status as any;
  if (isPopular !== undefined) where.isPopular = isPopular;
  if (isStar !== undefined) where.isStar = isStar;
  if (featured !== undefined) where.featured = featured;
  if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }, { tags: { has: search } }];
  const orderBy: any = {};
  const sortDir = (sortOrder === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';
  if (sortBy === 'price') orderBy.price = sortDir;
  else if (sortBy === 'name') orderBy.name = sortDir;
  else if (sortBy === 'sold') orderBy.orderCount = 'desc';
  else if (sortBy === 'rating') orderBy.rating = 'desc';
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
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null }, include: menuItemInclude });
  if (!item) throw new AppError('Plat non trouvé', 404);
  return item;
}

export async function createMenuItem(ownerId: string, data: MenuItemCreateInput) {
  const business = await getBusinessByOwner(ownerId);
  const { variants, ...itemData } = data;
  return prisma.$transaction(async (tx) => {
    const created = await tx.menuItem.create({
      data: {
        ...itemData as any,
        businessId: business.id,
        images: itemData.images || [],
        tags: itemData.tags || [],
        allergens: itemData.allergens || [],
        hasVariants: (variants?.length ?? 0) > 0 || false,
      },
    });

    if ((variants?.length ?? 0) > 0) {
      await tx.menuItemVariant.createMany({
        data: variants!.map((v: any) => ({
          menuItemId: created.id,
          name: v.name,
          price: v.price || 0,
          currency: v.currency || 'FCFA',
          isAvailable: v.isAvailable ?? true,
        })),
      });
    }

    return tx.menuItem.findUnique({
      where: { id: created.id },
      include: menuItemInclude,
    });
  });
}

export async function updateMenuItem(ownerId: string, itemId: string, data: Partial<MenuItemCreateInput>) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Plat non trouvé', 404);
  const { variants, ...itemData } = data;
  return prisma.$transaction(async (tx) => {
    if (variants !== undefined) {
      await tx.menuItemVariant.deleteMany({ where: { menuItemId: itemId } });
      const variantList = variants as Array<{ name: string; price: number; currency?: string; isAvailable?: boolean }>;
      if (variantList.length > 0) await tx.menuItemVariant.createMany({ data: variantList.map((v) => ({ menuItemId: itemId, name: v.name, price: v.price || 0, currency: v.currency || 'FCFA', isAvailable: v.isAvailable ?? true })) });
    }
    const upd: any = { ...itemData };
    if (variants !== undefined) upd.hasVariants = (variants as any[]).length > 0;
    return tx.menuItem.update({ where: { id: itemId }, data: upd, include: menuItemInclude });
  });
}

export async function deleteMenuItem(ownerId: string, itemId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Plat non trouvé', 404);
  await prisma.menuItem.update({ where: { id: itemId }, data: { isActive: false } });
}

export async function toggleMenuItemActive(ownerId: string, itemId: string) {
  const business = await getBusinessByOwner(ownerId);
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, businessId: business.id, deletedAt: null } });
  if (!item) throw new AppError('Plat non trouvé', 404);
  return prisma.menuItem.update({ where: { id: itemId }, data: { isActive: !item.isActive }, include: menuItemInclude });
}

export async function updateMenuItemStatus(ownerId: string, itemId: string, status: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.menuItem.update({ where: { id: itemId, businessId: business.id }, data: { status: status as any }, include: menuItemInclude });
}

export async function getMenuItemStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where: Prisma.MenuItemWhereInput = { businessId: business.id };
  const [total, active, outOfStock, popular, star, totalSold, byStatus] = await Promise.all([
    prisma.menuItem.count({ where }),
    prisma.menuItem.count({ where: { ...where, isActive: true } }),
    prisma.menuItem.count({ where: { ...where, status: 'OUT_OF_STOCK' } }),
    prisma.menuItem.count({ where: { ...where, isPopular: true } }),
    prisma.menuItem.count({ where: { ...where, isStar: true } }),
    prisma.menuItem.aggregate({ where, _sum: { orderCount: true } }),
    prisma.menuItem.groupBy({ by: ['status'], where, _count: true }),
  ]);
  return { total, active, outOfStock, popular, star, totalSold: totalSold._sum?.orderCount || 0, byStatus };
}

// Categories
export async function listCategories(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.menuCategory.findMany({ where: { businessId: business.id }, include: { _count: { select: { items: true } }, children: { include: { _count: { select: { items: true } } } } }, orderBy: { name: 'asc' } });
}

export async function createCategory(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuCategory.findUnique({ where: { businessId_name: { businessId: business.id, name: data.name } } });
  if (existing) throw new AppError('Cette catégorie existe déjà', 409);
  const catData: any = { ...data, businessId: business.id };
  if (data.parentId) catData.parentId = data.parentId;
  return prisma.menuCategory.create({ data: catData, include: { _count: { select: { items: true } }, children: true } });
}

export async function updateCategory(ownerId: string, categoryId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuCategory.findFirst({ where: { id: categoryId, businessId: business.id, deletedAt: null } });
  if (!existing) throw new AppError('Catégorie non trouvée', 404);
  const upd: any = { ...data };
  if (data.parentId === null) upd.parentId = null;
  else if (data.parentId) { if (data.parentId === categoryId) throw new AppError('Auto-référence impossible', 400); upd.parentId = data.parentId; }
  return prisma.menuCategory.update({ where: { id: categoryId }, data: upd, include: { _count: { select: { items: true } }, children: true } });
}

export async function deleteCategory(ownerId: string, categoryId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.menuCategory.findFirst({ where: { id: categoryId, businessId: business.id, deletedAt: null }, include: { _count: { select: { items: true } } } });
  if (!existing) throw new AppError('Catégorie non trouvée', 404);
  if (existing._count.items > 0) throw new AppError('Supprimez d\'abord les plats de cette catégorie', 400);
  await prisma.menuCategory.update({ where: { id: categoryId }, data: { deletedAt: new Date() } });
}

// Orders (menu)
const orderInclude = { table: true } as const;

export async function listOrders(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, status, type, search, dateFrom, dateTo } = filters;
  const where: Prisma.MenuOrderWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (dateFrom || dateTo) { const createdFilter: any = {}; if (dateFrom) createdFilter.gte = new Date(dateFrom); if (dateTo) createdFilter.lte = new Date(dateTo + 'T23:59:59Z'); where.createdAt = createdFilter; }
  if (search) where.OR = [{ notes: { contains: search, mode: 'insensitive' } }];
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
  const subtotal = (data.items || []).reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = data.deliveryFee || 0;
  const discount = data.discount || 0;
  const total = subtotal + deliveryFee - discount;
  return prisma.$transaction(async (tx) => {
    const order = await tx.menuOrder.create({
      data: {
        businessId: business.id,
        tableId: data.tableId || null,
        status: data.status || 'PENDING',
        notes: data.notes || null,
        total,
        items: data.items ? JSON.stringify(data.items) : undefined,
      },
      include: orderInclude,
    });
    if (data.tableId) await tx.restaurantTable.update({ where: { id: data.tableId }, data: { isAvailable: false } });
    return order;
  });
}

export async function updateOrderStatus(ownerId: string, orderId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.menuOrder.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouvée', 404);
  const now = new Date();
  const updateData: any = { status: status as any };
  if (status === 'CANCELLED') updateData.notes = (order as any).notes ? `${order.notes}\nCancelled: ${reason || ''}` : `Cancelled: ${reason || ''}`;
  const updated = await prisma.menuOrder.update({ where: { id: orderId }, data: updateData, include: orderInclude });
  if ((status === 'COMPLETED' || status === 'CANCELLED') && (order as any).tableId) {
    await prisma.restaurantTable.update({ where: { id: (order as any).tableId }, data: { isAvailable: true } });
  }
  return updated;
}

export async function getOrderStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id } as any;
  const statuses = ['PENDING','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','CANCELLED'] as const;
  const counts = await Promise.all(statuses.map(s => prisma.menuOrder.count({ where: { ...where, status: s as any } })));
  const [totalRevenue, todayRevenue] = await Promise.all([
    prisma.menuOrder.aggregate({ where: { ...where, status: { in: ['COMPLETED'] as any } }, _sum: { total: true } }),
    prisma.menuOrder.aggregate({ where: { ...where, status: { in: ['COMPLETED'] as any }, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }, _sum: { total: true } }),
  ]);
  const r: any = {}; statuses.forEach((s, i) => r[s.toLowerCase()] = counts[i]);
  r.total = counts.reduce((a,b) => a+b, 0);
  r.totalRevenue = totalRevenue._sum?.total || 0;
  r.todayRevenue = todayRevenue._sum?.total || 0;
  return r;
}

// Tables
export async function listTables(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.restaurantTable.findMany({ where: { businessId: business.id }, orderBy: { number: 'asc' } });
}

export async function createTable(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.restaurantTable.findUnique({ where: { businessId_number: { businessId: business.id, number: data.number } } });
  if (existing) throw new AppError('Ce numéro de table existe déjà', 409);
  return prisma.restaurantTable.create({ data: { ...data, businessId: business.id } });
}

export async function updateTable(ownerId: string, tableId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.restaurantTable.update({ where: { id: tableId }, data });
}

export async function deleteTable(ownerId: string, tableId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.restaurantTable.delete({ where: { id: tableId } });
}

export async function updateTableStatus(ownerId: string, tableId: string, isAvailable: boolean) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.restaurantTable.update({ where: { id: tableId }, data: { isAvailable } });
}

// Ingredients
export async function listIngredients(ownerId: string, filters: any = {}) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=50, search, lowStock } = filters;
  const where: Prisma.IngredientWhereInput = { businessId: business.id };
  if (lowStock) where.stock = { lte: 0 } as any;
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
  return prisma.ingredient.create({ data: { ...data, businessId: business.id } });
}

export async function updateIngredient(ownerId: string, ingredientId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.ingredient.update({ where: { id: ingredientId, businessId: business.id }, data });
}

export async function deleteIngredient(ownerId: string, ingredientId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.ingredient.update({ where: { id: ingredientId, businessId: business.id }, data: { isActive: false } });
}

export async function adjustStock(ownerId: string, ingredientId: string, type: string, quantity: number, reason?: string, reference?: string) {
  const business = await getBusinessByOwner(ownerId);
  const ingredient = await prisma.ingredient.findFirst({ where: { id: ingredientId, businessId: business.id } });
  if (!ingredient) throw new AppError('Ingrédient non trouvé', 404);
  return prisma.$transaction(async (tx) => {
    const current = Number(ingredient.stock || 0);
    const newStock = type === 'IN' ? current + Number(quantity) : current - Number(quantity);
    await tx.ingredient.update({ where: { id: ingredientId }, data: { stock: newStock } });
    return { ingredientId, type, quantity, unit: ingredient.unit, reason: reason || null, reference: reference || null };
  });
}

export async function getIngredientStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id } as any;
  const [total, lowStock, byUnit] = await Promise.all([
    prisma.ingredient.count({ where }),
    prisma.ingredient.count({ where: { ...where, stock: { lte: 0 } } }),
    prisma.ingredient.groupBy({ by: ['unit'], where, _count: true }),
  ]);
  return { total, lowStock, byUnit };
}

export async function getQrMenuInfo(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.business.findUnique({ where: { id: business.id }, select: { id: true, name: true, slug: true, logo: true, type: true, whatsapp: true, phone: true, email: true, address: true, city: true, hours: { orderBy: { day: 'asc' } } } });
}
