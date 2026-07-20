import { mockPrisma } from '../setup';
import * as productScoreService from '../../services/productScoreService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('productScoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computeProductScore', () => {
    it('should compute a score for a product', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        rating: 4.5,
        reviewCount: 20,
        orderCount: 50,
        stock: 10,
        isActive: true,
        featured: true,
        discountPercent: 10,
        tags: ['tag1'],
        businessId: 'biz-1',
      });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        score: { overallScore: 800 },
      });
      const result = (await productScoreService.computeProductScore('prod-1')) as NonNullable<
        Awaited<ReturnType<typeof productScoreService.computeProductScore>>
      >;
      expect(result.productId).toBe('prod-1');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.category).toMatch(/EXCELLENT|GOOD|AVERAGE|LOW/);
    });

    it('should return null if product not found', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await productScoreService.computeProductScore('invalid');
      expect(result).toBeNull();
    });

    it('should compute low score for inactive product', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        rating: 0,
        reviewCount: 0,
        orderCount: 0,
        stock: 0,
        isActive: false,
        featured: false,
        discountPercent: 0,
        tags: [],
        businessId: 'biz-1',
      });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        score: { overallScore: 500 },
      });
      const result = (await productScoreService.computeProductScore('prod-1')) as NonNullable<
        Awaited<ReturnType<typeof productScoreService.computeProductScore>>
      >;
      expect(result.score).toBe(0);
      expect(result.category).toBe('LOW');
    });
  });

  describe('recomputeProductScoresForBusiness', () => {
    it('should recompute scores for all products in a business', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-1' },
        { id: 'prod-2' },
      ]);
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        rating: 3,
        reviewCount: 5,
        orderCount: 10,
        stock: 5,
        isActive: true,
        featured: false,
        discountPercent: 0,
        tags: [],
        businessId: 'biz-1',
      });
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        score: { overallScore: 600 },
      });
      await productScoreService.recomputeProductScoresForBusiness('biz-1');
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { businessId: 'biz-1', deletedAt: null } })
      );
    });

    it('should handle errors gracefully', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([{ id: 'prod-1' }]);
      (mockPrisma.product.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      await expect(
        productScoreService.recomputeProductScoresForBusiness('biz-1')
      ).resolves.toBeUndefined();
    });
  });
});
