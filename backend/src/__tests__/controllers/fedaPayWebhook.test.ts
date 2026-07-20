import crypto from 'crypto';
import { mockPrisma } from '../setup';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../config/env', () => ({
  config: {
    FEDAPAY_WEBHOOK_SECRET: undefined as string | undefined,
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

import { handleFedaPayWebhook } from '../../controllers/fedaPayWebhook';

function mockReq(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return { body, headers } as any;
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('handleFedaPayWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept transaction.approved and update payment', async () => {
    const req = mockReq({
      type: 'transaction.approved',
      data: { id: 'fp-txn-123' },
    });
    const res = mockRes();

    mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
      id: 'pt-1',
      orderId: 'order-1',
      providerRef: 'fp-txn-123',
    });
    mockPrisma.paymentTransaction.update.mockResolvedValue({});
    mockPrisma.payment.findFirst.mockResolvedValue({
      id: 'pay-1',
      orderId: 'order-1',
    });
    mockPrisma.payment.update.mockResolvedValue({});

    await handleFedaPayWebhook(req, res);

    expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pt-1' },
        data: expect.objectContaining({ status: 'SUCCESS', paidAt: expect.any(Date) }),
      })
    );
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay-1' },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle transaction.failed', async () => {
    const req = mockReq({
      type: 'transaction.failed',
      data: { id: 'fp-txn-456' },
    });
    const res = mockRes();

    mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
      id: 'pt-2',
      orderId: 'order-1',
      providerRef: 'fp-txn-456',
    });
    mockPrisma.paymentTransaction.update.mockResolvedValue({});
    mockPrisma.payment.findFirst.mockResolvedValue(null);

    await handleFedaPayWebhook(req, res);

    expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle transaction.refunded', async () => {
    const req = mockReq({
      type: 'transaction.refunded',
      data: { id: 'fp-txn-789' },
    });
    const res = mockRes();

    mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
      id: 'pt-3',
      orderId: null,
      providerRef: 'fp-txn-789',
    });
    mockPrisma.paymentTransaction.update.mockResolvedValue({});

    await handleFedaPayWebhook(req, res);

    expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REFUNDED' }),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject missing signature when webhook secret is set', async () => {
    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../config/env', () => ({
        config: {
          FEDAPAY_WEBHOOK_SECRET: 'my-secret-key',
        },
      }));
    });

    const req = mockReq({ type: 'transaction.approved', data: { id: 'fp-txn-123' } }, {});
    const res = mockRes();

    const { handleFedaPayWebhook: verifyHandler } = jest.requireActual(
      '../../controllers/fedaPayWebhook'
    );
    await verifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing signature' });
  });

  it('should accept valid signature when webhook secret is set', async () => {
    const secret = 'my-secret-key';
    const payload = JSON.stringify({ type: 'transaction.approved', data: { id: 'fp-txn-123' } });
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    jest.isolateModules(() => {
      jest.resetModules();
      jest.doMock('../../config/env', () => ({
        config: {
          FEDAPAY_WEBHOOK_SECRET: secret,
        },
      }));
      jest.doMock('../../lib/logger', () => ({
        logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
      }));
    });

    const req = mockReq(
      { type: 'transaction.approved', data: { id: 'fp-txn-123' } },
      { 'x-fedapay-signature': signature }
    );
    const res = mockRes();

    const { handleFedaPayWebhook: verifyHandler } = jest.requireActual(
      '../../controllers/fedaPayWebhook'
    );

    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null);

    await verifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 200 for unhandled event types', async () => {
    const req = mockReq({
      type: 'customer.created',
      data: { id: 'cust-1' },
    });
    const res = mockRes();

    await handleFedaPayWebhook(req, res);

    expect(mockPrisma.paymentTransaction.findFirst).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle missing transaction ID gracefully', async () => {
    const req = mockReq({
      type: 'transaction.approved',
      data: {},
    });
    const res = mockRes();

    await handleFedaPayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle unknown transaction reference', async () => {
    const req = mockReq({
      type: 'transaction.approved',
      data: { id: 'fp-txn-unknown' },
    });
    const res = mockRes();

    mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null);

    await handleFedaPayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle internal errors gracefully', async () => {
    const req = mockReq({
      type: 'transaction.approved',
      data: { id: 'fp-txn-err' },
    });
    const res = mockRes();

    mockPrisma.paymentTransaction.findFirst.mockRejectedValue(new Error('DB error'));

    await handleFedaPayWebhook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ received: true }));
  });
});
