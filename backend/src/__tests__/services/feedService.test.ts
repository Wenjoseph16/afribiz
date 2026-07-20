import { mockPrisma } from '../setup';
import { createFeedItem, getFeed, getTrendingFeed } from '../../services/feedService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockFeedItem = {
  id: 'fi-1',
  businessId: 'b1',
  type: 'PRODUCT',
  referenceId: 'p1',
  mediaUrl: 'img.jpg',
  title: 'Nouveau produit',
  description: 'Desc',
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  business: { id: 'b1', name: 'Biz', slug: 'biz', logo: null, type: 'RESTAURANT' },
};

describe('Feed Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createFeedItem creates item', async () => {
    jest.spyOn(mockPrisma.feedItem, 'create').mockResolvedValue(mockFeedItem as any);
    const r = await createFeedItem({
      businessId: 'b1',
      type: 'PRODUCT',
      referenceId: 'p1',
      title: 'Nouveau',
    });
    expect(r.id).toBe('fi-1');
  });

  test('getFeed returns enriched feed for user', async () => {
    const mockUser = {
      id: 'u1',
      country: 'CI',
      city: 'Abidjan',
      followers: [{ businessId: 'b1', developerId: null }],
      favorites: [{ referenceId: 'b1' }],
    };
    const mockProduct = {
      id: 'p1',
      name: 'Prod',
      slug: 'prod',
      price: 5000,
      currency: 'XOF',
      images: ['img.jpg'],
      rating: 4,
    };
    jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser as any);
    jest.spyOn(mockPrisma.feedItem, 'findMany').mockResolvedValue([mockFeedItem as any]);
    jest.spyOn(mockPrisma.feedItem, 'count').mockResolvedValue(1);
    jest.spyOn(mockPrisma.product, 'findUnique').mockResolvedValue(mockProduct as any);
    const r = await getFeed('u1');
    expect(r.items).toHaveLength(1);
    expect(r.pagination.total).toBe(1);
  });

  test('getFeed returns empty for new user', async () => {
    jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue({
      id: 'u1',
      country: null,
      city: null,
      followers: [],
      favorites: [],
    } as any);
    jest.spyOn(mockPrisma.feedItem, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.feedItem, 'count').mockResolvedValue(0);
    const r = await getFeed('u1');
    expect(r.items).toHaveLength(0);
  });

  test('getTrendingFeed returns featured items', async () => {
    const featuredItem = { ...mockFeedItem, isFeatured: true };
    jest.spyOn(mockPrisma.feedItem, 'findMany').mockResolvedValue([featuredItem as any]);
    jest.spyOn(mockPrisma.feedItem, 'count').mockResolvedValue(1);
    jest
      .spyOn(mockPrisma.product, 'findUnique')
      .mockResolvedValue({ id: 'p1', name: 'Prod' } as any);
    const r = await getTrendingFeed();
    expect(r.items).toHaveLength(1);
  });
});
