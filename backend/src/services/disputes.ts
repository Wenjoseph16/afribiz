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
  if (filters?.type) where.type = filters.type;
  if (filters?.priority) where.priority = filters.priority;
  const page = Math.max(1, parseInt(filters?.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters?.limit) || 20));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dispute.count({ where }),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getDispute(ownerId: string, disputeId: string) {
  const business = await getBusinessByOwner(ownerId);
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);

  // Récupérer les commentaires du litige via le modèle Comment
  const comments = await getDisputeComments(ownerId, disputeId);

  return { ...dispute, comments };
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

export async function deleteDispute(ownerId: string, disputeId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!existing) throw new AppError('Litige non trouvé', 404);
  await prisma.dispute.delete({ where: { id: disputeId } });
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
  if (data.description !== undefined) {
    const { evidence: existingEvidence } = parseEvidenceFromDescription(existing.description);
    if (existingEvidence.length > 0) {
      updateData.description = `${data.description}${EVIDENCE_MARKER}${JSON.stringify(existingEvidence)}`;
    } else {
      updateData.description = data.description;
    }
  }
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

// ============================================
// DISPUTE EVIDENCE (stocké dans la description avec format structuré)
// ============================================

const EVIDENCE_MARKER = '___EVIDENCE___';

function parseEvidenceFromDescription(description: string | null): {
  evidence: any[];
  cleanDescription: string;
} {
  if (!description) return { evidence: [], cleanDescription: '' };
  const markerIdx = description.indexOf(EVIDENCE_MARKER);
  if (markerIdx === -1) return { evidence: [], cleanDescription: description };
  try {
    const jsonPart = description.substring(markerIdx + EVIDENCE_MARKER.length);
    const parsed = JSON.parse(jsonPart);
    const cleanDescription = description.substring(0, markerIdx);
    return { evidence: Array.isArray(parsed) ? parsed : [], cleanDescription };
  } catch {
    return { evidence: [], cleanDescription: description.replace(EVIDENCE_MARKER, '') };
  }
}

export async function addDisputeEvidence(
  ownerId: string,
  disputeId: string,
  evidence: { fileName: string; fileUrl: string; fileType: string; fileSize?: number }
) {
  const business = await getBusinessByOwner(ownerId);
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);

  const { evidence: existingEvidence, cleanDescription } = parseEvidenceFromDescription(
    dispute.description
  );
  const newEvidence = { ...evidence, uploadedAt: new Date().toISOString() };
  const updatedEvidence = [...existingEvidence, newEvidence];

  // Store evidence encoded in the description field
  const newDescription = `${cleanDescription}${EVIDENCE_MARKER}${JSON.stringify(updatedEvidence)}`;

  await prisma.dispute.update({
    where: { id: disputeId },
    data: { description: newDescription },
  });

  return { success: true, evidence: newEvidence };
}

export async function getDisputeEvidence(ownerId: string, disputeId: string) {
  const business = await getBusinessByOwner(ownerId);
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
    select: { description: true },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);
  const { evidence } = parseEvidenceFromDescription(dispute.description);
  return { evidence };
}

export async function deleteDisputeEvidence(ownerId: string, disputeId: string, fileUrl: string) {
  const business = await getBusinessByOwner(ownerId);
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
    select: { description: true },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);

  const { evidence, cleanDescription } = parseEvidenceFromDescription(dispute.description);
  const updatedEvidence = evidence.filter((e: any) => e.fileUrl !== fileUrl);

  const newDescription =
    updatedEvidence.length > 0
      ? `${cleanDescription}${EVIDENCE_MARKER}${JSON.stringify(updatedEvidence)}`
      : cleanDescription;

  await prisma.dispute.update({
    where: { id: disputeId },
    data: { description: newDescription },
  });

  return { success: true };
}

// ============================================
// DISPUTE COMMENTS (Messages via le modèle Comment)
// ============================================

export async function addDisputeComment(ownerId: string, disputeId: string, content: string) {
  const business = await getBusinessByOwner(ownerId);

  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);

  // Utiliser POST comme type avec préfixe 'dispute:' dans referenceId
  // pour éviter les conflits avec les vrais commentaires de posts
  return prisma.comment.create({
    data: {
      userId: ownerId,
      type: 'POST',
      referenceId: `dispute:${disputeId}`,
      content,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
}

export async function getDisputeComments(ownerId: string, disputeId: string) {
  const business = await getBusinessByOwner(ownerId);
  const dispute = await prisma.dispute.findFirst({
    where: { id: disputeId, businessId: business.id },
  });
  if (!dispute) throw new AppError('Litige non trouvé', 404);

  return prisma.comment.findMany({
    where: {
      type: 'POST',
      referenceId: `dispute:${disputeId}`,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
}
