import { mockPrisma } from '../setup';

jest.mock('../../services/offerFlashService', () => ({
  getActiveOffers: jest.fn(),
  getOfferById: jest.fn(),
  createOffer: jest.fn(),
  updateOffer: jest.fn(),
  deleteOffer: jest.fn(),
  claimOffer: jest.fn(),
  getNearbyBusinesses: jest.fn(),
}));

jest.mock('../../lib/businessAccess', () => ({
  resolveBusinessAccess: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import * as ctrl from '../../controllers/offerFlashController';
import * as svc from '../../services/offerFlashService';
import { resolveBusinessAccess } from '../../lib/businessAccess';

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
  return {
    user: { id: 'u1', roles: ['BUSINESS'] },
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as any;
}

describe('offerFlash controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveOffers', () => {
    it('should return active offers with parsed query params', async () => {
      const result = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (svc.getActiveOffers as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.getActiveOffers(
        req({
          query: {
            page: '2',
            limit: '10',
            businessId: 'b1',
            featured: 'true',
            latitude: '4.0',
            longitude: '11.0',
            radiusKm: '50',
          },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getActiveOffers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        businessId: 'b1',
        latitude: 4,
        longitude: 11,
        radiusKm: 50,
        featured: true,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should handle missing geo params', async () => {
      (svc.getActiveOffers as jest.Mock).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      const res = mockRes();
      ctrl.getActiveOffers(req(), res, jest.fn());
      await flush();
      expect(svc.getActiveOffers).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        businessId: undefined,
        latitude: undefined,
        longitude: undefined,
        radiusKm: undefined,
        featured: false,
      });
    });
  });

  describe('getOfferById', () => {
    it('should return offer', async () => {
      const offer = { id: 'o1', title: 'Flash' };
      (svc.getOfferById as jest.Mock).mockResolvedValue(offer);
      const res = mockRes();
      ctrl.getOfferById(req({ params: { id: 'o1' } }), res, jest.fn());
      await flush();
      expect(svc.getOfferById).toHaveBeenCalledWith('o1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: offer });
    });

    it('should return 404 when not found', async () => {
      (svc.getOfferById as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getOfferById(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, message: 'Offre introuvable' })
      );
    });
  });

  describe('createOffer', () => {
    it('should return 201 with created offer', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({
        businessId: 'b1',
        businessName: 'Biz',
      });
      const offer = { id: 'o1', title: 'New' };
      (svc.createOffer as jest.Mock).mockResolvedValue(offer);
      const res = mockRes();
      ctrl.createOffer(req({ body: { title: 'New', businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(resolveBusinessAccess).toHaveBeenCalledWith({
        userId: 'u1',
        roles: ['BUSINESS'],
        bodyBusinessId: 'b1',
      });
      expect(svc.createOffer).toHaveBeenCalledWith({ title: 'New', businessId: 'b1' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: offer,
        message: 'Offre flash créée',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createOffer({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 403 if no business access', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.createOffer(req({ body: { businessId: 'b1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('updateOffer', () => {
    it('should update offer successfully', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({
        businessId: 'b1',
        businessName: 'Biz',
      });
      (svc.updateOffer as jest.Mock).mockResolvedValue({ id: 'o1', title: 'Updated' });
      const res = mockRes();
      ctrl.updateOffer(req({ params: { id: 'o1' }, body: { title: 'Updated' } }), res, jest.fn());
      await flush();
      expect(svc.updateOffer).toHaveBeenCalledWith('o1', 'b1', { title: 'Updated' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'o1', title: 'Updated' },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.updateOffer({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if offer not found', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({
        businessId: 'b1',
        businessName: 'Biz',
      });
      (svc.updateOffer as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.updateOffer(req({ params: { id: 'none' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('deleteOffer', () => {
    it('should delete offer successfully', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({
        businessId: 'b1',
        businessName: 'Biz',
      });
      (svc.deleteOffer as jest.Mock).mockResolvedValue(true);
      const res = mockRes();
      ctrl.deleteOffer(req({ params: { id: 'o1' } }), res, jest.fn());
      await flush();
      expect(svc.deleteOffer).toHaveBeenCalledWith('o1', 'b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { deleted: true } });
    });

    it('should return 404 if offer not found', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({
        businessId: 'b1',
        businessName: 'Biz',
      });
      (svc.deleteOffer as jest.Mock).mockResolvedValue(false);
      const res = mockRes();
      const next = jest.fn();
      ctrl.deleteOffer(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('claimOffer', () => {
    it('should claim offer successfully', async () => {
      const offer = { id: 'o1', title: 'Flash' };
      (svc.claimOffer as jest.Mock).mockResolvedValue(offer);
      const res = mockRes();
      ctrl.claimOffer(req({ params: { id: 'o1' } }), res, jest.fn());
      await flush();
      expect(svc.claimOffer).toHaveBeenCalledWith('o1', 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: offer });
    });

    it('should return 400 if offer exhausted', async () => {
      (svc.claimOffer as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.claimOffer(req({ params: { id: 'o1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 400, message: 'Offre épuisée ou expirée' })
      );
    });
  });

  describe('getNearbyBusinesses', () => {
    it('should return nearby businesses', async () => {
      const result = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (svc.getNearbyBusinesses as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.getNearbyBusinesses(
        req({
          query: {
            latitude: '4.0',
            longitude: '11.0',
            radiusKm: '10',
            type: 'BIKERY',
            page: '1',
            limit: '5',
          },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getNearbyBusinesses).toHaveBeenCalledWith({
        latitude: 4,
        longitude: 11,
        radiusKm: 10,
        type: 'BIKERY',
        page: 1,
        limit: 5,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 400 if lat/lng missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getNearbyBusinesses(req({ query: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should handle missing optional params', async () => {
      (svc.getNearbyBusinesses as jest.Mock).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      const res = mockRes();
      ctrl.getNearbyBusinesses(
        req({ query: { latitude: '4.0', longitude: '11.0' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getNearbyBusinesses).toHaveBeenCalledWith({
        latitude: 4,
        longitude: 11,
        radiusKm: undefined,
        type: undefined,
        page: undefined,
        limit: undefined,
      });
    });
  });
});
