import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

// ── Generate Signature Token ──
export async function createSignatureRequest(documentId: string, signerId: string, signerEmail: string, signerName: string) {
  const token = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}_${signerId.slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const request = await prisma.businessDocument.findFirst({
    where: { id: documentId },
  });
  if (!request) throw new AppError('Document non trouvé', 404);

  const signature = await prisma.documentSignature.create({
    data: {
      documentId,
      signerId,
      signerEmail,
      signerName,
      token,
      status: 'PENDING',
      expiresAt,
    },
  });

  logger.info(`Signature request created: ${signature.id} for ${signerEmail}`);
  return { ...signature, signatureLink: `/sign/${token}` };
}

// ── Sign Document ──
export async function signDocument(token: string, signatureData: string, ipAddress?: string) {
  const request = await prisma.documentSignature.findUnique({ where: { token } });
  if (!request) throw new AppError('Lien de signature invalide', 404);
  if (request.status !== 'PENDING') throw new AppError('Document déjà signé ou expiré', 400);
  if (request.expiresAt < new Date()) throw new AppError('Lien de signature expiré', 400);

  const signed = await prisma.documentSignature.update({
    where: { id: request.id },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      signatureData,
      ipAddress: ipAddress || null,
    },
  });

  // Also mark document as signed
  await prisma.businessDocument.update({
    where: { id: request.documentId },
    data: { isSigned: true, signedAt: new Date() } as any,
  });

  logger.info(`Document ${request.documentId} signed by ${request.signerEmail}`);
  return signed;
}

// ── Verify Signature ──
export async function verifySignature(documentId: string) {
  const signatures = await prisma.documentSignature.findMany({
    where: { documentId, status: 'SIGNED' },
    orderBy: { signedAt: 'desc' },
  });

  return {
    isSigned: signatures.length > 0,
    signatures: signatures.map(s => ({
      signerName: s.signerName,
      signerEmail: s.signerEmail,
      signedAt: s.signedAt,
    })),
    signedCount: signatures.length,
  };
}

// ── List Signature Requests ──
export async function listSignatureRequests(ownerId: string, documentId?: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const where: any = {
    document: { businessId: business.id },
  };
  if (documentId) where.documentId = documentId;

  return prisma.documentSignature.findMany({
    where,
    include: {
      document: { select: { title: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
