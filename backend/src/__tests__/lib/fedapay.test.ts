import { logger } from '../../lib/logger';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../config/env', () => ({
  config: {
    FEDAPAY_SECRET_KEY: undefined as string | undefined,
    NODE_ENV: 'test',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

import {
  createTransaction,
  retrieveTransaction,
  createPayout,
  createPlan,
  refundTransaction,
  fedapayModeForProvider,
  detectProviderFromPhone,
  isFedaPayAvailable,
  getEnvironment,
} from '../../lib/fedapay';

describe('fedapayModeForProvider', () => {
  it('should map TMONEY to mtn_open', () => {
    expect(fedapayModeForProvider('TMONEY')).toBe('mtn_open');
  });

  it('should map FLOOZ to flooz_open', () => {
    expect(fedapayModeForProvider('FLOOZ')).toBe('flooz_open');
  });

  it('should map WAVE to wave_open', () => {
    expect(fedapayModeForProvider('WAVE')).toBe('wave_open');
  });

  it('should map MOOV_MONEY to moov_open', () => {
    expect(fedapayModeForProvider('MOOV_MONEY')).toBe('moov_open');
  });

  it('should map MTN to mtn_open', () => {
    expect(fedapayModeForProvider('MTN')).toBe('mtn_open');
  });

  it('should map ORANGE to orange_open', () => {
    expect(fedapayModeForProvider('ORANGE')).toBe('orange_open');
  });

  it('should return mtn_open for unknown provider', () => {
    expect(fedapayModeForProvider('UNKNOWN')).toBe('mtn_open');
  });
});

describe('detectProviderFromPhone', () => {
  it('should detect Togo Moov (22890)', () => {
    expect(detectProviderFromPhone('+22890123456')).toBe('moov');
  });

  it('should detect Togo MTN (22896)', () => {
    expect(detectProviderFromPhone('+22896123456')).toBe('mtn');
  });

  it('should detect Benin MTN (22901)', () => {
    expect(detectProviderFromPhone('+22901123456')).toBe('mtn');
  });

  it('should detect Senegal Wave (22177)', () => {
    expect(detectProviderFromPhone('22177123456')).toBe('wave');
  });

  it("should detect Côte d'Ivoire Orange (22507)", () => {
    expect(detectProviderFromPhone('+22507123456')).toBe('orange');
  });

  it('should fallback to country default for Benin', () => {
    expect(detectProviderFromPhone('+22999123456')).toBe('mtn');
  });

  it('should fallback to country default for Togo', () => {
    expect(detectProviderFromPhone('+22800123456')).toBe('moov');
  });

  it('should return undefined for unknown country', () => {
    expect(detectProviderFromPhone('+19990000000')).toBeUndefined();
  });

  it('should clean non-digit characters', () => {
    expect(detectProviderFromPhone('+228 90 12 34 56')).toBe('moov');
  });
});

describe('isFedaPayAvailable / getEnvironment', () => {
  it('should return false when not configured', () => {
    expect(isFedaPayAvailable()).toBe(false);
  });

  it('should return sandbox in test environment', () => {
    expect(getEnvironment()).toBe('sandbox');
  });
});

describe('FedaPay API (simulation mode - no keys)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should return a simulated pending transaction', async () => {
      const result = await createTransaction({
        amount: 5000,
        mode: 'mtn_open',
        description: 'Test payment',
        customerPhone: '+22890123456',
        customerName: 'Jean Test',
      });

      expect(result.id).toMatch(/^sim_txn_/);
      expect(result.status).toBe('pending');
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe('XOF');
      expect(result.mode).toBe('mtn_open');
      expect(result.customer).toBeDefined();
      expect(result.customer!.phone).toBe('+22890123456');
      expect(logger.info).toHaveBeenCalledWith(
        'FedaPay [SIM]: creating transaction',
        expect.any(Object)
      );
    });

    it('should use default currency XOF', async () => {
      const result = await createTransaction({
        amount: 2500,
        mode: 'wave_open',
      });

      expect(result.currency).toBe('XOF');
    });

    it('should not include customer if no phone', async () => {
      const result = await createTransaction({
        amount: 1000,
        mode: 'mtn_open',
      });

      expect(result.customer).toBeUndefined();
    });
  });

  describe('retrieveTransaction', () => {
    it('should return a simulated approved transaction', async () => {
      const result = await retrieveTransaction('txn-123');

      expect(result.id).toBe('txn-123');
      expect(result.status).toBe('approved');
      expect(result.mode).toBe('simulation');
    });
  });

  describe('createPayout', () => {
    it('should return a simulated completed payout', async () => {
      const result = await createPayout({
        amount: 10000,
        recipientPhone: '+22890123456',
        recipientName: 'Jean Test',
      });

      expect(result.id).toMatch(/^sim_payout_/);
      expect(result.status).toBe('completed');
      expect(result.amount).toBe(10000);
    });

    it('should use XOF as default currency', async () => {
      const result = await createPayout({
        amount: 5000,
        recipientPhone: '+22890123456',
      });

      expect(result.currency).toBe('XOF');
    });
  });

  describe('createPlan', () => {
    it('should return a simulated active plan', async () => {
      const result = await createPlan({
        name: 'Premium',
        amount: 5000,
        interval: 'monthly',
        description: 'Monthly premium plan',
      });

      expect(result.id).toMatch(/^sim_plan_/);
      expect(result.name).toBe('Premium');
      expect(result.amount).toBe(5000);
      expect(result.interval).toBe('monthly');
      expect(result.status).toBe('active');
    });

    it('should use XOF as default currency', async () => {
      const result = await createPlan({
        name: 'Basic',
        amount: 2000,
        interval: 'monthly',
      });

      expect(result.currency).toBe('XOF');
    });
  });

  describe('refundTransaction', () => {
    it('should return a simulated completed refund', async () => {
      const result = await refundTransaction('txn-123');

      expect(result.id).toMatch(/^sim_refund_/);
      expect(result.status).toBe('completed');
    });
  });
});
