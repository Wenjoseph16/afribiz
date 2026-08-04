import { mockPrisma } from '../setup';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  getUserActivity,
  getBusinesses,
  getBusinessById,
  updateBusinessStatus,
  updateBusinessVerification,
  getDevelopers,
  getDeveloperById,
  updateDeveloperStatus,
  getModules,
  updateModuleStatus,
  getPayments,
  getSubscriptions,
  getSupportTickets,
  getDisputes,
  getDisputesStats,
  updateDisputeStatus,
  getAdminEscrows,
  getAdminEscrowStats,
  releaseAdminEscrow,
  refundAdminEscrow,
  arbitrateAdminEscrow,
  getAdminPaymentStats,
  validatePayment,
  refundPayment,
  getAdminSubscriptionStats,
  cancelAdminSubscription,
  renewAdminSubscription,
  getAdminSecurityStats,
  getAdminSecurityAdmins,
  getAdminSecuritySessions,
  revokeAdminSession,
  getAdminSecurityAttempts,
  getAdminSecurityBlacklist,
  blockAdminSecurityIp,
  unblockAdminSecurityIp,
  getAdminSecurityJournal,
  getAdminMarketplaceItems,
  updateAdminMarketplaceItem,
  getAdminAdCampaigns,
  getAdminAdStats,
  getAdminAdRevenue,
  validateAdminAdCampaign,
  rejectAdminAdCampaign,
  suspendAdminAdCampaign,
  getAdminAfriScoreStats,
  getAdminAfriScoreRules,
  updateAdminAfriScoreRules,
  getAdminAfriScoreBadges,
  getAdminAfriScoreHistory,
  recomputeAllAfriScores as recomputeAfri,
  getAdminPartners,
  approveAdminPartner,
  suspendAdminPartner,
  getAdminDataAccessLogs,
  getAdminPlatformAnalytics,
  getDataReports,
  getNotifications,
  getSecurityLogs,
  getSystemLogs,
  getBackups,
  createBackup,
  restoreBackup,
  getApiKeys,
  getFraudReports,
  getPlatformSettings as getPlatSettings,
  updatePlatformSettings as updatePlatSettings,
  getAdminAuditLog,
  getEscrows as getEscrowsFn,
} from '../../services/adminService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockUser = {
  id: 'u1',
  email: 'a@b.com',
  firstName: 'A',
  lastName: 'B',
  phone: '123',
  emailVerified: true,
  phoneVerified: true,
  isActive: true,
  primaryRole: 'USER',
  roles: [],
  avatar: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { sessions: 0, notifications: 0, securityLogs: 0 },
};
const mockBiz = {
  id: 'b1',
  name: 'Biz',
  ownerId: 'u1',
  slug: 'biz',
  type: 'RESTAURANT',
  isActive: true,
  isVerified: false,
  verificationStatus: 'PENDING',
  createdAt: new Date(),
  owner: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
  score: null,
  _count: { products: 0, services: 0, menuItems: 0, rooms: 0, events: 0, rentals: 0, reviews: 0 },
};

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    test('returns aggregated stats', async () => {
      jest.spyOn(mockPrisma.user, 'count').mockResolvedValue(100);
      jest.spyOn(mockPrisma.business, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.developerProfile, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.developerModule, 'count').mockResolvedValue(20);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(200);
      jest.spyOn(mockPrisma.service, 'count').mockResolvedValue(100);
      jest.spyOn(mockPrisma.room, 'count').mockResolvedValue(30);
      jest.spyOn(mockPrisma.event, 'count').mockResolvedValue(15);
      jest.spyOn(mockPrisma.rental, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(300);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(150);
      jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(400);
      jest
        .spyOn(mockPrisma.payment, 'aggregate')
        .mockResolvedValue({ _sum: { amount: 1000000 } } as any);
      jest
        .spyOn(mockPrisma.adInvoice, 'aggregate')
        .mockResolvedValue({ _sum: { amount: 50000 } } as any);
      jest
        .spyOn(mockPrisma.developerRevenue, 'aggregate')
        .mockResolvedValue({ _sum: { amount: 20000 } } as any);
      jest
        .spyOn(mockPrisma.dataReport, 'aggregate')
        .mockResolvedValue({ _sum: { price: 10000 } } as any);
      jest.spyOn(mockPrisma.developerSupportTicket, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.adCampaign, 'count').mockResolvedValue(8);
      jest.spyOn(mockPrisma.adImpression, 'count').mockResolvedValue(10000);
      jest.spyOn(mockPrisma.adClick, 'count').mockResolvedValue(500);
      jest.spyOn(mockPrisma.adConversion, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.partnerSubscription, 'count').mockResolvedValue(20);
      jest.spyOn(mockPrisma.businessScore, 'count').mockResolvedValue(30);
      jest
        .spyOn(mockPrisma.businessScore, 'aggregate')
        .mockResolvedValue({ _avg: { overallScore: 600 } } as any);
      jest.spyOn(mockPrisma.dataConsent, 'count').mockResolvedValue(40);
      const r = await getDashboardStats();
      expect(r.totalUsers).toBe(100);
      expect(r.totalBusinesses).toBe(50);
      expect(r.totalOrders).toBe(300);
    });
  });

  describe('getUsers', () => {
    test('returns paginated users', async () => {
      jest.spyOn(mockPrisma.user, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.user, 'findMany').mockResolvedValue([mockUser]);
      const r = await getUsers({});
      expect(r.total).toBe(1);
      expect(r.users).toHaveLength(1);
    });
  });

  describe('getUserById', () => {
    test('returns user or throws', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser);
      const r = await getUserById('u1');
      expect(r.id).toBe('u1');
    });
    test('throws if not found', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(null);
      await expect(getUserById('x')).rejects.toThrow('introuvable');
    });
  });

  describe('updateUserStatus', () => {
    test('throws on delete action', async () => {
      await expect(updateUserStatus('u1', 'delete')).rejects.toThrow('suppression');
    });
    test('suspends user', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(mockPrisma.user, 'update').mockResolvedValue({ ...mockUser, isActive: false });
      const r = await updateUserStatus('u1', 'suspend');
      expect(r.isActive).toBe(false);
    });
  });

  describe('getUserActivity', () => {
    test('returns activity', async () => {
      jest.spyOn(mockPrisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(mockPrisma.session, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.securityLog, 'findMany').mockResolvedValue([]);
      const r = await getUserActivity('u1');
      expect(r.sessions).toBeDefined();
    });
  });

  describe('getBusinesses', () => {
    test('returns paginated businesses', async () => {
      jest.spyOn(mockPrisma.business, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([mockBiz]);
      const r = await getBusinesses({});
      expect(r.total).toBe(1);
    });
  });

  describe('getBusinessById', () => {
    test('returns business or throws', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      const r = await getBusinessById('b1');
      expect(r.id).toBe('b1');
    });
  });

  describe('updateBusinessStatus', () => {
    test('verifies business', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest
        .spyOn(mockPrisma.business, 'update')
        .mockResolvedValue({ ...mockBiz, isVerified: true, verificationStatus: 'VERIFIED' });
      const r = await updateBusinessStatus('b1', 'verify');
      expect(r.isVerified).toBe(true);
    });
  });

  describe('updateBusinessVerification', () => {
    test('verify action', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest
        .spyOn(mockPrisma.business, 'update')
        .mockResolvedValue({ ...mockBiz, verificationStatus: 'VERIFIED' });
      const r = await updateBusinessVerification('b1', 'verify');
      expect(r.verificationStatus).toBe('VERIFIED');
    });
  });

  describe('getDevelopers', () => {
    test('returns developers', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.developerProfile, 'findMany').mockResolvedValue([
        {
          id: 'd1',
          user: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', isActive: true },
          _count: {
            modules: 0,
            revenues: 0,
            payouts: 0,
            supportTickets: 0,
            developerModuleReviews: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ]);
      const r = await getDevelopers({});
      expect(r.total).toBe(1);
    });
  });

  describe('getDeveloperById', () => {
    test('returns or throws', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue({
        id: 'd1',
        user: mockUser,
        modules: [],
        revenues: [],
        payouts: [],
        supportTickets: [],
        developerModuleReviews: [],
      });
      const r = await getDeveloperById('d1');
      expect(r.id).toBe('d1');
    });
  });

  describe('updateDeveloperStatus', () => {
    test('verifies developer', async () => {
      jest.spyOn(mockPrisma.developerProfile, 'findUnique').mockResolvedValue({ id: 'd1' } as any);
      jest
        .spyOn(mockPrisma.developerProfile, 'update')
        .mockResolvedValue({ id: 'd1', verificationStatus: 'VERIFIED' } as any);
      const r = await updateDeveloperStatus('d1', 'verify');
      expect(r.verificationStatus).toBe('VERIFIED');
    });
  });

  describe('getModules / updateModuleStatus', () => {
    test('getModules returns', async () => {
      jest.spyOn(mockPrisma.developerModule, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.developerModule, 'findMany').mockResolvedValue([
        {
          id: 'm1',
          name: 'Mod',
          developer: { id: 'd1', companyName: 'Dev' },
          _count: { versions: 0, installations: 0, reviews: 0, supportTickets: 0 },
          createdAt: new Date(),
        } as any,
      ]);
      const r = await getModules({});
      expect(r.total).toBe(1);
    });
    test('updateModuleStatus publishes', async () => {
      jest
        .spyOn(mockPrisma.developerModule, 'findUnique')
        .mockResolvedValue({ id: 'm1', name: 'Mod' } as any);
      jest
        .spyOn(mockPrisma.developerModule, 'update')
        .mockResolvedValue({ id: 'm1', status: 'PUBLISHED' } as any);
      const r = await updateModuleStatus('m1', 'publish');
      expect(r.status).toBe('PUBLISHED');
    });
  });

  describe('getPayments', () => {
    test('returns payments', async () => {
      jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([
        {
          id: 'pm1',
          amount: 1000,
          createdAt: new Date(),
          user: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
          order: null,
        } as any,
      ]);
      const r = await getPayments({});
      expect(r.total).toBe(1);
    });
  });

  describe('getSubscriptions', () => {
    test('returns subscriptions', async () => {
      jest.spyOn(mockPrisma.partnerSubscription, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.partnerSubscription, 'findMany').mockResolvedValue([
        {
          id: 's1',
          partner: { id: 'p1', name: 'P', type: 'BUSINESS', email: 'e@e.com', logo: null },
          createdAt: new Date(),
        } as any,
      ]);
      const r = await getSubscriptions({});
      expect(r.total).toBe(1);
    });
  });

  describe('getSupportTickets', () => {
    test('returns tickets', async () => {
      jest.spyOn(mockPrisma.developerSupportTicket, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.developerSupportTicket, 'findMany').mockResolvedValue([
        {
          id: 't1',
          developer: null,
          module: null,
          business: null,
          messages: [],
          createdAt: new Date(),
        } as any,
      ]);
      const r = await getSupportTickets({});
      expect(r.total).toBe(1);
    });
  });

  describe('getDisputes', () => {
    test('returns disputes', async () => {
      jest.spyOn(mockPrisma.escrow, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.escrow, 'findMany').mockResolvedValue([
        {
          id: 'e1',
          amount: 50000,
          createdAt: new Date(),
          business: { id: 'b1', name: 'Biz' },
        } as any,
      ]);
      const r = await getDisputes({});
      expect(r.items).toHaveLength(1);
    });
  });

  describe('Escrow Admin', () => {
    test('getAdminEscrows returns', async () => {
      jest.spyOn(mockPrisma.escrow, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.escrow, 'findMany').mockResolvedValue([
        {
          id: 'e1',
          amount: 100000,
          status: 'HELD',
          createdAt: new Date(),
          business: { id: 'b1', name: 'Biz' },
        } as any,
      ]);
      const r = await getAdminEscrows({});
      expect(r.escrows).toHaveLength(1);
    });
    test('releaseAdminEscrow releases', async () => {
      jest
        .spyOn(mockPrisma.escrow, 'findUnique')
        .mockResolvedValue({ id: 'e1', status: 'HELD' } as any);
      jest
        .spyOn(mockPrisma.escrow, 'update')
        .mockResolvedValue({ id: 'e1', status: 'RELEASED' } as any);
      const r = await releaseAdminEscrow('e1');
      expect(r.status).toBe('RELEASED');
    });
    test('refundAdminEscrow refunds', async () => {
      jest
        .spyOn(mockPrisma.escrow, 'findUnique')
        .mockResolvedValue({ id: 'e1', status: 'DISPUTED' } as any);
      jest
        .spyOn(mockPrisma.escrow, 'update')
        .mockResolvedValue({ id: 'e1', status: 'REFUNDED' } as any);
      const r = await refundAdminEscrow('e1');
      expect(r.status).toBe('REFUNDED');
    });
  });

  describe('Payment Admin', () => {
    test('validatePayment validates', async () => {
      jest.spyOn(mockPrisma.payment, 'findUnique').mockResolvedValue({
        id: 'pm1',
        userId: 'u1',
        amount: 5000,
        description: 'Test',
        orderId: 'o1',
      } as any);
      jest
        .spyOn(mockPrisma.payment, 'update')
        .mockResolvedValue({ id: 'pm1', status: 'COMPLETED' } as any);
      const r = await validatePayment('pm1');
      expect(r.status).toBe('COMPLETED');
    });
    test('refundPayment refunds', async () => {
      jest.spyOn(mockPrisma.payment, 'findUnique').mockResolvedValue({
        id: 'pm1',
        userId: 'u1',
        amount: 5000,
        description: 'Test',
        orderId: 'o1',
      } as any);
      jest
        .spyOn(mockPrisma.payment, 'update')
        .mockResolvedValue({ id: 'pm1', status: 'REFUNDED' } as any);
      const r = await refundPayment('pm1');
      expect(r.status).toBe('REFUNDED');
    });
  });

  describe('Subscription Admin', () => {
    test('cancelAdminSubscription cancels', async () => {
      jest
        .spyOn(mockPrisma.partnerSubscription, 'findUnique')
        .mockResolvedValue({ id: 's1' } as any);
      jest
        .spyOn(mockPrisma.partnerSubscription, 'update')
        .mockResolvedValue({ id: 's1', status: 'CANCELLED' } as any);
      const r = await cancelAdminSubscription('s1');
      expect(r.status).toBe('CANCELLED');
    });
    test('renewAdminSubscription renews', async () => {
      jest
        .spyOn(mockPrisma.partnerSubscription, 'findUnique')
        .mockResolvedValue({ id: 's1' } as any);
      jest
        .spyOn(mockPrisma.partnerSubscription, 'update')
        .mockResolvedValue({ id: 's1', status: 'ACTIVE' } as any);
      const r = await renewAdminSubscription('s1');
      expect(r.status).toBe('ACTIVE');
    });
  });

  describe('Security Admin', () => {
    test('getAdminSecurityStats returns', async () => {
      jest.spyOn(mockPrisma.user, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.session, 'count').mockResolvedValue(20);
      jest.spyOn(mockPrisma.securityLog, 'count').mockResolvedValue(3);
      const r = await getAdminSecurityStats();
      expect(r.adminCount).toBe(5);
    });
    test('revokeAdminSession revokes', async () => {
      jest.spyOn(mockPrisma.session, 'findUnique').mockResolvedValue({ id: 's1' } as any);
      jest
        .spyOn(mockPrisma.session, 'update')
        .mockResolvedValue({ id: 's1', isActive: false } as any);
      const r = await revokeAdminSession('s1');
      expect(r.isActive).toBe(false);
    });
    test('blockAdminSecurityIp blocks', async () => {
      jest.spyOn(mockPrisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(mockPrisma.user, 'update').mockResolvedValue({ ...mockUser, isActive: false });
      const r = await blockAdminSecurityIp('127.0.0.1');
      expect(r.message).toContain('bloquée');
    });
    test('unblockAdminSecurityIp unblocks', async () => {
      jest.spyOn(mockPrisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(mockPrisma.user, 'update').mockResolvedValue({
        ...mockUser,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      const r = await unblockAdminSecurityIp('127.0.0.1');
      expect(r.message).toContain('débloquée');
    });
  });

  describe('Marketplace Admin', () => {
    test('getAdminMarketplaceItems returns featured', async () => {
      jest.spyOn(mockPrisma.business, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([
        {
          id: 'b1',
          name: 'Biz',
          type: 'RESTAURANT',
          email: 'a@b.com',
          country: 'TG',
          rating: 4,
          isVerified: true,
          isPremium: false,
          isTopSeller: false,
          createdAt: new Date(),
          _count: { products: 5, services: 2 },
        },
      ]);
      const r = await getAdminMarketplaceItems('featured', {});
      expect(r.items).toHaveLength(1);
    });
    test('updateAdminMarketplaceItem features', async () => {
      jest.spyOn(mockPrisma.business, 'update').mockResolvedValue(mockBiz);
      const r = await updateAdminMarketplaceItem('featured', 'b1', 'feature');
      expect(r.message).toContain('Mis en avant');
    });
  });

  describe('Ads Admin', () => {
    test('getAdminAdCampaigns returns', async () => {
      jest.spyOn(mockPrisma.adCampaign, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.adCampaign, 'findMany').mockResolvedValue([
        {
          id: 'c1',
          name: 'Camp',
          objective: 'BRAND',
          budget: 50000,
          status: 'ACTIVE',
          business: { id: 'b1', name: 'Biz' },
          companyName: null,
          createdAt: new Date(),
          _count: { impressions: 100, clicks: 10, creatives: 1 },
        } as any,
      ]);
      const r = await getAdminAdCampaigns({});
      expect(r.campaigns).toHaveLength(1);
    });
    test('validateAdminAdCampaign validates', async () => {
      jest
        .spyOn(mockPrisma.adCampaign, 'update')
        .mockResolvedValue({ id: 'c1', status: 'ACTIVE' } as any);
      const r = await validateAdminAdCampaign('c1');
      expect(r.status).toBe('ACTIVE');
    });
    test('rejectAdminAdCampaign rejects', async () => {
      jest
        .spyOn(mockPrisma.adCampaign, 'update')
        .mockResolvedValue({ id: 'c1', status: 'REJECTED' } as any);
      const r = await rejectAdminAdCampaign('c1', 'Bad content');
      expect(r.status).toBe('REJECTED');
    });
  });

  describe('AfriScore Admin', () => {
    test('getAdminAfriScoreStats returns', async () => {
      jest.spyOn(mockPrisma.businessScore, 'count').mockResolvedValue(30);
      jest
        .spyOn(mockPrisma.businessScore, 'aggregate')
        .mockResolvedValue({ _avg: { overallScore: 600 } } as any);
      jest.spyOn(mockPrisma.businessBadge, 'count').mockResolvedValue(15);
      jest.spyOn(mockPrisma.scoreHistory, 'count').mockResolvedValue(100);
      const r = await getAdminAfriScoreStats();
      expect(r.scoresCalculated).toBe(30);
    });
    test('getAdminAfriScoreRules returns rules', async () => {
      const r = await getAdminAfriScoreRules();
      expect(r.rules).toHaveLength(5);
    });
    test('recomputeAllAfriScores works', async () => {
      const r = await recomputeAfri();
      expect(r.success).toBe(true);
    });
  });

  describe('Partner Admin', () => {
    test('approveAdminPartner approves', async () => {
      jest.spyOn(mockPrisma.dataPartner, 'update').mockResolvedValue({} as any);
      const r = await approveAdminPartner('p1');
      expect(r.message).toContain('approuvé');
    });
    test('suspendAdminPartner suspends', async () => {
      jest.spyOn(mockPrisma.dataPartner, 'update').mockResolvedValue({} as any);
      const r = await suspendAdminPartner('p1');
      expect(r.message).toContain('suspendu');
    });
  });

  describe('Utility functions', () => {
    test('getBackups returns mock', async () => {
      const r = await getBackups();
      expect(r.backupCount).toBe(12);
    });
    test('createBackup returns success', async () => {
      const r = await createBackup('manual');
      expect(r.success).toBe(true);
    });
    test('restoreBackup returns success', async () => {
      const r = await restoreBackup('b1');
      expect(r.success).toBe(true);
    });
    test('getPlatformSettings reads real PlatformSetting table', async () => {
      jest.spyOn(mockPrisma.platformSetting, 'findMany').mockResolvedValue([
        { key: 'platformName', value: 'AfriBiz', category: 'general' },
        { key: 'maintenanceMode', value: false, category: 'general' },
        { key: 'commissionRate', value: '0.1', category: 'general' },
        { key: 'registrationOpen', value: true, category: 'general' },
      ] as any);
      const r = await getPlatSettings();
      expect(r.platformName).toBe('AfriBiz');
      expect(r.maintenanceMode).toBe(false);
      expect(r.commissionRate).toBe(0.1); // conversion string → number
      expect(r.registrationOpen).toBe(true); // conversion string → boolean
    });
    test('updatePlatformSettings persists to PlatformSetting table', async () => {
      jest.spyOn(mockPrisma.platformSetting, 'findMany').mockResolvedValue([
        { key: 'platformName', value: 'New', category: 'general' },
      ] as any);
      (mockPrisma.platformSetting as any).upsert = jest.fn().mockResolvedValue({});
      const r = await updatePlatSettings({ platformName: 'New' }, 'admin-1');
      expect(mockPrisma.platformSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { key: 'platformName' } })
      );
      expect(r.platformName).toBe('New');
    });
    test('getFraudReports returns empty', async () => {
      const r = await getFraudReports({});
      expect(r.items).toHaveLength(0);
    });
    test('getDataReports returns', async () => {
      jest.spyOn(mockPrisma.dataReport, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.dataReport, 'findMany').mockResolvedValue([
        {
          id: 'r1',
          partner: { id: 'p1', name: 'P', type: 'BANK' },
          createdAt: new Date(),
        } as any,
      ]);
      const r = await getDataReports({});
      expect(r.total).toBe(1);
    });
    test('getApiKeys returns', async () => {
      jest.spyOn(mockPrisma.dataPartner, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.dataPartner, 'findMany').mockResolvedValue([
        {
          id: 'k1',
          name: 'Key',
          type: 'API',
          email: 'a@b.com',
          apiKey: 'xxx',
          apiEnabled: true,
          apiQuota: 100,
          apiUsed: 10,
          isActive: true,
          createdAt: new Date(),
        },
      ]);
      const r = await getApiKeys({});
      expect(r.total).toBe(1);
    });
    test('getAdminAuditLog returns', async () => {
      jest.spyOn(mockPrisma.securityLog, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.securityLog, 'findMany').mockResolvedValue([
        {
          id: 'l1',
          action: 'LOGIN',
          ipAddress: '127.0.0.1',
          success: true,
          createdAt: new Date(),
          user: { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B' },
          userId: 'u1',
        } as any,
      ]);
      const r = await getAdminAuditLog({});
      expect(r.total).toBe(1);
    });
  });
});
