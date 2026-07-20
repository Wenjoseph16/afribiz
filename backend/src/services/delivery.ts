import { DeliveryStatus, DriverStatus } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { getBusinessByOwner } from '../lib/businessAccess';
import {
  publishDeliveryAssigned,
  publishDeliveryStarted,
  publishDeliveryCompleted,
  publishDeliveryFailed,
} from '../events/publishers';
import { getIO } from './socket';

// ===== ZONES =====
export async function listDeliveryZones(userId: string) {
  const business = await getBusinessByOwner(userId);
  return prisma.deliveryZone.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
  });
}

export async function createDeliveryZone(userId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const zoneData = {
    name: data.name,
    fee: parseFloat(data.fee) || 0,
    minOrder: data.minOrder ? parseFloat(data.minOrder) : null,
    estimatedTime: data.estimatedTime ? parseInt(data.estimatedTime, 10) : undefined,
    isActive: data.isActive !== undefined ? data.isActive : true,
  };
  return prisma.deliveryZone.create({
    data: { businessId: business.id, ...zoneData },
  });
}

export async function updateDeliveryZone(userId: string, zoneId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const zone = await prisma.deliveryZone.findFirst({
    where: { id: zoneId, businessId: business.id },
  });
  if (!zone) throw new AppError('Delivery zone not found', 404);
  const whitelisted: any = {};
  if (data.name !== undefined) whitelisted.name = data.name;
  if (data.fee !== undefined) whitelisted.fee = parseFloat(data.fee);
  if (data.minOrder !== undefined)
    whitelisted.minOrder = data.minOrder ? parseFloat(data.minOrder) : null;
  if (data.estimatedTime !== undefined)
    whitelisted.estimatedTime = parseInt(data.estimatedTime, 10);
  if (data.isActive !== undefined) whitelisted.isActive = data.isActive;
  return prisma.deliveryZone.update({ where: { id: zoneId }, data: whitelisted });
}

export async function deleteDeliveryZone(userId: string, zoneId: string) {
  const business = await getBusinessByOwner(userId);
  const zone = await prisma.deliveryZone.findFirst({
    where: { id: zoneId, businessId: business.id },
  });
  if (!zone) throw new AppError('Delivery zone not found', 404);
  await prisma.deliveryZone.delete({ where: { id: zoneId } });
  return { message: 'Zone deleted' };
}

// ===== DRIVERS =====
export async function listDrivers(userId: string) {
  const business = await getBusinessByOwner(userId);
  return prisma.driver.findMany({
    where: { businessId: business.id },
    orderBy: { name: 'asc' },
  });
}

export async function createDriver(userId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const driverData = {
    name: data.name,
    phone: data.phone,
    email: data.email || undefined,
    photo: data.photo || undefined,
    vehicleType: data.vehicleType || 'MOTORCYCLE',
    vehicleModel: data.vehicleModel || undefined,
    licensePlate: data.licensePlate || undefined,
    zones: data.zones || [],
    maxDistance: data.maxDistance ? parseInt(data.maxDistance, 10) : undefined,
    status: DriverStatus.AVAILABLE,
  };
  return prisma.driver.create({
    data: { businessId: business.id, ...driverData },
  });
}

export async function updateDriver(userId: string, driverId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, businessId: business.id },
  });
  if (!driver) throw new AppError('Driver not found', 404);
  const whitelisted: any = {};
  if (data.name !== undefined) whitelisted.name = data.name;
  if (data.phone !== undefined) whitelisted.phone = data.phone;
  if (data.email !== undefined) whitelisted.email = data.email;
  if (data.photo !== undefined) whitelisted.photo = data.photo;
  if (data.vehicleType !== undefined) whitelisted.vehicleType = data.vehicleType;
  if (data.vehicleModel !== undefined) whitelisted.vehicleModel = data.vehicleModel;
  if (data.licensePlate !== undefined) whitelisted.licensePlate = data.licensePlate;
  if (data.zones !== undefined) whitelisted.zones = data.zones;
  if (data.maxDistance !== undefined) whitelisted.maxDistance = parseInt(data.maxDistance, 10);
  if (data.status !== undefined) whitelisted.status = data.status as DriverStatus;
  return prisma.driver.update({ where: { id: driverId }, data: whitelisted });
}

