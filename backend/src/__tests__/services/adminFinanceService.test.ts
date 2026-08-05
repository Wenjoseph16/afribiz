import { mockPrisma } from '../setup';
import {
  getAdminFinanceOverview,
  getAdminFinanceTransactions,
  getAdminFinanceEscrows,
  getAdminFinanceFraudAlerts,
  getAdminFinanceDebtRecovery,
} from '../../services/adminFinanceService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('adminFinanceService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAdminFinanceOverview agrège la finance plateforme', async () => {
    jest
      .spyOn(mockPrisma.payment, 'aggregate')
      .mockResolvedValue({ _sum: { amount: 100000 } } as any);
    jest
      .spyOn(mockPrisma.escrow, 'aggregate')
      .mockResolvedValue({ _sum: { fee: 5000, amount: 200000 } } as any);
    jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(50);
    jest.spyOn(mockPrisma.escrow, 'count').mockResolvedValue(3);
    jest
      .spyOn(mockPrisma.debt, 'aggregate')
      .mockResolvedValue({ _sum: { remainingAmount: 75000, amountPaid: 25000 } } as any);
    jest.spyOn(mockPrisma.debt, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.fraudEvent, 'count').mockResolvedValue(2);

    const r = await getAdminFinanceOverview();
    expect(r.revenue.total30d).toBe(100000);
    expect(r.revenue.fees30d).toBe(5000);
    expect(r.transactions.total).toBe(50);
    expect(r.escrows.active).toBe(3);
    expect(r.escrows.totalHeld).toBe(200000);
    expect(r.debts.totalOwed).toBe(75000);
    expect(r.risks.highRisk).toBe(2);
    expect(r.risks.blacklisted).toBe(2);
  });

  test('getAdminFinanceTransactions mappe COMPLETED → SUCCESS', async () => {
    jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(1);
    jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([
      {
        id: 'p1',
        createdAt: new Date(),
        amount: 5000,
        method: 'WAVE',
        status: 'COMPLETED',
        reference: 'REF-1',
        business: { name: 'Saveur' },
      } as any,
    ]);
    const r = await getAdminFinanceTransactions({ page: 1, limit: 15 });
    expect(r.transactions).toHaveLength(1);
    expect(r.transactions[0].businessName).toBe('Saveur');
    expect(r.transactions[0].status).toBe('SUCCESS');
    expect(r.transactions[0].providerRef).toBe('REF-1');
  });

  test('getAdminFinanceTransactions traduit status=SUCCESS vers COMPLETED', async () => {
    jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(0);
    jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue([]);
    await getAdminFinanceTransactions({ status: 'SUCCESS' });
    expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'COMPLETED' } })
    );
  });

  test('getAdminFinanceEscrows retourne les lignes escrow', async () => {
    jest.spyOn(mockPrisma.escrow, 'count').mockResolvedValue(1);
    jest.spyOn(mockPrisma.escrow, 'findMany').mockResolvedValue([
      {
        id: 'e1',
        createdAt: new Date(),
        amount: 90000,
        status: 'HELD',
        disputeReason: null,
        releasedAt: null,
        business: { name: 'Saveur' },
      } as any,
    ]);
    const r = await getAdminFinanceEscrows({});
    expect(r.escrows[0].businessName).toBe('Saveur');
    expect(r.escrows[0].amount).toBe(90000);
    expect(r.escrows[0].status).toBe('HELD');
  });

  test('getAdminFinanceFraudAlerts retourne les événements non bloqués', async () => {
    jest.spyOn(mockPrisma.fraudEvent, 'findMany').mockResolvedValue([
      {
        id: 'fx1',
        eventType: 'VELOCITY_ORDER',
        severity: 'HIGH',
        ruleName: 'Vitesse anormale',
        blocked: false,
        createdAt: new Date(),
        ipAddress: '1.2.3.4',
        metadata: { amount: 50000 },
        user: { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com' },
      } as any,
    ]);
    const r = await getAdminFinanceFraudAlerts();
    expect(r.total).toBe(1);
    expect(r.alerts[0].client?.email).toBe('a@b.com');
    expect(r.alerts[0].amount).toBe(50000);
    expect(r.alerts[0].severity).toBe('HIGH');
  });

  test('getAdminFinanceDebtRecovery calcule le taux de recouvrement', async () => {
    jest.spyOn(mockPrisma.debt, 'count').mockResolvedValue(10);
    jest
      .spyOn(mockPrisma.debt, 'aggregate')
      .mockResolvedValue({ _sum: { remainingAmount: 75000, amountPaid: 25000 } } as any);
    jest
      .spyOn(mockPrisma.debt, 'groupBy')
      .mockResolvedValue([{ buyerId: 'u1', _sum: { remainingAmount: 40000 } }] as any);

    const r = await getAdminFinanceDebtRecovery();
    expect(r.totalDebts).toBe(10);
    expect(r.recoveredAmount).toBe(25000);
    expect(r.totalDebtAmount).toBe(75000);
    expect(r.recoveryRate).toBe(25); // 25000 / (25000 + 75000)
    expect(r.topDebtors).toHaveLength(1);
  });
});
