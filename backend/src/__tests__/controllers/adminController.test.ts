jest.mock('../../services/adminService', () => ({
  getDashboardStats: jest.fn(),
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  updateUserStatus: jest.fn(),
  getUserActivity: jest.fn(),
  getBusinesses: jest.fn(),
  getBusinessById: jest.fn(),
  updateBusinessStatus: jest.fn(),
  updateBusinessVerification: jest.fn(),
  getDevelopers: jest.fn(),
  getDeveloperById: jest.fn(),
  updateDeveloperStatus: jest.fn(),
  getModules: jest.fn(),
  updateModuleStatus: jest.fn(),
  getPayments: jest.fn(),
  getEscrows: jest.fn(),
  getSubscriptions: jest.fn(),
  getAdminEscrows: jest.fn(),
  getAdminEscrowStats: jest.fn(),
  releaseAdminEscrow: jest.fn(),
  refundAdminEscrow: jest.fn(),
  arbitrateAdminEscrow: jest.fn(),
  getAdminPaymentStats: jest.fn(),
  validatePayment: jest.fn(),
  refundPayment: jest.fn(),
  getAdminSubscriptionStats: jest.fn(),
  cancelAdminSubscription: jest.fn(),
  renewAdminSubscription: jest.fn(),
  getAdminSecurityStats: jest.fn(),
  getAdminSecurityAdmins: jest.fn(),
  getAdminSecuritySessions: jest.fn(),
  revokeAdminSession: jest.fn(),
  getAdminSecurityAttempts: jest.fn(),
  getAdminSecurityBlacklist: jest.fn(),
  blockAdminSecurityIp: jest.fn(),
  unblockAdminSecurityIp: jest.fn(),
  getAdminSecurityJournal: jest.fn(),
  getDisputesStats: jest.fn(),
  updateDisputeStatus: jest.fn(),
  getAdminMarketplaceItems: jest.fn(),
  updateAdminMarketplaceItem: jest.fn(),
  getAdminAdCampaigns: jest.fn(),
  getAdminAdStats: jest.fn(),
  getAdminAdRevenue: jest.fn(),
  validateAdminAdCampaign: jest.fn(),
  rejectAdminAdCampaign: jest.fn(),
  suspendAdminAdCampaign: jest.fn(),
  getAdminAfriScoreStats: jest.fn(),
  getAdminAfriScoreRules: jest.fn(),
  updateAdminAfriScoreRules: jest.fn(),
  getAdminAfriScoreBadges: jest.fn(),
  getAdminAfriScoreHistory: jest.fn(),
  getAdminAfriScoreAudit: jest.fn(),
  recomputeAllAfriScores: jest.fn(),
  getAdminPartners: jest.fn(),
  approveAdminPartner: jest.fn(),
  suspendAdminPartner: jest.fn(),
  revokeAdminPartner: jest.fn(),
  getAdminDataAccessLogs: jest.fn(),
  getAdminPlatformAnalytics: jest.fn(),
  getSupportTickets: jest.fn(),
  getDisputes: jest.fn(),
  getDataReports: jest.fn(),
  getNotifications: jest.fn(),
  getSecurityLogs: jest.fn(),
  getSystemLogs: jest.fn(),
  getBackups: jest.fn(),
  createBackup: jest.fn(),
  restoreBackup: jest.fn(),
  getApiKeys: jest.fn(),
  getFraudReports: jest.fn(),
  getPlatformSettings: jest.fn(),
  updatePlatformSettings: jest.fn(),
  getAdminAuditLog: jest.fn(),
}));

jest.mock('../../services/developerModules', () => ({
  getAllPayouts: jest.fn(),
  approvePayout: jest.fn(),
  rejectPayout: jest.fn(),
}));

import { NextFunction } from 'express';
import * as ctrl from '../../controllers/adminController';
import * as adminService from '../../services/adminService';
import { AppError } from '../../middlewares/errorHandler';

const flush = (): Promise<void> => new Promise((r) => setImmediate(r));

const mockRes = (): any => {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
};

const req = (overrides: Record<string, any> = {}): any => ({
  params: {},
  query: {},
  body: {},
  user: { id: 'admin-1', role: 'admin' },
  ...overrides,
});

