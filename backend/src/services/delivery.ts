import { DeliveryStatus } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

// ===== ZONES =====
export async function listDeliveryZones(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.deliveryZone.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
  });
}

export async function createDeliveryZone(userId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.deliveryZone.create({
    data: { businessId: business.id, ...data },
  });
}

export async function updateDeliveryZone(userId: string, zoneId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const zone = await prisma.deliveryZone.findFirst({ where: { id: zoneId, businessId: business.id } });
  if (!zone) throw new AppError('Delivery zone not found', 404);
  return prisma.deliveryZone.update({ where: { id: zoneId }, data });
}

export async function deleteDeliveryZone(userId: string, zoneId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const zone = await prisma.deliveryZone.findFirst({ where: { id: zoneId, businessId: business.id } });
  if (!zone) throw new AppError('Delivery zone not found', 404);
  await prisma.deliveryZone.delete({ where: { id: zoneId } });
  return { message: 'Zone deleted' };
}

// ===== DRIVERS =====
export async function listDrivers(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.driver.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
  });
}

export async function createDriver(userId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return prisma.driver.create({
    data: { businessId: business.id, ...data },
  });
}

export async function updateDriver(userId: string, driverId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const driver = await prisma.driver.findFirst({ where: { id: driverId, businessId: business.id } });
  if (!driver) throw new AppError('Driver not found', 404);
  return prisma.driver.update({ where: { id: driverId }, data });
}

export async function deleteDriver(userId: string, driverId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const driver = await prisma.driver.findFirst({ where: { id: driverId, businessId: business.id } });
  if (!driver) throw new AppError('Driver not found', 404);
  await prisma.driver.update({ where: { id: driverId }, data: { status: 'OFFLINE' } });
  return { message: 'Driver deactivated' };
}

// ===== DELIVERIES =====
export async function listDeliveries(userId: string, filters: any = {}) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const where: any = { businessId: business.id };
  if (filters.status) where.status = filters.status;
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.zoneId) where.zoneId = filters.zoneId;
  if (filters.search) {
    where.OR = [
      { deliveryNumber: { contains: filters.search } },
      { address: { contains: filters.search } },
    ];
  }
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: { driver: true, zone: true, order: { select: { orderNumber: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.delivery.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getDelivery(userId: string, deliveryId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: business.id },
    include: {
      driver: true,
      zone: true,
      order: { select: { orderNumber: true, status: true } },
      tracking: { orderBy: { createdAt: 'desc' } },
      proofs: true,
    },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return delivery;
}

export async function createDelivery(userId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  // Generate delivery number
  const count = await prisma.delivery.count({ where: { businessId: business.id } });
  const deliveryNumber = `LIV-${String(count + 1).padStart(6, '0')}`;
  return prisma.delivery.create({
    data: {
      businessId: business.id,
      deliveryNumber,
      ...data,
    },
    include: { driver: true, zone: true },
  });
}

export async function updateDelivery(userId: string, deliveryId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return prisma.delivery.update({
    where: { id: deliveryId },
    data,
    include: { driver: true, zone: true },
  });
}

export async function assignDriver(userId: string, deliveryId: string, driverId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const driver = await prisma.driver.findFirst({ where: { id: driverId, businessId: business.id } });
  if (!driver) throw new AppError('Driver not found', 404);
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: { driverId, status: 'ASSIGNED' },
    include: { driver: true, zone: true },
  });
}

export async function updateDeliveryStatus(userId: string, deliveryId: string, status: string, notes?: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const updateData: any = { status };
  // Track timing
  const now = new Date();
  switch (status) {
    case 'ASSIGNED': updateData.pickedUpAt = now; break;
    case 'IN_TRANSIT': updateData.inTransitAt = now; break;
    case 'ARRIVED': updateData.arrivedAt = now; break;
    case 'DELIVERED': updateData.deliveredAt = now; break;
    case 'CANCELLED': updateData.cancelledAt = now; break;
  }
  // Record tracking
  await prisma.deliveryTracking.create({
    data: {
      deliveryId,
      businessId: delivery.businessId,
      status: status as DeliveryStatus,
      locationName: delivery.address,
      notes,
    },
  });
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: updateData,
    include: { driver: true, zone: true, tracking: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
}

export async function addTrackingEvent(userId: string, deliveryId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return prisma.deliveryTracking.create({
    data: { deliveryId, businessId: delivery.businessId, ...data },
  });
}

export async function addDeliveryProof(userId: string, deliveryId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return prisma.deliveryProof.create({
    data: { deliveryId, businessId: delivery.businessId, ...data },
  });
}

export async function getDeliveryStats(userId: string, period?: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const where: any = { businessId: business.id };

  // Date filter for period
  if (period === 'today') {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  } else if (period === 'week') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    where.createdAt = { gte: weekAgo };
  } else if (period === 'month') {
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    where.createdAt = { gte: monthAgo };
  }

  const [total, delivered, cancelled, inTransit, drivers, zones, avgMinutes] = await Promise.all([
    prisma.delivery.count({ where }),
    prisma.delivery.count({ where: { ...where, status: 'DELIVERED' } }),
    prisma.delivery.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.delivery.count({ where: { ...where, status: 'IN_TRANSIT' } }),
    prisma.driver.count({ where: { businessId: business.id, status: 'AVAILABLE' } }),
    prisma.deliveryZone.count({ where: { businessId: business.id, isActive: true } }),
    prisma.delivery.aggregate({ where: { ...where, actualMinutes: { not: null } }, _avg: { actualMinutes: true } }),
  ]);

  return {
    total,
    delivered,
    cancelled,
    inTransit,
    pending: total - delivered - cancelled,
    availableDrivers: drivers,
    activeZones: zones,
    averageMinutes: avgMinutes._avg?.actualMinutes || 0,
    deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
  };
}

// ===== PUBLIC API =====
export async function getPublicDeliveryInfo(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      modules: true,
      deliveryZones: {
        where: { isActive: true },
        select: { name: true, fee: true, minOrder: true, estimatedTime: true },
      },
    },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('DELIVERIES')) {
    return { available: false, zones: [] };
  }
  return { available: true, zones: business.deliveryZones };
}
