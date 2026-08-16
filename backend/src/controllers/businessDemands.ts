import { Response } from 'express';
import { prisma } from '../lib/db';
import { AppError, catchAsyncErrors } from '../middlewares/errorHandler';
import type { AuthenticatedRequest } from '../middlewares/auth';

export const createDemand = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const { moduleType, title, description, budget, currency, deadline, isUrgent } = req.body;
  if (!moduleType || !title) throw new AppError('moduleType et title requis', 400);

  const demand = await prisma.moduleDemand.create({
    data: {
      businessId: business.id,
      moduleType,
      title,
      description,
      budget: budget ? Number(budget) : undefined,
      currency: currency || 'FCFA',
      deadline: deadline ? new Date(deadline) : undefined,
      isUrgent: isUrgent || false,
    },
  });

  res.status(201).json({ success: true, data: demand });
});

export const getMyDemands = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const demands = await (prisma as any).moduleDemand.findMany({
    where: { businessId: business.id },
    include: {
      _count: { select: { matches: true } },
      approvedDeveloper: { select: { id: true, companyName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: demands });
});

export const getDemandMatches = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const { id } = req.params;
    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);

    const demand = await prisma.moduleDemand.findFirst({
      where: { id, businessId: business.id },
    });
    if (!demand) throw new AppError('Demande non trouvée', 404);

    const matches = await prisma.moduleMatch.findMany({
      where: { demandId: id },
      orderBy: { score: 'desc' },
    });

    res.json({ success: true, data: matches });
  }
);

export const approveDeveloper = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const { id, matchId } = req.params;

    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);

    const demand = await prisma.moduleDemand.findFirst({
      where: { id, businessId: business.id },
    });
    if (!demand) throw new AppError('Demande non trouvée', 404);
    if (demand.status !== 'OPEN') throw new AppError("Cette demande n'est plus ouverte", 400);

    const match = await prisma.moduleMatch.findFirst({
      where: { id: matchId, demandId: id },
    });
    if (!match) throw new AppError('Proposition non trouvée', 404);

    // Update demand: set approved developer and change status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).moduleDemand.update({
      where: { id },
      data: { approvedDeveloperId: match.developerId, status: 'IN_PROGRESS' },
    });

    // Reject other pending matches
    await prisma.moduleMatch.updateMany({
      where: { demandId: id, id: { not: matchId }, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });

    // Accept the selected match
    await prisma.moduleMatch.update({
      where: { id: matchId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    // Notify the developer (if via a module, try to get its developer)
    try {
      const developerInfo = match.moduleId
        ? await prisma.developerModule.findUnique({
            where: { id: match.moduleId },
            select: { developer: { select: { userId: true } } },
          })
        : null;
      const notifyUserId = developerInfo?.developer?.userId;
      if (notifyUserId) {
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'SYSTEM' as any,
            title: 'Proposition acceptée',
            description: `Votre proposition pour "${demand.title}" a été acceptée. Vous pouvez maintenant créer le module.`,
            link: `/dashboard/developer/demands/${id}`,
            metadata: { demandId: id, matchId, businessId: business.id },
          },
        });
      }
    } catch {
      /* non-blocking */
    }

    res.json({ success: true, data: { demandId: id, matchId, developerId: match.developerId } });
  }
);
