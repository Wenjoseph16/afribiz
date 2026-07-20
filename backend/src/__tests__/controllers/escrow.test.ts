import * as escrowCtrl from '../../controllers/escrow';

jest.mock('../../services/debtsPayments', () => ({
  createEscrow: jest.fn(),
  listEscrows: jest.fn(),
  getEscrowById: jest.fn(),
  releaseEscrow: jest.fn(),
  refundEscrow: jest.fn(),
  disputeEscrow: jest.fn(),
  getPaymentStats: jest.fn(),
  listClientEscrows: jest.fn(),
  getClientEscrowById: jest.fn(),
  clientReleaseEscrow: jest.fn(),
  clientDisputeEscrow: jest.fn(),
}));

import * as debtsPaymentsService from '../../services/debtsPayments';

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

describe('escrow controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createEscrow returns 201', async () => {
    (debtsPaymentsService.createEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.createEscrow(req({ body: { amount: 50000, orderId: 'o1' } }), res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('listEscrows', async () => {
    (debtsPaymentsService.listEscrows as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.listEscrows(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getEscrowById', async () => {
    (debtsPaymentsService.getEscrowById as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.getEscrowById(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(debtsPaymentsService.getEscrowById).toHaveBeenCalled();
  });

  it('releaseEscrow', async () => {
    (debtsPaymentsService.releaseEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.releaseEscrow(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(debtsPaymentsService.releaseEscrow).toHaveBeenCalled();
  });

  it('refundEscrow', async () => {
    (debtsPaymentsService.refundEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.refundEscrow(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(debtsPaymentsService.refundEscrow).toHaveBeenCalled();
  });

  it('disputeEscrow', async () => {
    (debtsPaymentsService.disputeEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.disputeEscrow(
      req({ params: { id: 'e1' }, body: { reason: 'Not received' } }),
      res,
      next
    );
    await flush();
    expect(debtsPaymentsService.disputeEscrow).toHaveBeenCalled();
  });

  it('getEscrowStats', async () => {
    (debtsPaymentsService.getPaymentStats as jest.Mock).mockResolvedValue({ total: 10 });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.getEscrowStats(req(), res, next);
    await flush();
    expect(debtsPaymentsService.getPaymentStats).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listClientEscrows', async () => {
    (debtsPaymentsService.listClientEscrows as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.listClientEscrows(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getClientEscrowById', async () => {
    (debtsPaymentsService.getClientEscrowById as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.getClientEscrowById(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(debtsPaymentsService.getClientEscrowById).toHaveBeenCalled();
  });

  it('confirmClientEscrow', async () => {
    (debtsPaymentsService.clientReleaseEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.confirmClientEscrow(req({ params: { id: 'e1' } }), res, next);
    await flush();
    expect(debtsPaymentsService.clientReleaseEscrow).toHaveBeenCalled();
  });

  it('clientDisputeEscrow', async () => {
    (debtsPaymentsService.clientDisputeEscrow as jest.Mock).mockResolvedValue({ id: 'e1' });
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.clientDisputeEscrow(
      req({ params: { id: 'e1' }, body: { reason: 'Defective' } }),
      res,
      next
    );
    await flush();
    expect(debtsPaymentsService.clientDisputeEscrow).toHaveBeenCalled();
  });

  it('should handle missing user', async () => {
    const res = mockRes();
    const next = jest.fn();
    escrowCtrl.listEscrows({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
