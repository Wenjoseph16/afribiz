import { prisma } from '../lib/db';

export class ModuleDemandService {
  static async create(data: {
    businessId: string;
    moduleType: string;
    title: string;
    description?: string;
    budget?: number;
    currency?: string;
    deadline?: Date;
    isUrgent?: boolean;
  }) {
    return prisma.moduleDemand.create({ data: data as any });
  }

  static async findById(id: string) {
    return prisma.moduleDemand.findUnique({
      where: { id },
      include: { matches: { orderBy: { score: 'desc' } } },
    });
  }

  static async findAll(filters?: {
    businessId?: string;
    moduleType?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters?.businessId) where.businessId = filters.businessId;
    if (filters?.moduleType) where.moduleType = filters.moduleType;
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }
    return prisma.moduleDemand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { matches: true } } },
    });
  }

  static async updateStatus(id: string, status: string) {
    return prisma.moduleDemand.update({ where: { id }, data: { status: status as any } });
  }

  static async delete(id: string) {
    await prisma.moduleDemand.delete({ where: { id } });
    return { message: 'Demande supprimee' };
  }

  static async findMatches(demandId: string) {
    const demand = await prisma.moduleDemand.findUnique({ where: { id: demandId } });
    if (!demand) throw new Error('Demande introuvable');

    const modules = await prisma.developerModule.findMany({
      where: {
        isPublished: true,
        isActive: true,
        OR: [
          { category: { equals: demand.moduleType as string, mode: 'insensitive' } },
          { tags: { has: demand.moduleType as string } },
        ],
      },
      include: { developer: true },
    });

    const matches = [];
    for (const mod of modules) {
      const score = ModuleDemandService.calculateMatchScore(demand, mod);
      if (score > 0) {
        matches.push({ module: mod, developer: mod.developer, score });
      }
    }

    matches.sort((a: any, b: any) => b.score - a.score);
    return matches.slice(0, 10);
  }

  static calculateMatchScore(demand: any, mod: any): number {
    let score = 50; // Base score
    if (mod.category?.toLowerCase() === demand.moduleType?.toLowerCase()) score += 25;
    if (mod.tags?.includes(demand.moduleType)) score += 15;
    if (mod.isVerified) score += 10;
    if (mod.isFeatured) score += 10;
    if (mod.isFree) score += 10;
    if (mod.price && demand.budget && Number(mod.price) <= Number(demand.budget)) score += 10;
    if (mod.developer?.skills?.includes(demand.moduleType)) score += 5;
    return Math.min(100, score);
  }

  static async autoMatch(demandId: string) {
    const demand = await prisma.moduleDemand.findUnique({ where: { id: demandId } });
    if (!demand) throw new Error('Demande introuvable');

    const matches = await ModuleDemandService.findMatches(demandId);
    const created = [];

    for (const match of matches) {
      const existing = await prisma.moduleMatch.findFirst({
        where: { demandId, moduleId: match.module.id },
      });
      if (!existing) {
        const createdMatch = await prisma.moduleMatch.create({
          data: {
            demandId,
            developerId: match.developer?.id,
            moduleId: match.module.id,
            score: match.score,
            matchReasons: ModuleDemandService.getMatchReasons(demand, match.module),
            status: 'PENDING' as any,
          },
        });
        created.push(createdMatch);
      }
    }

    // Log search
    await prisma.demandSearchLog.create({
      data: { demandId, query: String(demand.moduleType), resultCount: created.length },
    });

    return created;
  }

  private static getMatchReasons(demand: any, mod: any): string[] {
    const reasons: string[] = [];
    if (mod.category?.toLowerCase() === demand.moduleType?.toLowerCase())
      reasons.push('Categorie correspondante');
    if (mod.tags?.includes(demand.moduleType)) reasons.push('Tags correspondants');
    if (mod.isVerified) reasons.push('Module verifie');
    if (mod.isFree) reasons.push('Module gratuit');
    if (mod.price && demand.budget && Number(mod.price) <= Number(demand.budget))
      reasons.push('Budget compatible');
    return reasons;
  }

  static async updateMatchStatus(matchId: string, status: string) {
    const updateData: any = { status: status as any };
    if (status === 'ACCEPTED') updateData.acceptedAt = new Date();
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    return prisma.moduleMatch.update({ where: { id: matchId }, data: updateData });
  }
}
