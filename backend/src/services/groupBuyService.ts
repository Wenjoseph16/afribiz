import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessId(ownerId: string) {
  const b = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b.id;
}

export async function listGroupBuys(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.groupBuy.findMany({
    where: { businessId },
    include: { _count: { select: { participants: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getGroupBuy(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const gb = await prisma.groupBuy.findFirst({
    where: { id, businessId },
    include: { participants: { orderBy: { createdAt: 'desc' } } },
  });
  if (!gb) throw new AppError('Achat groupé non trouvé', 404);
  return gb;
}

export async function createGroupBuy(
  ownerId: string,
  data: {
    title: string;
    description?: string;
    productId?: string;
    targetPrice: number;
    minParticipants: number;
    maxParticipants?: number;
    discountPercent: number;
    endAt?: string;
    whatsappGroup?: string;
  }
) {
  const businessId = await getBusinessId(ownerId);
  return prisma.groupBuy.create({
    data: { businessId, ...data, endAt: data.endAt ? new Date(data.endAt) : null } as any,
  });
}

export async function updateGroupBuy(ownerId: string, id: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.groupBuy.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Achat groupé non trouvé', 404);
  return prisma.groupBuy.update({ where: { id }, data });
}

export async function deleteGroupBuy(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.groupBuy.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Achat groupé non trouvé', 404);
  return prisma.groupBuy.delete({ where: { id } });
}

export async function addParticipant(
  ownerId: string,
  data: {
    groupBuyId: string;
    name: string;
    phone?: string;
    email?: string;
    quantity: number;
    amount: number;
  }
) {
  const businessId = await getBusinessId(ownerId);
  const gb = await prisma.groupBuy.findFirst({ where: { id: data.groupBuyId, businessId } });
  if (!gb) throw new AppError('Achat groupé non trouvé', 404);
  const participant = await prisma.groupBuyParticipant.create({ data: { ...data } as any });
  await prisma.groupBuy.update({
    where: { id: data.groupBuyId },
    data: { currentCount: { increment: 1 } },
  });
  return participant;
}

export async function removeParticipant(ownerId: string, participantId: string) {
  const businessId = await getBusinessId(ownerId);
  const p = await prisma.groupBuyParticipant.findFirst({
    where: { id: participantId, groupBuy: { businessId } },
  });
  if (!p) throw new AppError('Participant non trouvé', 404);
  await prisma.groupBuy.delete({ where: { id: participantId } });
  await prisma.groupBuy.update({
    where: { id: p.groupBuyId },
    data: { currentCount: { decrement: 1 } },
  });
}
