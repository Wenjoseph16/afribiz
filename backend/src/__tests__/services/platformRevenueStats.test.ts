import { mockPrisma } from '../setup';
import * as platformRevenueStats from '../../services/platformRevenueStats';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

describe('platformRevenueStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatformRevenueStats', () => {
    it('should return stats for 30d period', async () => {
      (mockPrisma.financialLog.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.partnerSubscription.aggregate as jest.Mock).mockResolvedValue({
        _sum: { price: 50000 },
      });
      (mockPrisma.adCampaign.aggregate as jest.Mock).mockResolvedValue({ _sum: { budget: 10000 } });
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.paymentTransaction.count as jest.Mock).mockResolvedValue(500);
      (mockPrisma.escrow.count as jest.Mock).mockResolvedValue(50);
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.paymentTransaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.escrow.findMany as jest.Mock).mockResolvedValue([]);

      const result = await platformRevenueStats.getPlatformRevenueStats('30d');
      expect(result.totalRevenue).toBe(60000);
      expect(result.totalBusinesses).toBe(100);
      expect(result.totalTransactions).toBe(500);
    });

    it('should return stats for 7d period', async () => {
      (mockPrisma.financialLog.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.partnerSubscription.aggregate as jest.Mock).mockResolvedValue({
        _sum: { price: null },
      });
      (mockPrisma.adCampaign.aggregate as jest.Mock).mockResolvedValue({ _sum: { budget: null } });
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.paymentTransaction.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.escrow.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.paymentTransaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.escrow.findMany as jest.Mock).mockResolvedValue([]);

      const result = await platformRevenueStats.getPlatformRevenueStats('7d');
      expect(result.totalRevenue).toBe(0);
    });

    it('should return stats for all time', async () => {
      (mockPrisma.financialLog.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.partnerSubscription.aggregate as jest.Mock).mockResolvedValue({
        _sum: { price: null },
      });
      (mockPrisma.adCampaign.aggregate as jest.Mock).mockResolvedValue({ _sum: { budget: null } });
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.paymentTransaction.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.escrow.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.paymentTransaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.escrow.findMany as jest.Mock).mockResolvedValue([]);

      const result = await platformRevenueStats.getPlatformRevenueStats('all');
      expect(result.totalRevenue).toBe(0);
    });

    it('should calculate commission breakdown correctly', async () => {
      const now = new Date();
      (mockPrisma.financialLog.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'fl-1',
          businessId: 'biz-1',
          amount: 1000,
          createdAt: now,
          metadata: { commissionType: 'TRANSACTION_FEE' },
        },
        {
          id: 'fl-2',
          businessId: 'biz-2',
          amount: 500,
          createdAt: now,
          metadata: { commissionType: 'ESCROW_FEE' },
        },
        {
          id: 'fl-3',
          businessId: 'biz-3',
          amount: 200,
          createdAt: now,
          metadata: { commissionType: 'MODULE_COMMISSION' },
        },
      ]);
      (mockPrisma.partnerSubscription.aggregate as jest.Mock).mockResolvedValue({
        _sum: { price: 0 },
      });
      (mockPrisma.adCampaign.aggregate as jest.Mock).mockResolvedValue({ _sum: { budget: 0 } });
      (mockPrisma.business.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.paymentTransaction.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.escrow.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([
        { id: 'biz-1', name: 'Biz1' },
      ]);
      (mockPrisma.paymentTransaction.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.escrow.findMany as jest.Mock).mockResolvedValue([]);

      const result = await platformRevenueStats.getPlatformRevenueStats('30d');
      expect(result.transactionCommissions).toBe(1000);
      expect(result.escrowCommissions).toBe(500);
      expect(result.developerModuleCommissions).toBe(200);
    });
  });
});
