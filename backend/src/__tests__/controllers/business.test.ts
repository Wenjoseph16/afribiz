import { mockPrisma } from '../setup';
import * as businessCtrl from '../../controllers/business';

jest.mock('../../services/business', () => ({
  getPublicBusiness: jest.fn(),
  getBusinessProducts: jest.fn(),
  getBusinessServices: jest.fn(),
  getBusinessMenu: jest.fn(),
  getBusinessRooms: jest.fn(),
  getBusinessEvents: jest.fn(),
  getBusinessRentals: jest.fn(),
  getBusinessPortfolio: jest.fn(),
  getBusinessPromotions: jest.fn(),
  getBusinessPartners: jest.fn(),
  getBusinessReviews: jest.fn(),
  getBusinessBookings: jest.fn(),
  getBusinessTrainings: jest.fn(),
  getMyBusiness: jest.fn(),
  getClients: jest.fn(),
  getClient: jest.fn(),
  createBusiness: jest.fn(),
  exportClients: jest.fn(),
}));
jest.mock('../../services/documents', () => ({
  getBusinessDocuments: jest.fn(),
  uploadDocument: jest.fn(),
  deleteDocument: jest.fn(),
}));
jest.mock('../../services/disputes', () => ({ listDisputes: jest.fn(), updateDispute: jest.fn() }));
jest.mock('../../services/businessFaq', () => ({
  listFaqs: jest.fn(),
  createFaq: jest.fn(),
  updateFaq: jest.fn(),
  deleteFaq: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import * as businessService from '../../services/business';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('business controller - public', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getPublicBusiness', async () => {
    (businessService.getPublicBusiness as jest.Mock).mockResolvedValue({ id: 'b1', name: 'Biz' });
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getPublicBusiness({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(businessService.getPublicBusiness).toHaveBeenCalledWith('my-biz');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessProducts', async () => {
    (businessService.getBusinessProducts as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getBusinessProducts({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessServices', async () => {
    (businessService.getBusinessServices as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getBusinessServices({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessMenu', async () => {
    (businessService.getBusinessMenu as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getBusinessMenu({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessRooms', async () => {
    (businessService.getBusinessRooms as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getBusinessRooms({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessEvents', async () => {
    (businessService.getBusinessEvents as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getBusinessEvents({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessReviews', async () => {
    (businessService.getBusinessReviews as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getBusinessReviews({ params: { slug: 'my-biz' } } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('business controller - authenticated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  it('getMyBusiness', async () => {
    (businessService.getMyBusiness as jest.Mock).mockResolvedValue({ id: 'b1' });
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getMyBusiness(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createBusiness returns 201', async () => {
    (businessService.createBusiness as jest.Mock).mockResolvedValue({ id: 'b1' });
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.createBusiness(req({ body: { name: 'MyBiz' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should return 401 if no user', async () => {
    mockPrisma.business.findUnique.mockReset();
    const res = mockRes();
    const next = jest.fn();
    businessCtrl.getMyBusiness({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
