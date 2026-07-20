jest.mock('../../services/customer360', () => ({
  getCustomer360: jest.fn(),
  trackPageView: jest.fn(),
  trackProductView: jest.fn(),
  trackProductClick: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/customer360';
import * as c360 from '../../services/customer360';

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

describe('customer360 controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  describe('getCustomer360', () => {
    it('should return customer 360 data', async () => {
      (c360.getCustomer360 as jest.Mock).mockResolvedValue({ client: { id: 'c1' }, orders: [] });
      const res = mockRes();
      ctrl.getCustomer360(req({ params: { clientId: 'c1' } }), res, jest.fn());
      await flush();
      expect(c360.getCustomer360).toHaveBeenCalledWith('b1', 'c1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { client: { id: 'c1' }, orders: [] },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getCustomer360({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('trackPageView', () => {
    it('should track page view and return 201', async () => {
      (c360.trackPageView as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.trackPageView(req({ body: { visitorId: 'v1', referrer: 'google' } }), res, jest.fn());
      await flush();
      expect(c360.trackPageView).toHaveBeenCalledWith({
        businessId: 'b1',
        visitorId: 'v1',
        referrer: 'google',
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('trackProductView', () => {
    it('should track product view', async () => {
      (c360.trackProductView as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.trackProductView(req({ body: { productId: 'p1', source: 'search' } }), res, jest.fn());
      await flush();
      expect(c360.trackProductView).toHaveBeenCalledWith({
        businessId: 'b1',
        productId: 'p1',
        source: 'search',
      });
    });

    it('should return 400 if productId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.trackProductView(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('trackProductClick', () => {
    it('should track product click', async () => {
      (c360.trackProductClick as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.trackProductClick(req({ body: { productId: 'p1' } }), res, jest.fn());
      await flush();
      expect(c360.trackProductClick).toHaveBeenCalledWith({ businessId: 'b1', productId: 'p1' });
    });
  });
});
