jest.mock('../../services/quotesInvoices', () => ({
  listQuotes: jest.fn(),
  getQuote: jest.fn(),
  createQuote: jest.fn(),
  updateQuote: jest.fn(),
  updateQuoteStatus: jest.fn(),
  convertQuoteToInvoice: jest.fn(),
  deleteQuote: jest.fn(),
  listInvoices: jest.fn(),
  getInvoice: jest.fn(),
  createInvoice: jest.fn(),
  updateInvoiceStatus: jest.fn(),
  updateInvoicePayment: jest.fn(),
  deleteInvoice: jest.fn(),
  getFinStats: jest.fn(),
  getBusinessByOwner: jest.fn(),
}));

jest.mock('../../services/pdfGenerator', () => ({
  generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d) => ({ success: true, data: d })),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/quotesInvoices';
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

describe('quotesInvoices controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('quotes', () => {
    it('listQuotes', async () => {
      (qi.listQuotes as jest.Mock).mockResolvedValue([{ id: 'q1' }]);
      const res = mockRes();
      ctrl.listQuotes(req(), res, jest.fn());
      await flush();
      expect(qi.listQuotes).toHaveBeenCalledWith('u1', {});
    });

    it('createQuote', async () => {
      (qi.createQuote as jest.Mock).mockResolvedValue({ id: 'q1' });
      const res = mockRes();
      ctrl.createQuote(req({ body: { clientId: 'c1', items: [] } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updateQuoteStatus', async () => {
      (qi.updateQuoteStatus as jest.Mock).mockResolvedValue({ id: 'q1', status: 'ACCEPTED' });
      const res = mockRes();
      ctrl.updateQuoteStatus(
        req({ params: { id: 'q1' }, body: { status: 'ACCEPTED' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(qi.updateQuoteStatus).toHaveBeenCalledWith('u1', 'q1', 'ACCEPTED', undefined);
    });

    it('convertQuoteToInvoice', async () => {
      (qi.convertQuoteToInvoice as jest.Mock).mockResolvedValue({ id: 'inv1' });
      const res = mockRes();
      ctrl.convertQuoteToInvoice(req({ params: { id: 'q1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('invoices', () => {
    it('createInvoice', async () => {
      (qi.createInvoice as jest.Mock).mockResolvedValue({ id: 'inv1' });
      const res = mockRes();
      ctrl.createInvoice(req({ body: { clientId: 'c1' } }), res, jest.fn());
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('updateInvoiceStatus', async () => {
      (qi.updateInvoiceStatus as jest.Mock).mockResolvedValue({ id: 'inv1' });
      const res = mockRes();
      ctrl.updateInvoiceStatus(
        req({ params: { id: 'inv1' }, body: { status: 'PAID' } }),
        res,
        jest.fn()
      );
      await flush();
    });

    it('getFinStats', async () => {
      (qi.getFinStats as jest.Mock).mockResolvedValue({ revenue: 500000 });
      const res = mockRes();
      ctrl.getFinStats(req(), res, jest.fn());
      await flush();
    });

    it('downloadInvoicePdf', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv1',
        businessId: 'b1',
        invoiceNumber: 'INV-001',
        invoiceItems: [],
        client: {},
        business: {},
      });
      (qi.getBusinessByOwner as jest.Mock).mockResolvedValue({ id: 'b1' });
      const res = mockRes();
      ctrl.downloadInvoicePdf(req({ params: { id: 'inv1' } }), res, jest.fn());
      await flush();
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it('downloadInvoicePdf should return 404 if invoice not found', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.downloadInvoicePdf(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('downloadInvoicePdf should return 403 if unauthorized', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv1',
        businessId: 'other',
        invoiceNumber: 'INV-001',
        invoiceItems: [],
        client: {},
        business: {},
      });
      (qi.getBusinessByOwner as jest.Mock).mockResolvedValue({ id: 'b1' });
      const res = mockRes();
      const next = jest.fn();
      ctrl.downloadInvoicePdf(req({ params: { id: 'inv1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });

  describe('downloadQuotePdf', () => {
    it('should return 501', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.downloadQuotePdf(req({ params: { id: 'q1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 501 }));
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.listQuotes({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
