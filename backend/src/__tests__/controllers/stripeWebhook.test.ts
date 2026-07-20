jest.mock('../../lib/db', () => ({
  prisma: {
    paymentTransaction: { findFirst: jest.fn(), update: jest.fn() },
    payment: { findFirst: jest.fn(), update: jest.fn() },
  },
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../config/env', () => ({
  config: { STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test' },
}));

const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => ({
  Stripe: jest.fn().mockImplementation(() => mockStripe),
}));

import { handleStripeWebhook } from '../../controllers/stripeWebhook';
const { prisma } = require('../../lib/db');

function mockReq(overrides: any = {}) {
  return {
    headers: { 'stripe-signature': 'test_sig' },
    body: Buffer.from('raw body'),
    ...overrides,
  } as any;
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

describe('stripeWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process payment_intent.succeeded', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_123' } },
    });
    prisma.paymentTransaction.findFirst.mockResolvedValue({ id: 'tx1', orderId: 'order1' });
    prisma.paymentTransaction.update.mockResolvedValue({});
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay1' });
    prisma.payment.update.mockResolvedValue({});

    const res = mockRes();
    await handleStripeWebhook(mockReq(), res);
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'SUCCESS', paidAt: expect.any(Date) }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it('should process payment_intent.payment_failed', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_123' } },
    });
    prisma.paymentTransaction.findFirst.mockResolvedValue({ id: 'tx1' });
    const res = mockRes();
    await handleStripeWebhook(mockReq(), res);
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) })
    );
  });

  it('should process charge.refunded', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: { object: { payment_intent: 'pi_123' } },
    });
    prisma.paymentTransaction.findFirst.mockResolvedValue({ id: 'tx1' });
    const res = mockRes();
    await handleStripeWebhook(mockReq(), res);
    expect(prisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'REFUNDED' }) })
    );
  });

  it('should handle unhandled events', async () => {
    mockStripe.webhooks.constructEvent.mockReturnValue({
      type: 'unhandled.event',
      data: { object: {} },
    });
    const res = mockRes();
    await handleStripeWebhook(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 400 on invalid signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = mockRes();
    await handleStripeWebhook(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
  });

  it('should handle Stripe not configured', async () => {
    jest.resetModules();
    jest.doMock('../../config/env', () => ({
      config: { STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '' },
    }));
    const { handleStripeWebhook: hsw } = await import('../../controllers/stripeWebhook');
    const res = mockRes();
    await hsw(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ received: false, error: 'Stripe non configuré' });
  });
});
