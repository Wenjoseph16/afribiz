import { mockPrisma } from '../setup';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

import { ModuleDemandService } from '../../services/ModuleDemandService';

function flush() {
  return new Promise((r) => setImmediate(r));
}

describe('ModuleDemandService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a demand', async () => {
      const data = { businessId: 'b1', moduleType: 'ECOMMERCE', title: 'Shop' };
      mockPrisma.moduleDemand.create.mockResolvedValue({ id: 'd1', ...data });
      const result = await ModuleDemandService.create(data as any);
      expect(mockPrisma.moduleDemand.create).toHaveBeenCalledWith({ data });
      expect(result.id).toBe('d1');
    });
  });

  describe('findById', () => {
    it('should find demand with matches', async () => {
      mockPrisma.moduleDemand.findUnique.mockResolvedValue({ id: 'd1', matches: [] });
      const result = await ModuleDemandService.findById('d1');
      expect(mockPrisma.moduleDemand.findUnique).toHaveBeenCalledWith({
        where: { id: 'd1' },
        include: { matches: { orderBy: { score: 'desc' } } },
      });
      expect(result!.id).toBe('d1');
    });
  });

  describe('findAll', () => {
    it('should find all with filters', async () => {
      mockPrisma.moduleDemand.findMany.mockResolvedValue([{ id: 'd1', _count: { matches: 0 } }]);
      const result = await ModuleDemandService.findAll({ businessId: 'b1', search: 'shop' });
      expect(mockPrisma.moduleDemand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            businessId: 'b1',
            OR: expect.arrayContaining([expect.objectContaining({ title: { contains: 'shop' } })]),
          }),
        })
      );
      expect(result).toHaveLength(1);
    });

    it('should handle empty filters', async () => {
      mockPrisma.moduleDemand.findMany.mockResolvedValue([]);
      const result = await ModuleDemandService.findAll({});
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update demand status', async () => {
      mockPrisma.moduleDemand.update.mockResolvedValue({ id: 'd1', status: 'IN_PROGRESS' });
      const result = await ModuleDemandService.updateStatus('d1', 'IN_PROGRESS');
      expect(mockPrisma.moduleDemand.update).toHaveBeenCalledWith({
        where: { id: 'd1' },
        data: { status: 'IN_PROGRESS' },
      });
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('delete', () => {
    it('should delete and return message', async () => {
      mockPrisma.moduleDemand.delete.mockResolvedValue({ id: 'd1' });
      const result = await ModuleDemandService.delete('d1');
      expect(mockPrisma.moduleDemand.delete).toHaveBeenCalledWith({ where: { id: 'd1' } });
      expect(result).toEqual({ message: 'Demande supprimee' });
    });
  });

  describe('findMatches', () => {
    it('should return matching modules', async () => {
      mockPrisma.moduleDemand.findUnique.mockResolvedValue({ id: 'd1', moduleType: 'ECOMMERCE' });
      mockPrisma.developerModule.findMany.mockResolvedValue([
        {
          id: 'm1',
          name: 'Shop',
          category: 'ECOMMERCE',
          tags: [],
          isVerified: true,
          isFeatured: false,
          isFree: false,
          price: 50000,
          developer: { id: 'dev1', skills: ['ecommerce'] },
        },
      ]);
      const result = await ModuleDemandService.findMatches('d1');
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].score).toBeGreaterThan(50);
    });

    it('should throw if demand not found', async () => {
      mockPrisma.moduleDemand.findUnique.mockResolvedValue(null);
      await expect(ModuleDemandService.findMatches('invalid')).rejects.toThrow(
        'Demande introuvable'
      );
    });
  });

  describe('calculateMatchScore', () => {
    it('should calculate score based on criteria', () => {
      const demand = { moduleType: 'ECOMMERCE', budget: 100000 };
      const mod = {
        category: 'ECOMMERCE',
        tags: ['ecommerce'],
        isVerified: true,
        isFeatured: true,
        isFree: false,
        price: 80000,
        developer: { skills: ['ecommerce'] },
      };
      const score = ModuleDemandService.calculateMatchScore(demand, mod);
      // 50 base + 25 category + 15 tags + 10 verified + 10 featured + 10 budget + 5 skill = 115, capped at 100
      expect(score).toBe(100);
    });

    it('should return base score for no matches', () => {
      const demand = { moduleType: 'RESTAURANT', budget: 50000 };
      const mod = {
        category: 'ECOMMERCE',
        tags: [],
        isVerified: false,
        isFeatured: false,
        isFree: false,
        price: 100000,
        developer: { skills: [] },
      };
      const score = ModuleDemandService.calculateMatchScore(demand, mod);
      expect(score).toBe(50);
    });
  });

  describe('autoMatch', () => {
    it('should auto-match and create new matches', async () => {
      mockPrisma.moduleDemand.findUnique.mockResolvedValue({ id: 'd1', moduleType: 'ECOMMERCE' });
      mockPrisma.developerModule.findMany.mockResolvedValue([
        {
          id: 'm1',
          name: 'Shop',
          category: 'ECOMMERCE',
          tags: [],
          isVerified: true,
          isFeatured: false,
          isFree: false,
          price: 50000,
          developer: { id: 'dev1', skills: [] },
        },
      ]);
      mockPrisma.moduleMatch.findFirst.mockResolvedValue(null);
      mockPrisma.moduleMatch.create.mockResolvedValue({
        id: 'mm1',
        demandId: 'd1',
        developerId: 'dev1',
        moduleId: 'm1',
        score: 85,
        status: 'PENDING',
      });
      mockPrisma.demandSearchLog.create.mockResolvedValue({ id: 'sl1' });

      const result = await ModuleDemandService.autoMatch('d1');
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(85);
    });

    it('should skip existing matches', async () => {
      mockPrisma.moduleDemand.findUnique.mockResolvedValue({ id: 'd1', moduleType: 'ECOMMERCE' });
      mockPrisma.developerModule.findMany.mockResolvedValue([
        {
          id: 'm1',
          name: 'Shop',
          category: 'ECOMMERCE',
          tags: [],
          isVerified: false,
          isFeatured: false,
          isFree: false,
          price: 50000,
          developer: { id: 'dev1', skills: [] },
        },
      ]);
      mockPrisma.moduleMatch.findFirst.mockResolvedValue({ id: 'mm1' });
      mockPrisma.demandSearchLog.create.mockResolvedValue({ id: 'sl1' });

      const result = await ModuleDemandService.autoMatch('d1');
      await flush();
      expect(result).toHaveLength(0);
    });

    it('should throw if demand not found', async () => {
      mockPrisma.moduleDemand.findUnique.mockResolvedValue(null);
      await expect(ModuleDemandService.autoMatch('invalid')).rejects.toThrow('Demande introuvable');
    });
  });

  describe('updateMatchStatus', () => {
    it('should update status and set acceptedAt for ACCEPTED', async () => {
      mockPrisma.moduleMatch.update.mockResolvedValue({ id: 'mm1', status: 'ACCEPTED' });
      const result = await ModuleDemandService.updateMatchStatus('mm1', 'ACCEPTED');
      expect(mockPrisma.moduleMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mm1' },
          data: expect.objectContaining({ status: 'ACCEPTED', acceptedAt: expect.any(Date) }),
        })
      );
    });

    it('should update status and set completedAt for COMPLETED', async () => {
      mockPrisma.moduleMatch.update.mockResolvedValue({ id: 'mm1', status: 'COMPLETED' });
      await ModuleDemandService.updateMatchStatus('mm1', 'COMPLETED');
      expect(mockPrisma.moduleMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        })
      );
    });
  });
});
