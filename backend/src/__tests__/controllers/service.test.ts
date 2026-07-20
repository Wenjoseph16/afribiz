import * as serviceCtrl from '../../controllers/service';

jest.mock('../../services/service', () => ({
  listServices: jest.fn(),
  getService: jest.fn(),
  createService: jest.fn(),
  updateService: jest.fn(),
  deleteService: jest.fn(),
  toggleServiceActive: jest.fn(),
  getServiceStats: jest.fn(),
  duplicateService: jest.fn(),
  exportServices: jest.fn(),
}));

import * as serviceService from '../../services/service';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('service controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listServices', async () => {
    (serviceService.listServices as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.listServices(
      req({ query: { page: '1', limit: '20', categoryId: 'c1' } }),
      res,
      next
    );
    await flush();
    expect(serviceService.listServices).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ page: 1, limit: 20 })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getService', async () => {
    (serviceService.getService as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.getService(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('createService returns 201', async () => {
    (serviceService.createService as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.createService(req({ body: { name: 'Consulting' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('updateService', async () => {
    (serviceService.updateService as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.updateService(req({ params: { id: 's1' }, body: { name: 'Updated' } }), res, next);
    await flush();
    expect(serviceService.updateService).toHaveBeenCalledWith('u1', 's1', { name: 'Updated' });
  });

  it('deleteService', async () => {
    (serviceService.deleteService as jest.Mock).mockResolvedValue({});
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.deleteService(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('toggleServiceActive', async () => {
    (serviceService.toggleServiceActive as jest.Mock).mockResolvedValue({
      id: 's1',
      isActive: false,
    });
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.toggleServiceActive(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getServiceStats', async () => {
    (serviceService.getServiceStats as jest.Mock).mockResolvedValue({ total: 5 });
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.getServiceStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('duplicateService returns 201', async () => {
    (serviceService.duplicateService as jest.Mock).mockResolvedValue({ id: 's2' });
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.duplicateService(req({ params: { id: 's1' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('exportServices', async () => {
    (serviceService.exportServices as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.exportServices(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    serviceCtrl.listServices({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
