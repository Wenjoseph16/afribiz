import { mockPrisma } from '../setup';

jest.mock('../../services/africanUnitService', () => ({
  listUnits: jest.fn(),
  getUnit: jest.fn(),
  createUnit: jest.fn(),
  updateUnit: jest.fn(),
  deleteUnit: jest.fn(),
  convertValue: jest.fn(),
  getCategories: jest.fn(),
}));

import * as africanUnitCtrl from '../../controllers/africanUnitController';
import * as unitService from '../../services/africanUnitService';

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

describe('africanUnit controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list success', async () => {
    const data = [{ id: 'u1', name: 'Koboto', category: 'weight', region: 'west-africa' }];
    (unitService.listUnits as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.list(req({ query: { category: 'weight', region: 'west-africa' } }), res, next);
    await flush();
    expect(unitService.listUnits).toHaveBeenCalledWith('weight', 'west-africa');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('list without filters', async () => {
    (unitService.listUnits as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.list(req(), res, next);
    await flush();
    expect(unitService.listUnits).toHaveBeenCalledWith(undefined, undefined);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('get success', async () => {
    const data = { id: 'u1', name: 'Koboto' };
    (unitService.getUnit as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.get(req({ params: { id: 'u1' } }), res, next);
    await flush();
    expect(unitService.getUnit).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('create success', async () => {
    const data = {
      id: 'u1',
      name: 'Koboto',
      category: 'weight',
      standardUnit: 'kg',
      conversionRate: 1,
    };
    (unitService.createUnit as jest.Mock).mockResolvedValue(data);
    const body = { name: 'Koboto', category: 'weight', standardUnit: 'kg', conversionRate: 1 };
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.create(req({ body }), res, next);
    await flush();
    expect(unitService.createUnit).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('create returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.create({ body: { name: 'Koboto' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(unitService.createUnit).not.toHaveBeenCalled();
  });

  it('update success', async () => {
    const data = { id: 'u1', name: 'Koboto Updated' };
    (unitService.updateUnit as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.update(
      req({ params: { id: 'u1' }, body: { name: 'Koboto Updated' } }),
      res,
      next
    );
    await flush();
    expect(unitService.updateUnit).toHaveBeenCalledWith('u1', { name: 'Koboto Updated' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('update returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.update({ params: { id: 'u1' }, body: {} } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(unitService.updateUnit).not.toHaveBeenCalled();
  });

  it('remove success', async () => {
    (unitService.deleteUnit as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.remove(req({ params: { id: 'u1' } }), res, next);
    await flush();
    expect(unitService.deleteUnit).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Unité supprimée' });
  });

  it('remove returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.remove({ params: { id: 'u1' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(unitService.deleteUnit).not.toHaveBeenCalled();
  });

  it('convert success', async () => {
    const data = { value: 1000, unit: 'kg' };
    (unitService.convertValue as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.convert(
      req({ body: { unitId: 'u1', value: 1000, toStandard: true } }),
      res,
      next
    );
    await flush();
    expect(unitService.convertValue).toHaveBeenCalledWith('u1', 1000, true);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('categories success', async () => {
    const data = [
      { category: 'weight', count: 5 },
      { category: 'length', count: 3 },
    ];
    (unitService.getCategories as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    africanUnitCtrl.categories(req(), res, next);
    await flush();
    expect(unitService.getCategories).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });
});