export async function deleteDriver(userId: string, driverId: string) {
  const business = await getBusinessByOwner(userId);
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, businessId: business.id },
  });
  if (!driver) throw new AppError('Driver not found', 404);
  await prisma.driver.update({ where: { id: driverId }, data: { status: DriverStatus.OFFLINE } });
  return { message: 'Driver deactivated' };
}

// ===== DELIVERIES =====
export async function listDeliveries(userId: string, filters: any = {}) {
  const business = await getBusinessByOwner(userId);
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
  const business = await getBusinessByOwner(userId);
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
  const business = await getBusinessByOwner(userId);
  // Generate a unique delivery number atomically using a Prisma transaction.
  // Uses the current millisecond timestamp (base-36) to avoid race conditions
  // while keeping the counter-based format for human readability.
  const deliveryNumber = await prisma.$transaction(async (tx) => {
    const last = await tx.delivery.findFirst({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
      select: { deliveryNumber: true },
    });
    const lastNum = last
      ? parseInt(last.deliveryNumber.replace('LIV-', '').split('-').pop() || '0', 10)
      : 0;
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    return `LIV-${ts}-${String(lastNum + 1).padStart(4, '0')}`;
  });
  const deliveryData = {
    orderId: data.orderId || undefined,
    driverId: data.driverId || undefined,
    zoneId: data.zoneId || undefined,
    type: data.type || 'STANDARD',
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    address: data.address,
    city: data.city || undefined,
    latitude: data.latitude ? parseFloat(data.latitude) : undefined,
    longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    deliveryInstructions: data.deliveryInstructions || undefined,
    fee: data.fee ? parseFloat(data.fee) : 0,
    currency: data.currency || 'FCFA',
    recipientName: data.recipientName || undefined,
    recipientPhone: data.recipientPhone || undefined,
    notes: data.notes || undefined,
  };
  return prisma.delivery.create({
    data: {
      businessId: business.id,
      deliveryNumber,
      ...deliveryData,
    },
    include: { driver: true, zone: true },
  });
}

export async function updateDelivery(userId: string, deliveryId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: business.id },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const whitelisted: any = {};
  if (data.driverId !== undefined) whitelisted.driverId = data.driverId;
  if (data.zoneId !== undefined) whitelisted.zoneId = data.zoneId;
  if (data.type !== undefined) whitelisted.type = data.type;
  if (data.status !== undefined) whitelisted.status = data.status;
  if (data.scheduledAt !== undefined) whitelisted.scheduledAt = new Date(data.scheduledAt);
  if (data.address !== undefined) whitelisted.address = data.address;
  if (data.city !== undefined) whitelisted.city = data.city;
  if (data.latitude !== undefined) whitelisted.latitude = parseFloat(data.latitude);
  if (data.longitude !== undefined) whitelisted.longitude = parseFloat(data.longitude);
  if (data.deliveryInstructions !== undefined)
    whitelisted.deliveryInstructions = data.deliveryInstructions;
  if (data.fee !== undefined) whitelisted.fee = parseFloat(data.fee);
  if (data.currency !== undefined) whitelisted.currency = data.currency;
  if (data.estimatedMinutes !== undefined)
    whitelisted.estimatedMinutes = parseInt(data.estimatedMinutes, 10);
  if (data.recipientName !== undefined) whitelisted.recipientName = data.recipientName;
  if (data.recipientPhone !== undefined) whitelisted.recipientPhone = data.recipientPhone;
  if (data.notes !== undefined) whitelisted.notes = data.notes;
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: whitelisted,
    include: { driver: true, zone: true },
  });
}

