import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('DISPUTES')) {
    throw new AppError('Module Litiges non activé', 403);
  }
  return business;
}

export async function listDisputes(ownerId: string, filters?: any) {
  const business = await getBusinessByOwner(ownerId);
  const where: Prisma.DisputeWhereInput = { businessId: business.id };
  if (filters?.status) where.status = filters.status;
  return prisma.dispute.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDispute(ownerId: string, disputeId: string) {
  const business = await getBusinessByOwner(ownerId);
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);
  return dispute;
}

export async function createDispute(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.dispute.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      reference: data.reference,
      type: data.type || 'OTHER',
      priority: data.priority || 'MEDIUM',
      status: 'OUVERT',
      amount: data.amount ? parseFloat(data.amount) : null,
      relatedEntityId: data.relatedEntityId,
      relatedEntityType: data.relatedEntityType,
    },
  });
}

export async function updateDispute(ownerId: string, disputeId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!existing) throw new AppError('Litige non trouvé', 404);
  const updateData: any = {};
  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'RESOLU' || data.status === 'FERME') {
      updateData.resolvedAt = new Date();
    }
  }
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.reference) updateData.reference = data.reference;
  if (data.type) updateData.type = data.type;
  if (data.priority) updateData.priority = data.priority;
  if (data.amount !== undefined) updateData.amount = parseFloat(data.amount);
  if (data.relatedEntityId) updateData.relatedEntityId = data.relatedEntityId;
  if (data.relatedEntityType) updateData.relatedEntityType = data.relatedEntityType;
  return prisma.dispute.update({
    where: { id: disputeId },
    data: updateData,
  });
}
