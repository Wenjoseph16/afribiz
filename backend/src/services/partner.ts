import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessId(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

// ===================== PARTNERS =====================

export async function listPartners(ownerId: string, params?: {
  category?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerWhereInput = { businessId };

  if (params?.category) where.category = params.category as any;
  if (params?.isActive !== undefined) where.isActive = params.isActive;
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { description: { contains: params.search, mode: 'insensitive' } },
      { specialite: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      include: {
        _count: { select: { contracts: true, transactions: true, assignments: true, reviews: true } },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.partner.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getPartner(ownerId: string, partnerId: string) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partner.findFirst({
    where: { id: partnerId, businessId },
    include: {
      contracts: { orderBy: { createdAt: 'desc' } },
      transactions: { orderBy: { createdAt: 'desc' } },
      assignments: { orderBy: { createdAt: 'desc' } },
      reviews: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      permissions: true,
    },
  });
}

export async function createPartner(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partner.create({
    data: { ...data, businessId },
  });
}

export async function updatePartner(ownerId: string, partnerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partner.findFirst({ where: { id: partnerId, businessId } });
  if (!existing) throw new AppError('Partenaire non trouvé', 404);
  return prisma.partner.update({ where: { id: partnerId }, data });
}

export async function deletePartner(ownerId: string, partnerId: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partner.findFirst({ where: { id: partnerId, businessId } });
  if (!existing) throw new AppError('Partenaire non trouvé', 404);
  return prisma.partner.update({ where: { id: partnerId }, data: { isActive: false } });
}

export async function getPartnerStats(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const [total, active, withContracts, totalRevenue, totalScore] = await Promise.all([
    prisma.partner.count({ where: { businessId } }),
    prisma.partner.count({ where: { businessId, isActive: true } }),
    prisma.partnerContract.count({ where: { businessId } }),
    prisma.partnerTransaction.aggregate({
      where: { businessId, type: 'PAIEMENT', status: 'EFFECTUE' },
      _sum: { amount: true },
    }),
    prisma.partner.aggregate({
      where: { businessId, isActive: true },
      _avg: { score: true },
    }),
  ]);

  const collaborations = await prisma.partnerAssignment.count({ where: { businessId } });
  const verified = await prisma.partner.count({ where: { businessId, verifiedAt: { not: null } } });

  return {
    total,
    actif: active,
    collaborations,
    contratsActifs: withContracts,
    revenusGeneres: totalRevenue._sum.amount || 0,
    scoreMoyen: Math.round(totalScore._avg.score || 0),
    partenairesVerifies: verified,
  };
}

export async function getPublicPartners(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return prisma.partner.findMany({
    where: { businessId: business.id, isActive: true },
    select: {
      id: true,
      name: true,
      logo: true,
      description: true,
      category: true,
      specialite: true,
      website: true,
      phone: true,
      email: true,
    },
    orderBy: { sortOrder: 'asc' },
  });
}

// ===================== CONTRACTS =====================

export async function listContracts(ownerId: string, partnerId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerContractWhereInput = { businessId };
  if (partnerId) where.partnerId = partnerId;
  return prisma.partnerContract.findMany({
    where,
    include: { partner: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createContract(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partnerContract.create({
    data: { ...data, businessId },
  });
}

export async function updateContract(ownerId: string, contractId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partnerContract.findFirst({ where: { id: contractId, businessId } });
  if (!existing) throw new AppError('Contrat non trouvé', 404);
  return prisma.partnerContract.update({ where: { id: contractId }, data });
}

export async function signContract(ownerId: string, contractId: string, byBusiness: boolean) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partnerContract.findFirst({ where: { id: contractId, businessId } });
  if (!existing) throw new AppError('Contrat non trouvé', 404);
  const updateData: any = { signedAt: new Date() };
  if (byBusiness) updateData.signedByBusiness = true;
  else updateData.signedByPartner = true;
  return prisma.partnerContract.update({ where: { id: contractId }, data: updateData });
}

// ===================== TRANSACTIONS =====================

export async function listTransactions(ownerId: string, partnerId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerTransactionWhereInput = { businessId };
  if (partnerId) where.partnerId = partnerId;
  return prisma.partnerTransaction.findMany({
    where,
    include: { partner: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTransaction(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partnerTransaction.create({
    data: { ...data, businessId },
  });
}

// ===================== ASSIGNMENTS =====================

export async function listAssignments(ownerId: string, partnerId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerAssignmentWhereInput = { businessId };
  if (partnerId) where.partnerId = partnerId;
  return prisma.partnerAssignment.findMany({
    where,
    include: { partner: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAssignment(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partnerAssignment.create({
    data: { ...data, businessId },
  });
}

export async function updateAssignment(ownerId: string, assignmentId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partnerAssignment.findFirst({ where: { id: assignmentId, businessId } });
  if (!existing) throw new AppError('Assignation non trouvée', 404);
  return prisma.partnerAssignment.update({ where: { id: assignmentId }, data });
}

// ===================== REVIEWS =====================

export async function listReviews(ownerId: string, partnerId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerReviewWhereInput = { businessId };
  if (partnerId) where.partnerId = partnerId;
  return prisma.partnerReview.findMany({
    where,
    include: { partner: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createReview(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const review = await prisma.partnerReview.create({
    data: { ...data, businessId },
  });

  // Recalculate partner score
  const partnerId = data.partnerId;
  const agg = await prisma.partnerReview.aggregate({
    where: { partnerId, businessId },
    _avg: { rating: true },
  });
  const avgRating = agg._avg.rating || 0;
  await prisma.partner.update({
    where: { id: partnerId },
    data: { score: Math.round(avgRating * 20) }, // 5 stars -> 100
  });

  return review;
}

// ===================== DOCUMENTS =====================

export async function listDocuments(ownerId: string, partnerId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerDocumentWhereInput = { businessId };
  if (partnerId) where.partnerId = partnerId;
  return prisma.partnerDocument.findMany({
    where,
    include: { partner: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createDocument(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partnerDocument.create({
    data: { ...data, businessId },
  });
}

export async function deleteDocument(ownerId: string, documentId: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partnerDocument.findFirst({ where: { id: documentId, businessId } });
  if (!existing) throw new AppError('Document non trouvé', 404);
  return prisma.partnerDocument.delete({ where: { id: documentId } });
}

// ===================== PERMISSIONS =====================

export async function listPermissions(ownerId: string, partnerId?: string) {
  const businessId = await getBusinessId(ownerId);
  const where: Prisma.PartnerPermissionWhereInput = { businessId };
  if (partnerId) where.partnerId = partnerId;
  return prisma.partnerPermission.findMany({
    where,
    include: { partner: { select: { id: true, name: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createPermission(ownerId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  return prisma.partnerPermission.create({
    data: { ...data, businessId },
  });
}

export async function updatePermission(ownerId: string, permissionId: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partnerPermission.findFirst({ where: { id: permissionId, businessId } });
  if (!existing) throw new AppError('Permission non trouvée', 404);
  return prisma.partnerPermission.update({ where: { id: permissionId }, data });
}

export async function deletePermission(ownerId: string, permissionId: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.partnerPermission.findFirst({ where: { id: permissionId, businessId } });
  if (!existing) throw new AppError('Permission non trouvée', 404);
  return prisma.partnerPermission.delete({ where: { id: permissionId } });
}

// ===================== ANALYTICS =====================

export async function getPartnerAnalytics(ownerId: string) {
  const businessId = await getBusinessId(ownerId);

  const topPartners = await prisma.partner.findMany({
    where: { businessId, isActive: true },
    orderBy: { score: 'desc' },
    take: 10,
    select: {
      id: true, name: true, logo: true, score: true, category: true,
      _count: { select: { transactions: true, assignments: true } },
    },
  });

  const byCategory = await prisma.partner.groupBy({
    by: ['category'],
    where: { businessId },
    _count: true,
    _avg: { score: true },
  });

  const recentTransactions = await prisma.partnerTransaction.findMany({
    where: { businessId },
    include: { partner: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const pendingContracts = await prisma.partnerContract.count({
    where: { businessId, status: 'ACTIF', endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
  });

  return {
    topPartners,
    byCategory,
    recentTransactions,
    contratsExpirant: pendingContracts,
  };
}
