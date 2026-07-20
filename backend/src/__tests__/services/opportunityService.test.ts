import { mockPrisma } from '../setup';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

import {
  detectOpportunities,
  getOpportunityFeed,
  updateOpportunityStatus,
  getPublicOpportunityFeed,
  getUnmetDemandFeed,
  detectAllOpportunities,
} from '../../services/opportunityService';

function flush() {
  return new Promise((r) => setImmediate(r));
}

describe('opportunityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectOpportunities', () => {
    it('should return 0 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const result = await detectOpportunities('invalid');
      expect(result).toBe(0);
    });

    it('should detect search gaps, favorite gaps, and trends', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        type: 'RETAIL',
        city: 'City',
        country: 'Country',
      });
      // search gaps
      mockPrisma.searchLog.groupBy.mockResolvedValueOnce([
        { query: 'new product', _count: { query: 5 } },
      ]);
      mockPrisma.opportunity.findFirst.mockResolvedValueOnce(null);
      mockPrisma.opportunity.create.mockResolvedValueOnce({ id: 'o1' });
      // favorite gaps
      mockPrisma.product.findMany.mockResolvedValue([{ id: 'p1' }]);
      mockPrisma.favorite.findMany.mockResolvedValue([
        { referenceId: 'p2' },
        { referenceId: 'p2' },
      ]);
      mockPrisma.opportunity.findFirst.mockResolvedValueOnce(null);
      mockPrisma.opportunity.create.mockResolvedValueOnce({ id: 'o2' });
      // trending
      mockPrisma.searchLog.groupBy.mockResolvedValueOnce([
        { query: 'trending', _count: { query: 15 } },
      ]);
      mockPrisma.opportunity.findFirst.mockResolvedValueOnce(null);
      mockPrisma.opportunity.create.mockResolvedValueOnce({ id: 'o3' });

      const result = await detectOpportunities('b1');
      await flush();
      expect(result).toBe(3);
    });
  });

  describe('getOpportunityFeed', () => {
    it('should return paginated feed', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([{ id: 'o1', count: 10 }]);
      mockPrisma.opportunity.count.mockResolvedValue(1);
      const result = await getOpportunityFeed('b1', 1, 10);
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('updateOpportunityStatus', () => {
    it('should update status and set timestamps', async () => {
      mockPrisma.opportunity.update.mockResolvedValue({
        id: 'o1',
        status: 'SEEN',
        seenAt: new Date(),
      });
      const result = await updateOpportunityStatus('o1', 'SEEN');
      expect(mockPrisma.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'o1' },
          data: expect.objectContaining({ status: 'SEEN', seenAt: expect.any(Date) }),
        })
      );
    });

    it('should set actedAt for ACTED status', async () => {
      mockPrisma.opportunity.update.mockResolvedValue({ id: 'o1', status: 'ACTED' });
      await updateOpportunityStatus('o1', 'ACTED');
      expect(mockPrisma.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ actedAt: expect.any(Date) }) })
      );
    });
  });

  describe('getPublicOpportunityFeed', () => {
    it('should return filtered trending searches', async () => {
      mockPrisma.searchLog.groupBy.mockResolvedValue([
        { query: 'trend1', _count: { query: 10 } },
        { query: 'trend2', _count: { query: 3 } },
      ]);
      const result = await getPublicOpportunityFeed(1, 10);
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].keyword).toBe('trend1');
    });
  });

  describe('getUnmetDemandFeed', () => {
    it('should return unmet demands with 3+ searches', async () => {
      mockPrisma.searchLog.groupBy.mockResolvedValue([
        { query: 'unmet1', _count: { query: 5 } },
        { query: 'unmet2', _count: { query: 2 } },
      ]);
      const result = await getUnmetDemandFeed(1, 10);
      await flush();
      expect(result).toHaveLength(1);
      expect(result[0].keyword).toBe('unmet1');
    });
  });

  describe('detectAllOpportunities', () => {
    it('should run detection for all active businesses', async () => {
      mockPrisma.business.findMany.mockResolvedValue([{ id: 'b1' }]);
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Test',
        type: 'RETAIL',
        city: 'City',
        country: 'Country',
      });
      mockPrisma.searchLog.groupBy.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);
      mockPrisma.favorite.findMany.mockResolvedValue([]);
      const result = await detectAllOpportunities();
      await flush();
      expect(result.detected).toBe(0);
    });
  });
});
