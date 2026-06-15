import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishOrderPlaced, publishOrderStatusChanged, publishNewClient, publishPaymentReceived, publishPaymentFailed } from '../events/publishers';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('ORDERS')) throw new AppError('Module Commandes non activ\u00e9', 403);
  return business;
}

function generateOrderNumber(): string {
  const d = new Date();
  return 'CMD-' + d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + '-' + String(Math.floor(Math.random()*99999)).padStart(5,'0');
}

const orderInclude = {
  items: true,
  buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  debts: true,
  deliveryZone: { select: { id: true, name: true, fee: true } },
  payments: true,
} satisfies Prisma.OrderInclude;

// ===================== ORDERS =====================

export async function listBusinessOrders(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const { status, type, source, search, dateFrom, dateTo } = filters;
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
    { contactName: { contains: search, mode: 'insensitive' } },
    { contactPhone: { contains: search, mode: 'insensitive' } },
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
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);
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

  // Validate stock for products (outside transaction, read-only check)
  for (const item of (data.items || [])) {
    if (item.productId) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.stock < item.quantity) {
        throw new AppError('Stock insuffisant pour ' + product.name, 400);
      }
    }
  }

  // Execute stock decrement + order creation + debt creation atomically
  const order = await prisma.$transaction(async (tx) => {
    // Decrement product stock
    for (const item of (data.items || [])) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        businessId: business.id,
        buyerId: data.buyerId || null,
        type: data.type || 'DELIVERY',
        source: data.source || 'WALK_IN',
        status: data.status || 'PENDING',
        contactName: data.customerName || data.contactName || null,
        contactPhone: data.customerPhone || data.contactPhone || null,
        subtotal,
        taxAmount: tax,
        deliveryFee,
        discountAmount: discount,
        totalAmount: total,
        currency: data.currency || business.settings?.currency || 'FCFA',
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        deliveryZoneId: data.deliveryZoneId,
        notes: data.notes,
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
      await tx.debt.create({
        data: {
          orderId: created.id,
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

    return tx.order.findUnique({ where: { id: created.id }, include: orderInclude });
  });

  if (!order) throw new AppError('Failed to retrieve created order', 500);

  publishOrderPlaced({
    userId: order.buyerId || '',
    orderId: order.id,
    businessName: business.name,
    amount: order.totalAmount.toString(),
    businessId: order.businessId || business.id,
  });
  publishNewClient({
    userId: ownerId,
    businessId: order.businessId || business.id,
    clientId: order.buyerId || '',
    clientName: order.contactName || 'Client',
  });

  return order;
}

export async function updateOrderStatus(ownerId: string, orderId: string, status: string, reason?: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);

  const now = new Date();
  const upd: any = { status: status as any };
  switch (status) {
    case 'ACCEPTED': upd.acceptedAt = now; break;
    case 'PREPARING': upd.preparingAt = now; break;
    case 'READY': upd.readyAt = now; break;
    case 'DELIVERED': upd.deliveredAt = now; upd.deliveryStatus = 'DELIVERED'; upd.paymentStatus = 'PAID'; upd.paidAt = now; break;
    case 'COMPLETED': upd.completedAt = now; break;
    case 'REFUSED': upd.refusedAt = now; upd.refuseReason = reason || 'Refus\u00e9e'; break;
    case 'CANCELLED': upd.cancelledAt = now; upd.cancelReason = reason || 'Annul\u00e9e'; break;
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data: upd, include: orderInclude });

  publishOrderStatusChanged({
    userId: order.buyerId || '',
    orderId: order.id,
    status: status.toLowerCase(),
    businessName: business.name,
    businessId: order.businessId || business.id,
  });

  return updated;
}

export async function updateDeliveryStatus(ownerId: string, orderId: string, deliveryStatus: string, notes?: string) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);
  const data: any = { deliveryStatus: deliveryStatus as any };
  if (notes) data.notes = notes;
  return prisma.order.update({ where: { id: orderId }, data, include: orderInclude });
}

export async function updateOrderPayment(ownerId: string, orderId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);
  const upd: any = {};
  if (data.paymentMethod) upd.paymentMethod = data.paymentMethod;
  if (data.paymentStatus) upd.paymentStatus = data.paymentStatus;
  // Order model stores payment status and paidAt; amounts/payments are tracked in Payment records
  if (data.paymentStatus === 'PAID') upd.paidAt = new Date();
  return prisma.order.update({ where: { id: orderId }, data: upd, include: orderInclude });
}

export async function deleteOrder(ownerId: string, orderId: string) {
  const business = await getBusinessByOwner(ownerId);
  // mark as cancelled instead of deleting
  await prisma.order.update({ where: { id: orderId, businessId: business.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
}

export async function getOrderStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id } as any;

  const statuses = ['PENDING','CONFIRMED','PREPARING','SHIPPED','DELIVERED','CANCELLED','REFUNDED'];
  const statusCounts = await Promise.all(
    statuses.map(s => prisma.order.count({ where: { ...where, status: s as any } }))
  );

  const [totalRevenue, todayRevenue, popularType] = await Promise.all([
    prisma.order.aggregate({ where: { ...where, status: { in: ['DELIVERED'] as any } }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({
      where: { ...where, status: { in: ['DELIVERED'] as any }, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
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
    { order: { contactName: { contains: search, mode: 'insensitive' } } },
    { order: { contactPhone: { contains: search, mode: 'insensitive' } } },
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
  if (!debt) throw new AppError('Dette non trouv\u00e9e', 404);

  return prisma.$transaction(async (tx) => {
    const current = await tx.debt.findUnique({ where: { id: debtId } });
    if (!current) throw new AppError('Dette non trouv\u00e9e', 404);

    const newPaid = Number(current.amountPaid) + Number(amount);
    const remaining = Number(current.totalAmount) - newPaid;
    const upd: any = { amountPaid: newPaid, remainingAmount: Math.max(0, remaining) };
    if (remaining <= 0) upd.status = 'SETTLED'; else upd.status = 'PARTIALLY_PAID';

    return tx.debt.update({ where: { id: debtId }, data: upd });
  });
}

export async function settleDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouv\u00e9e', 404);

  return prisma.$transaction(async (tx) => {
    const current = await tx.debt.findUnique({ where: { id: debtId } });
    if (!current) throw new AppError('Dette non trouv\u00e9e', 404);
    return tx.debt.update({
      where: { id: debtId },
      data: { status: 'SETTLED', remainingAmount: 0, amountPaid: current.totalAmount },
    });
  });
}
