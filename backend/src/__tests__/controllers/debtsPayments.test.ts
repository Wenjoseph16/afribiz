jest.mock('../../services/debtsPayments', () => ({
  listDebts: jest.fn(),
  getDebt: jest.fn(),
  updateDebt: jest.fn(),
  registerDebtPayment: jest.fn(),
  updateDebtPriority: jest.fn(),
  createEscrow: jest.fn(),
  releaseEscrow: jest.fn(),
  refundEscrow: jest.fn(),
  disputeEscrow: jest.fn(),
  listEscrows: jest.fn(),
  listClientEscrows: jest.fn(),
  clientReleaseEscrow: jest.fn(),
  clientDisputeEscrow: jest.fn(),
  getClientRisk: jest.fn(),
  updateClientRisk: jest.fn(),
  listClientDebts: jest.fn(),
  clientPayDebt: jest.fn(),
  listClientRisks: jest.fn(),
  sendDebtReminder: jest.fn(),
  listReminders: jest.fn(),
  listFinancialLogs: jest.fn(),
  getDebtAging: jest.fn(),
  getPaymentStats: jest.fn(),
  autoScoreClientRisk: jest.fn(),
  escalateOverdueDebts: jest.fn(),
  autoSendDebtReminders: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/debtsPayments';
import * as svc from '../../services/debtsPayments';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('debtsPayments controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listDebts', () => {
    it('should list debts', async () => {
      (svc.listDebts as jest.Mock).mockResolvedValue([{ id: 'd1' }]);
      const res = mockRes();
      ctrl.listDebts(req({ query: { status: 'PENDING' } }), res, jest.fn());
      await flush();
      expect(svc.listDebts).toHaveBeenCalledWith('u1', { status: 'PENDING' });
    });
  });

  describe('debts CRUD', () => {
    it('getDebt', async () => {
      (svc.getDebt as jest.Mock).mockResolvedValue({ id: 'd1' });
      const res = mockRes();
      ctrl.getDebt(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(svc.getDebt).toHaveBeenCalledWith('u1', 'd1');
    });

    it('updateDebt', async () => {
      (svc.updateDebt as jest.Mock).mockResolvedValue({ id: 'd1', amount: 5000 });
      const res = mockRes();
      ctrl.updateDebt(req({ params: { id: 'd1' }, body: { amount: 5000 } }), res, jest.fn());
      await flush();
      expect(svc.updateDebt).toHaveBeenCalledWith('u1', 'd1', { amount: 5000 });
    });

    it('registerDebtPayment', async () => {
      (svc.registerDebtPayment as jest.Mock).mockResolvedValue({ id: 'd1' });
      const res = mockRes();
      ctrl.registerDebtPayment(
        req({ params: { id: 'd1' }, body: { amount: 1000 } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.registerDebtPayment).toHaveBeenCalledWith('u1', 'd1', { amount: 1000 });
    });
  });

  describe('escrows', () => {
    it('createEscrow', async () => {
      (svc.createEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
      const res = mockRes();
      ctrl.createEscrow(req({ body: { amount: 50000 } }), res, jest.fn());
      await flush();
      expect(svc.createEscrow).toHaveBeenCalledWith('u1', { amount: 50000 });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('releaseEscrow', async () => {
      (svc.releaseEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
      const res = mockRes();
      ctrl.releaseEscrow(req({ params: { id: 'e1' } }), res, jest.fn());
      await flush();
      expect(svc.releaseEscrow).toHaveBeenCalledWith('u1', 'e1');
    });

    it('listEscrows', async () => {
      (svc.listEscrows as jest.Mock).mockResolvedValue([{ id: 'e1' }]);
      const res = mockRes();
      ctrl.listEscrows(req(), res, jest.fn());
      await flush();
    });
  });

  describe('auto actions', () => {
    it('autoScoreClientRisk', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (svc.autoScoreClientRisk as jest.Mock).mockResolvedValue({ score: 75 });
      const res = mockRes();
      ctrl.autoScoreClientRisk(req({ body: { clientId: 'c1' } }), res, jest.fn());
      await flush();
      expect(svc.autoScoreClientRisk).toHaveBeenCalledWith('b1', 'c1');
    });

    it('autoScoreClientRisk should return 400 if clientId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.autoScoreClientRisk(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('escalateOverdueDebts', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (svc.escalateOverdueDebts as jest.Mock).mockResolvedValue(3);
      const res = mockRes();
      ctrl.escalateOverdueDebts(req(), res, jest.fn());
      await flush();
      expect(svc.escalateOverdueDebts).toHaveBeenCalledWith('b1');
    });

    it('autoSendDebtReminders', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (svc.autoSendDebtReminders as jest.Mock).mockResolvedValue(5);
      const res = mockRes();
      ctrl.autoSendDebtReminders(req(), res, jest.fn());
      await flush();
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listDebts({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found for auto actions', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.escalateOverdueDebts(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
