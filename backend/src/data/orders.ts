/**
 * Orders Data Layer
 * Pure database operations — no business logic, no events
 */
import { prisma } from '../lib/db';

const orderInclude = {
  items: { include: { product: true, variant: true } },
  payments: true,
  escrow: true,
  delivery: true,
  business: { select: { id: true, name: true, slug: true, logo: true } },
  buyer: { select: { id: true, firstName: true, lastName: true, phone: true } },
};

export async function findOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

export async function findOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({ where: { orderNumber }, include: orderInclude });
}

export async function listOrdersByBusiness(
  businessId: string,
  opts?: { status?: string; limit?: number; offset?: number }
) {
  const where: any = { businessId };
  if (opts?.status) where.status = opts.status;
  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: opts?.limit || 50,
    skip: opts?.offset || 0,
  });
}

export async function countOrdersByBusiness(businessId: string, opts?: { status?: string }) {
  const where: any = { businessId };
  if (opts?.status) where.status = opts.status;
  return prisma.order.count({ where });
}

export async function listOrdersByBuyer(
  buyerId: string,
  opts?: { limit?: number; offset?: number }
) {
  return prisma.order.findMany({
    where: { buyerId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: opts?.limit || 50,
    skip: opts?.offset || 0,
  });
}

export async function createOrder(data: any) {
  return prisma.order.create({ data, include: orderInclude });
}

export async function updateOrder(id: string, data: any) {
  return prisma.order.update({ where: { id }, data, include: orderInclude });
}
