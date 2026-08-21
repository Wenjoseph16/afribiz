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

  test('saveTransaction notifies the business owner (not the buyer) of the commission', async () => {
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'tx-1' } as any);
    mockPrisma.financialLog.create.mockResolvedValue({} as any);
    const { publishCommissionCharged } = jest.requireMock('../../events/publishers');
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'biz-1',
      name: 'Ma Boutique',
      ownerId: 'owner-1',
    } as any);

    await saveTransaction({
      businessId: 'biz-1',
      userId: 'buyer-1', // l'acheteur ne doit PAS recevoir la commission
      orderId: 'o1',
      amount: 10000,
      currency: 'FCFA',
      provider: 'MTN',
      providerRef: 'REF',
      status: 'SUCCESS',
      fee: 0,
    });

    expect(publishCommissionCharged).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner-1', businessId: 'biz-1' })
    );
    expect(publishCommissionCharged).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'buyer-1' })
    );
  });

  test('saveTransaction skips commission notification when business has no owner', async () => {
    mockPrisma.paymentTransaction.create.mockResolvedValue({ id: 'tx-1' } as any);
    mockPrisma.financialLog.create.mockResolvedValue({} as any);
    const { publishCommissionCharged } = jest.requireMock('../../events/publishers');
    mockPrisma.business.findUnique.mockResolvedValue(null as any);

    await saveTransaction({
      businessId: 'biz-1',
      amount: 10000,
      currency: 'FCFA',
      provider: 'MTN',
      status: 'SUCCESS',
      fee: 0,
    });

    expect(publishCommissionCharged).not.toHaveBeenCalled();
  });

  test('processStripePayment throws when not configured', async () => {
    await expect(processStripePayment(5000, 'usd', 'pm_card_visa', 'Test')).rejects.toThrow(
      'Stripe non configuré'
    );
  });
});
