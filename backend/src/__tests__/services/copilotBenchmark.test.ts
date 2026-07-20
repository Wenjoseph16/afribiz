import { mockPrisma } from '../setup';
import { getPeerBenchmarks } from '../../services/copilotBenchmark';

describe('copilotBenchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPeerBenchmarks returns benchmarks with peers', async () => {
    jest
      .spyOn(mockPrisma.business, 'findUnique')
      .mockResolvedValue({ id: 'biz-1', name: 'My Biz' });
    jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValueOnce([
      { id: 'p1', name: 'Peer 1', score: null },
      { id: 'p2', name: 'Peer 2', score: null },
    ]);
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(100);
    jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(20);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(3);
    const result = await getPeerBenchmarks('biz-1', 'RESTAURANT');
    expect(result.businessName).toBe('My Biz');
    expect(result.peerCount).toBe(2);
    expect(result.benchmarks).toHaveLength(5);
  });

  test('getPeerBenchmarks returns empty when business not found', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
    const result = await getPeerBenchmarks('biz-1', 'RESTAURANT');
    expect(result.businessName).toBe('');
    expect(result.peerCount).toBe(0);
    expect(result.benchmarks).toEqual([]);
  });

  test('getPeerBenchmarks uses fallback when no peers found', async () => {
    jest
      .spyOn(mockPrisma.business, 'findUnique')
      .mockResolvedValue({ id: 'biz-1', name: 'My Biz' });
    jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValueOnce([]);
    jest
      .spyOn(mockPrisma.business, 'findMany')
      .mockResolvedValueOnce([{ id: 'p1', name: 'Peer', score: null }]);
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(100);
    jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(20);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(3);
    const result = await getPeerBenchmarks('biz-1', 'RESTAURANT');
    expect(result.peerCount).toBe(1);
    expect(result.benchmarks).toHaveLength(5);
  });
});
