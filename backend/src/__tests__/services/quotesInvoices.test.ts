import { mockPrisma } from '../setup';
import {
  listQuotes,
  createQuote,
  listInvoices,
  createInvoice,
  updateInvoicePayment,
  getFinStats,
} from '../../services/quotesInvoices';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishNewMessage: jest.fn() }));

const mockBiz = {
  id: 'biz-1',
  name: 'TestBiz',
  modules: ['QUOTES_INVOICES'],
  settings: { currency: 'FCFA' },
};
const mockQuote = {
  id: 'qt-1',
  businessId: 'biz-1',
  quoteNumber: 'DEV-001',
  clientName: 'Jean',
  clientEmail: 'j@t.com',
  totalAmount: 50000,
  status: 'PENDING',
  items: [],
  createdAt: new Date(),
};
const mockInvoice = {
  id: 'inv-1',
  businessId: 'biz-1',
  invoiceNumber: 'FAC-001',
  clientName: 'Jean',
  totalAmount: 50000,
  amountPaid: 0,
  status: 'PENDING',
  items: [],
  createdAt: new Date(),
};

describe('Quotes & Invoices Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue(mockBiz as any);
  });

  test('listQuotes returns paginated', async () => {
    jest.spyOn(mockPrisma.quote, 'findMany').mockResolvedValue([mockQuote as any]);
    jest.spyOn(mockPrisma.quote, 'count').mockResolvedValue(1);
    const r = await listQuotes('u1', {});
    expect(r.total).toBe(1);
  });

  test('createQuote creates with items', async () => {
    jest.spyOn(mockPrisma.quote, 'create').mockResolvedValue(mockQuote as any);
    const r = await createQuote('u1', {
      clientName: 'Jean',
      clientEmail: 'j@t.com',
      totalAmount: 50000,
      items: [],
    });
    expect(r.id).toBe('qt-1');
  });

  test('listInvoices returns paginated', async () => {
    jest.spyOn(mockPrisma.invoice, 'findMany').mockResolvedValue([mockInvoice as any]);
    jest.spyOn(mockPrisma.invoice, 'count').mockResolvedValue(1);
    const r = await listInvoices('u1', {});
    expect(r.total).toBe(1);
  });

  test('createInvoice creates', async () => {
    jest.spyOn(mockPrisma.invoice, 'create').mockResolvedValue(mockInvoice as any);
    jest.spyOn(mockPrisma.invoice, 'findUnique').mockResolvedValue(mockInvoice as any);
    const r = await createInvoice('u1', { clientName: 'Jean', totalAmount: 50000, items: [] });
    expect(r!.id).toBe('inv-1');
  });

  test('getFinStats aggregates', async () => {
    jest
      .spyOn(mockPrisma.quote, 'aggregate')
      .mockResolvedValue({ _sum: { totalAmount: 100000 } } as any);
    jest
      .spyOn(mockPrisma.invoice, 'aggregate')
      .mockResolvedValue({ _sum: { totalAmount: 500000 } } as any);
    jest.spyOn(mockPrisma.quote, 'count').mockResolvedValue(3);
    jest.spyOn(mockPrisma.invoice, 'count').mockResolvedValue(5);
    jest
      .spyOn(mockPrisma.payment, 'aggregate')
      .mockResolvedValue({ _sum: { amount: 200000 } } as any);
    const r = await getFinStats('u1');
    expect(r).toBeDefined();
    expect(r!.activeQuotes).toBe(3);
  });
});
