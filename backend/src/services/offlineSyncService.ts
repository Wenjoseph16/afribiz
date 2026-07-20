import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function listSyncItems(ownerId: string, status?: string) {
  const where: any = { userId: ownerId };
  if (status) where.status = status;
  return prisma.offlineSyncQueue.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createSyncItem(data: {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  payload: any;
}) {
  return prisma.offlineSyncQueue.create({ data: { ...data, status: 'PENDING' } as any });
}

export async function processSyncItem(id: string) {
  const item = await prisma.offlineSyncQueue.findUnique({ where: { id } });
  if (!item) throw new AppError('Élément de synchronisation non trouvé', 404);
  return prisma.offlineSyncQueue.update({
    where: { id },
    data: { status: 'SYNCED', syncedAt: new Date() },
  });
}

export async function getPendingSyncCount(userId: string) {
  return prisma.offlineSyncQueue.count({ where: { userId, status: 'PENDING' } });
}

export async function bulkSync(
  userId: string,
  items: { entityType: string; entityId: string; action: string; payload: any }[]
) {
  const created = await prisma.offlineSyncQueue.createMany({
    data: items.map((i) => ({ userId, ...i, status: 'PENDING' })),
  });
  return { synced: created.count };
}
