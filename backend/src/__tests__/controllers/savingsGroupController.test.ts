import { mockPrisma } from '../setup';

jest.mock('../../services/savingsGroupService', () => ({
  listSavingsGroups: jest.fn(),
  getSavingsGroup: jest.fn(),
  createSavingsGroup: jest.fn(),
  updateSavingsGroup: jest.fn(),
  deleteSavingsGroup: jest.fn(),
  addSavingsMember: jest.fn(),
  removeSavingsMember: jest.fn(),
  getMemberScore: jest.fn(),
  startSavingsCycle: jest.fn(),
  closeSavingsCycle: jest.fn(),
  validateCycleClosure: jest.fn(),
  processCyclePayouts: jest.fn(),
  getCyclePayoutStatus: jest.fn(),
  recordContribution: jest.fn(),
  listLoans: jest.fn(),
  createLoan: jest.fn(),
  approveLoan: jest.fn(),
  repayLoan: jest.fn(),
  getSavingsStats: jest.fn(),
  getGroupEscrows: jest.fn(),
}));

import * as ctrl from '../../controllers/savingsGroupController';
import * as svc from '../../services/savingsGroupService';

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

describe('savingsGroup controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should list groups', async () => {
      const data = [{ id: 'g1', name: 'Groupe' }];
      (svc.listSavingsGroups as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.list(req(), res, jest.fn());
      await flush();
      expect(svc.listSavingsGroups).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.list({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('get', () => {
    it('should get group by id', async () => {
      const data = { id: 'g1', name: 'Groupe' };
      (svc.getSavingsGroup as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.get(req({ params: { id: 'g1' } }), res, jest.fn());
      await flush();
      expect(svc.getSavingsGroup).toHaveBeenCalledWith('u1', 'g1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.get({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('create', () => {
    it('should create group and return 201', async () => {
      const data = { id: 'g1', name: 'New' };
      (svc.createSavingsGroup as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.create(req({ body: { name: 'New' } }), res, jest.fn());
      await flush();
      expect(svc.createSavingsGroup).toHaveBeenCalledWith('u1', { name: 'New' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('update', () => {
    it('should update group', async () => {
      const data = { id: 'g1', name: 'Updated' };
      (svc.updateSavingsGroup as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.update(req({ params: { id: 'g1' }, body: { name: 'Updated' } }), res, jest.fn());
      await flush();
      expect(svc.updateSavingsGroup).toHaveBeenCalledWith('u1', 'g1', { name: 'Updated' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('remove', () => {
    it('should delete group', async () => {
      (svc.deleteSavingsGroup as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.remove(req({ params: { id: 'g1' } }), res, jest.fn());
      await flush();
      expect(svc.deleteSavingsGroup).toHaveBeenCalledWith('u1', 'g1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Groupe supprimé' });
    });
  });

  describe('addMember', () => {
    it('should add member and return 201', async () => {
      const data = { id: 'm1', name: 'Member' };
      (svc.addSavingsMember as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.addMember(req({ body: { groupId: 'g1', name: 'Member' } }), res, jest.fn());
      await flush();
      expect(svc.addSavingsMember).toHaveBeenCalledWith('u1', { groupId: 'g1', name: 'Member' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('removeMember', () => {
    it('should remove member', async () => {
      (svc.removeSavingsMember as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.removeMember(req({ params: { memberId: 'm1' } }), res, jest.fn());
      await flush();
      expect(svc.removeSavingsMember).toHaveBeenCalledWith('u1', 'm1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Membre retiré' });
    });
  });

  describe('getMemberScore', () => {
    it('should return member score', async () => {
      const data = { score: 80, level: 'EXCELLENT' };
      (svc.getMemberScore as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.getMemberScore(req({ params: { memberId: 'm1' } }), res, jest.fn());
      await flush();
      expect(svc.getMemberScore).toHaveBeenCalledWith('u1', 'm1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('startCycle', () => {
    it('should start cycle and return 201', async () => {
      const data = { id: 'c1', status: 'ACTIVE' };
      (svc.startSavingsCycle as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.startCycle(
        req({ params: { id: 'g1' }, body: { startDate: '2025-01-01' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.startSavingsCycle).toHaveBeenCalledWith('u1', 'g1', '2025-01-01');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('closeCycle', () => {
    it('should close cycle', async () => {
      const data = { id: 'c1', status: 'COMPLETED' };
      (svc.closeSavingsCycle as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.closeCycle(req({ params: { cycleId: 'c1' } }), res, jest.fn());
      await flush();
      expect(svc.closeSavingsCycle).toHaveBeenCalledWith('u1', 'c1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('validateCycle', () => {
    it('should validate cycle', async () => {
      const data = { validated: true, validators: 1 };
      (svc.validateCycleClosure as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.validateCycle(req({ params: { cycleId: 'c1' } }), res, jest.fn());
      await flush();
      expect(svc.validateCycleClosure).toHaveBeenCalledWith('u1', 'c1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('processPayouts', () => {
    it('should process payouts', async () => {
      const data = { payout: { memberId: 'm1', memberName: 'M' } };
      (svc.processCyclePayouts as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.processPayouts(req({ params: { cycleId: 'c1' } }), res, jest.fn());
      await flush();
      expect(svc.processCyclePayouts).toHaveBeenCalledWith('u1', 'c1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('getCycleStatus', () => {
    it('should return cycle status', async () => {
      const data = { cycleId: 'c1', status: 'ACTIVE' };
      (svc.getCyclePayoutStatus as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.getCycleStatus(req({ params: { cycleId: 'c1' } }), res, jest.fn());
      await flush();
      expect(svc.getCyclePayoutStatus).toHaveBeenCalledWith('u1', 'c1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('recordContribution', () => {
    it('should record contribution and return 201', async () => {
      const data = { id: 'c1', amount: 5000 };
      (svc.recordContribution as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.recordContribution(
        req({ body: { cycleId: 'c1', memberId: 'm1', amount: 5000 } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.recordContribution).toHaveBeenCalledWith('u1', {
        cycleId: 'c1',
        memberId: 'm1',
        amount: 5000,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('listLoans', () => {
    it('should list loans with groupId filter', async () => {
      const data = [{ id: 'l1', amount: 10000 }];
      (svc.listLoans as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.listLoans(req({ query: { groupId: 'g1' } }), res, jest.fn());
      await flush();
      expect(svc.listLoans).toHaveBeenCalledWith('u1', 'g1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should list loans without groupId', async () => {
      (svc.listLoans as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.listLoans(req(), res, jest.fn());
      await flush();
      expect(svc.listLoans).toHaveBeenCalledWith('u1', undefined);
    });
  });

  describe('createLoan', () => {
    it('should create loan and return 201', async () => {
      const data = { id: 'l1', amount: 50000 };
      (svc.createLoan as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.createLoan(
        req({ body: { groupId: 'g1', memberId: 'm1', amount: 50000 } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.createLoan).toHaveBeenCalledWith('u1', {
        groupId: 'g1',
        memberId: 'm1',
        amount: 50000,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('approveLoan', () => {
    it('should approve loan', async () => {
      const data = { id: 'l1', status: 'ACTIVE' };
      (svc.approveLoan as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.approveLoan(req({ params: { loanId: 'l1' } }), res, jest.fn());
      await flush();
      expect(svc.approveLoan).toHaveBeenCalledWith('u1', 'l1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('repayLoan', () => {
    it('should repay loan', async () => {
      const data = { id: 'l1', status: 'REPAID' };
      (svc.repayLoan as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.repayLoan(
        req({ params: { loanId: 'l1' }, body: { amount: 5000, method: 'CASH' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.repayLoan).toHaveBeenCalledWith('u1', 'l1', 5000, 'CASH');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('stats', () => {
    it('should return savings stats', async () => {
      const data = { totalGroups: 2, totalMembers: 10 };
      (svc.getSavingsStats as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.stats(req(), res, jest.fn());
      await flush();
      expect(svc.getSavingsStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('getGroupEscrows', () => {
    it('should return group escrows', async () => {
      const data = [{ id: 'e1', amount: 100000 }];
      (svc.getGroupEscrows as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      ctrl.getGroupEscrows(req({ params: { id: 'g1' } }), res, jest.fn());
      await flush();
      expect(svc.getGroupEscrows).toHaveBeenCalledWith('u1', 'g1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('requireAuth', () => {
    it('should return 401 for all auth-guarded endpoints when no user', async () => {
      const protectedFns: ((req: any, res: any, next: any) => void)[] = [
        ctrl.list,
        ctrl.get,
        ctrl.create,
        ctrl.update,
        ctrl.remove,
        ctrl.addMember,
        ctrl.removeMember,
        ctrl.getMemberScore,
        ctrl.startCycle,
        ctrl.closeCycle,
        ctrl.validateCycle,
        ctrl.processPayouts,
        ctrl.getCycleStatus,
        ctrl.recordContribution,
        ctrl.listLoans,
        ctrl.createLoan,
        ctrl.approveLoan,
        ctrl.repayLoan,
        ctrl.stats,
        ctrl.getGroupEscrows,
      ];
      for (const fn of protectedFns) {
        const res = mockRes();
        const next = jest.fn();
        fn({} as any, res, next);
        await flush();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        jest.clearAllMocks();
      }
    });
  });
});
