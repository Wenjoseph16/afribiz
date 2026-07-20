import { mockPrisma } from '../setup';
import {
  listPromotions,
  createPromotion,
  deletePromotion,
  listCoupons,
  getPromoStats,
} from '../../controllers/promotions';

jest.mock('../../services/promotions', () => ({
  listPromotions: jest.fn(),
  createPromotion: jest.fn(),
  deletePromotion: jest.fn(),
  listCoupons: jest.fn(),
  getPromoStats: jest.fn(),
}));

import * as promoService from '../../services/promotions';

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

describe('promotions controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listPromotions – success', async () => {
    (promoService.listPromotions as jest.Mock).mockResolvedValue({ promotions: [], total: 0 });
    const res = mockRes();
    const next = jest.fn();
    listPromotions(req(), res, next);
    await flush();
    expect(promoService.listPromotions).toHaveBeenCalledWith('u1', {});
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { promotions: [], total: 0 } });
  });

  it('createPromotion – success with 201', async () => {
    (promoService.createPromotion as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    createPromotion(req({ body: { title: 'Test' } }), res, next);
    await flush();
    expect(promoService.createPromotion).toHaveBeenCalledWith('u1', { title: 'Test' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'p1' },
      message: 'Promotion créée',
    });
  });

  it('deletePromotion – message check', async () => {
    (promoService.deletePromotion as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    deletePromotion(req({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(promoService.deletePromotion).toHaveBeenCalledWith('u1', 'p1');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Promotion supprimée' });
  });

  it('listCoupons – success', async () => {
    (promoService.listCoupons as jest.Mock).mockResolvedValue({ coupons: [], total: 0 });
    const res = mockRes();
    const next = jest.fn();
    listCoupons(req({ query: { status: 'ACTIVE' } }), res, next);
    await flush();
    expect(promoService.listCoupons).toHaveBeenCalledWith('u1', { status: 'ACTIVE' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { coupons: [], total: 0 } });
  });

  it('getPromoStats – success', async () => {
    (promoService.getPromoStats as jest.Mock).mockResolvedValue({
      activePromos: 5,
      totalPromos: 10,
    });
    const res = mockRes();
    const next = jest.fn();
    getPromoStats(req(), res, next);
    await flush();
    expect(promoService.getPromoStats).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { activePromos: 5, totalPromos: 10 },
    });
  });

  it('returns 401 when user is missing', async () => {
    const res = mockRes();
    const next = jest.fn();
    listPromotions({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, message: 'Non authentifié' })
    );
  });
});
