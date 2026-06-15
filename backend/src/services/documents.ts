import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('DOCUMENTS')) {
    throw new AppError('Module Documents non activé', 403);
  }
  return business;
}

export async function listDocuments(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.businessDocument.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocument(ownerId: string, documentId: string) {
  const business = await getBusinessByOwner(ownerId);
  const doc = await prisma.businessDocument.findFirst({
    where: { id: documentId, businessId: business.id },
  });
  if (!doc) throw new AppError('Document non trouvé', 404);
  return doc;
}

export async function createDocument(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.businessDocument.create({
    data: {
      businessId: business.id,
      type: data.type || 'AUTRE',
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ? parseInt(data.fileSize, 10) : null,
      mimeType: data.mimeType,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

export async function updateDocument(ownerId: string, documentId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.businessDocument.findFirst({
    where: { id: documentId, businessId: business.id },
  });
  if (!existing) throw new AppError('Document non trouvé', 404);
  return prisma.businessDocument.update({
    where: { id: documentId },
    data: {
      type: data.type,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ? parseInt(data.fileSize, 10) : null,
      mimeType: data.mimeType,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

export async function deleteDocument(ownerId: string, documentId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.businessDocument.deleteMany({
    where: { id: documentId, businessId: business.id },
  });
  return { message: 'Document supprimé' };
}
