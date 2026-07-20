import { mockPrisma } from '../setup';
import * as financeCtrl from '../../controllers/adminFinanceController';

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
  return {
    user: { id: 'u1', roles: ['ADMIN'] },
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as any;
}

describe('adminFinanceController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminFinanceOverview', () => {
    it('returns overview data', async () => {
      mockPrisma.paymentTransaction.count.mockResolvedValueOnce(100).mockResolvedValueOnce(15);
      mockPrisma.paymentTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 500000 } })
        .mockResolvedValueOnce({ _sum: { fee: 25000 } });
      mockPrisma.escrow.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
      mockPrisma.escrow.aggregate.mockResolvedValueOnce({ _sum: { amount: 200000 } });
      mockPrisma.debt.count.mockResolvedValueOnce(20).mockResolvedValueOnce(5);
      mockPrisma.debt.aggregate.mockResolvedValueOnce({ _sum: { remainingAmount: 100000 } });
      mockPrisma.clientRisk.count.mockResolvedValueOnce(8).mockResolvedValueOnce(3);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminFinanceOverview(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transactions: { total: 100, pending: 15 },
          revenue: { total30d: 500000, fees30d: 25000 },
          escrows: { active: 10, totalHeld: 200000, disputes: 3 },
          debts: { active: 20, totalOwed: 100000, overdue: 5 },
          risks: { highRisk: 8, blacklisted: 3 },
        },
      });
    });

    it('throws 403 if not ADMIN', async () => {
      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminFinanceOverview(req({ user: { id: 'u1', roles: ['USER'] } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 403, message: 'Accès refusé' })
      );
    });
  });

  describe('getAdminAllTransactions', () => {
    it('returns paginated transactions', async () => {
      const transactions = [
        {
          id: 't1',
          amount: 100,
          status: 'SUCCESS',
          provider: 'ORANGE',
          business: { name: 'Biz1', ownerId: 'o1' },
        },
        {
          id: 't2',
          amount: 200,
          status: 'PENDING',
          provider: 'MTN',
          business: { name: 'Biz2', ownerId: 'o2' },
        },
      ];
      mockPrisma.paymentTransaction.findMany.mockResolvedValue(transactions);
      mockPrisma.paymentTransaction.count.mockResolvedValue(2);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllTransactions(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          transactions: [
            { ...transactions[0], businessName: 'Biz1' },
            { ...transactions[1], businessName: 'Biz2' },
          ],
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('filters by status and provider', async () => {
      mockPrisma.paymentTransaction.findMany.mockResolvedValue([]);
      mockPrisma.paymentTransaction.count.mockResolvedValue(0);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllTransactions(
        req({ query: { status: 'SUCCESS', provider: 'MTN', page: '2', limit: '10' } }),
        res,
        next
      );
      await flush();

      expect(mockPrisma.paymentTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'SUCCESS', provider: 'MTN' },
          skip: 10,
          take: 10,
        })
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('clamps page and limit', async () => {
      mockPrisma.paymentTransaction.findMany.mockResolvedValue([]);
      mockPrisma.paymentTransaction.count.mockResolvedValue(0);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllTransactions(req({ query: { page: '0', limit: '999' } }), res, next);
      await flush();

      expect(mockPrisma.paymentTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 100 })
      );
    });

    it('throws 403 if not ADMIN', async () => {
      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllTransactions(req({ user: { id: 'u1', roles: ['USER'] } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('getAdminAllEscrows', () => {
    it('returns paginated escrows', async () => {
      const escrows = [
        { id: 'e1', amount: 500, status: 'HELD', business: { name: 'Biz1', ownerId: 'o1' } },
        {
          id: 'e2',
          amount: 300,
          status: 'DISPUTED',
          disputeReason: 'Non-conforme',
          business: { name: 'Biz2', ownerId: 'o2' },
        },
      ];
      mockPrisma.escrow.findMany.mockResolvedValue(escrows);
      mockPrisma.escrow.count.mockResolvedValue(2);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllEscrows(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          escrows: [
            { ...escrows[0], businessName: 'Biz1' },
            { ...escrows[1], businessName: 'Biz2' },
          ],
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('filters by status', async () => {
      mockPrisma.escrow.findMany.mockResolvedValue([]);
      mockPrisma.escrow.count.mockResolvedValue(0);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllEscrows(
        req({ query: { status: 'DISPUTED', page: '1', limit: '5' } }),
        res,
        next
      );
      await flush();

      expect(mockPrisma.escrow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'DISPUTED' }, skip: 0, take: 5 })
      );
    });

    it('throws 403 if not ADMIN', async () => {
      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminAllEscrows(req({ user: { id: 'u1', roles: ['USER'] } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('getAdminFraudAlerts', () => {
    it('returns aggregated alerts sorted by date', async () => {
      const now = Date.now();
      const blacklisted = [
        {
          updatedAt: new Date(now - 1000),
          client: { firstName: 'John', lastName: 'Doe', email: 'john@test.com', phone: '+123' },
        },
      ];
      const criticalRisks = [
        {
          riskLevel: 'CRITICAL',
          blacklisted: false,
          latePaymentCount: 5,
          updatedAt: new Date(now - 2000),
          client: { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
        },
      ];
      const disputedEscrows = [
        {
          id: 'e1',
          amount: 1000,
          status: 'DISPUTED',
          disputeReason: 'Produit abîmé',
          disputedAt: new Date(now - 3000),
          updatedAt: new Date(now - 3000),
          business: { name: 'Biz1' },
        },
      ];
      const pendingVerification = [
        {
          id: 'p1',
          amount: 50,
          status: 'VERIFYING' as any,
          createdAt: new Date(now - 100000),
          user: { firstName: 'Paul', lastName: 'Test', email: 'paul@test.com' },
        },
      ];

      mockPrisma.clientRisk.findMany
        .mockResolvedValueOnce(blacklisted)
        .mockResolvedValueOnce(criticalRisks);
      mockPrisma.escrow.findMany.mockResolvedValueOnce(disputedEscrows);
      mockPrisma.payment.findMany.mockResolvedValueOnce(pendingVerification);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminFraudAlerts(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            total: 4,
            alerts: expect.arrayContaining([
              expect.objectContaining({ type: 'BLACKLISTED_CLIENT', severity: 'HIGH' }),
              expect.objectContaining({ type: 'CRITICAL_RISK', severity: 'MEDIUM' }),
              expect.objectContaining({ type: 'ESCROW_DISPUTE', severity: 'HIGH' }),
              expect.objectContaining({ type: 'PENDING_VERIFICATION', severity: 'LOW' }),
            ]),
          }),
        })
      );

      const { alerts } = (res.json as jest.Mock).mock.calls[0][0].data;
      for (let i = 1; i < alerts.length; i++) {
        expect(new Date(alerts[i].createdAt).getTime()).toBeLessThanOrEqual(
          new Date(alerts[i - 1].createdAt).getTime()
        );
      }
    });

    it('returns empty alerts when no issues', async () => {
      mockPrisma.clientRisk.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockPrisma.escrow.findMany.mockResolvedValueOnce([]);
      mockPrisma.payment.findMany.mockResolvedValueOnce([]);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminFraudAlerts(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { alerts: [], total: 0 },
      });
    });

    it('throws 403 if not ADMIN', async () => {
      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminFraudAlerts(req({ user: { id: 'u1', roles: ['USER'] } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('getAdminDebtRecovery', () => {
    it('returns debt recovery data with recovery rate', async () => {
      mockPrisma.debt.count.mockResolvedValueOnce(100).mockResolvedValueOnce(30);
      mockPrisma.debt.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 1000000 } })
        .mockResolvedValueOnce({ _sum: { amountPaid: 250000 } });
      mockPrisma.debt.groupBy.mockResolvedValueOnce([
        { buyerId: 'b1', _sum: { remainingAmount: 50000 } },
        { buyerId: 'b2', _sum: { remainingAmount: 30000 } },
      ]);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminDebtRecovery(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalDebts: 100,
          settledDebts: 30,
          totalDebtAmount: 1000000,
          recoveredAmount: 250000,
          recoveryRate: 25,
          topDebtors: [
            { buyerId: 'b1', _sum: { remainingAmount: 50000 } },
            { buyerId: 'b2', _sum: { remainingAmount: 30000 } },
          ],
        },
      });
    });

    it('returns 0 recovery rate when no debt', async () => {
      mockPrisma.debt.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockPrisma.debt.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: null } })
        .mockResolvedValueOnce({ _sum: { amountPaid: null } });
      mockPrisma.debt.groupBy.mockResolvedValueOnce([]);

      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminDebtRecovery(req(), res, next);
      await flush();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalDebts: 0,
          settledDebts: 0,
          totalDebtAmount: 0,
          recoveredAmount: 0,
          recoveryRate: 0,
          topDebtors: [],
        },
      });
    });

    it('throws 403 if not ADMIN', async () => {
      const res = mockRes();
      const next = jest.fn();
      financeCtrl.getAdminDebtRecovery(req({ user: { id: 'u1', roles: ['USER'] } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });
});
