jest.mock('../../services/pdfGenerator', () => ({
  generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

jest.mock('../../services/quotesInvoices', () => ({
  listClientQuotes: jest.fn(),
  getClientQuote: jest.fn(),
  listClientInvoices: jest.fn(),
  getClientInvoice: jest.fn(),
  listClientInvoicesStats: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d) => ({ success: true, data: d })),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/clientQuotesInvoices';
import * as qi from '../../services/quotesInvoices';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn();
  r.send = jest.fn();
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('clientQuotesInvoices controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMyQuotes', () => {
    it('should list quotes', async () => {
      (qi.listClientQuotes as jest.Mock).mockResolvedValue([{ id: 'q1' }]);
      const res = mockRes();
      ctrl.listMyQuotes(req({ query: { status: 'SENT' } }), res, jest.fn());
      await flush();
      expect(qi.listClientQuotes).toHaveBeenCalledWith('u1', { status: 'SENT' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'q1' }] });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listMyQuotes({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMyQuote', () => {
    it('should get a quote', async () => {
      (qi.getClientQuote as jest.Mock).mockResolvedValue({ id: 'q1' });
      const res = mockRes();
      ctrl.getMyQuote(req({ params: { id: 'q1' } }), res, jest.fn());
      await flush();
      expect(qi.getClientQuote).toHaveBeenCalledWith('u1', 'q1');
    });
  });

  describe('listMyInvoices', () => {
    it('should list invoices', async () => {
      (qi.listClientInvoices as jest.Mock).mockResolvedValue([{ id: 'inv1' }]);
      const res = mockRes();
      ctrl.listMyInvoices(req(), res, jest.fn());
      await flush();
      expect(qi.listClientInvoices).toHaveBeenCalledWith('u1', {});
    });
  });

  describe('getMyInvoice', () => {
    it('should get an invoice', async () => {
      (qi.getClientInvoice as jest.Mock).mockResolvedValue({ id: 'inv1' });
      const res = mockRes();
      ctrl.getMyInvoice(req({ params: { id: 'inv1' } }), res, jest.fn());
      await flush();
      expect(qi.getClientInvoice).toHaveBeenCalledWith('u1', 'inv1');
    });
  });

  describe('getMyInvoiceStats', () => {
    it('should return stats', async () => {
      (qi.listClientInvoicesStats as jest.Mock).mockResolvedValue({ total: 5, paid: 3 });
      const res = mockRes();
      ctrl.getMyInvoiceStats(req(), res, jest.fn());
      await flush();
      expect(qi.listClientInvoicesStats).toHaveBeenCalledWith('u1');
    });
  });

  describe('downloadMyInvoicePdf', () => {
    it('should download PDF', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv1',
        invoiceNumber: 'INV-001',
        invoiceItems: [],
        business: {},
      });
      const res = mockRes();
      ctrl.downloadMyInvoicePdf(req({ params: { id: 'inv1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.invoice.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inv1', clientId: 'u1' } })
      );
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 if invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.downloadMyInvoicePdf(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
