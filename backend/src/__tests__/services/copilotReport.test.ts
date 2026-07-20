import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import { generateWeeklyReport, generateAllWeeklyReports } from '../../services/copilotReport';

describe('copilotReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateWeeklyReport returns report', async () => {
    jest
      .spyOn(mockPrisma.business, 'findUnique')
      .mockResolvedValue({ id: 'biz-1', name: 'Biz 1', score: { overallScore: 750 } });
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 50000 } });
    jest
      .spyOn(mockPrisma.businessDailyStats, 'aggregate')
      .mockResolvedValue({ _sum: { newClients: 3 } });
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(2);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(150);
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([]);
    const result = await generateWeeklyReport('biz-1');
    expect(result).not.toBeNull();
    expect(result!.businessName).toBe('Biz 1');
    expect(result!.stats.orders).toBe(10);
  });

  test('generateWeeklyReport returns null when business not found', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
    const result = await generateWeeklyReport('biz-1');
    expect(result).toBeNull();
  });

  test('generateAllWeeklyReports processes all businesses', async () => {
    jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([{ id: 'biz-1' }]);
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({
      id: 'biz-1',
      name: 'Biz 1',
      score: { overallScore: 750 },
      ownerId: 'u1',
    });
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 25000 } });
    jest
      .spyOn(mockPrisma.businessDailyStats, 'aggregate')
      .mockResolvedValue({ _sum: { newClients: 2 } });
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(1);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(50);
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({ id: 'n1' });
    const result = await generateAllWeeklyReports();
    expect(result).toBe(1);
  });
});
