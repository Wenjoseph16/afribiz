import { prisma } from '../lib/db';
import { CommentTargetType, ContentReportStatus, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { publishReportCreated, publishReportResolved } from '../events/publishers';

interface CreateReportParams {
  reporterId: string;
  type: CommentTargetType;
  referenceId: string;
  reason: string;
  description?: string;
}

export async function createReport(params: CreateReportParams) {
  const existing = await prisma.contentReport.findFirst({
    where: {
      reporterId: params.reporterId,
      type: params.type,
      referenceId: params.referenceId,
      status: 'PENDING' as ContentReportStatus,
    },
  });
  if (existing) throw new AppError('Vous avez déjà signalé ce contenu', 409);

  const report = await prisma.contentReport.create({
    data: {
      reporterId: params.reporterId,
      type: params.type,
      referenceId: params.referenceId,
      reason: params.reason,
      description: params.description,
    },
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  publishReportCreated({
    userId: params.reporterId,
    reportId: report.id,
    targetType: params.type,
    reason: params.reason,
  });

  return report;
}

export async function getReports(filters: {
  status?: ContentReportStatus;
  type?: CommentTargetType;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: Prisma.ContentReportWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  const [items, total] = await Promise.all([
    prisma.contentReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contentReport.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function resolveReport(
  reportId: string,
  reviewerId: string,
  status: ContentReportStatus
) {
  const report = await prisma.contentReport.update({
    where: { id: reportId },
    data: {
      status,
      reviewedById: reviewerId,
      resolvedAt: new Date(),
    },
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  publishReportResolved({
    userId: report.reporterId,
    reportId: report.id,
    status: report.status,
  });

  return report;
}

export async function getReportById(reportId: string) {
  return prisma.contentReport.findUnique({
    where: { id: reportId },
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function countReportsByStatus() {
  const [pending, reviewed, dismissed, actionTaken] = await Promise.all([
    prisma.contentReport.count({ where: { status: 'PENDING' as ContentReportStatus } }),
    prisma.contentReport.count({ where: { status: 'REVIEWED' as ContentReportStatus } }),
    prisma.contentReport.count({ where: { status: 'DISMISSED' as ContentReportStatus } }),
    prisma.contentReport.count({ where: { status: 'ACTION_TAKEN' as ContentReportStatus } }),
  ]);

  return { pending, reviewed, dismissed, actionTaken };
}
