import { mockPrisma } from '../setup';
import * as pdfGenerator from '../../services/pdfGenerator';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockGetBuffer = jest.fn((cb: Function) => cb(null, Buffer.from('PDF')));
const mockCreatePdf = jest.fn(() => ({ getBuffer: mockGetBuffer }));

jest.mock('pdfmake', () => ({ createPdf: mockCreatePdf }), { virtual: true });
jest.mock('pdfmake/build/vfs_fonts', () => ({ default: {} }), { virtual: true });
jest.mock('pdfmake/build/vfs_fonts.js', () => ({ default: {} }), { virtual: true });

describe('pdfGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBusiness = {
    id: 'biz-1',
    name: 'Biz',
    logo: null,
    email: 'biz@test.com',
    phone: '+22890123456',
    address: 'Address',
    city: 'Lome',
    country: 'Togo',
    whatsapp: null,
    website: null,
    taxId: null,
    settings: null,
  };

  describe('generateQuotePdf', () => {
    it('should generate a quote PDF buffer', async () => {
      const quote = {
        id: 'q-1',
        quoteNumber: 'Q-001',
        status: 'SENT',
        subtotal: 10000,
        totalAmount: 10000,
        taxAmount: 0,
        discountAmount: 0,
        currency: 'FCFA',
        notes: null,
        terms: null,
        createdAt: new Date(),
        validUntil: null,
        client: {
          id: 'c-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'j@t.com',
          phone: '+22890123456',
        },
        clientName: null,
        clientEmail: null,
        clientPhone: null,
        business: mockBusiness,
        quoteItems: [{ description: 'Item', quantity: 1, unitPrice: 10000, total: 10000 }],
      } as any;
      const result = await pdfGenerator.generateQuotePdf(quote);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockCreatePdf).toHaveBeenCalled();
    });
  });

  describe('generateInvoicePdf', () => {
    it('should generate an invoice PDF buffer', async () => {
      const invoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        status: 'SENT',
        subtotal: 10000,
        totalAmount: 10000,
        taxAmount: 0,
        discountAmount: 0,
        amountPaid: 0,
        currency: 'FCFA',
        notes: null,
        terms: null,
        createdAt: new Date(),
        dueDate: null,
        client: {
          id: 'c-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'j@t.com',
          phone: '+22890123456',
        },
        clientName: null,
        clientEmail: null,
        clientPhone: null,
        business: mockBusiness,
        invoiceItems: [{ description: 'Item', quantity: 1, unitPrice: 10000, total: 10000 }],
      } as any;
      const result = await pdfGenerator.generateInvoicePdf(invoice);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockCreatePdf).toHaveBeenCalled();
    });
  });

  describe('generateRentalContractPdf', () => {
    it('should generate a rental contract PDF', async () => {
      const booking = {
        id: 'book-1',
        bookingNumber: 'BK-001',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        price: 5000,
        customerName: null,
        createdAt: new Date(),
        status: 'CONFIRMED',
        client: {
          id: 'c-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'j@t.com',
          phone: '+22890123456',
        },
        business: mockBusiness,
        rental: {
          id: 'r-1',
          name: 'Rental Item',
          price: 5000,
          description: 'Nice item',
          deposit: 1000,
        },
      } as any;
      const result = await pdfGenerator.generateRentalContractPdf(booking);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockCreatePdf).toHaveBeenCalled();
    });
  });

  describe('generateTrainingCertificatePdf', () => {
    it('should generate a training certificate PDF', async () => {
      const data = {
        userName: 'John Doe',
        trainingTitle: 'Business 101',
        businessName: 'AfriBiz',
        completionDate: new Date(),
        certId: 'CERT-001',
      };
      const result = await pdfGenerator.generateTrainingCertificatePdf(data);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(mockCreatePdf).toHaveBeenCalled();
    });
  });
});
