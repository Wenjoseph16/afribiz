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
jest.mock('../../services/crm', () => ({
  getClientDetail: jest.fn().mockResolvedValue({ id: 'bc-1', firstName: 'Jean', lastName: 'Kone' }),
}));
import {
  trackPageView,
  trackProductView,
  trackProductClick,
  logActivity,
  getCustomer360,
} from '../../services/customer360';

describe('customer360', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('trackPageView creates page view', async () => {
    jest.spyOn(mockPrisma.businessPageView, 'create').mockResolvedValue({ id: 'pv-1' });
    jest.spyOn(mockPrisma.businessClient, 'upsert').mockResolvedValue({ id: 'bc-1' });
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue({ id: 'bc-1' });
    jest.spyOn(mockPrisma.clientActivityLog, 'create').mockResolvedValue({ id: 'al-1' });
    await trackPageView({ businessId: 'biz-1', userId: 'u1' });
    expect(mockPrisma.businessPageView.create).toHaveBeenCalled();
  });

  test('trackProductView creates product view', async () => {
    jest.spyOn(mockPrisma.productView, 'create').mockResolvedValue({ id: 'pv-1' });
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue({ id: 'bc-1' });
    jest.spyOn(mockPrisma.clientActivityLog, 'create').mockResolvedValue({ id: 'al-1' });
    await trackProductView({ businessId: 'biz-1', productId: 'p1', userId: 'u1' });
    expect(mockPrisma.productView.create).toHaveBeenCalled();
  });

  test('trackProductClick creates product click', async () => {
    jest.spyOn(mockPrisma.productClick, 'create').mockResolvedValue({ id: 'pc-1' });
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue({ id: 'bc-1' });
    jest.spyOn(mockPrisma.clientActivityLog, 'create').mockResolvedValue({ id: 'al-1' });
    await trackProductClick({ businessId: 'biz-1', productId: 'p1', userId: 'u1' });
    expect(mockPrisma.productClick.create).toHaveBeenCalled();
  });

  test('logActivity logs client activity', async () => {
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue({ id: 'bc-1' });
    jest.spyOn(mockPrisma.clientActivityLog, 'create').mockResolvedValue({ id: 'al-1' });
    await logActivity('biz-1', 'u1', 'PAGE_VIEW', { description: 'Visited page' });
    expect(mockPrisma.clientActivityLog.create).toHaveBeenCalled();
  });

  test('logActivity returns early when client not found', async () => {
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue(null);
    await logActivity('biz-1', 'u1', 'PAGE_VIEW');
    expect(mockPrisma.clientActivityLog.create).not.toHaveBeenCalled();
  });

  test('getCustomer360 returns customer data', async () => {
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue({ id: 'bc-1' });
    jest.spyOn(mockPrisma.clientActivityLog, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.businessPageView, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.productView, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.productClick, 'findMany').mockResolvedValue([]);
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([]);
    const result = await getCustomer360('biz-1', 'u1');
    expect(result).toBeDefined();
    expect(result.activityTimeline).toEqual([]);
  });

  test('getCustomer360 throws when client not found', async () => {
    jest.spyOn(mockPrisma.businessClient, 'findUnique').mockResolvedValue(null);
    await expect(getCustomer360('biz-1', 'u1')).rejects.toThrow('Client non trouvé');
  });
});
