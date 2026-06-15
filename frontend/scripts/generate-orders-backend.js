const fs = require('fs');

// ===== SERVICE =====
const serviceContent = `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('ORDERS')) throw new AppError('Module Commandes non activ\\u00e9', 403);
  return business;
}

function generateOrderNumber(): string {
  const d = new Date();
  return 'CMD-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*99999)).padStart(5,'0');
}

const orderInclude = {
  items: true,
  buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  debt: true,
  deliveryZone: { select: { id: true, name: true, fee: true } },
  payments: true,
} satisfies Prisma.OrderInclude;

// ===================== ORDERS =====================

export async function listBusinessOrders(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, status, type, source, search, dateFrom, dateTo } = filters;
  const where: Prisma.OrderWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (type) where.type = type as any;
  if (source) where.source = source as any;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search) where.OR = [
    { orderNumber: { contains: search, mode: 'insensitive' } },
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerPhone: { contains: search, mode: 'insensitive' } },
  ];
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.order.count({ where }),
  ]);
  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBusinessOrder(ownerId: string, orderId: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId: business.id },
    include: orderInclude,
  });
  if (!order) throw new AppError('Commande non trouv\\u00e9e', 404);
  return order;
}

export async function createOrder(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const orderNumber = generateOrderNumber();

  const subtotal = data.items?.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * item.quantity), 0) || 0;
  const tax = data.tax || 0;
  const deliveryFee = data.deliveryFee || 0;
  const discount = data.discount || 0;
  const total = subtotal + Number(tax) + Number(deliveryFee) - Number(discount);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      businessId: business.id,
      buyerId: data.buyerId || '',
      type: data.type || 'DELIVERY',
      source: data.source || 'PHYSICAL',
      status: data.status || 'PENDING',
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      subtotal,
      tax,
      deliveryFee,
      discount,
      totalAmount: total,
      currency: data.currency || business.settings?.currency || 'FCFA',
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PENDING',
      deliveryAddress: data.deliveryAddress,
      deliveryLat: data.deliveryLat,
      deliveryLng: data.deliveryLng,
      deliveryZoneId: data.deliveryZoneId,
      notes: data.notes,
      specialRequests: data.specialRequests,
      internalNotes: data.internalNotes,
      items: {
        create: (data.items || []).map((item: any) => ({
          productId: item.productId,
          variantId: item.variantId,
          menuItemId: item.menuItemId,
          serviceId: item.serviceId,
          name: item.name,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: Number(item.unitPrice) * item.quantity,
          notes: item.notes,
        })),
      },
    },
    include: orderInclude,
  });

  // Create debt if payment is partial
  if (data.paymentMethod === 'CASH' && data.depositAmount && Number(data.depositAmount) < total) {
    const remaining = total - Number(data.depositAmount);
    await prisma.debt.create({
      data: {
        orderId: order.id,
        businessId: business.id,
        buyerId: data.buyerId,
        totalAmount: remaining,
        remainingAmount: remaining,
        dueDate: data.debtDueDate ? new Date(data.debtDueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        notes: data.debtNotes,
      },
    });
  }

  return prisma.order.findUnique({ where: { id: order.id }, include: orderInclude });
}

export async function updateOrderStatus(ownerId: string, orderId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\\u00e9e', 404);

  const now = new Date();
  const upd: any = { status: status as any };
  switch (status) {
    case 'ACCEPTED': upd.acceptedAt = now; break;
    case 'PREPARING': upd.preparingAt = now; break;
    case 'READY': upd.readyAt = now; break;
    case 'DELIVERED': upd.deliveredAt = now; upd.deliveryStatus = 'DELIVERED'; upd.paymentStatus = 'PAID'; upd.paidAt = now; break;
    case 'COMPLETED': upd.completedAt = now; break;
    case 'REFUSED': upd.refusedAt = now; upd.refuseReason = reason || 'Refus\\u00e9e'; break;
    case 'CANCELLED': upd.cancelledAt = now; upd.cancelReason = reason || 'Annul\\u00e9e'; break;
  }

  return prisma.order.update({ where: { id: orderId }, data: upd, include: orderInclude });
}

export async function updateDeliveryStatus(ownerId: string, orderId: string, deliveryStatus: string, notes?: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\\u00e9e', 404);
  return prisma.order.update({
    where: { id: orderId },
    data: { deliveryStatus: deliveryStatus as any, deliveryNotes: notes || undefined },
    include: orderInclude,
  });
}

export async function updateOrderPayment(ownerId: string, orderId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\\u00e9e', 404);
  const upd: any = {};
  if (data.paymentMethod) upd.paymentMethod = data.paymentMethod;
  if (data.paymentStatus) upd.paymentStatus = data.paymentStatus;
  if (data.paidAmount) upd.paidAmount = data.paidAmount;
  if (data.depositAmount) upd.depositAmount = data.depositAmount;
  if (data.depositPaid !== undefined) upd.depositPaid = data.depositPaid;
  if (data.paymentStatus === 'PAID') upd.paidAt = new Date();
  return prisma.order.update({ where: { id: orderId }, data: upd, include: orderInclude });
}

export async function deleteOrder(ownerId: string, orderId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.order.update({
    where: { id: orderId, businessId: business.id },
    data: { deletedAt: new Date() },
  });
}

export async function getOrderStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id, deletedAt: null };

  const statuses = ['PENDING','CONFIRMED','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','REFUSED','CANCELLED','DISPUTE'];
  const statusCounts = await Promise.all(
    statuses.map(s => prisma.order.count({ where: { ...where, status: s as any } }))
  );

  const [totalRevenue, todayRevenue, popularType] = await Promise.all([
    prisma.order.aggregate({ where: { ...where, status: { in: ['DELIVERED','COMPLETED'] as any } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({
      where: { ...where, status: { in: ['DELIVERED','COMPLETED'] as any }, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({ by: ['type'], where, _count: true, orderBy: { _count: { type: 'desc' } }, take: 1 }),
  ]);

  const r: any = {};
  statuses.forEach((s, i) => r[s.toLowerCase()] = statusCounts[i]);
  r.total = statusCounts.reduce((a,b) => a+b, 0);
  r.totalRevenue = totalRevenue._sum.totalAmount || 0;
  r.todayRevenue = todayRevenue._sum.totalAmount || 0;
  r.mostPopularType = popularType[0]?.type || null;
  return r;
}

// ===================== DEBTS =====================

export async function listDebts(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page=1, limit=20, status, search } = filters;
  const where: Prisma.DebtWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (search) where.OR = [
    { order: { customerName: { contains: search, mode: 'insensitive' } } },
    { order: { customerPhone: { contains: search, mode: 'insensitive' } } },
  ];
  const skip = (page - 1) * limit;
  const [debts, total] = await Promise.all([
    prisma.debt.findMany({
      where,
      include: { order: { include: { items: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.debt.count({ where }),
  ]);
  return { debts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function payDebt(ownerId: string, debtId: string, amount: number) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouv\\u00e9e', 404);
  const newPaid = Number(debt.paidAmount) + Number(amount);
  const remaining = Number(debt.totalAmount) - newPaid;
  const upd: any = {
    paidAmount: newPaid,
    remainingAmount: Math.max(0, remaining),
  };
  if (remaining <= 0) {
    upd.status = 'SETTLED';
    upd.settledAt = new Date();
  } else {
    upd.status = 'PARTIALLY_PAID';
  }
  return prisma.debt.update({ where: { id: debtId }, data: upd });
}

export async function settleDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouv\\u00e9e', 404);
  return prisma.debt.update({
    where: { id: debtId },
    data: { status: 'SETTLED', settledAt: new Date(), remainingAmount: 0, paidAmount: debt.totalAmount },
  });
}
`;

