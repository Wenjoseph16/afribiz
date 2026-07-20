import { mockPrisma } from '../setup';
jest.mock('../../middlewares/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(
      msg: string,
      public statusCode: number
    ) {
      super(msg);
    }
  },
}));
jest.mock('../../services/business', () => ({
  getAggregatedDashboardStats: jest
    .fn()
    .mockResolvedValue({ totalOrders: 10, totalRevenue: 50000 }),
  getMyBusinessStats: jest.fn().mockResolvedValue({ stats: { views: 100 } }),
}));
jest.mock('../../services/developer', () => ({
  getDeveloperDashboard: jest.fn().mockResolvedValue({ modules: [], totalInstalls: 0 }),
}));
jest.mock('../../services/adminService', () => ({
  getDashboardStats: jest.fn().mockResolvedValue({ totalUsers: 100, totalBusinesses: 50 }),
}));
import {
  getClientDashboardData,
  getBusinessDashboardData,
  getDeveloperDashboardData,
  getAdminDashboardData,
} from '../../services/dashboardService';

describe('dashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getClientDashboardData returns client stats', async () => {
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(3);
    jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(2);
    jest.spyOn(mockPrisma.favorite, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.loyaltyPoints, 'findMany').mockResolvedValue([{ totalPoints: 500 }]);
    jest.spyOn(mockPrisma.notification, 'count').mockResolvedValue(3);
    const result = await getClientDashboardData('u1');
    expect(result.orders.total).toBe(5);
    expect(result.loyalty.points).toBe(500);
  });

  test('getBusinessDashboardData returns business data', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'biz-1', ownerId: 'u1' });
    const result = await getBusinessDashboardData('u1');
    expect(result.businessId).toBe('biz-1');
  });

  test('getBusinessDashboardData throws when business not found', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
    await expect(getBusinessDashboardData('u1')).rejects.toThrow('Business not found');
  });

  test('getDeveloperDashboardData returns developer data', async () => {
    jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue({ id: 'dp-1' });
    const result = await getDeveloperDashboardData('u1');
    expect(result).toBeDefined();
  });

  test('getDeveloperDashboardData throws when profile not found', async () => {
    jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue(null);
    await expect(getDeveloperDashboardData('u1')).rejects.toThrow('Developer profile not found');
  });

  test('getAdminDashboardData returns admin data', async () => {
    const result = await getAdminDashboardData();
    expect(result).toBeDefined();
  });
});
