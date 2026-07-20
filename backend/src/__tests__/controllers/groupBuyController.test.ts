import { mockPrisma } from '../setup';
import * as groupBuyCtrl from '../../controllers/groupBuyController';

jest.mock('../../services/groupBuyService', () => ({
  listGroupBuys: jest.fn(),
  getGroupBuy: jest.fn(),
  createGroupBuy: jest.fn(),
  updateGroupBuy: jest.fn(),
  deleteGroupBuy: jest.fn(),
  addParticipant: jest.fn(),
  removeParticipant: jest.fn(),
}));

import * as groupBuyService from '../../services/groupBuyService';

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

describe('groupBuy controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list', async () => {
    (groupBuyService.listGroupBuys as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.list(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('get', async () => {
    (groupBuyService.getGroupBuy as jest.Mock).mockResolvedValue({ id: 'g1' });
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.get(req({ params: { id: 'g1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('create returns 201', async () => {
    (groupBuyService.createGroupBuy as jest.Mock).mockResolvedValue({ id: 'g1' });
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.create(
      req({
        body: { title: 'Group Achat', targetPrice: 1000, minParticipants: 5, discountPercent: 10 },
      }),
      res,
      next
    );
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('update', async () => {
    (groupBuyService.updateGroupBuy as jest.Mock).mockResolvedValue({ id: 'g1' });
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.update(req({ params: { id: 'g1' }, body: { title: 'Updated' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('remove', async () => {
    (groupBuyService.deleteGroupBuy as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.remove(req({ params: { id: 'g1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Achat groupé supprimé' });
  });

  it('addParticipant returns 201', async () => {
    (groupBuyService.addParticipant as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.addParticipant(
      req({ body: { groupBuyId: 'g1', name: 'John', quantity: 1, amount: 1000 } }),
      res,
      next
    );
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('removeParticipant', async () => {
    (groupBuyService.removeParticipant as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.removeParticipant(req({ params: { participantId: 'p1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Participant retiré' });
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    groupBuyCtrl.list({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