const mockNext: NextFunction = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Dashboard & Users', () => {
  describe('getDashboardStats', () => {
    it('should return dashboard stats', async () => {
      const stats = { users: 10, businesses: 5 };
      (adminService.getDashboardStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getDashboardStats(req(), res, mockNext);
      await flush();

      expect(adminService.getDashboardStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const result = { users: [], total: 0 };
      (adminService.getUsers as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({
        query: { search: 'test', role: 'user', status: 'active', page: '2', limit: '5' },
      });

      await ctrl.getUsers(r, res, mockNext);
      await flush();

      expect(adminService.getUsers).toHaveBeenCalledWith({
        search: 'test',
        role: 'user',
        status: 'active',
        page: 2,
        limit: 5,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should use defaults when no query params', async () => {
      (adminService.getUsers as jest.Mock).mockResolvedValue({ users: [], total: 0 });
      const res = mockRes();

      await ctrl.getUsers(req(), res, mockNext);
      await flush();

      expect(adminService.getUsers).toHaveBeenCalledWith({
        search: undefined,
        role: undefined,
        status: undefined,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      const user = { id: 'u1', name: 'Test' };
      (adminService.getUserById as jest.Mock).mockResolvedValue(user);
      const res = mockRes();
      const r = req({ params: { id: 'u1' } });

      await ctrl.getUserById(r, res, mockNext);
      await flush();

      expect(adminService.getUserById).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: user });
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      const user = { id: 'u1', status: 'suspended' };
      (adminService.updateUserStatus as jest.Mock).mockResolvedValue(user);
      const res = mockRes();
      const r = req({ params: { id: 'u1' }, body: { action: 'suspend' } });

      await ctrl.updateUserStatus(r, res, mockNext);
      await flush();

      expect(adminService.updateUserStatus).toHaveBeenCalledWith('u1', 'suspend', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: user,
        message: 'Statut mis à jour',
      });
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity', async () => {
      const activity = [{ action: 'login', date: new Date() }];
      (adminService.getUserActivity as jest.Mock).mockResolvedValue(activity);
      const res = mockRes();
      const r = req({ params: { id: 'u1' } });

      await ctrl.getUserActivity(r, res, mockNext);
      await flush();

      expect(adminService.getUserActivity).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: activity });
    });
  });
});

describe('Businesses', () => {
  describe('getBusinesses', () => {
    it('should return paginated businesses', async () => {
      const result = { businesses: [], total: 0 };
      (adminService.getBusinesses as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({
        query: { search: 'shop', status: 'active', verified: 'true', page: '1', limit: '20' },
      });

      await ctrl.getBusinesses(r, res, mockNext);
      await flush();

      expect(adminService.getBusinesses).toHaveBeenCalledWith({
        search: 'shop',
        status: 'active',
        verified: 'true',
        page: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getBusinessById', () => {
    it('should return a business by id', async () => {
      const business = { id: 'b1', name: 'Biz' };
      (adminService.getBusinessById as jest.Mock).mockResolvedValue(business);
      const res = mockRes();
      const r = req({ params: { id: 'b1' } });

      await ctrl.getBusinessById(r, res, mockNext);
      await flush();

      expect(adminService.getBusinessById).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: business });
    });
  });

  describe('updateBusinessStatus', () => {
    it('should update business status', async () => {
      const business = { id: 'b1', status: 'approved' };
      (adminService.updateBusinessStatus as jest.Mock).mockResolvedValue(business);
      const res = mockRes();
      const r = req({ params: { id: 'b1' }, body: { action: 'approve' } });

      await ctrl.updateBusinessStatus(r, res, mockNext);
      await flush();

      expect(adminService.updateBusinessStatus).toHaveBeenCalledWith('b1', 'approve', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: business,
        message: 'Statut mis à jour',
      });
    });
  });

  describe('updateBusinessVerification', () => {
    it('should verify a business', async () => {
      const business = { id: 'b1', verified: true };
      (adminService.updateBusinessVerification as jest.Mock).mockResolvedValue(business);
      const res = mockRes();
      const r = req({
        params: { id: 'b1' },
        body: { action: 'verify', rejectionReason: undefined },
      });

      await ctrl.updateBusinessVerification(r, res, mockNext);
      await flush();

      expect(adminService.updateBusinessVerification).toHaveBeenCalledWith(
        'b1',
        'verify',
        undefined,
        'admin-1'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: business,
        message: 'Commerce vérifié avec succès',
      });
    });

    it('should reject a business', async () => {
      const business = { id: 'b1', verified: false };
      (adminService.updateBusinessVerification as jest.Mock).mockResolvedValue(business);
      const res = mockRes();
      const r = req({
        params: { id: 'b1' },
        body: { action: 'reject', rejectionReason: 'docs invalides' },
      });

      await ctrl.updateBusinessVerification(r, res, mockNext);
      await flush();

      expect(adminService.updateBusinessVerification).toHaveBeenCalledWith(
        'b1',
        'reject',
        'docs invalides',
        'admin-1'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: business,
        message: 'Commerce refusé',
      });
    });
  });
});

