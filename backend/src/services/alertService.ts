import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function createAlert(
  userId: string,
  data: {
    type: 'PRICE_DROP' | 'BACK_IN_STOCK' | 'NEW_CONTENT' | 'EVENT_REMINDER';
    referenceId?: string;
    businessId?: string;
    label?: string;
    metadata?: any;
  }
) {
  const existing = await prisma.alert.findUnique({
    where: {
      userId_type_referenceId: { userId, type: data.type, referenceId: data.referenceId ?? '' },
    },
  });
  if (existing) {
    return prisma.alert.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        label: data.label ?? existing.label,
        metadata: data.metadata ?? existing.metadata,
      },
    });
  }
  return prisma.alert.create({
    data: {
      userId,
      type: data.type,
      referenceId: data.referenceId ?? null,
      businessId: data.businessId ?? null,
      label: data.label ?? null,
      metadata: (data.metadata as Prisma.InputJsonValue) ?? Prisma.DbNull,
    },
  });
}

export async function updateAlert(
  userId: string,
  alertId: string,
  data: {
    isActive?: boolean;
    label?: string;
    metadata?: any;
  }
) {
  const alert = await prisma.alert.findFirst({ where: { id: alertId, userId } });
  if (!alert) throw new AppError('Alerte non trouvée', 404);
  const updateData: any = {};
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.label !== undefined) updateData.label = data.label;
  if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.InputJsonValue;
  return prisma.alert.update({ where: { id: alertId }, data: updateData });
}

export async function deleteAlert(userId: string, alertId: string) {
  const alert = await prisma.alert.findFirst({ where: { id: alertId, userId } });
  if (!alert) throw new AppError('Alerte non trouvée', 404);
  await prisma.alert.delete({ where: { id: alertId } });
}

export async function listAlerts(
  userId: string,
  params: { type?: string; isActive?: string; page?: number; limit?: number }
) {
  const where: Prisma.AlertWhereInput = { userId };
  if (params.type) where.type = params.type as any;
  if (params.isActive !== undefined) where.isActive = params.isActive === 'true';
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.alert.count({ where }),
  ]);
  return { alerts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAlert(userId: string, alertId: string) {
  const alert = await prisma.alert.findFirst({ where: { id: alertId, userId } });
  if (!alert) throw new AppError('Alerte non trouvée', 404);
  return alert;
}

export async function triggerAlertsForBackInStock(
  productId: string,
  _productName: string,
  _businessId: string
) {
  const alerts = await prisma.alert.findMany({
    where: { type: 'BACK_IN_STOCK', referenceId: productId, isActive: true },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
  for (const alert of alerts) {
    prisma.alert
      .update({ where: { id: alert.id }, data: { lastTriggeredAt: new Date() } })
      .catch(() => {});
  }
  return alerts;
}

export async function triggerAlertsForPriceDrop(
  productId: string,
  _productName: string,
  _businessId: string,
  _newPrice: number,
  _oldPrice: number
) {
  const alerts = await prisma.alert.findMany({
    where: { type: 'PRICE_DROP', referenceId: productId, isActive: true },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
  });
  for (const alert of alerts) {
    prisma.alert
      .update({ where: { id: alert.id }, data: { lastTriggeredAt: new Date() } })
      .catch(() => {});
  }
  return alerts;
}
