import * as marketingCtrl from '../../controllers/marketing';

jest.mock('../../services/marketingCampaigns', () => ({
  getMarketingStats: jest.fn(),
  sendBirthdayCampaigns: jest.fn(),
  detectInactiveClients: jest.fn(),
}));

import * as marketingService from '../../services/marketingCampaigns';

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
  return { user: { id: 'u1' }, query: {}, ...overrides } as any;
}

describe('marketing controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMarketingStats', async () => {
    (marketingService.getMarketingStats as jest.Mock).mockResolvedValue({
      campaigns: 3,
      reach: 1500,
    });
    const res = mockRes();
    const next = jest.fn();
    marketingCtrl.getMarketingStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('triggerBirthdayCampaign', async () => {
    (marketingService.sendBirthdayCampaigns as jest.Mock).mockResolvedValue({ sent: 10 });
    const res = mockRes();
    const next = jest.fn();
    marketingCtrl.triggerBirthdayCampaign({} as any, res, next);
    await flush();
    expect(marketingService.sendBirthdayCampaigns).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('triggerInactiveCheck', async () => {
    (marketingService.detectInactiveClients as jest.Mock).mockResolvedValue({ inactive: 5 });
    const res = mockRes();
    const next = jest.fn();
    marketingCtrl.triggerInactiveCheck(req({ query: { days: '60' } }), res, next);
    await flush();
    expect(marketingService.detectInactiveClients).toHaveBeenCalledWith(60);
  });
});
