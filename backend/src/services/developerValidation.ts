import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { DeveloperRepository } from '../repositories/developerRepository';

/**
 * Submit a module for validation
 */
export async function submitForValidation(userId: string, moduleId: string) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const module = await prisma.developerModule.findFirst({
    where: { id: moduleId, developerId: profile.id },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  // Check latest version
  const latestVersion = await prisma.developerModuleVersion.findFirst({
    where: { moduleId },
    orderBy: { createdAt: 'desc' },
  });

  // Create validation record
  const validation = await (prisma as any).moduleValidation.create({
    data: {
      moduleId,
      versionId: latestVersion?.id,
      status: 'PENDING',
      checks: {
        create: [
          { type: 'CODE_QUALITY', status: 'PENDING' },
          { type: 'SECURITY', status: 'PENDING' },
          { type: 'PERFORMANCE', status: 'PENDING' },
          { type: 'DOCUMENTATION', status: 'PENDING' },
          { type: 'COMPATIBILITY', status: 'PENDING' },
          { type: 'MARKETPLACE', status: 'PENDING' },
        ],
      },
    },
    include: { checks: true },
  });

  // Update module status
  await prisma.developerModule.update({
    where: { id: moduleId },
    data: { status: 'PENDING_REVIEW' },
  });

  return validation;
}

/**
 * Approve validation check (admin)
 */
export async function approveValidationCheck(checkId: string, score: number, details?: string) {
  return (prisma as any).validationCheck.update({
    where: { id: checkId },
    data: {
      status: 'COMPLETED',
      score,
      details,
      passed: score >= 70,
      completedAt: new Date(),
    },
  });
}

/**
 * Reject validation check (admin)
 */
export async function rejectValidationCheck(checkId: string, details: string) {
  return (prisma as any).validationCheck.update({
    where: { id: checkId },
    data: {
      status: 'COMPLETED',
      score: 0,
      details,
      passed: false,
      completedAt: new Date(),
    },
  });
}

/**
 * Complete validation review (admin)
 */
export async function completeValidation(
  validationId: string,
  reviewerId: string,
  status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
  notes?: string
) {
  const validation = await (prisma as any).moduleValidation.findUnique({
    where: { id: validationId },
    include: { checks: true },
  });
  if (!validation) throw new AppError('Validation non trouvée', 404);

  const allCompleted = validation.checks.every((c: any) => c.status === 'COMPLETED');
  if (!allCompleted && (status === 'APPROVED' || status === 'REJECTED')) {
    throw new AppError('Tous les checks doivent être complétés', 400);
  }

  const avgScore = validation.checks.length > 0
    ? Math.round(validation.checks.reduce((s: number, c: any) => s + (c.score || 0), 0) / validation.checks.length)
    : 0;

  const updated = await (prisma as any).moduleValidation.update({
    where: { id: validationId },
    data: {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewerNotes: notes,
      score: avgScore,
    },
  });

  // Update module status based on result
  if (status === 'APPROVED') {
    await prisma.developerModule.update({
      where: { id: validation.moduleId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        isVerified: true,
        publishedAt: new Date(),
      },
    });
  } else if (status === 'REJECTED') {
    await prisma.developerModule.update({
      where: { id: validation.moduleId },
      data: { status: 'REJECTED' },
    });
  } else if (status === 'CHANGES_REQUESTED') {
    await prisma.developerModule.update({
      where: { id: validation.moduleId },
      data: { status: 'DRAFT' },
    });
  }

  return updated;
}

/**
 * Get validation status for a module
 */
export async function getModuleValidation(moduleId: string) {
  return (prisma as any).moduleValidation.findFirst({
    where: { moduleId },
    include: {
      checks: true,
      version: { select: { id: true, version: true, changelog: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all validations for review (admin)
 */
export async function getPendingValidations() {
  return (prisma as any).moduleValidation.findMany({
    where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
    include: {
      module: {
        select: {
          id: true, name: true, slug: true, version: true,
          developer: {
            select: {
              id: true, companyName: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      checks: true,
    },
    orderBy: { submittedAt: 'asc' },
  });
}

/**
 * Get validation history for a module
 */
export async function getValidationHistory(moduleId: string) {
  return (prisma as any).moduleValidation.findMany({
    where: { moduleId },
    include: { checks: true },
    orderBy: { createdAt: 'desc' },
  });
}
