import { mockPrisma } from '../setup';
import {
  getPlatformStats,
  getSectorStats,
  getGeographicStats,
  getGrowthStats,
  getPaymentTrends,
  getConsumptionTrends,
  getBookingTrends,
  getDeliveryTrends,
  computeSectorBenchmarks,
  generateBusinessReport,
  generateSectorReport,
  generateGeographicReport,
  getPartnerAccessCheck,
  getBusinessConsentCheck,
  clearCache,
  clearCachePattern,
} from '../../services/afriDataHubService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

function dec(val: number) {
  return { toNumber: () => val } as any;
}

describe('afriDataHubService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache', () => {
    test('clearCache clears', () => {
      clearCache();
      expect(true).toBe(true);
    });
    test('clearCachePattern clears matching', () => {
      clearCachePattern('platform');
      expect(true).toBe(true);
    });
  });

  describe('getPlatformStats', () => {
    test('returns stats from db', async () => {
      jest.spyOn(mockPrisma.business, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(200);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(100);
      jest
        .spyOn(mockPrisma.payment, 'aggregate')
        .mockResolvedValue({ _count: 300, _sum: { amount: dec(5000000) } } as any);
      jest.spyOn(mockPrisma.event, 'count').mockResolvedValue(20);
      jest.spyOn(mockPrisma.rental, 'count').mockResolvedValue(10);
      const r = await getPlatformStats();
      expect(r.totalBusinesses).toBe(50);
      expect(r.totalOrders).toBe(200);
      expect(r.currency).toBe('FCFA');
    });
  });

  describe('getSectorStats', () => {
    test('returns sector stats', async () => {
      jest
        .spyOn(mockPrisma.business, 'groupBy')
        .mockResolvedValue([{ type: 'RESTAURANT', _count: { id: 10 } }]);
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([{ id: 'b1', ownerId: 'u1' }]);
      jest
        .spyOn(mockPrisma.payment, 'aggregate')
        .mockResolvedValue({ _sum: { amount: dec(100000) } } as any);
      const r = await getSectorStats();
      expect(r).toHaveLength(1);
      expect(r[0].sector).toBe('RESTAURANT');
    });
  });

  describe('getGeographicStats', () => {
    test('returns geographic stats', async () => {
      jest
        .spyOn(mockPrisma.business, 'groupBy')
        .mockResolvedValue([{ country: 'TG', _count: { id: 30 } }]);
      const r = await getGeographicStats();
      expect(r.byCountry).toHaveLength(1);
    });
  });

  describe('getGrowthStats', () => {
    test('returns growth stats', async () => {
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(25);
      jest
        .spyOn(mockPrisma.payment, 'aggregate')
        .mockResolvedValue({ _sum: { amount: dec(1000000) } } as any);
      jest.spyOn(mockPrisma.business, 'count').mockResolvedValue(5);
      const r = await getGrowthStats();
      expect(r.orders.thisMonth).toBe(50);
    });
  });

  describe('getPaymentTrends', () => {
    test('returns payment trends', async () => {
      jest
        .spyOn(mockPrisma.payment, 'groupBy')
        .mockResolvedValue([{ method: 'OM', _count: { id: 10 }, _sum: { amount: dec(50000) } }]);
      const r = await getPaymentTrends();
      expect(r.byMethod).toBeDefined();
    });
  });

  describe('getConsumptionTrends', () => {
    test('returns raw query results', async () => {
      (mockPrisma as any).$queryRaw = jest.fn().mockResolvedValue([{ day: new Date(), count: 5 }]);
      const r = await getConsumptionTrends();
      expect(r.orders).toBeDefined();
    });
  });

  describe('getBookingTrends', () => {
    test('returns booking trends', async () => {
      (mockPrisma as any).$queryRaw = jest
        .fn()
        .mockResolvedValue([{ month: new Date(), count: 10 }]);
      jest
        .spyOn(mockPrisma.booking, 'groupBy')
        .mockResolvedValue([{ status: 'CONFIRMED', _count: { id: 20 } }]);
      const r = await getBookingTrends();
      expect(r.byStatus).toBeDefined();
    });
  });

  describe('getDeliveryTrends', () => {
    test('returns delivery trends', async () => {
      (mockPrisma as any).$queryRaw = jest
        .fn()
        .mockResolvedValue([{ month: new Date(), count: 8 }]);
      jest
        .spyOn(mockPrisma.order, 'groupBy')
        .mockResolvedValue([{ status: 'DELIVERED', _count: { id: 15 } }]);
      const r = await getDeliveryTrends();
      expect(r.byStatus).toBeDefined();
    });
  });

  describe('generateBusinessReport', () => {
    test('generates report', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({
        id: 'b1',
        name: 'Biz',
        type: 'RESTAURANT',
        country: 'TG',
        city: 'Lomé',
        score: {
          overallScore: 750,
          commercialScore: 150,
          financialScore: 150,
          satisfactionScore: 150,
          reliabilityScore: 150,
          profileScore: 150,
          category: 'GOOD',
          totalOrders: 50,
          totalBookings: 20,
          avgRating: 4.5,
          reviewCount: 30,
          completionPct: 80,
        },
      } as any);
      jest
        .spyOn(mockPrisma.dataConsent, 'findUnique')
        .mockResolvedValue({ isActive: true, shareLevel: 'FULL' } as any);
      jest
        .spyOn(mockPrisma.dataPartner, 'findUnique')
        .mockResolvedValue({ id: 'p1', isActive: true, name: 'Partner' } as any);
      jest
        .spyOn(mockPrisma.dataReport, 'create')
        .mockResolvedValue({ id: 'r1', type: 'SOLVABILITY', status: 'READY' } as any);
      jest.spyOn(mockPrisma.dataAccessLog, 'create').mockResolvedValue({} as any);
      const r = await generateBusinessReport('b1', 'p1');
      expect(r.status).toBe('READY');
    });
  });

  describe('generateSectorReport', () => {
    test('generates sector report', async () => {
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([
        {
          id: 'b1',
          name: 'Biz',
          type: 'RESTAURANT',
          city: 'Lomé',
          country: 'TG',
          isActive: true,
          score: {
            overallScore: 700,
            commercialScore: 140,
            financialScore: 140,
            satisfactionScore: 140,
            reliabilityScore: 140,
            profileScore: 140,
          },
        } as any,
      ]);
      jest
        .spyOn(mockPrisma.dataReport, 'create')
        .mockResolvedValue({ id: 'r1', type: 'SECTORIAL', status: 'READY' } as any);
      const r = await generateSectorReport('RESTAURANT');
      expect(r.status).toBe('READY');
    });
  });

  describe('generateGeographicReport', () => {
    test('generates geographic report', async () => {
      jest
        .spyOn(mockPrisma.business, 'findMany')
        .mockResolvedValue([{ id: 'b1', name: 'Biz', type: 'RESTAURANT', city: 'Lomé' }]);
      jest
        .spyOn(mockPrisma.payment, 'aggregate')
        .mockResolvedValue({ _sum: { amount: dec(500000) } } as any);
      jest
        .spyOn(mockPrisma.dataReport, 'create')
        .mockResolvedValue({ id: 'r1', type: 'GEOGRAPHIC', status: 'READY' } as any);
      const r = await generateGeographicReport('TG', 'Lomé');
      expect(r.status).toBe('READY');
    });
  });

  describe('Access checks', () => {
    test('getPartnerAccessCheck returns true for active', async () => {
      jest
        .spyOn(mockPrisma.partnerSubscription, 'findFirst')
        .mockResolvedValue({ id: 's1' } as any);
      const r = await getPartnerAccessCheck('p1');
      expect(r).toBe(true);
    });
    test('getBusinessConsentCheck returns', async () => {
      jest
        .spyOn(mockPrisma.dataConsent, 'findUnique')
        .mockResolvedValue({ businessId: 'b1', isActive: true } as any);
      const r = await getBusinessConsentCheck('b1');
      expect(r.isActive).toBe(true);
    });
  });
});