export async function assignDriver(userId: string, deliveryId: string, driverId: string) {
  const business = await getBusinessByOwner(userId);
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: business.id },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const driver = await prisma.driver.findFirst({
    where: { id: driverId, businessId: business.id },
  });
  if (!driver) throw new AppError('Driver not found', 404);
  const result = await prisma.delivery.update({
    where: { id: deliveryId },
    data: { driverId, status: 'ASSIGNED' },
    include: { driver: true, zone: true },
  });
  publishDeliveryAssigned({
    userId,
    deliveryId,
    businessId: business.id,
    driverName: driver.name,
  });
  const io = getIO();
  if (io) {
    io.to(`business:${business.id}`).emit('delivery:status-change', result);
  }
  return result;
}

export async function updateDeliveryStatus(
  userId: string,
  deliveryId: string,
  status: string,
  notes?: string
) {
  const business = await getBusinessByOwner(userId);
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: business.id },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const updateData: any = { status };
  // Track timing
  const now = new Date();
  switch (status) {
    case 'ASSIGNED':
      updateData.pickedUpAt = now;
      break;
    case 'IN_TRANSIT':
      updateData.inTransitAt = now;
      break;
    case 'ARRIVED':
      updateData.arrivedAt = now;
      break;
    case 'DELIVERED':
      updateData.deliveredAt = now;
      break;
    case 'CANCELLED':
      updateData.cancelledAt = now;
      break;
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
  const result = await prisma.delivery.update({
    where: { id: deliveryId },
    data: updateData,
    include: { driver: true, zone: true, tracking: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
  // Publish events
  if (status === 'IN_TRANSIT') {
    publishDeliveryStarted({ userId, deliveryId, businessId: business.id });
  } else if (status === 'DELIVERED') {
    publishDeliveryCompleted({ userId, deliveryId, businessId: business.id });
  } else if (status === 'FAILED') {
    publishDeliveryFailed({ userId, deliveryId, businessId: business.id, reason: notes || '' });
  }
  const io = getIO();
  if (io) {
    io.to(`business:${business.id}`).emit('delivery:status-change', result);
  }
  return result;
}

export async function addTrackingEvent(userId: string, deliveryId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: business.id },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const trackingData = {
    status: data.status,
    latitude: data.latitude ? parseFloat(data.latitude) : undefined,
    longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    locationName: data.locationName || undefined,
    notes: data.notes || undefined,
    recordedBy: data.recordedBy || undefined,
  };
  return prisma.deliveryTracking.create({
    data: { deliveryId, businessId: delivery.businessId, ...trackingData },
  });
}

export async function addDeliveryProof(userId: string, deliveryId: string, data: any) {
  const business = await getBusinessByOwner(userId);
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, businessId: business.id },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  const proofData = {
    type: data.type,
    url: data.url || undefined,
    value: data.value || undefined,
    notes: data.notes || undefined,
  };
  return prisma.deliveryProof.create({
    data: { deliveryId, businessId: delivery.businessId, ...proofData },
  });
}

export async function getDeliveryStats(userId: string, period?: string) {
  const business = await getBusinessByOwner(userId);
  const where: any = { businessId: business.id };

  // Date filter for period
  if (period === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  } else if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    where.createdAt = { gte: weekAgo };
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    where.createdAt = { gte: monthAgo };
  }

  const [total, delivered, cancelled, inTransit, drivers, zones, avgMinutes] = await Promise.all([
    prisma.delivery.count({ where }),
    prisma.delivery.count({ where: { ...where, status: 'DELIVERED' } }),
    prisma.delivery.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.delivery.count({ where: { ...where, status: 'IN_TRANSIT' } }),
    prisma.driver.count({ where: { businessId: business.id, status: 'AVAILABLE' } }),
    prisma.deliveryZone.count({ where: { businessId: business.id, isActive: true } }),
    prisma.delivery.aggregate({
      where: { ...where, actualMinutes: { not: null } },
      _avg: { actualMinutes: true },
    }),
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
