jest.mock('../../services/employeeLeaves', () => ({
  listPayrolls: jest.fn(),
  getPayroll: jest.fn(),
  createPayroll: jest.fn(),
  updatePayrollStatus: jest.fn(),
  deletePayroll: jest.fn(),
  getPayrollStats: jest.fn(),
}));

import * as ctrl from '../../controllers/payrollController';
import * as svc from '../../services/employeeLeaves';

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
  return { user: { id: 'u1' }, params: {}, query: {}, body: {}, ...overrides } as any;
}

describe('payroll controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listPayrolls', () => {
    it('should list payrolls', async () => {
      const result = { items: [], total: 0, page: 1, limit: 20 };
      (svc.listPayrolls as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.listPayrolls(
        req({ query: { status: 'DRAFT', page: '1', limit: '10' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.listPayrolls).toHaveBeenCalledWith('u1', {
        status: 'DRAFT',
        page: '1',
        limit: '10',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listPayrolls({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getPayroll', () => {
    it('should get payroll by id', async () => {
      const payroll = { id: 'p1', netAmount: 50000 };
      (svc.getPayroll as jest.Mock).mockResolvedValue(payroll);
      const res = mockRes();
      ctrl.getPayroll(req({ params: { id: 'p1' } }), res, jest.fn());
      await flush();
      expect(svc.getPayroll).toHaveBeenCalledWith('u1', 'p1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: payroll });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getPayroll({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createPayroll', () => {
    it('should create payroll and return 201', async () => {
      const payroll = { id: 'p1', netAmount: 50000 };
      (svc.createPayroll as jest.Mock).mockResolvedValue(payroll);
      const res = mockRes();
      ctrl.createPayroll(
        req({ body: { employeeId: 'e1', periodStart: '2025-01-01', periodEnd: '2025-01-31' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.createPayroll).toHaveBeenCalledWith('u1', {
        employeeId: 'e1',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: payroll,
        message: 'Fiche de paie créée',
      });
    });
  });

  describe('updatePayrollStatus', () => {
    it('should update payroll status', async () => {
      const payroll = { id: 'p1', status: 'PAID' };
      (svc.updatePayrollStatus as jest.Mock).mockResolvedValue(payroll);
      const res = mockRes();
      ctrl.updatePayrollStatus(
        req({ params: { id: 'p1' }, body: { status: 'PAID', notes: 'Ok' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.updatePayrollStatus).toHaveBeenCalledWith('u1', 'p1', {
        status: 'PAID',
        notes: 'Ok',
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: payroll,
        message: 'Statut de paie mis à jour',
      });
    });
  });

  describe('deletePayroll', () => {
    it('should delete payroll', async () => {
      const result = { message: 'Fiche de paie supprimée' };
      (svc.deletePayroll as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.deletePayroll(req({ params: { id: 'p1' } }), res, jest.fn());
      await flush();
      expect(svc.deletePayroll).toHaveBeenCalledWith('u1', 'p1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getPayrollStats', () => {
    it('should return payroll stats', async () => {
      const stats = { total: 10, draft: 5, paid: 5 };
      (svc.getPayrollStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();
      ctrl.getPayrollStats(req(), res, jest.fn());
      await flush();
      expect(svc.getPayrollStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });
  });

  describe('auth guard', () => {
    it('should return 401 for all endpoints if no user', async () => {
      const endpoints = [
        ctrl.listPayrolls,
        ctrl.getPayroll,
        ctrl.createPayroll,
        ctrl.updatePayrollStatus,
        ctrl.deletePayroll,
        ctrl.getPayrollStats,
      ];
      for (const ep of endpoints) {
        const res = mockRes();
        const next = jest.fn();
        ep({} as any, res, next);
        await flush();
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
        jest.clearAllMocks();
      }
    });
  });
});
