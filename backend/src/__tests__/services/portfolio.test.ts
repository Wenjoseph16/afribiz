import { mockPrisma } from '../setup';
import {
  listPortfolioItems,
  createPortfolioItem,
  getPortfolioStats,
} from '../../services/portfolio';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'DevT', modules: ['PORTFOLIO'], settings: {} };
const mockItem = {
  id: 'pf-1',
  businessId: 'biz-1',
  title: 'Site Ecommerce',
  description: 'Un site',
  category: { id: 'cat-1', name: 'Web' },
  media: [],
  testimonials: [],
  tags: [],
  isActive: true,
};

describe('Portfolio Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findFirst.mockResolvedValue(mockBiz as any);
  });

  test('listPortfolioItems returns paginated', async () => {
    jest.spyOn(mockPrisma.portfolioItem, 'findMany').mockResolvedValue([mockItem as any]);
    jest.spyOn(mockPrisma.portfolioItem, 'count').mockResolvedValue(1);
    const r = await listPortfolioItems('u1', {});
    expect(r.total).toBe(1);
  });

  test('createPortfolioItem creates', async () => {
    jest.spyOn(mockPrisma.portfolioItem, 'create').mockResolvedValue(mockItem as any);
    const r = await createPortfolioItem('u1', { title: 'Site Ecommerce', description: 'Un site' });
    expect(r.title).toBe('Site Ecommerce');
  });

  test('getPortfolioStats aggregates', async () => {
    mockPrisma.portfolioItem.count.mockResolvedValue(3);
    mockPrisma.portfolioCategory.count.mockResolvedValue(2);
    mockPrisma.portfolioMedia.count.mockResolvedValue(10);
    mockPrisma.portfolioTestimonial.count.mockResolvedValue(5);
    mockPrisma.portfolioInteraction.count.mockResolvedValue(100);
    mockPrisma.portfolioItem.aggregate.mockResolvedValue({ _sum: { orderCount: 5 } } as any);
    const r = await getPortfolioStats('u1');
    expect(r).toBeDefined();
  });
});
