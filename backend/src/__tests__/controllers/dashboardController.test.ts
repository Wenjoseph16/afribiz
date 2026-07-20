import { mockPrisma } from '../setup';
import * as dashboardCtrl from '../../controllers/dashboardController';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data) => ({ success: true, data })),
}));

jest.mock('../../services/dashboardService', () => ({
  getClientDashboardData: jest.fn(),
  getBusinessDashboardData: jest.fn(),
  getDeveloperDashboardData: jest.fn(),
  getAdminDashboardData: jest.fn(),
}));

const dashboard = jest.requireMock('../../services/dashboardService');

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('dashboard controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClientDashboard', () => {
    it('should return client dashboard data', async () => {
      const data = { totalBookings: 5, upcomingAppointments: [] };
      (dashboard.getClientDashboardData as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getClientDashboard(req(), res, next);
      await flush();
      expect(dashboard.getClientDashboardData).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getClientDashboard({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getBusinessDashboard', () => {
    it('should return business dashboard data', async () => {
      const data = { totalRevenue: 10000, totalOrders: 20 };
      (dashboard.getBusinessDashboardData as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getBusinessDashboard(req({ query: { businessId: 'b1' } }), res, next);
      await flush();
      expect(dashboard.getBusinessDashboardData).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 400 if no businessId', async () => {
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getBusinessDashboard(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getDeveloperDashboard', () => {
    it('should return developer dashboard data', async () => {
      const data = { totalModules: 3, totalSales: 150 };
      (dashboard.getDeveloperDashboardData as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getDeveloperDashboard(req(), res, next);
      await flush();
      expect(dashboard.getDeveloperDashboardData).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getDeveloperDashboard({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard data', async () => {
      const data = { totalUsers: 1000, totalBusinesses: 200 };
      (dashboard.getAdminDashboardData as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getAdminDashboard(req(), res, next);
      await flush();
      expect(dashboard.getAdminDashboardData).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      dashboardCtrl.getAdminDashboard({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
