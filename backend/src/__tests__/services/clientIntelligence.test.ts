import { mockPrisma } from '../setup';
import {
  segmentClients,
  getTopClients,
  getActivityBarometer,
} from '../../services/clientIntelligenceService';

describe('Client Intelligence Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('segmentClients returns segments', async () => {
    const mockClients = [
      {
        id: 'bc-1',
        clientId: 'u1',
        firstName: 'Jean',
        lastName: 'Kone',
        email: 'j@t.com',
        phone: '+22501',
        totalOrders: 20,
        totalSpent: 200000,
        lastOrderAt: new Date(),
        lastVisitAt: new Date(),
        visitCount: 50,
        isActive: true,
        isBlacklisted: false,
      },
      {
        id: 'bc-2',
        clientId: 'u2',
        firstName: 'Marie',
        lastName: 'Diallo',
        email: 'm@t.com',
        phone: '+22502',
        totalOrders: 3,
        totalSpent: 50000,
        lastOrderAt: new Date(Date.now() - 86400000),
        lastVisitAt: new Date(),
        visitCount: 10,
        isActive: true,
        isBlacklisted: false,
      },
      {
        id: 'bc-3',
        clientId: 'u3',
        firstName: 'Paul',
        lastName: 'Konan',
        email: 'p@t.com',
        phone: '+22503',
        totalOrders: 1,
        totalSpent: 10000,
        lastOrderAt: new Date(Date.now() - 60 * 86400000),
        lastVisitAt: new Date(),
        visitCount: 3,
        isActive: true,
        isBlacklisted: false,
      },
    ];
    jest.spyOn(mockPrisma.businessClient, 'findMany').mockResolvedValue(mockClients);
    jest.spyOn(mockPrisma.order, 'groupBy').mockResolvedValue([]);
    const result = await segmentClients('biz-1');
    expect(result.clients).toHaveLength(3);
    expect(result.counts).toBeDefined();
    expect(result.suggestions).toBeDefined();
  });

  test('getTopClients returns leaderboard', async () => {
    jest
      .spyOn(mockPrisma.order, 'groupBy')
      .mockResolvedValue([{ buyerId: 'u1', _count: { id: 10 }, _sum: { totalAmount: 100000 } }]);
    jest.spyOn(mockPrisma.businessClient, 'findMany').mockResolvedValue([
      {
        clientId: 'u1',
        firstName: 'Jean',
        lastName: 'Kone',
        totalOrders: 20,
        totalSpent: 200000,
        lastOrderAt: new Date(),
        visitCount: 50,
      },
    ]);
    const r = await getTopClients('biz-1', '30d', 10);
    expect(r).toHaveLength(1);
    expect(r[0].totalSpentInPeriod).toBe(100000);
  });

  test('getActivityBarometer returns metrics', async () => {
    jest
      .spyOn(mockPrisma.product, 'findMany')
      .mockResolvedValueOnce([
        { id: 'p1', name: 'Prod A', orderCount: 50, images: [], price: 5000 },
      ]);
    jest
      .spyOn(mockPrisma.service, 'findMany')
      .mockResolvedValueOnce([
        { id: 's1', name: 'Serv A', bookingCount: 30, images: [], price: 10000 },
      ]);
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValueOnce([{ createdAt: new Date() }]);
    jest
      .spyOn(mockPrisma.product, 'findMany')
      .mockResolvedValueOnce([{ id: 'p1', name: 'Prod A', orderCount: 50 }]);
    jest
      .spyOn(mockPrisma.orderItem, 'findMany')
      .mockResolvedValue([{ productId: 'p1', quantity: 5 }]);
    const r = await getActivityBarometer('biz-1');
    expect(r.topProducts).toHaveLength(1);
    expect(r.topServices).toHaveLength(1);
    expect(r.trendingProducts).toBeDefined();
  });
});
