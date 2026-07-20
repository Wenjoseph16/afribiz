import { mockPrisma } from '../setup';
import {
  searchMarketplace,
  getSearchHistory,
  getSearchSuggestions,
} from '../../services/smartSearchService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockProduct = {
  id: 'p1',
  name: 'Phone',
  price: 50000,
  isActive: true,
  deletedAt: null,
  business: { id: 'b1', name: 'Biz', slug: 'biz', logo: null, city: 'Lomé', country: 'TG' },
  category: { id: 'c1', name: 'Electronics', slug: 'electronics' },
};

const mockService = {
  id: 's1',
  name: 'Cleaning',
  isActive: true,
  deletedAt: null,
  business: { id: 'b1', name: 'Biz', slug: 'biz', logo: null, city: 'Lomé' },
  category: { id: 'c1', name: 'Services' },
};

const mockBusiness = {
  id: 'b1',
  name: 'Biz',
  slug: 'biz',
  type: 'RESTAURANT',
  city: 'Lomé',
  country: 'TG',
  rating: 4.5,
  reviewCount: 10,
  shortDescription: 'Good food',
  isVerified: true,
  isActive: true,
  deletedAt: null,
};

const mockSearchLog = { id: 'log-1', query: 'phone', createdAt: new Date() };

describe('smartSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMarketplace', () => {
    it('should search products when type is PRODUCT', async () => {
      jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([mockProduct as any]);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma, '$queryRawUnsafe').mockResolvedValue([]);
      const r = await searchMarketplace('phone', { type: 'PRODUCT', page: 1, limit: 20 });
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(1);
    });

    it('should search services when type is SERVICE', async () => {
      jest.spyOn(mockPrisma.service, 'findMany').mockResolvedValue([mockService as any]);
      jest.spyOn(mockPrisma.service, 'count').mockResolvedValue(1);
      const r = await searchMarketplace('clean', { type: 'SERVICE' });
      expect(r.items).toHaveLength(1);
    });

    it('should search businesses when type is BUSINESS', async () => {
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([mockBusiness as any]);
      jest.spyOn(mockPrisma.business, 'count').mockResolvedValue(1);
      const r = await searchMarketplace('biz', { type: 'BUSINESS' });
      expect(r.items).toHaveLength(1);
    });

    it('should search ALL types', async () => {
      jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([mockProduct as any]);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma, '$queryRawUnsafe').mockResolvedValue([]);
      const r = await searchMarketplace('phone', { type: 'ALL' });
      expect(r.items).toHaveLength(1);
    });

    it('should return empty for unknown type', async () => {
      const r = await searchMarketplace('test', { type: 'UNKNOWN' });
      expect(r.items).toHaveLength(0);
      expect(r.total).toBe(0);
    });

    it('should apply price filters', async () => {
      jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([mockProduct as any]);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma, '$queryRawUnsafe').mockResolvedValue([]);
      const r = await searchMarketplace('phone', {
        type: 'PRODUCT',
        minPrice: 1000,
        maxPrice: 100000,
      });
      expect(r.items).toHaveLength(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });

    it('should sort by price ascending', async () => {
      jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([mockProduct as any]);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma, '$queryRawUnsafe').mockResolvedValue([]);
      await searchMarketplace('phone', { type: 'PRODUCT', sort: 'price_asc' });
      expect(mockPrisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('getSearchHistory', () => {
    it('should return search history for user', async () => {
      jest.spyOn(mockPrisma.searchLog, 'findMany').mockResolvedValue([mockSearchLog as any]);
      const r = await getSearchHistory('u1');
      expect(r).toHaveLength(1);
      expect(r[0].query).toBe('phone');
    });

    it('should return empty array if no userId', async () => {
      const r = await getSearchHistory();
      expect(r).toEqual([]);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return suggestions for valid query', async () => {
      jest
        .spyOn(mockPrisma, '$queryRawUnsafe')
        .mockResolvedValueOnce([{ id: 'p1', text: 'Phone', type: 'PRODUCT' }])
        .mockResolvedValueOnce([{ id: 'b1', text: 'Phone Shop', type: 'BUSINESS' }]);
      const r = await getSearchSuggestions('pho');
      expect(r).toHaveLength(2);
    });

    it('should return empty for short query', async () => {
      const r = await getSearchSuggestions('a');
      expect(r).toEqual([]);
    });
  });
});
