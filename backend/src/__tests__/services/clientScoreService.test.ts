import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import {
  computeClientScore,
  recomputeClientScoresForBusiness,
} from '../../services/clientScoreService';

describe('clientScoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('computeClientScore returns score and category', async () => {
    jest
      .spyOn(mockPrisma.order, 'findMany')
      .mockResolvedValue([
        { id: 'o1', totalAmount: 50000, status: 'DELIVERED', createdAt: new Date() },
      ]);
    jest
      .spyOn(mockPrisma.booking, 'findMany')
      .mockResolvedValue([{ id: 'b1', status: 'COMPLETED', createdAt: new Date() }]);
    jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([{ id: 'p1', amount: 50000 }]);
    jest.spyOn(mockPrisma.review, 'findMany').mockResolvedValue([{ id: 'r1', rating: 5 }]);
    const result = await computeClientScore('u1', 'biz-1');
    expect(result.clientId).toBe('u1');
    expect(result.businessId).toBe('biz-1');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.category).toBeDefined();
  });

  test('computeClientScore handles empty data', async () => {
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.review, 'findMany').mockResolvedValue([]);
    const result = await computeClientScore('u1', 'biz-1');
    expect(result.score).toBe(0);
    expect(result.category).toBe('NOUVEAU');
  });

  test('recomputeClientScoresForBusiness processes all clients', async () => {
    jest
      .spyOn(mockPrisma.order, 'findMany')
      .mockResolvedValue([{ buyerId: 'u1' }, { buyerId: 'u2' }]);
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.booking, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.review, 'findMany').mockResolvedValue([]);
    await recomputeClientScoresForBusiness('biz-1');
    expect(mockPrisma.order.findMany).toHaveBeenCalled();
  });
});
