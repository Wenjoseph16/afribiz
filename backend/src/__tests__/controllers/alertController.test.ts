import { mockPrisma } from '../setup';
import * as alertCtrl from '../../controllers/alertController';

jest.mock('../../services/alertService', () => ({
  createAlert: jest.fn(),
  updateAlert: jest.fn(),
  deleteAlert: jest.fn(),
  listAlerts: jest.fn(),
  getAlert: jest.fn(),
}));

import * as alertService from '../../services/alertService';

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

describe('alert controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createAlert returns 201', async () => {
    (alertService.createAlert as jest.Mock).mockResolvedValue({ id: 'a1', type: 'price_drop' });
    const res = mockRes();
    const next = jest.fn();
    alertCtrl.createAlert(req({ body: { type: 'price_drop', target: 50000 } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { id: 'a1', type: 'price_drop' } })
    );
  });

  it('updateAlert', async () => {
    (alertService.updateAlert as jest.Mock).mockResolvedValue({ id: 'a1', active: false });
    const res = mockRes();
    const next = jest.fn();
    alertCtrl.updateAlert(req({ params: { id: 'a1' }, body: { active: false } }), res, next);
    await flush();
    expect(alertService.updateAlert).toHaveBeenCalledWith('u1', 'a1', { active: false });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('deleteAlert', async () => {
    (alertService.deleteAlert as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    alertCtrl.deleteAlert(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(alertService.deleteAlert).toHaveBeenCalledWith('u1', 'a1');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Alerte supprimée' });
  });

  it('listAlerts', async () => {
    (alertService.listAlerts as jest.Mock).mockResolvedValue([{ id: 'a1' }]);
    const res = mockRes();
    const next = jest.fn();
    alertCtrl.listAlerts(req({ query: { type: 'price_drop' } }), res, next);
    await flush();
    expect(alertService.listAlerts).toHaveBeenCalledWith('u1', { type: 'price_drop' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getAlert', async () => {
    (alertService.getAlert as jest.Mock).mockResolvedValue({ id: 'a1', type: 'price_drop' });
    const res = mockRes();
    const next = jest.fn();
    alertCtrl.getAlert(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(alertService.getAlert).toHaveBeenCalledWith('u1', 'a1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
