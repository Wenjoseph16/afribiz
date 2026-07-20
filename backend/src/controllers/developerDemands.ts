import { Response } from 'express';
import { prisma } from '../lib/db';
import { AppError, catchAsyncErrors } from '../middlewares/errorHandler';
import type { AuthenticatedRequest } from '../middlewares/auth';

export const getOpenDemands = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { moduleType, search } = req.query;

  const where: any = { status: 'OPEN' };
  if (moduleType) where.moduleType = moduleType;
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const demands = await prisma.moduleDemand.findMany({
    where,
    include: {
      _count: { select: { matches: true } },
    },
    orderBy: [{ isUrgent: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({ success: true, data: demands });
});

export const getMyMatchedDemands = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const profile = await prisma.developerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!profile) throw new AppError('Profil développeur non trouvé', 404);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matches = await (prisma as any).moduleMatch.findMany({
      where: { developerId: profile.id },
      include: {
        demand: {
          include: {
            business: { select: { id: true, name: true, city: true, country: true } },
            approvedDeveloper: { select: { id: true, companyName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: matches });
  }
);

export const getDeveloperDemandById = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const { id } = req.params;
    const profile = await prisma.developerProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!profile) throw new AppError('Profil développeur non trouvé', 404);

    // First try via an approved match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const demand = await (prisma as any).moduleDemand.findFirst({
      where: {
        id,
        OR: [{ status: 'OPEN' }, { approvedDeveloperId: profile.id }],
      },
      include: {
        business: { select: { id: true, name: true, city: true, country: true } },
        approvedDeveloper: { select: { id: true, companyName: true } },
        _count: { select: { matches: true } },
      },
    });
    if (!demand) throw new AppError('Demande non trouvée', 404);

    res.json({ success: true, data: demand });
  }
);

export const applyToDemand = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const { id } = req.params;
  const { moduleId, proposalType } = req.body;
  const type = proposalType || 'EXISTING';

  if (type === 'EXISTING' && !moduleId)
    throw new AppError('moduleId requis pour une proposition de module existant', 400);

  const profile = await prisma.developerProfile.findUnique({
    where: { userId: req.user.id },
  });
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const demand = await prisma.moduleDemand.findUnique({ where: { id } });
  if (!demand) throw new AppError('Demande non trouvée', 404);
  if (demand.status !== 'OPEN') throw new AppError("Cette demande n'est plus ouverte", 400);

  const existing = await prisma.moduleMatch.findFirst({
    where: { demandId: id, developerId: profile.id },
  });
  if (existing) throw new AppError('Vous avez déjà postulé à cette demande', 409);

  let score = 50;
  let matchReasons: string[] = [];
  let modName = 'Module sur mesure';

  if (type === 'EXISTING' && moduleId) {
    const mod = await prisma.developerModule.findFirst({
      where: { id: moduleId, developerId: profile.id },
    });
    if (!mod) throw new AppError('Module non trouvé ou non autorisé', 404);

    modName = mod.name;
    score = calculateScore(demand, mod);
    matchReasons = [
      demand.moduleType === mod.category ? 'Catégorie correspondante' : '',
      mod.isVerified ? 'Module vérifié' : '',
      mod.isFeatured ? 'Module en vedette' : '',
      Number(mod.price) === 0 ? 'Module gratuit' : '',
    ].filter(Boolean);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = await (prisma as any).moduleMatch.create({
      data: {
        demandId: id,
        developerId: profile.id,
        moduleId: mod.id,
        proposalType: 'EXISTING',
        score,
        matchReasons,
        status: 'PENDING',
      },
    });

    // Notify
    try {
      const business = await prisma.business.findUnique({
        where: { id: demand.businessId },
        select: { ownerId: true },
      });
      if (business) {
        await prisma.notification.create({
          data: {
            userId: business.ownerId,
            type: 'SYSTEM' as any,
            title: 'Nouvelle proposition',
            description: `${profile.companyName} a proposé son module "${modName}" pour "${demand.title}".`,
            link: `/dashboard/business/modules/demands/${id}`,
            metadata: {
              demandId: id,
              moduleId: mod.id,
              developerId: profile.id,
              matchId: match.id,
              proposalType: 'EXISTING',
            },
          },
        });
      }
    } catch {
      /* non-blocking */
    }

    return res.status(201).json({ success: true, data: match });
  }

  // CUSTOM_BUILD
  matchReasons = ['Proposition de développement sur mesure'];
  score = Math.max(score, 60);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = await (prisma as any).moduleMatch.create({
    data: {
      demandId: id,
      developerId: profile.id,
      moduleId: null,
      proposalType: 'CUSTOM_BUILD',
      score,
      matchReasons,
      status: 'PENDING',
    },
  });

  // Notify
  try {
    const business = await prisma.business.findUnique({
      where: { id: demand.businessId },
      select: { ownerId: true },
    });
    if (business) {
      await prisma.notification.create({
        data: {
          userId: business.ownerId,
          type: 'SYSTEM' as any,
          title: 'Nouvelle proposition sur mesure',
          description: `${profile.companyName} propose de développer un module sur mesure pour "${demand.title}".`,
          link: `/dashboard/business/modules/demands/${id}`,
          metadata: {
            demandId: id,
            developerId: profile.id,
            matchId: match.id,
            proposalType: 'CUSTOM_BUILD',
          },
        },
      });
    }
  } catch {
    /* non-blocking */
  }

  res.status(201).json({ success: true, data: match });
});

function calculateScore(
  demand: { moduleType: string },
  mod: { category: string | null; isVerified: boolean; isFeatured: boolean; price: any }
): number {
  let score = 50;
  if (demand.moduleType === mod.category) score += 25;
  if (mod.isVerified) score += 10;
  if (mod.isFeatured) score += 10;
  if (Number(mod.price) === 0) score += 5;
  return Math.min(score, 100);
}
