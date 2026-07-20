import { mockPrisma } from '../setup';
import * as similarityService from '../../services/similarityService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

describe('similarityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const tags = [
        { tag: 'a', weight: 1 },
        { tag: 'b', weight: 1 },
      ];
      const result = similarityService.cosineSimilarity(tags, tags);
      expect(result).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [{ tag: 'a', weight: 1 }];
      const b = [{ tag: 'b', weight: 1 }];
      const result = similarityService.cosineSimilarity(a, b);
      expect(result).toBe(0);
    });

    it('should return 0 if either vector has zero norm', () => {
      const result = similarityService.cosineSimilarity([], [{ tag: 'a', weight: 1 }]);
      expect(result).toBe(0);
    });
  });

  describe('findSimilarProducts', () => {
    it('should return similar products sorted by score', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod-1',
        tags: ['tech', 'phone'],
        categoryId: 'cat-1',
        businessId: 'biz-1',
        name: 'Phone',
      });
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([
        { id: 'prod-2', tags: ['tech', 'phone'], categoryId: 'cat-1' },
        { id: 'prod-3', tags: ['food'], categoryId: 'cat-2' },
      ]);
      const result = await similarityService.findSimilarProducts('prod-1', 10);
      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe('prod-2');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should return empty array if product not found', async () => {
      (mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await similarityService.findSimilarProducts('invalid');
      expect(result).toEqual([]);
    });
  });

  describe('findSimilarBusinesses', () => {
    it('should return similar businesses sorted by score', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'biz-1',
        type: 'RETAIL',
        modules: ['POS', 'INVENTORY'],
        city: 'Lome',
        country: 'Togo',
      });
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'biz-2',
          type: 'RETAIL',
          modules: ['POS', 'INVENTORY'],
          city: 'Lome',
          rating: 4.5,
          reviewCount: 50,
        },
        { id: 'biz-3', type: 'FOOD', modules: ['POS'], city: 'Kara', rating: 3, reviewCount: 5 },
      ]);
      const result = await similarityService.findSimilarBusinesses('biz-1', 10);
      expect(result).toHaveLength(2);
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should return empty array if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await similarityService.findSimilarBusinesses('invalid');
      expect(result).toEqual([]);
    });
  });
});
