import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';
import * as orderService from '../services/orders';

// ===================== BUSINESS ORDERS =====================

export const listBusinessOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.listBusinessOrders(req.user.id, req.query);
  res.json(successResponse(data));
});

export const getBusinessOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.getBusinessOrder(req.user.id, req.params.id);
  res.json(successResponse(data));
});

export const createBusinessOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.createOrder(req.user.id, req.body);
  res.status(201).json(successResponse(data));
});

export const updateBusinessOrderStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.updateOrderStatus(req.user.id, req.params.id, req.body.status, req.body.reason);
  res.json(successResponse(data));
});

export const updateBusinessDeliveryStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.updateDeliveryStatus(req.user.id, req.params.id, req.body.deliveryStatus, req.body.notes);
  res.json(successResponse(data));
});

export const updateBusinessOrderPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.updateOrderPayment(req.user.id, req.params.id, req.body);
  res.json(successResponse(data));
});

export const deleteBusinessOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  await orderService.deleteOrder(req.user.id, req.params.id);
  res.json(successResponse({ message: 'Commande supprim\u00e9e' }));
});

export const getBusinessOrderStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.getOrderStats(req.user.id);
  res.json(successResponse(data));
});

// ===================== DEBTS =====================

export const listBusinessDebts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.listDebts(req.user.id, req.query);
  res.json(successResponse(data));
});

export const payBusinessDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.payDebt(req.user.id, req.params.id, req.body.amount);
  res.json(successResponse(data));
});

export const settleBusinessDebt = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const data = await orderService.settleDebt(req.user.id, req.params.id);
  res.json(successResponse(data));
});

// ===================== CLIENT ORDERS =====================

export const getMyOrderTimeline = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
    select: {
      id: true, orderNumber: true, status: true, createdAt: true,
      paidAt: true, deliveredAt: true, cancelledAt: true,
    },
  });
  if (!order) { res.status(404).json({ success: false, error: 'Commande introuvable' }); return; }

  const statusFlow = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
  const currentIdx = statusFlow.indexOf(order.status);

  const timeline = [
    {
      status: 'PENDING',
      label: 'Commande pass\u00e9e',
      date: order.createdAt?.toISOString() || null,
      isActive: true,
    },
    {
      status: 'CONFIRMED',
      label: 'Prise en charge',
      date: order.paidAt?.toISOString() || order.createdAt?.toISOString() || null,
      isActive: currentIdx >= statusFlow.indexOf('CONFIRMED'),
    },
    {
      status: 'PREPARING',
      label: 'En pr\u00e9paration',
      date: null,
      isActive: currentIdx >= statusFlow.indexOf('PREPARING'),
    },
    {
      status: 'SHIPPED',
      label: 'En livraison',
      date: null,
      isActive: currentIdx >= statusFlow.indexOf('SHIPPED'),
    },
    {
      status: 'DELIVERED',
      label: 'Livr\u00e9e',
      date: order.deliveredAt?.toISOString() || null,
      isActive: currentIdx >= statusFlow.indexOf('DELIVERED'),
    },
  ];

  if (['CANCELLED', 'REFUNDED'].includes(order.status)) {
    timeline.push({
      status: order.status,
      label: order.status === 'CANCELLED' ? 'Annul\u00e9e' : 'Rembours\u00e9e',
      date: order.cancelledAt?.toISOString() || null,
      isActive: true,
    });
  }

  res.json({
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      timeline,
    },
  });
});

export const getMyOrders = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;
  const where: any = { buyerId: req.user.id };
  if (status) where.status = status as any;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, skip, take: limitNum, orderBy: { createdAt: 'desc' }, include: { items: true, payments: true, business: { select: { name: true, logo: true } } } }),
    prisma.order.count({ where }),
  ]);
  res.json(successResponse({ orders, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } }));
});

export const updateMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
  });
  if (!order) { res.status(404).json({ success: false, error: 'Commande introuvable' }); return; }
  const { clientName, deliveryAddress, contactPhone, notes } = req.body;
  const upd: any = {};
  if (clientName !== undefined) upd.contactName = clientName;
  if (deliveryAddress !== undefined) upd.deliveryAddress = deliveryAddress;
  if (contactPhone !== undefined) upd.contactPhone = contactPhone;
  if (notes !== undefined) upd.notes = notes;
  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: upd,
    include: { items: true, payments: true, debts: true, business: { select: { name: true } } },
  });
  res.json(successResponse({ order: updated }));
});

export const cancelMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
  });
  if (!order) { res.status(404).json({ success: false, error: 'Commande introuvable' }); return; }
  if (['CANCELLED', 'REFUSED', 'REFUNDED', 'DELIVERED', 'COMPLETED'].includes(order.status)) {
    res.status(400).json({ success: false, error: 'Cette commande ne peut plus \u00eatre annul\u00e9e' }); return;
  }
  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: req.body.reason || null },
    include: { items: true, payments: true, debts: true },
  });
  res.json(successResponse({ order: updated, message: 'Commande annul\u00e9e' }));
});

export const getMyOrder = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifi\u00e9' }); return; }
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, buyerId: req.user.id },
    include: {
      items: true,
      payments: true,
      debts: true,
      business: { select: { id: true, name: true, slug: true, logo: true, phone: true, email: true } },
    },
  });
  if (!order) { res.status(404).json({ success: false, error: 'Commande introuvable' }); return; }
  res.json(successResponse({ order }));
});


