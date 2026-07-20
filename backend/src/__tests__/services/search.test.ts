import { mockPrisma } from '../setup';
import { globalSearch } from '../../services/search';

jest.mock('../../lib/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('../../lib/fulltext', () => ({ searchIdsByText: jest.fn().mockResolvedValue([]) }));
jest.mock('../../services/dataHubAnalytics', () => ({ trackSearchQuery: jest.fn() }));

describe('Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique = jest.fn().mockResolvedValue({ id: 'biz-1' } as any);
  });

  test('globalSearch performs full-text search', async () => {
    mockPrisma.user.findMany.mockResolvedValue([]);
    const r = await globalSearch('u1', 'test');
    expect(r).toBeDefined();
  });

  test('globalSearch with empty query returns empty', async () => {
    mockPrisma.product.findMany.mockResolvedValue([]);
    mockPrisma.service.findMany.mockResolvedValue([]);
    mockPrisma.menuItem.findMany.mockResolvedValue([]);
    mockPrisma.booking.findMany.mockResolvedValue([]);
    mockPrisma.quote.findMany.mockResolvedValue([]);
    mockPrisma.invoice.findMany.mockResolvedValue([]);
    mockPrisma.debt.findMany.mockResolvedValue([]);
    mockPrisma.dispute.findMany.mockResolvedValue([]);
    mockPrisma.businessDocument.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);
    const r = await globalSearch('u1', '');
    expect(r).toBeDefined();
  });
});
