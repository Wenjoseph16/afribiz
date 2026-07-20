import { mockPrisma } from '../setup';
import {
  getBalanceSheetCtrl,
  getIncomeStatementCtrl,
  exportAccountingCSVCtrl,
} from '../../controllers/accountingAdvanced';
import * as accountingService from '../../services/accounting';

jest.mock('../../services/accounting', () => ({
  getBalanceSheet: jest.fn(),
  getIncomeStatement: jest.fn(),
  exportAccountingCSV: jest.fn(),
}));

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('accountingAdvanced controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalanceSheetCtrl', () => {
    it('should return balance sheet data', async () => {
      const mockData = { year: 2025, assets: {}, liabilities: {}, equity: {} };
      (accountingService.getBalanceSheet as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const next = jest.fn();
      getBalanceSheetCtrl(req({ query: { year: '2025' } }), res, next);
      await flush();
      expect(accountingService.getBalanceSheet).toHaveBeenCalledWith('u1', 2025);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should use current year when no year provided', async () => {
      (accountingService.getBalanceSheet as jest.Mock).mockResolvedValue({});
      const res = mockRes();
      const next = jest.fn();
      getBalanceSheetCtrl(req(), res, next);
      await flush();
      expect(accountingService.getBalanceSheet).toHaveBeenCalledWith(
        'u1',
        new Date().getFullYear()
      );
    });

    it('should return 401 if user is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      getBalanceSheetCtrl(req({ user: null }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Non authentifié' })
      );
    });
  });

  describe('getIncomeStatementCtrl', () => {
    it('should return income statement data', async () => {
      const mockData = { year: 2025, revenue: {}, expenses: {}, netIncome: 0 };
      (accountingService.getIncomeStatement as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const next = jest.fn();
      getIncomeStatementCtrl(req({ query: { year: '2025' } }), res, next);
      await flush();
      expect(accountingService.getIncomeStatement).toHaveBeenCalledWith('u1', 2025);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should use current year when no year provided', async () => {
      (accountingService.getIncomeStatement as jest.Mock).mockResolvedValue({});
      const res = mockRes();
      const next = jest.fn();
      getIncomeStatementCtrl(req(), res, next);
      await flush();
      expect(accountingService.getIncomeStatement).toHaveBeenCalledWith(
        'u1',
        new Date().getFullYear()
      );
    });

    it('should return 401 if user is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      getIncomeStatementCtrl(req({ user: null }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Non authentifié' })
      );
    });
  });

  describe('exportAccountingCSVCtrl', () => {
    it('should return CSV export', async () => {
      const mockData = { csv: 'a,b,c\n1,2,3', filename: 'export.csv' };
      (accountingService.exportAccountingCSV as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const next = jest.fn();
      exportAccountingCSVCtrl(req({ query: { year: '2025' } }), res, next);
      await flush();
      expect(accountingService.exportAccountingCSV).toHaveBeenCalledWith('u1', 2025);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="export.csv"'
      );
      expect(res.send).toHaveBeenCalledWith('a,b,c\n1,2,3');
    });

    it('should use current year when no year provided', async () => {
      (accountingService.exportAccountingCSV as jest.Mock).mockResolvedValue({
        csv: '',
        filename: '',
      });
      const res = mockRes();
      const next = jest.fn();
      exportAccountingCSVCtrl(req(), res, next);
      await flush();
      expect(accountingService.exportAccountingCSV).toHaveBeenCalledWith(
        'u1',
        new Date().getFullYear()
      );
    });

    it('should return 401 if user is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      exportAccountingCSVCtrl(req({ user: null }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Non authentifié' })
      );
    });
  });
});
