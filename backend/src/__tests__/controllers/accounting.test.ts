import { mockPrisma } from '../setup';
import * as accountingCtrl from '../../controllers/accounting';

jest.mock('../../services/accounting', () => ({
  listExpenses: jest.fn(),
  getExpense: jest.fn(),
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  getAccountingStats: jest.fn(),
  getMonthlyReport: jest.fn(),
  getAccountingSummary: jest.fn(),
  getRecentTransactions: jest.fn(),
}));

import * as accountingService from '../../services/accounting';

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

describe('accounting controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listExpenses', () => {
    it('should list expenses', async () => {
      (accountingService.listExpenses as jest.Mock).mockResolvedValue({
        expenses: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.listExpenses(req(), res, next);
      await flush();
      expect(accountingService.listExpenses).toHaveBeenCalledWith('u1', {});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { expenses: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.listExpenses({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getExpense', () => {
    it('should get expense by id', async () => {
      (accountingService.getExpense as jest.Mock).mockResolvedValue({
        id: 'e1',
        description: 'Test',
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getExpense(req({ params: { id: 'e1' } }), res, next);
      await flush();
      expect(accountingService.getExpense).toHaveBeenCalledWith('u1', 'e1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'e1', description: 'Test' },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getExpense({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createExpense', () => {
    it('should create expense and return 201', async () => {
      (accountingService.createExpense as jest.Mock).mockResolvedValue({ id: 'e1', amount: 100 });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.createExpense(req({ body: { amount: 100, description: 'Achat' } }), res, next);
      await flush();
      expect(accountingService.createExpense).toHaveBeenCalledWith('u1', {
        amount: 100,
        description: 'Achat',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'e1', amount: 100 },
        message: 'Dépense enregistrée',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.createExpense({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('updateExpense', () => {
    it('should update expense', async () => {
      (accountingService.updateExpense as jest.Mock).mockResolvedValue({ id: 'e1', amount: 200 });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.updateExpense(req({ params: { id: 'e1' }, body: { amount: 200 } }), res, next);
      await flush();
      expect(accountingService.updateExpense).toHaveBeenCalledWith('u1', 'e1', { amount: 200 });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'e1', amount: 200 },
        message: 'Dépense mise à jour',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.updateExpense({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense', async () => {
      (accountingService.deleteExpense as jest.Mock).mockResolvedValue({ deleted: true });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.deleteExpense(req({ params: { id: 'e1' } }), res, next);
      await flush();
      expect(accountingService.deleteExpense).toHaveBeenCalledWith('u1', 'e1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Dépense supprimée' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.deleteExpense({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getAccountingStats', () => {
    it('should return accounting stats', async () => {
      (accountingService.getAccountingStats as jest.Mock).mockResolvedValue({
        totalExpenses: 1000,
        monthExpenses: 200,
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getAccountingStats(req(), res, next);
      await flush();
      expect(accountingService.getAccountingStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { totalExpenses: 1000, monthExpenses: 200 },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getAccountingStats({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMonthlyReportCtrl', () => {
    it('should return monthly report with provided year/month', async () => {
      (accountingService.getMonthlyReport as jest.Mock).mockResolvedValue({
        revenue: 500,
        expenses: 300,
        netResult: 200,
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getMonthlyReportCtrl(req({ query: { year: '2024', month: '6' } }), res, next);
      await flush();
      expect(accountingService.getMonthlyReport).toHaveBeenCalledWith('u1', 2024, 6);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { revenue: 500, expenses: 300, netResult: 200 },
      });
    });

    it('should use current year/month when not provided', async () => {
      (accountingService.getMonthlyReport as jest.Mock).mockResolvedValue({
        revenue: 0,
        expenses: 0,
        netResult: 0,
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getMonthlyReportCtrl(req(), res, next);
      await flush();
      const now = new Date();
      expect(accountingService.getMonthlyReport).toHaveBeenCalledWith(
        'u1',
        now.getFullYear(),
        now.getMonth() + 1
      );
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getMonthlyReportCtrl({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getAccountingSummaryCtrl', () => {
    it('should return accounting summary', async () => {
      (accountingService.getAccountingSummary as jest.Mock).mockResolvedValue({
        totalRevenue: 5000,
        monthlyRevenue: 800,
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getAccountingSummaryCtrl(req(), res, next);
      await flush();
      expect(accountingService.getAccountingSummary).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { totalRevenue: 5000, monthlyRevenue: 800 },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getAccountingSummaryCtrl({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getRecentTransactionsCtrl', () => {
    it('should return recent transactions with default limit', async () => {
      (accountingService.getRecentTransactions as jest.Mock).mockResolvedValue({
        transactions: [],
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getRecentTransactionsCtrl(req(), res, next);
      await flush();
      expect(accountingService.getRecentTransactions).toHaveBeenCalledWith('u1', 5);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { transactions: [] } });
    });

    it('should use provided limit', async () => {
      (accountingService.getRecentTransactions as jest.Mock).mockResolvedValue({
        transactions: [{ id: 't1' }],
      });
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getRecentTransactionsCtrl(req({ query: { limit: '10' } }), res, next);
      await flush();
      expect(accountingService.getRecentTransactions).toHaveBeenCalledWith('u1', 10);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { transactions: [{ id: 't1' }] },
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      accountingCtrl.getRecentTransactionsCtrl({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
