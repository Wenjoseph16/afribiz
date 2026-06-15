import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusiness(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return business;
}

export async function listDocuments(userId: string, filters: any = {}) {
  const business = await getBusiness(userId);
  const where: any = { businessId: business.id, deletedAt: null };
  if (filters.search) where.title = { contains: filters.search };
  if (filters.type && filters.type !== 'TOUS') where.type = filters.type;
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 50;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.businessDocument.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.businessDocument.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function getDocument(userId: string, docId: string) {
  const business = await getBusiness(userId);
  const doc = await prisma.businessDocument.findFirst({
    where: { id: docId, businessId: business.id, deletedAt: null },
    include: { DocumentSignature: { orderBy: { createdAt: 'desc' } } },
  });
  if (!doc) throw new AppError('Document not found', 404);
  return doc;
}

export async function createDocument(userId: string, data: any) {
  const business = await getBusiness(userId);
  return prisma.businessDocument.create({
    data: {
      businessId: business.id,
      title: data.title,
      type: data.type || 'AUTRE',
      description: data.description,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ? parseInt(data.fileSize) : null,
      mimeType: data.mimeType,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

export async function updateDocument(userId: string, docId: string, data: any) {
  const business = await getBusiness(userId);
  const existing = await prisma.businessDocument.findFirst({
    where: { id: docId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Document not found', 404);
  return prisma.businessDocument.update({
    where: { id: docId },
    data: {
      title: data.title,
      type: data.type,
      description: data.description,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ? parseInt(data.fileSize) : undefined,
      mimeType: data.mimeType,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
}

export async function deleteDocument(userId: string, docId: string) {
  const business = await getBusiness(userId);
  const existing = await prisma.businessDocument.findFirst({
    where: { id: docId, businessId: business.id, deletedAt: null },
  });
  if (!existing) throw new AppError('Document not found', 404);
  await prisma.businessDocument.update({
    where: { id: docId },
    data: { deletedAt: new Date() },
  });
  return { success: true };
}

export async function getDocumentStats(userId: string) {
  const business = await getBusiness(userId);
  const docs = await prisma.businessDocument.findMany({
    where: { businessId: business.id, deletedAt: null },
  });
  return {
    total: docs.length,
    contracts: docs.filter((d) => d.type === 'CONTRAT').length,
    factures: docs.filter((d) => d.type === 'FACTURE').length,
    certifications: docs.filter((d) => d.type === 'CERTIFICATION').length,
    expired: docs.filter((d) => d.expiresAt && d.expiresAt < new Date()).length,
  };
}
