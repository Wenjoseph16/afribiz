import { mockPrisma } from '../setup';
import * as recommendationService from '../../services/recommendationService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

describe('recommendationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecommendations', () => {
    it('should return product recommendations', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        country: 'Togo',
        city: 'Lome',
      });
      (mockPrisma.favorite.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);
      const result = await recommendationService.getRecommendations('user-1', 'PRODUCT');
      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should return service recommendations', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        country: 'Togo',
        city: 'Lome',
      });
      (mockPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.service.count as jest.Mock).mockResolvedValue(0);
      const result = await recommendationService.getRecommendations('user-1', 'SERVICE');
      expect(result.items).toEqual([]);
    });

    it('should return business recommendations', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        country: 'Togo',
        city: 'Lome',
      });
      (mockPrisma.follow.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(0);
      const result = await recommendationService.getRecommendations('user-1', 'BUSINESS');
      expect(result.items).toEqual([]);
    });

    it('should return event recommendations', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        country: 'Togo',
        city: 'Lome',
      });
      (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.event.count as jest.Mock).mockResolvedValue(0);
      const result = await recommendationService.getRecommendations('user-1', 'EVENT');
      expect(result.items).toEqual([]);
    });

    it('should return promotion recommendations', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        country: 'Togo',
      });
      (mockPrisma.promotion.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.promotion.count as jest.Mock).mockResolvedValue(0);
      const result = await recommendationService.getRecommendations('user-1', 'PROMOTION');
      expect(result.items).toEqual([]);
    });

    it('should return offer flash recommendations', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        country: 'Togo',
      });
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.offerFlash.count as jest.Mock).mockResolvedValue(0);
      const result = await recommendationService.getRecommendations('user-1', 'OFFER_FLASH');
      expect(result.items).toEqual([]);
    });

    it('should return empty for unknown type', async () => {
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      const result = await recommendationService.getRecommendations('user-1', 'UNKNOWN' as any);
      expect(result.items).toEqual([]);
      expect(result.pagination.totalPages).toBe(0);
    });
  });
});
