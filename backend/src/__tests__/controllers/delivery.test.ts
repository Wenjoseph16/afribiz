import * as deliveryCtrl from '../../controllers/delivery';

jest.mock('../../services/delivery', () => ({
  listDeliveryZones: jest.fn(),
  createDeliveryZone: jest.fn(),
  updateDeliveryZone: jest.fn(),
  deleteDeliveryZone: jest.fn(),
  listDrivers: jest.fn(),
  createDriver: jest.fn(),
  updateDriver: jest.fn(),
  deleteDriver: jest.fn(),
  listDeliveries: jest.fn(),
  getDelivery: jest.fn(),
  createDelivery: jest.fn(),
  updateDelivery: jest.fn(),
  assignDriver: jest.fn(),
  updateDeliveryStatus: jest.fn(),
  addTrackingEvent: jest.fn(),
  addDeliveryProof: jest.fn(),
  getDeliveryStats: jest.fn(),
}));

import * as deliveryService from '../../services/delivery';

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
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('delivery controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listDeliveryZones', async () => {
    (deliveryService.listDeliveryZones as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.listDeliveryZones(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createDeliveryZone returns 201', async () => {
    (deliveryService.createDeliveryZone as jest.Mock).mockResolvedValue({ id: 'z1' });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.createDeliveryZone(req({ body: { name: 'Zone A' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listDrivers', async () => {
    (deliveryService.listDrivers as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.listDrivers(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createDriver returns 201', async () => {
    (deliveryService.createDriver as jest.Mock).mockResolvedValue({ id: 'd1' });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.createDriver(req({ body: { name: 'John', phone: '+22890123456' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listDeliveries', async () => {
    (deliveryService.listDeliveries as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.listDeliveries(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createDelivery returns 201', async () => {
    (deliveryService.createDelivery as jest.Mock).mockResolvedValue({ id: 'd1' });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.createDelivery(req({ body: { orderId: 'o1', zoneId: 'z1' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('assignDriver', async () => {
    (deliveryService.assignDriver as jest.Mock).mockResolvedValue({ id: 'd1' });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.assignDriver(req({ params: { id: 'd1' }, body: { driverId: 'dr1' } }), res, next);
    await flush();
    expect(deliveryService.assignDriver).toHaveBeenCalled();
  });

  it('updateDeliveryStatus', async () => {
    (deliveryService.updateDeliveryStatus as jest.Mock).mockResolvedValue({
      id: 'd1',
      status: 'IN_TRANSIT',
    });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.updateDeliveryStatus(
      req({ params: { id: 'd1' }, body: { status: 'IN_TRANSIT' } }),
      res,
      next
    );
    await flush();
    expect(deliveryService.updateDeliveryStatus).toHaveBeenCalled();
  });

  it('addTrackingEvent', async () => {
    (deliveryService.addTrackingEvent as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.addTrackingEvent(
      req({ params: { id: 'd1' }, body: { location: 'City center', status: 'IN_TRANSIT' } }),
      res,
      next
    );
    await flush();
    expect(deliveryService.addTrackingEvent).toHaveBeenCalled();
  });

  it('getDeliveryStats', async () => {
    (deliveryService.getDeliveryStats as jest.Mock).mockResolvedValue({ total: 30, delivered: 25 });
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.getDeliveryStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    deliveryCtrl.listDeliveries({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
