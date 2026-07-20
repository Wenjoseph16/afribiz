import { mockPrisma } from '../setup';
import * as hybridPayment from '../../services/hybridPaymentService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../events/publishers', () => ({ publishCommissionCharged: jest.fn() }));
jest.mock('../../services/monetizationConfig', () => ({
  calculateCommission: jest
    .fn()
    .mockResolvedValue({ rate: 0.01, commission: 100, netAmount: 9900 }),
}));

const mockOrder = {
  id: 'ord-1',
  totalAmount: 10000,
  status: 'PENDING',
  businessId: 'biz-1',
  paidAt: null,
};
const mockPayment = {
  id: 'pay-1',
  orderId: 'ord-1',
  userId: 'u1',
  amount: 5000,
  method: 'CASH',
  status: 'COMPLETED',
  reference: null,
  isManual: false,
  paidAt: new Date(),
  description: '',
  verifiedBy: null,
  verifiedAt: null,
  verificationNotes: null,
  order: mockOrder,
};
const mockProof = { id: 'prf-1', paymentId: 'pay-1', imageUrl: 'proof.jpg', notes: '' };

describe('hybridPaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHybridPayments', () => {
    test('returns payment details for order', async () => {
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([
        { ...mockPayment, proofs: [] },
      ]);
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      const r = await hybridPayment.getHybridPayments('ord-1');
      expect(r.paymentCount).toBe(1);
      expect(r.orderTotal).toBe(10000);
    });

    test('handles order not found', async () => {
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);
      const r = await hybridPayment.getHybridPayments('ord-1');
      expect(r.orderTotal).toBe(0);
      expect(r.isFullyPaid).toBe(false);
    });
  });

  describe('addHybridPayment', () => {
    test('adds completed payment', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);
      (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'fl-1' });
      const r = await hybridPayment.addHybridPayment({
        orderId: 'ord-1',
        userId: 'u1',
        businessId: 'biz-1',
        amount: 5000,
        method: 'CASH',
      });
      expect(r.id).toBe('pay-1');
    });

    test('throws if order not found', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        hybridPayment.addHybridPayment({
          orderId: 'bad-id',
          userId: 'u1',
          businessId: 'biz-1',
          amount: 5000,
          method: 'CASH',
        })
      ).rejects.toThrow('Commande non trouvée');
    });

    test('throws if amount exceeds remaining', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([
        { ...mockPayment, status: 'COMPLETED', amount: 8000 },
      ]);
      await expect(
        hybridPayment.addHybridPayment({
          orderId: 'ord-1',
          userId: 'u1',
          businessId: 'biz-1',
          amount: 5000,
          method: 'CASH',
        })
      ).rejects.toThrow('Le montant dépasse le reste dû');
    });

    test('marks order as CONFIRMED when fully paid', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.payment.create as jest.Mock).mockResolvedValue({ ...mockPayment, amount: 10000 });
      (mockPrisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });
      (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'fl-1' });
      const r = await hybridPayment.addHybridPayment({
        orderId: 'ord-1',
        userId: 'u1',
        businessId: 'biz-1',
        amount: 10000,
        method: 'CASH',
      });
      expect(r.id).toBe('pay-1');
    });

    test('creates payment proof when url provided', async () => {
      (mockPrisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.payment.create as jest.Mock).mockResolvedValue(mockPayment);
      (mockPrisma.paymentProof.create as jest.Mock).mockResolvedValue(mockProof);
      (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'fl-1' });
      const r = await hybridPayment.addHybridPayment({
        orderId: 'ord-1',
        userId: 'u1',
        businessId: 'biz-1',
        amount: 5000,
        method: 'CASH',
        proofUrl: 'proof.jpg',
      });
      expect(r.id).toBe('pay-1');
      expect(mockPrisma.paymentProof.create).toHaveBeenCalled();
    });
  });

  describe('verifyHybridPayment', () => {
    test('approves payment and updates order', async () => {
      (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'VERIFYING',
        order: mockOrder,
      });
      (mockPrisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'COMPLETED',
      });
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([
        { ...mockPayment, amount: 10000, status: 'COMPLETED' },
      ]);
      (mockPrisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'CONFIRMED',
      });
      (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'fl-1' });
      const r = await hybridPayment.verifyHybridPayment('u1', 'pay-1', true);
      expect(r.id).toBe('pay-1');
    });

    test('rejects payment', async () => {
      (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'VERIFYING',
        order: mockOrder,
      });
      (mockPrisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'FAILED',
      });
      const r = await hybridPayment.verifyHybridPayment('u1', 'pay-1', false, 'Invalid');
      expect(r.id).toBe('pay-1');
    });

    test('throws if payment not found', async () => {
      (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(hybridPayment.verifyHybridPayment('u1', 'bad-id', true)).rejects.toThrow(
        'Paiement non trouvé'
      );
    });

    test('throws if payment not in VERIFYING status', async () => {
      (mockPrisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
      await expect(hybridPayment.verifyHybridPayment('u1', 'pay-1', true)).rejects.toThrow(
        'Paiement pas en attente de vérification'
      );
    });
  });
});
