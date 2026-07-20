import { mockPrisma } from '../setup';
import {
  processStripePayment,
  processMobileMoney,
  processFedaPayPayment,
  saveTransaction,
} from '../../services/paymentProcessor';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/fedapay', () => ({
  isFedaPayAvailable: jest.fn().mockReturnValue(false),
  createTransaction: jest.fn(),
  retrieveTransaction: jest.fn(),
}));
jest.mock('../../services/monetizationConfig', () => ({
  calculateCommission: jest.fn().mockResolvedValue({ rate: 0.01, commission: 100 }),
}));
jest.mock('../../events/publishers', () => ({ publishCommissionCharged: jest.fn() }));

describe('Payment Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processMobileMoney processes payment', async () => {
    const r = await processMobileMoney('MTN', '22901000000', 5000, 'Test');
    expect(r).toBeDefined();
  });

  test('processMobileMoney rejects invalid operator', async () => {
    await expect(processMobileMoney('XYZ', '+22501000000', 5000, 'Test')).rejects.toThrow(
      'Opérateur non supporté'
    );
  });

  test('saveTransaction saves to DB', async () => {
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'tx-1' } as any);
    mockPrisma.financialLog.create.mockResolvedValue({} as any);
    const r = await saveTransaction({
      businessId: 'biz-1',
      userId: 'u1',
      orderId: 'o1',
      amount: 5000,
      currency: 'FCFA',
      provider: 'MTN',
      providerRef: 'REF',
      status: 'SUCCESS',
      fee: 0,
    });
    expect(r.id).toBe('tx-1');
  });

  test('processStripePayment throws when not configured', async () => {
    await expect(processStripePayment(5000, 'usd', 'pm_card_visa', 'Test')).rejects.toThrow(
      'Stripe non configuré'
    );
  });
});
