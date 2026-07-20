/**
 * Tests pour le module Paiements / Payment Processor
 */

import { mockPrisma } from './setup';
import * as paymentProc from '../services/paymentProcessor';

describe('PaymentProcessor - Mobile Money', () => {
  test('processMobileMoney: accepts TMONEY, FLOOZ, WAVE, MOOV_MONEY', async () => {
    const providers = ['TMONEY', 'FLOOZ', 'WAVE', 'MOOV_MONEY'];
    for (const provider of providers) {
      const result = await paymentProc.processMobileMoney(provider, '22890000000', 5000);
      expect(result.providerRef).toContain(provider);
      expect(result.status).toBe('SUCCESS');
    }
  });

  test('processMobileMoney: rejects unsupported provider', async () => {
    await expect(paymentProc.processMobileMoney('BITCOIN', '22890000000', 5000)).rejects.toThrow(
      'Opérateur non supporté'
    );
  });

  test('processMobileMoney: rejects empty phone', async () => {
    await expect(paymentProc.processMobileMoney('TMONEY', '', 5000)).rejects.toThrow(
      'Numéro de téléphone requis'
    );
  });

  test('processMobileMoney: rejects zero amount', async () => {
    await expect(paymentProc.processMobileMoney('TMONEY', '22890000000', 0)).rejects.toThrow(
      'Montant invalide'
    );
  });

  test('processMobileMoney: test phone returns SUCCESS', async () => {
    const testPhones = ['22901000000', '22901000001', '22997000000', '22890000000', '22177000000'];
    for (const phone of testPhones) {
      const result = await paymentProc.processMobileMoney('FLOOZ', phone, 2500);
      expect(result.status).toBe('SUCCESS');
      expect(result.fee).toBeGreaterThan(0);
    }
  });

  test('processMobileMoney: non-test phone returns PENDING', async () => {
    const result = await paymentProc.processMobileMoney('WAVE', '22896123456', 10000);
    expect(result.status).toBe('PENDING');
    expect(result.message).toContain('Confirmez sur votre téléphone');
  });
});

describe('PaymentProcessor - Save Transaction', () => {
  const mockBusiness = { id: 'biz-1' };
  const mockTransaction = { id: 'tx-1', businessId: 'biz-1', provider: 'TMONEY', amount: 5000 };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
    (mockPrisma.paymentTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);
    (mockPrisma.$transaction as jest.Mock).mockImplementation((fn: (p: any) => any) =>
      fn(mockPrisma)
    );
  });

  test('saveTransaction: creates with valid Mobile Money data', async () => {
    (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });

    const result = await paymentProc.saveTransaction({
      businessId: 'biz-1',
      userId: 'user-1',
      amount: 5000,
      provider: 'TMONEY',
      providerRef: 'TMONEY_123',
      status: 'SUCCESS',
      fee: 50,
    });

    expect(result).toBeDefined();
    expect(mockPrisma.paymentTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'biz-1',
          provider: 'TMONEY',
          status: 'SUCCESS',
          amount: 5000,
        }),
      })
    );
  });

  test('saveTransaction: stores commission on SUCCESS', async () => {
    (mockPrisma.financialLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' });

    await paymentProc.saveTransaction({
      businessId: 'biz-1',
      amount: 10000,
      provider: 'FLOOZ',
      status: 'SUCCESS',
      fee: 100,
    });

    expect(mockPrisma.financialLog.create).toHaveBeenCalled();
  });

  test('saveTransaction: does not commission on PENDING', async () => {
    await paymentProc.saveTransaction({
      businessId: 'biz-1',
      amount: 10000,
      provider: 'WAVE',
      status: 'PENDING',
      fee: 100,
    });

    expect(mockPrisma.financialLog.create).not.toHaveBeenCalled();
  });
});
