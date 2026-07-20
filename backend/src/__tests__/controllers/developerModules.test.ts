jest.mock('../../services/developerModules', () => ({
  createModule: jest.fn(),
  updateModule: jest.fn(),
  publishModule: jest.fn(),
  archiveModule: jest.fn(),
  getDeveloperModules: jest.fn(),
  getModuleById: jest.fn(),
  getModuleBySlug: jest.fn(),
  getMarketplaceModules: jest.fn(),
  startTrial: jest.fn(),
  purchaseModule: jest.fn(),
  confirmModulePayment: jest.fn(),
  installModule: jest.fn(),
  uninstallModule: jest.fn(),
  reinstallModule: jest.fn(),
  createModuleVersion: jest.fn(),
  getModuleVersions: jest.fn(),
  createReview: jest.fn(),
  getModuleReviews: jest.fn(),
  respondToReview: jest.fn(),
  createTicket: jest.fn(),
  getMyTickets: jest.fn(),
  getTicketById: jest.fn(),
  replyToTicket: jest.fn(),
  updateTicketStatus: jest.fn(),
  getDeveloperInstallations: jest.fn(),
  getDeveloperOrders: jest.fn(),
  getDeveloperSubscriptions: jest.fn(),
  getRevenueHistory: jest.fn(),
  getRevenueSummary: jest.fn(),
  getPayoutHistory: jest.fn(),
  requestPayout: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/developerModules';
import * as svc from '../../services/developerModules';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('developerModules controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('module CRUD', () => {
    it('createModule', async () => {
      (svc.createModule as jest.Mock).mockResolvedValue({ id: 'm1' });
      const res = mockRes();
      ctrl.createModule(req({ body: { name: 'My Module' } }), res, jest.fn());
      await flush();
      expect(svc.createModule).toHaveBeenCalledWith('u1', { name: 'My Module' });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updateModule', async () => {
      (svc.updateModule as jest.Mock).mockResolvedValue({ id: 'm1' });
      const res = mockRes();
      ctrl.updateModule(req({ params: { id: 'm1' }, body: { name: 'Updated' } }), res, jest.fn());
      await flush();
      expect(svc.updateModule).toHaveBeenCalledWith('m1', 'u1', { name: 'Updated' });
    });

    it('publishModule', async () => {
      (svc.publishModule as jest.Mock).mockResolvedValue({ id: 'm1', isPublished: true });
      const res = mockRes();
      ctrl.publishModule(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
    });

    it('archiveModule', async () => {
      (svc.archiveModule as jest.Mock).mockResolvedValue({ id: 'm1' });
      const res = mockRes();
      ctrl.archiveModule(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('marketplace', () => {
    it('getMarketplaceModules', async () => {
      (svc.getMarketplaceModules as jest.Mock).mockResolvedValue({ items: [], pagination: {} });
      const res = mockRes();
      ctrl.getMarketplaceModules(
        req({
          query: { category: 'ECOMMERCE', search: 'shop', sort: 'price', page: '2', limit: '5' },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getMarketplaceModules).toHaveBeenCalledWith('ECOMMERCE', 'shop', 'price', 2, 5);
    });

    it('getModuleBySlug', async () => {
      (svc.getModuleBySlug as jest.Mock).mockResolvedValue({ id: 'm1' });
      const res = mockRes();
      ctrl.getModuleBySlug(req({ params: { slug: 'my-module' } }), res, jest.fn());
      await flush();
      expect(svc.getModuleBySlug).toHaveBeenCalledWith('my-module');
    });
  });

  describe('purchase / install', () => {
    it('purchaseModule', async () => {
      (svc.purchaseModule as jest.Mock).mockResolvedValue({ reference: 'ref1' });
      const res = mockRes();
      ctrl.purchaseModule(
        req({ params: { id: 'm1' }, body: { provider: 'orange', phone: '690000000' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.purchaseModule).toHaveBeenCalledWith('m1', 'u1', {
        provider: 'orange',
        phone: '690000000',
      });
    });

    it('purchaseModule should return 400 if missing provider/phone', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.purchaseModule(req({ params: { id: 'm1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('confirmModulePayment', async () => {
      (svc.confirmModulePayment as jest.Mock).mockResolvedValue({ id: 'inst1' });
      const res = mockRes();
      ctrl.confirmModulePayment(req({ body: { providerRef: 'ref1' } }), res, jest.fn());
      await flush();
      expect(svc.confirmModulePayment).toHaveBeenCalledWith('u1', 'ref1');
    });

    it('startTrial', async () => {
      (svc.startTrial as jest.Mock).mockResolvedValue({ id: 'trial1' });
      const res = mockRes();
      ctrl.startTrial(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
    });

    it('installModule should succeed for free modules', async () => {
      (svc.getModuleById as jest.Mock).mockResolvedValue({ price: 0, isFree: true });
      (svc.installModule as jest.Mock).mockResolvedValue({ id: 'inst1' });
      const res = mockRes();
      ctrl.installModule(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
      expect(svc.installModule).toHaveBeenCalledWith('m1', 'u1');
    });

    it('installModule should return 402 for paid modules', async () => {
      (svc.getModuleById as jest.Mock).mockResolvedValue({ price: 5000, isFree: false });
      const res = mockRes();
      const next = jest.fn();
      ctrl.installModule(req({ params: { id: 'm1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 402 }));
    });

    it('uninstallModule', async () => {
      (svc.uninstallModule as jest.Mock).mockResolvedValue({ message: 'Uninstalled' });
      const res = mockRes();
      ctrl.uninstallModule(req({ params: { id: 'm1' } }), res, jest.fn());
      await flush();
    });

    it('reinstallModule', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (svc.reinstallModule as jest.Mock).mockResolvedValue({ id: 'inst1' });
      const res = mockRes();
      ctrl.reinstallModule(req({ params: { moduleId: 'm1' } }), res, jest.fn());
      await flush();
      expect(svc.reinstallModule).toHaveBeenCalledWith('m1', 'b1', 'u1');
    });
  });

  describe('tickets', () => {
    it('createTicket', async () => {
      (svc.createTicket as jest.Mock).mockResolvedValue({ id: 't1' });
      const res = mockRes();
      ctrl.createTicket(req({ body: { subject: 'Issue' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('getMyTickets', async () => {
      (svc.getMyTickets as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      ctrl.getMyTickets(req(), res, jest.fn());
      await flush();
    });
  });

  describe('revenue', () => {
    it('getRevenueSummary', async () => {
      (svc.getRevenueSummary as jest.Mock).mockResolvedValue({ total: 100000 });
      const res = mockRes();
      ctrl.getRevenueSummary(req(), res, jest.fn());
      await flush();
    });

    it('requestPayout', async () => {
      (svc.requestPayout as jest.Mock).mockResolvedValue({ id: 'p1' });
      const res = mockRes();
      ctrl.requestPayout(req({ body: { amount: 50000 } }), res, jest.fn());
      await flush();
      expect(svc.requestPayout).toHaveBeenCalledWith('u1', { amount: 50000 });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createModule({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
