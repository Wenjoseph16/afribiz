import * as adsCtrl from '../../controllers/ads';

jest.mock('../../services/ads', () => ({
  createAdCampaign: jest.fn(),
  getMyCampaigns: jest.fn(),
  getAdCampaignById: jest.fn(),
  pauseAdCampaign: jest.fn(),
  resumeAdCampaign: jest.fn(),
  updateAdCampaign: jest.fn(),
  deleteAdCampaign: jest.fn(),
  getActiveAdCreatives: jest.fn(),
  trackImpression: jest.fn(),
  trackClick: jest.fn(),
  trackConversion: jest.fn(),
  getAdStats: jest.fn(),
  getAllCampaigns: jest.fn(),
  validateCampaign: jest.fn(),
  rejectCampaign: jest.fn(),
  suspendCampaign: jest.fn(),
  getAdminStats: jest.fn(),
  getPackages: jest.fn(),
  createPackage: jest.fn(),
  updatePackage: jest.fn(),
  getAdminRevenue: jest.fn(),
  generateInvoice: jest.fn(),
  reportAd: jest.fn(),
}));

import * as adsService from '../../services/ads';

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
    user: { id: 'u1', primaryRole: 'BUSINESS' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as any;
}

describe('ads controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createCampaign returns 201', async () => {
    (adsService.createAdCampaign as jest.Mock).mockResolvedValue({ id: 'c1' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.createCampaign(req({ body: { name: 'Campaign 1', budget: 50000 } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getMyCampaigns', async () => {
    (adsService.getMyCampaigns as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.getMyCampaigns(req(), res, next);
    await flush();
    expect(adsService.getMyCampaigns).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getCampaignById', async () => {
    (adsService.getAdCampaignById as jest.Mock).mockResolvedValue({ id: 'c1' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.getCampaignById(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('pauseCampaign', async () => {
    (adsService.pauseAdCampaign as jest.Mock).mockResolvedValue({ id: 'c1', status: 'PAUSED' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.pauseCampaign(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(adsService.pauseAdCampaign).toHaveBeenCalled();
  });

  it('resumeCampaign', async () => {
    (adsService.resumeAdCampaign as jest.Mock).mockResolvedValue({ id: 'c1', status: 'ACTIVE' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.resumeCampaign(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(adsService.resumeAdCampaign).toHaveBeenCalled();
  });

  it('updateCampaign', async () => {
    (adsService.updateAdCampaign as jest.Mock).mockResolvedValue({ id: 'c1' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.updateCampaign(req({ params: { id: 'c1' }, body: { budget: 75000 } }), res, next);
    await flush();
    expect(adsService.updateAdCampaign).toHaveBeenCalled();
  });

  it('deleteCampaign', async () => {
    (adsService.deleteAdCampaign as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.deleteCampaign(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getActiveAds', async () => {
    (adsService.getActiveAdCreatives as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.getActiveAds({ query: {} } as any, res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('trackImpression', async () => {
    (adsService.trackImpression as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.trackImpression({ body: { adId: 'a1' } } as any, res, next);
    await flush();
    expect(adsService.trackImpression).toHaveBeenCalled();
  });

  it('getAdStats', async () => {
    (adsService.getAdStats as jest.Mock).mockResolvedValue({ impressions: 1000 });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.getAdStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('generateInvoice', async () => {
    (adsService.generateInvoice as jest.Mock).mockResolvedValue({ id: 'inv1' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.generateInvoice(req({ params: { id: 'c1' } }), res, next);
    await flush();
    expect(adsService.generateInvoice).toHaveBeenCalled();
  });

  it('reportAd', async () => {
    (adsService.reportAd as jest.Mock).mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    const next = jest.fn();
    adsCtrl.reportAd(req({ body: { adId: 'a1', reason: 'inappropriate' } }), res, next);
    await flush();
    expect(adsService.reportAd).toHaveBeenCalled();
  });
});