fs.writeFileSync('backend/src/services/orders.ts', serviceContent, 'utf8');
console.log('✅ backend/src/services/orders.ts created');

// ===== CONTROLLER =====
const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as orderService from '../services/orders';

// ===================== BUSINESS ORDERS =====================

export const listBusinessOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.listBusinessOrders(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getBusinessOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.getBusinessOrder(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const createBusinessOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(successResponse(data));
});

export const updateBusinessOrderStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.updateOrderStatus(req.user.id, req.params.id, req.body.status, req.body.reason);
  res.json(successResponse(data));
});

export const updateBusinessDeliveryStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.updateDeliveryStatus(req.user.id, req.params.id, req.body.deliveryStatus, req.body.notes);
  res.json(successResponse(data));
});

export const updateBusinessOrderPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.updateOrderPayment(req.user.id, req.params.id, req.body);
  res.json(successResponse(data));
});

export const deleteBusinessOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  await orderService.deleteOrder(req.user.id, req.params.id);
  res.json(successResponse({ message: 'Commande supprim\\u00e9e' }));
});

export const getBusinessOrderStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.getOrderStats(req.user.id);
  res.json(successResponse(data));
});

// ===================== DEBTS =====================

export const listBusinessDebts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.listDebts(req.user.id, req.query);
  res.json(successResponse(data));
});

