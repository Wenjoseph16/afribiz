import { mockPrisma } from '../setup';
import * as marketplace from '../../services/marketplace';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/fulltext', () => ({ searchIdsByText: jest.fn().mockResolvedValue([]) }));

const mockBusiness = {
  id: 'biz-1',
  name: 'Test Biz',
  slug: 'test-biz',
  type: 'BOUTIQUE_VETEMENTS',
  description: 'A test',
  shortDescription: '',
  logo: null,
  coverImage: null,
  city: 'Abidjan',
  country: 'CI',
  rating: 4.5,
  reviewCount: 10,
  isVerified: true,
  isPremium: false,
  isNew: false,
  isTopSeller: false,
  isRecommended: false,
  modules: ['PRODUCTS'],
  latitude: null,
  longitude: null,
  distance: undefined,
  distanceFormatted: undefined,
};
const mockProduct = {
  id: 'prod-1',
  name: 'Product',
  slug: 'product',
  description: '',
  price: 1000,
  currency: 'FCFA',
  images: [],
  stock: 10,
  rating: 4,
  reviewCount: 5,
  tags: [],
  deliveryFee: null,
  business: {
    id: 'biz-1',
    name: 'Test Biz',
    slug: 'test-biz',
    logo: null,
    rating: 4,
    city: 'Abidjan',
    country: 'CI',
  },
  reviews: [],
};

describe('marketplace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchMarketplace', () => {
    function setupBusinessMock() {
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([mockBusiness]);
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(1);
    }

    function setupOtherMocks() {
      (mockPrisma.developerModule.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.developerModule.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.developerProfile.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.developerProfile.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.service.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.menuItem.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.menuItem.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.event.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.rental.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.rental.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);
    }

    test('returns search results with business type', async () => {
      setupBusinessMock();
      setupOtherMocks();
      const r = await marketplace.searchMarketplace({ type: 'business', page: 1, limit: 10 });
      expect(r.total).toBeGreaterThanOrEqual(1);
      expect(r.data.length).toBeGreaterThanOrEqual(0);
    });

    test('returns results for all types by default', async () => {
      setupBusinessMock();
      setupOtherMocks();
      const r = await marketplace.searchMarketplace({});
      expect(r.total).toBeGreaterThanOrEqual(1);
    });

    test('filters by category and country', async () => {
      setupBusinessMock();
      setupOtherMocks();
      const r = await marketplace.searchMarketplace({
        category: 'RESTAURANT',
        country: 'CI',
        page: 1,
        limit: 20,
      });
      expect(r).toBeDefined();
    });

    test('handles text search', async () => {
      setupBusinessMock();
      setupOtherMocks();
      const r = await marketplace.searchMarketplace({ q: 'test', page: 1, limit: 10 });
      expect(r).toBeDefined();
    });
  });

  describe('getTrending', () => {
    test('returns trending items across categories', async () => {
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([mockBusiness]);
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (mockPrisma.service.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.developerModule.findMany as jest.Mock).mockResolvedValue([]);
      const r = await marketplace.getTrending();
      expect(r.topBusinesses).toHaveLength(1);
      expect(r.topProducts).toHaveLength(1);
    });
  });

  describe('getMarketplaceStats', () => {
    test('returns marketplace statistics', async () => {
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(500);
      (mockPrisma.service.count as jest.Mock).mockResolvedValue(200);
      (mockPrisma.event.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.businessReview.aggregate as jest.Mock).mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: { rating: 100 },
      });
      const r = await marketplace.getMarketplaceStats();
      expect(r.businesses).toBe(100);
      expect(r.products).toBe(500);
      expect(r.averageRating).toBe(4.2);
    });
  });

  describe('getSimilarBusinesses', () => {
    test('returns similar businesses by type or city', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        id: 'biz-1',
        type: 'RESTAURANT',
        city: 'Abidjan',
        country: 'CI',
      });
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([mockBusiness]);
      const r = await marketplace.getSimilarBusinesses('biz-1');
      expect(r).toHaveLength(1);
    });

    test('returns empty array if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      const r = await marketplace.getSimilarBusinesses('bad-id');
      expect(r).toEqual([]);
    });
  });

  describe('getActiveMarketplaceAds', () => {
    test('returns active ads shuffled', async () => {
      const mockAd = {
        id: 'ad-1',
        isActive: true,
        placementPage: 'HOME',
        placementPosition: 'TOP',
        targetCountries: [],
        sortOrder: 1,
        campaign: {
          id: 'camp-1',
          name: 'Camp',
          objective: 'BRANDING',
          description: '',
          business: { id: 'biz-1', name: 'Biz', slug: 'biz', logo: null },
        },
      };
      (mockPrisma.adCreative.findMany as jest.Mock).mockResolvedValue([mockAd]);
      const r = await marketplace.getActiveMarketplaceAds('home', 'top', 'CI');
      expect(r).toHaveLength(1);
    });
  });

  describe('getPriceDistribution', () => {
    test('returns price buckets for products', async () => {
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(5);
      const r = await marketplace.getPriceDistribution('product');
      expect(r).toHaveLength(6);
      expect(r[0].label).toBe('0 - 1k');
      expect(r[0].count).toBe(5);
    });
  });

  describe('getProductBySlug', () => {
    test('returns product by slug', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);
      const r = await marketplace.getProductBySlug('product');
      expect(r!.name).toBe('Product');
    });

    test('returns null when not found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);
      const r = await marketplace.getProductBySlug('bad-slug');
      expect(r).toBeNull();
    });
  });
});
