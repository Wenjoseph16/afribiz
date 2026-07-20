import { mockPrisma } from '../setup';
import {
  getHybridPayments,
  addHybridPayment,
  verifyHybridPayment,
} from '../../services/hybridPaymentService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({ publishCommissionCharged: jest.fn() }));
jest.mock('../../services/monetizationConfig', () => ({
  calculateCommission: jest.fn().mockResolvedValue({ rate: 0.01, commission: 100 }),
}));

describe('Hybrid Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getHybridPayments returns summary', async () => {
    const mockPayments = [
      {
        id: 'pay-1',
        amount: 5000,
        status: 'COMPLETED',
        method: 'OM',
        reference: 'REF1',
        paidAt: new Date(),
        isManual: false,
        proofs: [],
      },
      {
        id: 'pay-2',
        amount: 3000,
        status: 'COMPLETED',
        method: 'Wave',
        reference: 'REF2',
        paidAt: new Date(),
        isManual: false,
        proofs: [],
      },
    ];
    jest.spyOn(mockPrisma.payment, 'findMany').mockResolvedValue(mockPayments);
    jest
      .spyOn(mockPrisma.order, 'findUnique')
      .mockResolvedValue({ id: 'ord-1', totalAmount: 10000 });
    const r = await getHybridPayments('ord-1');
    expect(r.totalPaid).toBe(8000);
    expect(r.paymentCount).toBe(2);
    expect(r.methods).toHaveLength(2);
  });

  test('addHybridPayment creates payment', async () => {
    jest
      .spyOn(mockPrisma.order, 'findUnique')
      .mockResolvedValue({ id: 'ord-1', totalAmount: 10000 });
    jest
      .spyOn(mockPrisma.payment, 'findMany')
      .mockResolvedValue([{ amount: 3000, status: 'COMPLETED' }]);
    const spy = jest
      .spyOn(mockPrisma.payment, 'create')
      .mockResolvedValue({ id: 'pay-1', amount: 5000 });
    jest.spyOn(mockPrisma.financialLog, 'create').mockResolvedValue({});
    const r = await addHybridPayment({
      orderId: 'ord-1',
      userId: 'u1',
      businessId: 'biz-1',
      amount: 5000,
      method: 'OM',
    });
    expect(r.id).toBe('pay-1');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: 5000 }) })
    );
  });

  test('addHybridPayment rejects overpayment', async () => {
    jest
      .spyOn(mockPrisma.order, 'findUnique')
      .mockResolvedValue({ id: 'ord-1', totalAmount: 10000 });
    jest
      .spyOn(mockPrisma.payment, 'findMany')
      .mockResolvedValue([{ amount: 8000, status: 'COMPLETED' }]);
    await expect(
      addHybridPayment({
        orderId: 'ord-1',
        userId: 'u1',
        businessId: 'biz-1',
        amount: 5000,
        method: 'OM',
      })
    ).rejects.toThrow('Le montant dépasse le reste dû');
  });

  test('verifyHybridPayment approves payment', async () => {
    jest.spyOn(mockPrisma.payment, 'findUnique').mockResolvedValue({
      id: 'pay-1',
      status: 'VERIFYING',
      amount: 5000,
      orderId: 'ord-1',
      userId: 'u1',
    });
    jest.spyOn(mockPrisma.payment, 'update').mockResolvedValue({});
    jest
      .spyOn(mockPrisma.order, 'findUnique')
      .mockResolvedValue({ id: 'ord-1', totalAmount: 5000, businessId: 'biz-1' });
    jest
      .spyOn(mockPrisma.payment, 'findMany')
      .mockResolvedValue([{ amount: 5000, status: 'COMPLETED' }]);
    jest.spyOn(mockPrisma.financialLog, 'create').mockResolvedValue({});
    const r = await verifyHybridPayment('owner-1', 'pay-1', true);
    expect(r.id).toBe('pay-1');
  });

  test('verifyHybridPayment rejects non-verifying', async () => {
    jest
      .spyOn(mockPrisma.payment, 'findUnique')
      .mockResolvedValue({ id: 'pay-1', status: 'COMPLETED' });
    await expect(verifyHybridPayment('u1', 'pay-1', true)).rejects.toThrow(
      'pas en attente de vérification'
    );
  });
});
