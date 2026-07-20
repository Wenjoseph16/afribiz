import { mockPrisma } from '../setup';
import { initiatePayment, listTransactions } from '../../controllers/paymentsProcessor';

jest.mock('../../services/paymentProcessor', () => ({
  processStripePayment: jest.fn(),
  processFedaPayPayment: jest.fn(),
  processMobileMoney: jest.fn(),
  saveTransaction: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import * as paymentProc from '../../services/paymentProcessor';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('paymentsProcessor controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  it('initiatePayment - STRIPE', async () => {
    (paymentProc.processStripePayment as jest.Mock).mockResolvedValue({
      providerRef: 'pi_123',
      status: 'PENDING',
      fee: 100,
    });
    (paymentProc.saveTransaction as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = mockRes();
    const next = jest.fn();
    initiatePayment(
      req({
        body: {
          provider: 'STRIPE',
          amount: 5000,
          paymentMethodId: 'pm_1',
          orderId: 'o1',
          currency: 'USD',
        },
      }),
      res,
      next
    );
    await flush();
    expect(paymentProc.processStripePayment).toHaveBeenCalledWith(
      5000,
      'USD',
      'pm_1',
      'Paiement o1'
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('initiatePayment - FEDAPAY', async () => {
    (paymentProc.processFedaPayPayment as jest.Mock).mockResolvedValue({
      providerRef: 'fp_1',
      status: 'PENDING',
      fee: 50,
    });
    (paymentProc.saveTransaction as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = mockRes();
    const next = jest.fn();
    initiatePayment(
      req({ body: { provider: 'FEDAPAY', amount: 5000, phone: '+22890123456', currency: 'XOF' } }),
      res,
      next
    );
    await flush();
    expect(paymentProc.processFedaPayPayment).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('initiatePayment - Mobile Money', async () => {
    (paymentProc.processMobileMoney as jest.Mock).mockResolvedValue({
      providerRef: 'mm_1',
      status: 'PENDING',
      fee: 0,
    });
    (paymentProc.saveTransaction as jest.Mock).mockResolvedValue({ id: 't1' });
    const res = mockRes();
    const next = jest.fn();
    initiatePayment(
      req({ body: { provider: 'TMONEY', amount: 2500, phone: '+22890123456' } }),
      res,
      next
    );
    await flush();
    expect(paymentProc.processMobileMoney).toHaveBeenCalledWith('TMONEY', '+22890123456', 2500);
  });

  it('listTransactions', async () => {
    mockPrisma.paymentTransaction.findMany.mockResolvedValue([{ id: 't1', amount: 5000 }]);
    mockPrisma.paymentTransaction.count.mockResolvedValue(1);
    const res = mockRes();
    const next = jest.fn();
    listTransactions(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    mockPrisma.business.findUnique.mockReset();
    const res = mockRes();
    const next = jest.fn();
    initiatePayment({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