describe('Developers & Modules', () => {
  describe('getDevelopers', () => {
    it('should return paginated developers', async () => {
      const result = { developers: [], total: 0 };
      (adminService.getDevelopers as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({
        query: { search: 'dev', status: 'active', verified: 'true', page: '2', limit: '5' },
      });

      await ctrl.getDevelopers(r, res, mockNext);
      await flush();

      expect(adminService.getDevelopers).toHaveBeenCalledWith({
        search: 'dev',
        status: 'active',
        verified: 'true',
        page: 2,
        limit: 5,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getDeveloperById', () => {
    it('should return a developer by id', async () => {
      const developer = { id: 'd1', name: 'Dev' };
      (adminService.getDeveloperById as jest.Mock).mockResolvedValue(developer);
      const res = mockRes();
      const r = req({ params: { id: 'd1' } });

      await ctrl.getDeveloperById(r, res, mockNext);
      await flush();

      expect(adminService.getDeveloperById).toHaveBeenCalledWith('d1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: developer });
    });
  });

  describe('updateDeveloperStatus', () => {
    it('should update developer status', async () => {
      const developer = { id: 'd1', status: 'approved' };
      (adminService.updateDeveloperStatus as jest.Mock).mockResolvedValue(developer);
      const res = mockRes();
      const r = req({ params: { id: 'd1' }, body: { action: 'approve' } });

      await ctrl.updateDeveloperStatus(r, res, mockNext);
      await flush();

      expect(adminService.updateDeveloperStatus).toHaveBeenCalledWith('d1', 'approve', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: developer,
        message: 'Statut mis à jour',
      });
    });
  });

  describe('getModules', () => {
    it('should return paginated modules', async () => {
      const result = { modules: [], total: 0 };
      (adminService.getModules as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { search: 'mod', status: 'published', page: '1', limit: '10' } });

      await ctrl.getModules(r, res, mockNext);
      await flush();

      expect(adminService.getModules).toHaveBeenCalledWith({
        search: 'mod',
        status: 'published',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('updateModuleStatus', () => {
    it('should update module status', async () => {
      const mod = { id: 'm1', status: 'approved' };
      (adminService.updateModuleStatus as jest.Mock).mockResolvedValue(mod);
      const res = mockRes();
      const r = req({ params: { id: 'm1' }, body: { action: 'approve' } });

      await ctrl.updateModuleStatus(r, res, mockNext);
      await flush();

      expect(adminService.updateModuleStatus).toHaveBeenCalledWith('m1', 'approve', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mod,
        message: 'Statut mis à jour',
      });
    });
  });
});

describe('Payments', () => {
  describe('getPayments', () => {
    it('should return paginated payments', async () => {
      const result = { payments: [], total: 0 };
      (adminService.getPayments as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'completed', page: '1', limit: '10' } });

      await ctrl.getPayments(r, res, mockNext);
      await flush();

      expect(adminService.getPayments).toHaveBeenCalledWith({
        status: 'completed',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminPaymentStats', () => {
    it('should return payment stats', async () => {
      const stats = { total: 1000, pending: 5 };
      (adminService.getAdminPaymentStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getAdminPaymentStats(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminPaymentStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('validatePayment', () => {
    it('should validate a payment', async () => {
      const result = { id: 'p1', status: 'validated' };
      (adminService.validatePayment as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'p1' } });

      await ctrl.validatePayment(r, res, mockNext);
      await flush();

      expect(adminService.validatePayment).toHaveBeenCalledWith('p1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Paiement validé',
      });
    });
  });

  describe('refundPayment', () => {
    it('should refund a payment', async () => {
      const result = { id: 'p1', status: 'refunded' };
      (adminService.refundPayment as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'p1' } });

      await ctrl.refundPayment(r, res, mockNext);
      await flush();

      expect(adminService.refundPayment).toHaveBeenCalledWith('p1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Remboursement effectué',
      });
    });
  });
});

describe('Escrows', () => {
  describe('getEscrows', () => {
    it('should return paginated escrows', async () => {
      const result = { escrows: [], total: 0 };
      (adminService.getEscrows as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'held', page: '1', limit: '10' } });

      await ctrl.getEscrows(r, res, mockNext);
      await flush();

      expect(adminService.getEscrows).toHaveBeenCalledWith({ status: 'held', page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminEscrows', () => {
    it('should return admin escrows', async () => {
      const result = { escrows: [], total: 0 };
      (adminService.getAdminEscrows as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'active', page: '1', limit: '10' } });

      await ctrl.getAdminEscrows(r, res, mockNext);
      await flush();

      expect(adminService.getAdminEscrows).toHaveBeenCalledWith({
        status: 'active',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminEscrowStats', () => {
    it('should return escrow stats', async () => {
      const stats = { total: 50, released: 30 };
      (adminService.getAdminEscrowStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getAdminEscrowStats(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminEscrowStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('releaseAdminEscrow', () => {
    it('should release an escrow', async () => {
      const result = { id: 'e1', status: 'released' };
      (adminService.releaseAdminEscrow as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'e1' } });

      await ctrl.releaseAdminEscrow(r, res, mockNext);
      await flush();

      expect(adminService.releaseAdminEscrow).toHaveBeenCalledWith('e1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Fonds libérés',
      });
    });
  });

  describe('refundAdminEscrow', () => {
    it('should refund an escrow', async () => {
      const result = { id: 'e1', status: 'refunded' };
      (adminService.refundAdminEscrow as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'e1' } });

      await ctrl.refundAdminEscrow(r, res, mockNext);
      await flush();

      expect(adminService.refundAdminEscrow).toHaveBeenCalledWith('e1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Remboursement effectué',
      });
    });
  });

  describe('arbitrateAdminEscrow', () => {
    it('should arbitrate an escrow', async () => {
      const result = { id: 'e1', status: 'resolved' };
      (adminService.arbitrateAdminEscrow as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'e1' }, body: { decision: 'buyer' } });

      await ctrl.arbitrateAdminEscrow(r, res, mockNext);
      await flush();

      expect(adminService.arbitrateAdminEscrow).toHaveBeenCalledWith('e1', 'buyer', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Arbitrage effectué',
      });
    });
  });
});

describe('Subscriptions', () => {
  describe('getSubscriptions', () => {
    it('should return paginated subscriptions', async () => {
      const result = { subscriptions: [], total: 0 };
      (adminService.getSubscriptions as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'active', page: '1', limit: '10' } });

      await ctrl.getSubscriptions(r, res, mockNext);
      await flush();

      expect(adminService.getSubscriptions).toHaveBeenCalledWith({
        status: 'active',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminSubscriptionStats', () => {
    it('should return subscription stats', async () => {
      const stats = { total: 100, active: 80 };
      (adminService.getAdminSubscriptionStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getAdminSubscriptionStats(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminSubscriptionStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('cancelAdminSubscription', () => {
    it('should cancel a subscription', async () => {
      const result = { id: 's1', status: 'cancelled' };
      (adminService.cancelAdminSubscription as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 's1' } });

      await ctrl.cancelAdminSubscription(r, res, mockNext);
      await flush();

      expect(adminService.cancelAdminSubscription).toHaveBeenCalledWith('s1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Abonnement résilié',
      });
    });
  });

  describe('renewAdminSubscription', () => {
    it('should renew a subscription', async () => {
      const result = { id: 's1', status: 'active' };
      (adminService.renewAdminSubscription as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 's1' } });

      await ctrl.renewAdminSubscription(r, res, mockNext);
      await flush();

      expect(adminService.renewAdminSubscription).toHaveBeenCalledWith('s1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Abonnement renouvelé',
      });
    });
  });
});

describe('Security', () => {
  describe('getAdminSecurityStats', () => {
    it('should return security stats', async () => {
      const stats = { attempts: 100, blocked: 5 };
      (adminService.getAdminSecurityStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getAdminSecurityStats(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminSecurityStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('getAdminSecurityAdmins', () => {
    it('should return security admins list', async () => {
      const result = { admins: [], total: 0 };
      (adminService.getAdminSecurityAdmins as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '2', limit: '15' } });

      await ctrl.getAdminSecurityAdmins(r, res, mockNext);
      await flush();

      expect(adminService.getAdminSecurityAdmins).toHaveBeenCalledWith({ page: 2, limit: 15 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminSecuritySessions', () => {
    it('should return security sessions', async () => {
      const result = { sessions: [], total: 0 };
      (adminService.getAdminSecuritySessions as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '15' } });

      await ctrl.getAdminSecuritySessions(r, res, mockNext);
      await flush();

      expect(adminService.getAdminSecuritySessions).toHaveBeenCalledWith({ page: 1, limit: 15 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('revokeAdminSession', () => {
    it('should revoke a session', async () => {
      (adminService.revokeAdminSession as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const r = req({ params: { id: 'sess-1' } });

      await ctrl.revokeAdminSession(r, res, mockNext);
      await flush();

      expect(adminService.revokeAdminSession).toHaveBeenCalledWith('sess-1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Session révoquée',
      });
    });
  });

  describe('getAdminSecurityAttempts', () => {
    it('should return security attempts', async () => {
      const result = { attempts: [], total: 0 };
      (adminService.getAdminSecurityAttempts as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '15' } });

      await ctrl.getAdminSecurityAttempts(r, res, mockNext);
      await flush();

      expect(adminService.getAdminSecurityAttempts).toHaveBeenCalledWith({ page: 1, limit: 15 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminSecurityBlacklist', () => {
    it('should return security blacklist', async () => {
      const result = { ips: [], total: 0 };
      (adminService.getAdminSecurityBlacklist as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '15' } });

      await ctrl.getAdminSecurityBlacklist(r, res, mockNext);
      await flush();

      expect(adminService.getAdminSecurityBlacklist).toHaveBeenCalledWith({ page: 1, limit: 15 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('blockAdminSecurityIp', () => {
    it('should block an IP', async () => {
      const result = { ip: '192.168.1.1', blocked: true };
      (adminService.blockAdminSecurityIp as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ body: { ip: '192.168.1.1' } });

      await ctrl.blockAdminSecurityIp(r, res, mockNext);
      await flush();

      expect(adminService.blockAdminSecurityIp).toHaveBeenCalledWith('192.168.1.1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'IP 192.168.1.1 bloquée',
      });
    });
  });

  describe('unblockAdminSecurityIp', () => {
    it('should unblock an IP', async () => {
      const result = { ip: '192.168.1.1', blocked: false };
      (adminService.unblockAdminSecurityIp as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { ip: '192.168.1.1' } });

      await ctrl.unblockAdminSecurityIp(r, res, mockNext);
      await flush();

      expect(adminService.unblockAdminSecurityIp).toHaveBeenCalledWith('192.168.1.1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'IP débloquée',
      });
    });
  });

  describe('getAdminSecurityJournal', () => {
    it('should return security journal', async () => {
      const result = { entries: [], total: 0 };
      (adminService.getAdminSecurityJournal as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '15' } });

      await ctrl.getAdminSecurityJournal(r, res, mockNext);
      await flush();

      expect(adminService.getAdminSecurityJournal).toHaveBeenCalledWith({ page: 1, limit: 15 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });
});

describe('Disputes', () => {
  describe('getDisputesStats', () => {
    it('should return dispute stats', async () => {
      const stats = { total: 10, open: 3 };
      (adminService.getDisputesStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getDisputesStats(req(), res, mockNext);
      await flush();

      expect(adminService.getDisputesStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('updateDisputeStatus', () => {
    it('should update dispute status', async () => {
      const result = { id: 'disp-1', status: 'closed' };
      (adminService.updateDisputeStatus as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'disp-1', action: 'close' } });

      await ctrl.updateDisputeStatus(r, res, mockNext);
      await flush();

      expect(adminService.updateDisputeStatus).toHaveBeenCalledWith(
        'disp-1',
        'close',
        'admin-1',
        undefined
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Statut du litige mis à jour',
      });
    });
  });

  describe('getDisputes', () => {
    it('should return paginated disputes', async () => {
      const result = { disputes: [], total: 0 };
      (adminService.getDisputes as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'open', page: '1', limit: '10' } });

      await ctrl.getDisputes(r, res, mockNext);
      await flush();

      expect(adminService.getDisputes).toHaveBeenCalledWith({ status: 'open', page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });
});

describe('Marketplace', () => {
  describe('getAdminMarketplaceItems', () => {
    it('should return marketplace items by type', async () => {
      const result = { items: [], total: 0 };
      (adminService.getAdminMarketplaceItems as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { type: 'products' }, query: { page: '1', limit: '20' } });

      await ctrl.getAdminMarketplaceItems(r, res, mockNext);
      await flush();

      expect(adminService.getAdminMarketplaceItems).toHaveBeenCalledWith('products', {
        page: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('updateAdminMarketplaceItem', () => {
    it('should update a marketplace item', async () => {
      const result = { id: 'item-1', featured: true };
      (adminService.updateAdminMarketplaceItem as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { type: 'products', id: 'item-1', action: 'feature' } });

      await ctrl.updateAdminMarketplaceItem(r, res, mockNext);
      await flush();

      expect(adminService.updateAdminMarketplaceItem).toHaveBeenCalledWith(
        'products',
        'item-1',
        'feature'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: 'Mis à jour' });
    });
  });
});

describe('Ads', () => {
  describe('getAdminAdCampaigns', () => {
    it('should return paginated ad campaigns', async () => {
      const result = { campaigns: [], total: 0 };
      (adminService.getAdminAdCampaigns as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'active', search: 'camp', page: '1', limit: '10' } });

      await ctrl.getAdminAdCampaigns(r, res, mockNext);
      await flush();

      expect(adminService.getAdminAdCampaigns).toHaveBeenCalledWith({
        status: 'active',
        search: 'camp',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminAdStats', () => {
    it('should return ad stats', async () => {
      const stats = { impressions: 1000, clicks: 50 };
      (adminService.getAdminAdStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getAdminAdStats(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminAdStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('getAdminAdRevenue', () => {
    it('should return ad revenue', async () => {
      const revenue = { total: 5000, pending: 200 };
      (adminService.getAdminAdRevenue as jest.Mock).mockResolvedValue(revenue);
      const res = mockRes();

      await ctrl.getAdminAdRevenue(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminAdRevenue).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: revenue });
    });
  });

  describe('validateAdminAdCampaign', () => {
    it('should validate an ad campaign', async () => {
      const result = { id: 'camp-1', status: 'active' };
      (adminService.validateAdminAdCampaign as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'camp-1' } });

      await ctrl.validateAdminAdCampaign(r, res, mockNext);
      await flush();

      expect(adminService.validateAdminAdCampaign).toHaveBeenCalledWith('camp-1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Campagne validée',
      });
    });
  });

  describe('rejectAdminAdCampaign', () => {
    it('should reject an ad campaign', async () => {
      const result = { id: 'camp-1', status: 'rejected' };
      (adminService.rejectAdminAdCampaign as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'camp-1' }, body: { reason: 'inappropriate' } });

      await ctrl.rejectAdminAdCampaign(r, res, mockNext);
      await flush();

      expect(adminService.rejectAdminAdCampaign).toHaveBeenCalledWith(
        'camp-1',
        'inappropriate',
        'admin-1'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Campagne refusée',
      });
    });
  });

  describe('suspendAdminAdCampaign', () => {
    it('should suspend an ad campaign', async () => {
      const result = { id: 'camp-1', status: 'suspended' };
      (adminService.suspendAdminAdCampaign as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'camp-1' }, body: { reason: 'policy violation' } });

      await ctrl.suspendAdminAdCampaign(r, res, mockNext);
      await flush();

      expect(adminService.suspendAdminAdCampaign).toHaveBeenCalledWith(
        'camp-1',
        'policy violation',
        'admin-1'
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Campagne suspendue',
      });
    });
  });
});

describe('AfriScore', () => {
  describe('getAdminAfriScoreStats', () => {
    it('should return afriscore stats', async () => {
      const stats = { average: 75, total: 100 };
      (adminService.getAdminAfriScoreStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();

      await ctrl.getAdminAfriScoreStats(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminAfriScoreStats).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('getAdminAfriScoreRules', () => {
    it('should return afriscore rules', async () => {
      const result = { rules: [] };
      (adminService.getAdminAfriScoreRules as jest.Mock).mockResolvedValue(result);
      const res = mockRes();

      await ctrl.getAdminAfriScoreRules(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminAfriScoreRules).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('updateAdminAfriScoreRules', () => {
    it('should update afriscore rules', async () => {
      const result = { rules: [{ name: 'rule1', weight: 10 }] };
      (adminService.updateAdminAfriScoreRules as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ body: { rules: [{ name: 'rule1', weight: 10 }] } });

      await ctrl.updateAdminAfriScoreRules(r, res, mockNext);
      await flush();

      expect(adminService.updateAdminAfriScoreRules).toHaveBeenCalledWith({
        rules: [{ name: 'rule1', weight: 10 }],
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Règles mises à jour',
      });
    });
  });

  describe('getAdminAfriScoreBadges', () => {
    it('should return afriscore badges', async () => {
      const result = { badges: [], total: 0 };
      (adminService.getAdminAfriScoreBadges as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '2', limit: '10' } });

      await ctrl.getAdminAfriScoreBadges(r, res, mockNext);
      await flush();

      expect(adminService.getAdminAfriScoreBadges).toHaveBeenCalledWith({ page: 2, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminAfriScoreHistory', () => {
    it('should return afriscore history', async () => {
      const result = { history: [], total: 0 };
      (adminService.getAdminAfriScoreHistory as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '10' } });

      await ctrl.getAdminAfriScoreHistory(r, res, mockNext);
      await flush();

      expect(adminService.getAdminAfriScoreHistory).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminAfriScoreAudit', () => {
    it('should return afriscore audit', async () => {
      const result = { audit: [], total: 0 };
      (adminService.getAdminAfriScoreAudit as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '10' } });

      await ctrl.getAdminAfriScoreAudit(r, res, mockNext);
      await flush();

      expect(adminService.getAdminAfriScoreAudit).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('recomputeAllAfriScores', () => {
    it('should recompute all afriscores', async () => {
      const result = { processed: 100 };
      (adminService.recomputeAllAfriScores as jest.Mock).mockResolvedValue(result);
      const res = mockRes();

      await ctrl.recomputeAllAfriScores(req(), res, mockNext);
      await flush();

      expect(adminService.recomputeAllAfriScores).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Recalcul lancé',
      });
    });
  });
});

describe('Partners / Data Hub', () => {
  describe('getAdminPartners', () => {
    it('should return paginated partners', async () => {
      const result = { partners: [], total: 0 };
      (adminService.getAdminPartners as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '50' } });

      await ctrl.getAdminPartners(r, res, mockNext);
      await flush();

      expect(adminService.getAdminPartners).toHaveBeenCalledWith({ page: 1, limit: 50 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('approveAdminPartner', () => {
    it('should approve a partner', async () => {
      const result = { id: 'part-1', status: 'approved' };
      (adminService.approveAdminPartner as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'part-1' } });

      await ctrl.approveAdminPartner(r, res, mockNext);
      await flush();

      expect(adminService.approveAdminPartner).toHaveBeenCalledWith('part-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Partenaire approuvé',
      });
    });
  });

  describe('suspendAdminPartner', () => {
    it('should suspend a partner', async () => {
      const result = { id: 'part-1', status: 'suspended' };
      (adminService.suspendAdminPartner as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'part-1' } });

      await ctrl.suspendAdminPartner(r, res, mockNext);
      await flush();

      expect(adminService.suspendAdminPartner).toHaveBeenCalledWith('part-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Partenaire suspendu',
      });
    });
  });

  describe('revokeAdminPartner', () => {
    it('should revoke a partner access', async () => {
      const result = { id: 'part-1', access: false };
      (adminService.revokeAdminPartner as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'part-1' } });

      await ctrl.revokeAdminPartner(r, res, mockNext);
      await flush();

      expect(adminService.revokeAdminPartner).toHaveBeenCalledWith('part-1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Accès révoqué',
      });
    });
  });

  describe('getAdminDataAccessLogs', () => {
    it('should return data access logs', async () => {
      const result = { logs: [], total: 0 };
      (adminService.getAdminDataAccessLogs as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '50' } });

      await ctrl.getAdminDataAccessLogs(r, res, mockNext);
      await flush();

      expect(adminService.getAdminDataAccessLogs).toHaveBeenCalledWith({ page: 1, limit: 50 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminPlatformAnalytics', () => {
    it('should return platform analytics', async () => {
      const result = { users: 100, revenue: 5000 };
      (adminService.getAdminPlatformAnalytics as jest.Mock).mockResolvedValue(result);
      const res = mockRes();

      await ctrl.getAdminPlatformAnalytics(req(), res, mockNext);
      await flush();

      expect(adminService.getAdminPlatformAnalytics).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });
});

describe('Support & Reports & Logs', () => {
  describe('getSupportTickets', () => {
    it('should return paginated support tickets', async () => {
      const result = { tickets: [], total: 0 };
      (adminService.getSupportTickets as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'open', priority: 'high', page: '1', limit: '10' } });

      await ctrl.getSupportTickets(r, res, mockNext);
      await flush();

      expect(adminService.getSupportTickets).toHaveBeenCalledWith({
        status: 'open',
        priority: 'high',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getDataReports', () => {
    it('should return paginated data reports', async () => {
      const result = { reports: [], total: 0 };
      (adminService.getDataReports as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({
        query: { type: 'transactions', status: 'completed', page: '1', limit: '10' },
      });

      await ctrl.getDataReports(r, res, mockNext);
      await flush();

      expect(adminService.getDataReports).toHaveBeenCalledWith({
        type: 'transactions',
        status: 'completed',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      const result = { notifications: [], total: 0 };
      (adminService.getNotifications as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { type: 'alert', page: '1', limit: '10' } });

      await ctrl.getNotifications(r, res, mockNext);
      await flush();

      expect(adminService.getNotifications).toHaveBeenCalledWith({
        type: 'alert',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getSecurityLogs', () => {
    it('should return paginated security logs', async () => {
      const result = { logs: [], total: 0 };
      (adminService.getSecurityLogs as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { action: 'login', userId: 'u1', page: '1', limit: '10' } });

      await ctrl.getSecurityLogs(r, res, mockNext);
      await flush();

      expect(adminService.getSecurityLogs).toHaveBeenCalledWith({
        action: 'login',
        userId: 'u1',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getSystemLogs', () => {
    it('should return paginated system logs', async () => {
      const result = { logs: [], total: 0 };
      (adminService.getSystemLogs as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { module: 'auth', action: 'error', page: '1', limit: '10' } });

      await ctrl.getSystemLogs(r, res, mockNext);
      await flush();

      expect(adminService.getSystemLogs).toHaveBeenCalledWith({
        module: 'auth',
        action: 'error',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getAdminAuditLog', () => {
    it('should return paginated audit log', async () => {
      const result = { entries: [], total: 0 };
      (adminService.getAdminAuditLog as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { adminId: 'admin-1', action: 'delete', page: '1', limit: '10' } });

      await ctrl.getAdminAuditLog(r, res, mockNext);
      await flush();

      expect(adminService.getAdminAuditLog).toHaveBeenCalledWith({
        adminId: 'admin-1',
        action: 'delete',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });
});

describe('Backups & API Keys & Settings', () => {
  describe('getBackups', () => {
    it('should return backups', async () => {
      const backups = [{ id: 'bkp-1', date: new Date() }];
      (adminService.getBackups as jest.Mock).mockResolvedValue(backups);
      const res = mockRes();

      await ctrl.getBackups(req(), res, mockNext);
      await flush();

      expect(adminService.getBackups).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: backups });
    });
  });

  describe('createBackup', () => {
    it('should create a backup with default action', async () => {
      const result = { id: 'bkp-1', status: 'created' };
      (adminService.createBackup as jest.Mock).mockResolvedValue(result);
      const res = mockRes();

      await ctrl.createBackup(req(), res, mockNext);
      await flush();

      expect(adminService.createBackup).toHaveBeenCalledWith('manual');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should create a backup with specified action', async () => {
      const result = { id: 'bkp-2', status: 'created' };
      (adminService.createBackup as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ body: { action: 'auto' } });

      await ctrl.createBackup(r, res, mockNext);
      await flush();

      expect(adminService.createBackup).toHaveBeenCalledWith('auto');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('restoreBackup', () => {
    it('should restore a backup', async () => {
      const result = { id: 'bkp-1', status: 'restored' };
      (adminService.restoreBackup as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ body: { backupId: 'bkp-1' } });

      await ctrl.restoreBackup(r, res, mockNext);
      await flush();

      expect(adminService.restoreBackup).toHaveBeenCalledWith('bkp-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getApiKeys', () => {
    it('should return paginated API keys', async () => {
      const result = { keys: [], total: 0 };
      (adminService.getApiKeys as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { page: '1', limit: '10' } });

      await ctrl.getApiKeys(r, res, mockNext);
      await flush();

      expect(adminService.getApiKeys).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getFraudReports', () => {
    it('should return paginated fraud reports', async () => {
      const result = { reports: [], total: 0 };
      (adminService.getFraudReports as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ query: { status: 'pending', page: '1', limit: '10' } });

      await ctrl.getFraudReports(r, res, mockNext);
      await flush();

      expect(adminService.getFraudReports).toHaveBeenCalledWith({
        status: 'pending',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getPlatformSettings', () => {
    it('should return platform settings', async () => {
      const settings = { maintenance: false };
      (adminService.getPlatformSettings as jest.Mock).mockResolvedValue(settings);
      const res = mockRes();

      await ctrl.getPlatformSettings(req(), res, mockNext);
      await flush();

      expect(adminService.getPlatformSettings).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: settings });
    });
  });

  describe('updatePlatformSettings', () => {
    it('should update platform settings', async () => {
      const result = { maintenance: true };
      (adminService.updatePlatformSettings as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const r = req({ body: { maintenance: true } });

      await ctrl.updatePlatformSettings(r, res, mockNext);
      await flush();

      expect(adminService.updatePlatformSettings).toHaveBeenCalledWith(
        { maintenance: true },
        'admin-1'
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });
});

describe('Payouts (dynamic import from developerModules)', () => {
  const getDevModules = () =>
    jest.requireMock('../../services/developerModules') as {
      getAllPayouts: jest.Mock;
      approvePayout: jest.Mock;
      rejectPayout: jest.Mock;
    };

  describe('getAllPayouts', () => {
    it('should return all payouts', async () => {
      const payouts = [{ id: 'po-1', amount: 100 }];
      getDevModules().getAllPayouts.mockResolvedValue(payouts);
      const res = mockRes();
      const r = req({ query: { status: 'pending', developerId: 'dev-1' } });

      await ctrl.getAllPayouts(r, res, mockNext);
      await flush();

      expect(getDevModules().getAllPayouts).toHaveBeenCalledWith({
        status: 'pending',
        developerId: 'dev-1',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: payouts });
    });
  });

  describe('approvePayout', () => {
    it('should approve a payout', async () => {
      const result = { success: true };
      getDevModules().approvePayout.mockResolvedValue(result);
      const res = mockRes();
      const r = req({ params: { id: 'po-1' }, user: { id: 'admin-1' } });

      await ctrl.approvePayout(r, res, mockNext);
      await flush();

      expect(getDevModules().approvePayout).toHaveBeenCalledWith('po-1', 'admin-1');
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should throw AppError when user is not authenticated', async () => {
      const next = jest.fn();
      const res = mockRes();
      const r = req({ params: { id: 'po-1' }, user: null });

      await ctrl.approvePayout(r, res, next);
      await flush();

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toBe('Non authentifié');
    });
  });

  describe('rejectPayout', () => {
    it('should reject a payout', async () => {
      const result = { success: true };
      getDevModules().rejectPayout.mockResolvedValue(result);
      const res = mockRes();
      const r = req({
        params: { id: 'po-1' },
        body: { reason: 'docs invalides' },
        user: { id: 'admin-1' },
      });

      await ctrl.rejectPayout(r, res, mockNext);
      await flush();

      expect(getDevModules().rejectPayout).toHaveBeenCalledWith(
        'po-1',
        'admin-1',
        'docs invalides'
      );
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should throw AppError when user is not authenticated', async () => {
      const next = jest.fn();
      const res = mockRes();
      const r = req({ params: { id: 'po-1' }, user: null });

      await ctrl.rejectPayout(r, res, next);
      await flush();

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(401);
      expect(next.mock.calls[0][0].message).toBe('Non authentifié');
    });
  });
});