export const payBusinessDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.payDebt(req.user.id, req.params.id, req.body.amount);
  res.json(successResponse(data));
});

export const settleBusinessDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const data = await orderService.settleDebt(req.user.id, req.params.id);
  res.json(successResponse(data));
});

// ===================== CLIENT ORDERS =====================

export const getMyOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;
  const where: any = { buyerId: req.user.id, deletedAt: null };
  if (status) where.status = status as any;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true } }),
    prisma.order.count({ where }),
  ]);
  res.json(successResponse({ orders, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } }));
});

export const getMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\\u00e9' }); return; }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id, deletedAt: null },
    include: { items: true, payments: true, debt: true },
  });
  if (!order) { res.status(404).json({ success: false, error: 'Commande introuvable' }); return; }
  res.json(successResponse({ order }));
});
`;

fs.writeFileSync('backend/src/controllers/orders.ts', controllerContent, 'utf8');
console.log('✅ backend/src/controllers/orders.ts created');

// ===== VALIDATORS =====
const validatorContent = `import { z } from 'zod';

export const createOrderSchema = z.object({
  buyerId: z.string().optional(),
  type: z.enum(['DELIVERY','ON_SITE','CLICK_COLLECT','PREORDER','QUICK','CUSTOM']).optional(),
  source: z.enum(['WEB_SITE','DASHBOARD','PHYSICAL','PHONE','WHATSAPP','QR_CODE']).optional(),
  status: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().nullable(),
  tax: z.number().optional(),
  deliveryFee: z.number().optional(),
  discount: z.number().optional(),
  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  deliveryZoneId: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  internalNotes: z.string().optional(),
  depositAmount: z.number().optional(),
  debtDueDate: z.string().optional(),
  debtNotes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    variantId: z.string().optional(),
    menuItemId: z.string().optional(),
    serviceId: z.string().optional(),
    name: z.string(),
    variantName: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    notes: z.string().optional(),
  })).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING','CONFIRMED','ACCEPTED','PREPARING','READY','DELIVERING','DELIVERED','COMPLETED','REFUSED','CANCELLED','DISPUTE']),
  reason: z.string().optional(),
});

export const updateDeliverySchema = z.object({
  deliveryStatus: z.enum(['PENDING','ASSIGNED','IN_TRANSIT','DELAYED','DELIVERED','FAILED']),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  paidAmount: z.number().optional(),
  depositAmount: z.number().optional(),
  depositPaid: z.boolean().optional(),
});

export const payDebtSchema = z.object({
  amount: z.number().positive(),
});
`;

fs.writeFileSync('backend/src/validators/orders.ts', validatorContent, 'utf8');
console.log('✅ backend/src/validators/orders.ts created');

// ===== BUSINESS ROUTES =====
const businessRoutesContent = `import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import {
  listBusinessOrders, getBusinessOrder, createBusinessOrder,
  updateBusinessOrderStatus, updateBusinessDeliveryStatus,
  updateBusinessOrderPayment, deleteBusinessOrder, getBusinessOrderStats,
  listBusinessDebts, payBusinessDebt, settleBusinessDebt,
} from '../controllers/orders';
import {
  createOrderSchema, updateStatusSchema, updateDeliverySchema, updatePaymentSchema, payDebtSchema,
} from '../validators/orders';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

// Orders
router.get('/stats', getBusinessOrderStats);
router.get('/', listBusinessOrders);
router.post('/', validateBody(createOrderSchema), createBusinessOrder);
router.get('/:id', getBusinessOrder);
router.put('/:id/status', validateBody(updateStatusSchema), updateBusinessOrderStatus);
router.put('/:id/delivery', validateBody(updateDeliverySchema), updateBusinessDeliveryStatus);
router.put('/:id/payment', validateBody(updatePaymentSchema), updateBusinessOrderPayment);
router.delete('/:id', deleteBusinessOrder);

// Debts
router.get('/debts/list', listBusinessDebts);
router.post('/debts/:id/pay', validateBody(payDebtSchema), payBusinessDebt);
router.post('/debts/:id/settle', settleBusinessDebt);

export default router;
`;

fs.writeFileSync('backend/src/routes/orders.ts', businessRoutesContent, 'utf8');
console.log('✅ backend/src/routes/orders.ts created (business routes)');

console.log('\\n=== Backend generation complete! ===');
