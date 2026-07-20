import { mockPrisma } from '../setup';
import * as orderCtrl from '../../controllers/orders';

jest.mock('../../services/orders', () => ({
  listBusinessOrders: jest.fn(),
  getBusinessOrder: jest.fn(),
  createOrder: jest.fn(),
  updateOrderStatus: jest.fn(),
  updateDeliveryStatus: jest.fn(),
  updateOrderPayment: jest.fn(),
  deleteOrder: jest.fn(),
  getOrderStats: jest.fn(),
  listDebts: jest.fn(),
  payDebt: jest.fn(),
  settleDebt: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import * as orderService from '../../services/orders';

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
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, cookies: {}, ...overrides } as any;
}

describe('orders controller - business orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listBusinessOrders', async () => {
    (orderService.listBusinessOrders as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.listBusinessOrders(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessOrder', async () => {
    (orderService.getBusinessOrder as jest.Mock).mockResolvedValue({ id: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.getBusinessOrder(req({ params: { id: 'o1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createBusinessOrder returns 201', async () => {
    (orderService.createOrder as jest.Mock).mockResolvedValue({ id: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.createBusinessOrder(req(), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateBusinessOrderStatus', async () => {
    (orderService.updateOrderStatus as jest.Mock).mockResolvedValue({ id: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.updateBusinessOrderStatus(
      req({ params: { id: 'o1' }, body: { status: 'CONFIRMED' } }),
      res,
      next
    );
    await flush();
    expect(orderService.updateOrderStatus).toHaveBeenCalledWith('u1', 'o1', 'CONFIRMED', undefined);
  });

  it('updateBusinessDeliveryStatus', async () => {
    (orderService.updateDeliveryStatus as jest.Mock).mockResolvedValue({ id: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.updateBusinessDeliveryStatus(
      req({ params: { id: 'o1' }, body: { deliveryStatus: 'SHIPPED' } }),
      res,
      next
    );
    await flush();
    expect(orderService.updateDeliveryStatus).toHaveBeenCalledWith(
      'u1',
      'o1',
      'SHIPPED',
      undefined
    );
  });

  it('updateBusinessOrderPayment', async () => {
    (orderService.updateOrderPayment as jest.Mock).mockResolvedValue({ id: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.updateBusinessOrderPayment(
      req({ params: { id: 'o1' }, body: { paymentStatus: 'PAID' } }),
      res,
      next
    );
    await flush();
    expect(orderService.updateOrderPayment).toHaveBeenCalledWith('u1', 'o1', {
      paymentStatus: 'PAID',
    });
  });

  it('deleteBusinessOrder', async () => {
    (orderService.deleteOrder as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.deleteBusinessOrder(req({ params: { id: 'o1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getBusinessOrderStats', async () => {
    (orderService.getOrderStats as jest.Mock).mockResolvedValue({ total: 5, revenue: 50000 });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.getBusinessOrderStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('orders controller - debts', () => {
  it('listBusinessDebts', async () => {
    (orderService.listDebts as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.listBusinessDebts(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('payBusinessDebt', async () => {
    (orderService.payDebt as jest.Mock).mockResolvedValue({ id: 'd1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.payBusinessDebt(req({ params: { id: 'd1' }, body: { amount: 5000 } }), res, next);
    await flush();
    expect(orderService.payDebt).toHaveBeenCalledWith('u1', 'd1', 5000);
  });

  it('settleBusinessDebt', async () => {
    (orderService.settleDebt as jest.Mock).mockResolvedValue({ id: 'd1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.settleBusinessDebt(req({ params: { id: 'd1' } }), res, next);
    await flush();
    expect(orderService.settleDebt).toHaveBeenCalledWith('u1', 'd1');
  });
});

describe('orders controller - client orders', () => {
  it('getMyOrderTimeline', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-001',
      status: 'PENDING',
      createdAt: new Date(),
      paidAt: null,
      deliveredAt: null,
      cancelledAt: null,
    });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.getMyOrderTimeline(req({ params: { id: 'o1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getMyOrders', async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.order.count.mockResolvedValue(0);
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.getMyOrders(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('updateMyOrder', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'o1' });
    mockPrisma.order.update.mockResolvedValue({ id: 'o1' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.updateMyOrder(req({ params: { id: 'o1' }, body: { clientName: 'Test' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('cancelMyOrder', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({ id: 'o1', status: 'PENDING' });
    mockPrisma.order.update.mockResolvedValue({ id: 'o1', status: 'CANCELLED' });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.cancelMyOrder(
      req({ params: { id: 'o1' }, body: { reason: 'changed mind' } }),
      res,
      next
    );
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getMyOrder', async () => {
    mockPrisma.order.findFirst.mockResolvedValue({
      id: 'o1',
      orderNumber: 'ORD-001',
      status: 'PENDING',
      createdAt: new Date(),
    });
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.getMyOrder(req({ params: { id: 'o1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    orderCtrl.listBusinessOrders({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
