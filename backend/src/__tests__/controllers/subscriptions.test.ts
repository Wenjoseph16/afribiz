import * as subscriptionCtrl from '../../controllers/subscriptions';

jest.mock('../../services/subscriptions', () => ({
  listSubscriptionPlans: jest.fn(),
  getSubscriptionPlan: jest.fn(),
  createSubscriptionPlan: jest.fn(),
  updateSubscriptionPlan: jest.fn(),
  deleteSubscriptionPlan: jest.fn(),
  listSubscribers: jest.fn(),
  getSubscriber: jest.fn(),
  createSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  renewSubscription: jest.fn(),
  listSubscriptionPayments: jest.fn(),
  recordSubscriptionPayment: jest.fn(),
  listSubscriptionLogs: jest.fn(),
  getSubscriptionStats: jest.fn(),
  getMyCurrentSubscription: jest.fn(),
  subscribeToPlan: jest.fn(),
  cancelMySubscription: jest.fn(),
}));

import * as subscriptionService from '../../services/subscriptions';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function userReq(overrides = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('subscription controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listSubscriptionPlans', async () => {
    (subscriptionService.listSubscriptionPlans as jest.Mock).mockResolvedValue([{ id: 'p1' }]);
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.listSubscriptionPlans(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getSubscriptionPlan', async () => {
    (subscriptionService.getSubscriptionPlan as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.getSubscriptionPlan(userReq({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createSubscriptionPlan returns 201', async () => {
    (subscriptionService.createSubscriptionPlan as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.createSubscriptionPlan(userReq(), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateSubscriptionPlan', async () => {
    (subscriptionService.updateSubscriptionPlan as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.updateSubscriptionPlan(userReq({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('deleteSubscriptionPlan', async () => {
    (subscriptionService.deleteSubscriptionPlan as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.deleteSubscriptionPlan(userReq({ params: { id: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listSubscribers', async () => {
    (subscriptionService.listSubscribers as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.listSubscribers(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getSubscriber', async () => {
    (subscriptionService.getSubscriber as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.getSubscriber(userReq({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createSubscription returns 201', async () => {
    (subscriptionService.createSubscription as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.createSubscription(userReq(), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('cancelSubscription', async () => {
    (subscriptionService.cancelSubscription as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.cancelSubscription(userReq({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('renewSubscription', async () => {
    (subscriptionService.renewSubscription as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.renewSubscription(userReq({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listSubscriptionPayments', async () => {
    (subscriptionService.listSubscriptionPayments as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.listSubscriptionPayments(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('recordSubscriptionPayment returns 201', async () => {
    (subscriptionService.recordSubscriptionPayment as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.recordSubscriptionPayment(userReq(), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listSubscriptionLogs', async () => {
    (subscriptionService.listSubscriptionLogs as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.listSubscriptionLogs(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getSubscriptionStats', async () => {
    (subscriptionService.getSubscriptionStats as jest.Mock).mockResolvedValue({ total: 5 });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.getSubscriptionStats(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getMySubscription', async () => {
    (subscriptionService.getMyCurrentSubscription as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.getMySubscription(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('subscribeToPlan returns 201', async () => {
    (subscriptionService.subscribeToPlan as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.subscribeToPlan(userReq(), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('cancelMySubscription', async () => {
    (subscriptionService.cancelMySubscription as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.cancelMySubscription(userReq(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    subscriptionCtrl.listSubscriptionPlans({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
