import { mockPrisma } from '../setup';

jest.mock('../../services/employeeLeaves', () => ({
  listLeaves: jest.fn(),
  getLeave: jest.fn(),
  createLeave: jest.fn(),
  updateLeaveStatus: jest.fn(),
  deleteLeave: jest.fn(),
  getLeaveStats: jest.fn(),
}));

import * as leavesCtrl from '../../controllers/employeeLeaves';
import * as leaveService from '../../services/employeeLeaves';

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

describe('employeeLeaves controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listLeaves', async () => {
    (leaveService.listLeaves as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.listLeaves(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listLeaves returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.listLeaves({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('getLeave', async () => {
    (leaveService.getLeave as jest.Mock).mockResolvedValue({ id: 'l1' });
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.getLeave(req({ params: { id: 'l1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getLeave returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.getLeave({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('createLeave returns 201 and Congé créé message', async () => {
    (leaveService.createLeave as jest.Mock).mockResolvedValue({ id: 'l1' });
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.createLeave(
      req({ body: { employeeId: 'e1', startDate: '2026-01-01', endDate: '2026-01-05' } }),
      res,
      next
    );
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Congé créé' })
    );
  });

  it('createLeave returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.createLeave({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('updateLeaveStatus', async () => {
    (leaveService.updateLeaveStatus as jest.Mock).mockResolvedValue({
      id: 'l1',
      status: 'APPROVED',
    });
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.updateLeaveStatus(
      req({ params: { id: 'l1' }, body: { status: 'APPROVED' } }),
      res,
      next
    );
    await flush();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Statut du congé mis à jour' })
    );
  });

  it('updateLeaveStatus returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.updateLeaveStatus({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('deleteLeave', async () => {
    (leaveService.deleteLeave as jest.Mock).mockResolvedValue({ message: 'Congé supprimé' });
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.deleteLeave(req({ params: { id: 'l1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('deleteLeave returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.deleteLeave({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('getLeaveStats', async () => {
    (leaveService.getLeaveStats as jest.Mock).mockResolvedValue({
      total: 10,
      pending: 3,
      approved: 5,
      rejected: 2,
    });
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.getLeaveStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getLeaveStats returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    leavesCtrl.getLeaveStats({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
