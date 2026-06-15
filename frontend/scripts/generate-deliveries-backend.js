const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendDir = 'backend/src';

// ============================================
// SERVICE
// ============================================
const serviceContent = `import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

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
      tracking: { orderBy: { timestamp: 'desc' } },
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
  const deliveryNumber = \`LIV-\${String(count + 1).padStart(6, '0')}\`;
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
    case 'PICKED_UP': updateData.pickedUpAt = now; break;
    case 'IN_TRANSIT': updateData.inTransitAt = now; break;
    case 'ARRIVED': updateData.arrivedAt = now; break;
    case 'DELIVERED': updateData.deliveredAt = now; break;
    case 'CANCELLED': updateData.cancelledAt = now; break;
  }
  // Record tracking
  await prisma.deliveryTracking.create({
    data: {
      deliveryId,
      status,
      location: delivery.address,
      notes,
    },
  });
  return prisma.delivery.update({
    where: { id: deliveryId },
    data: updateData,
    include: { driver: true, zone: true, tracking: { orderBy: { timestamp: 'desc' }, take: 5 } },
  });
}

export async function addTrackingEvent(userId: string, deliveryId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return prisma.deliveryTracking.create({
    data: { deliveryId, ...data },
  });
}

export async function addDeliveryProof(userId: string, deliveryId: string, data: any) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, businessId: business.id } });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return prisma.deliveryProof.create({
    data: { deliveryId, ...data },
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
`;

// ============================================
// CONTROLLER
// ============================================
const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as deliveryService from '../services/delivery';

export const listDeliveryZones = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.listDeliveryZones(req.user.id);
  res.json({ success: true, data: result });
});

export const createDeliveryZone = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.createDeliveryZone(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateDeliveryZone = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.updateDeliveryZone(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const deleteDeliveryZone = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.deleteDeliveryZone(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listDrivers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.listDrivers(req.user.id);
  res.json({ success: true, data: result });
});

export const createDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.createDriver(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.updateDriver(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const deleteDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.deleteDriver(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listDeliveries = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.listDeliveries(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getDelivery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.getDelivery(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const createDelivery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.createDelivery(req.user.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const updateDelivery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.updateDelivery(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: result });
});

export const assignDriver = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { driverId } = req.body;
  const result = await deliveryService.assignDriver(req.user.id, req.params.id, driverId);
  res.json({ success: true, data: result });
});

export const updateDeliveryStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { status, notes } = req.body;
  const result = await deliveryService.updateDeliveryStatus(req.user.id, req.params.id, status, notes);
  res.json({ success: true, data: result });
});

export const addTrackingEvent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.addTrackingEvent(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const addDeliveryProof = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await deliveryService.addDeliveryProof(req.user.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: result });
});

export const getDeliveryStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const period = req.query.period as string | undefined;
  const result = await deliveryService.getDeliveryStats(req.user.id, period);
  res.json({ success: true, data: result });
});
`;

// ============================================
// ROUTES
// ============================================
const routesContent = `import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listDeliveryZones, createDeliveryZone, updateDeliveryZone, deleteDeliveryZone,
  listDrivers, createDriver, updateDriver, deleteDriver,
  listDeliveries, getDelivery, createDelivery, updateDelivery,
  assignDriver, updateDeliveryStatus,
  addTrackingEvent, addDeliveryProof, getDeliveryStats,
} from '../controllers/delivery';

const router = Router();
router.use(authMiddleware);

// Stats (must be before :id routes)
router.get('/stats', getDeliveryStats);

// Zones
router.get('/zones', listDeliveryZones);
router.post('/zones', createDeliveryZone);
router.patch('/zones/:id', updateDeliveryZone);
router.delete('/zones/:id', deleteDeliveryZone);

// Drivers
router.get('/drivers', listDrivers);
router.post('/drivers', createDriver);
router.patch('/drivers/:id', updateDriver);
router.delete('/drivers/:id', deleteDriver);

// Tracking & Proofs (must be before /:id)
router.post('/:id/tracking', addTrackingEvent);
router.post('/:id/proofs', addDeliveryProof);
router.post('/:id/assign', assignDriver);
router.patch('/:id/status', updateDeliveryStatus);

// CRUD deliveries
router.get('/', listDeliveries);
router.post('/', createDelivery);
router.get('/:id', getDelivery);
router.patch('/:id', updateDelivery);
// delete handled via status: CANCELLED

export default router;
`;

// Write files using cat through execSync
const files = [
  { name: 'services/delivery.ts', content: serviceContent },
  { name: 'controllers/delivery.ts', content: controllerContent },
  { name: 'routes/delivery.ts', content: routesContent },
];

for (const file of files) {
  const fullPath = path.join(backendDir, file.name);
  fs.writeFileSync(fullPath, file.content, 'utf-8');
  console.log('✅ Created:', file.name);
}

console.log('\\n🎉 All delivery backend files created!');
