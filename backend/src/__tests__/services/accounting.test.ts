import { mockPrisma } from '../setup';
import {
  listExpenses,
  createExpense,
  getExpense,
  deleteExpense,
  getAccountingStats,
  getMonthlyReport,
  getBalanceSheet,
  getAccountingSummary,
  getRecentTransactions,
  exportAccountingCSV,
} from '../../services/accounting';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: [], settings: {} };
const mockExp = {
  id: 'exp-1',
  businessId: 'biz-1',
  description: 'Achat',
  amount: 50000,
  category: 'ACHATS',
  date: new Date(),
  createdAt: new Date(),
};

describe('Accounting Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
  });
  test('listExpenses returns paginated', async () => {
    jest.spyOn(mockPrisma.expense, 'findMany').mockResolvedValue([mockExp]);
    jest.spyOn(mockPrisma.expense, 'count').mockResolvedValue(1);
    const r = await listExpenses('u1', {});
    expect(r.total).toBe(1);
  });
  test('createExpense creates', async () => {
    jest.spyOn(mockPrisma.expense, 'create').mockResolvedValue(mockExp);
    const r = await createExpense('u1', { description: 'Test', amount: 10000 });
    expect(r.id).toBe('exp-1');
  });
  test('getExpense returns or throws', async () => {
    jest.spyOn(mockPrisma.expense, 'findFirst').mockResolvedValue(mockExp);
    expect((await getExpense('u1', 'exp-1')).id).toBe('exp-1');
  });
  test('deleteExpense deletes', async () => {
    jest.spyOn(mockPrisma.expense, 'findFirst').mockResolvedValue(mockExp);
    jest.spyOn(mockPrisma.expense, 'delete').mockResolvedValue(mockExp);
    expect((await deleteExpense('u1', 'exp-1')).deleted).toBe(true);
  });
  test('getAccountingStats aggregates', async () => {
    jest.spyOn(mockPrisma.expense, 'aggregate').mockResolvedValue({ _sum: { amount: 100000 } });
    jest
      .spyOn(mockPrisma.expense, 'groupBy')
      .mockResolvedValue([{ category: 'ACHATS', _sum: { amount: 50000 }, _count: 1 }]);
    jest.spyOn(mockPrisma.expense, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 200000 } });
    const r = await getAccountingStats('u1');
    expect(r.totalExpenses).toBe(100000);
  });
  test('getMonthlyReport returns', async () => {
    jest.spyOn(mockPrisma.expense, 'aggregate').mockResolvedValue({ _sum: { amount: 50000 } });
    jest
      .spyOn(mockPrisma.expense, 'groupBy')
      .mockResolvedValue([{ category: 'ACHATS', _sum: { amount: 50000 } }]);
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 100000 } });
    const r = await getMonthlyReport('u1', 2024, 6);
    expect(r.revenue).toBe(100000);
  });
  test('getBalanceSheet returns', async () => {
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 500000 } });
    jest.spyOn(mockPrisma.expense, 'aggregate').mockResolvedValue({ _sum: { amount: 200000 } });
    jest
      .spyOn(mockPrisma.invoice, 'aggregate')
      .mockResolvedValue({ _sum: { totalAmount: 100000, amountPaid: 20000 } });
    jest
      .spyOn(mockPrisma.debt, 'aggregate')
      .mockResolvedValue({ _sum: { remainingAmount: 50000 } });
    jest.spyOn(mockPrisma.quote, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 30000 } });
    const r = await getBalanceSheet('u1', 2024);
    expect(r.assets.totalAssets).toBeGreaterThan(0);
  });
  test('getAccountingSummary returns (skip raw query)', async () => {
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 1000000 } });
    jest.spyOn(mockPrisma.expense, 'aggregate').mockResolvedValue({ _sum: { amount: 100000 } });
    (mockPrisma as any).$queryRawUnsafe = jest.fn().mockResolvedValue([{ total: 50000 }]);
    const r = await getAccountingSummary('u1');
    expect(r.totalRevenue).toBe(1000000);
  });
  test('getRecentTransactions combines', async () => {
    jest.spyOn(mockPrisma.order, 'findMany').mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'CMD',
        totalAmount: 5000,
        status: 'OK',
        createdAt: new Date(),
        paidAt: new Date(),
      },
    ]);
    jest.spyOn(mockPrisma.expense, 'findMany').mockResolvedValue([
      {
        id: 'e1',
        description: 'Fourn',
        amount: 2000,
        category: 'ACHATS',
        date: new Date(),
        createdAt: new Date(),
      },
    ]);
    const r = await getRecentTransactions('u1', 5);
    expect(r.transactions).toHaveLength(2);
  });
  test('exportAccountingCSV generates', async () => {
    jest.spyOn(mockPrisma.expense, 'findMany').mockResolvedValue([
      {
        id: 'e1',
        description: 'Stock',
        amount: 5000,
        category: 'ACHATS',
        date: new Date(),
        createdAt: new Date(),
        reference: null,
        taxDeductible: false,
      },
    ]);
    jest
      .spyOn(mockPrisma.order, 'findMany')
      .mockResolvedValue([
        { orderNumber: 'CMD', totalAmount: 10000, paidAt: new Date(), status: 'OK' },
      ]);
    const r = await exportAccountingCSV('u1', 2024);
    expect(r.csv).toContain('Revenu');
  });
});
