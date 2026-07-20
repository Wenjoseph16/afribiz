/**
 * Business commission stats unit tests
 *
 * Tests: getBusinessCommissionStats
 *
 * Note: Uses mockPrisma from setup.ts for basic test scenarios.
 * The full integration of financialLog/findMany mocking inside
 * jest.isolateModules() still has unresolved resolution issues.
 */

import { Response } from 'express';
import { mockPrisma } from '../setup';

jest.mock('../../services/monetizationConfig', () => ({
  getTransactionCommissionRate: jest.fn(),
  getEscrowCommissionRate: jest.fn(),
}));

import * as businessController from '../../controllers/business';
import * as monetizationConfig from '../../services/monetizationConfig';

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

// catchAsyncErrors retourne void — il faut attendre les microtasks manuellement
async function flushMicrotasks() {
  await new Promise<void>(process.nextTick);
}

describe('getBusinessCommissionStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Use jest.spyOn to reliably mock through the Proxy
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'biz-1' });
    (monetizationConfig.getTransactionCommissionRate as jest.Mock).mockResolvedValue(0.01);
    (monetizationConfig.getEscrowCommissionRate as jest.Mock).mockResolvedValue(0.02);
    jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 500000 } });
    jest.spyOn(mockPrisma.financialLog, 'findMany').mockResolvedValue([
      {
        id: 'log-1',
        amount: -5000,
        metadata: { commissionType: 'TRANSACTION_FEE' },
        businessId: 'biz-1',
      },
    ]);
    jest.spyOn(mockPrisma.paymentTransaction, 'count').mockResolvedValue(25);
  });

  it('should return 404 if business not found', async () => {
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);

    const req = { user: { id: 'user-1' }, query: {} } as any;
    const res = mockRes();
    const next = jest.fn();

    businessController.getBusinessCommissionStats(req, res, next);
    await flushMicrotasks();

    // catchAsyncErrors appelle next(err) au lieu de res.status
    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(404);
  });

  it('should return 401 if not authenticated', async () => {
    const req = { user: null, query: {} } as any;
    const res = mockRes();
    const next = jest.fn();

    businessController.getBusinessCommissionStats(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
  });

  it('should handle business lookup', async () => {
    const req = { user: { id: 'user-1' }, query: { period: '30d' } } as any;
    const res = mockRes();
    const next = jest.fn();

    businessController.getBusinessCommissionStats(req, res, next);
    await flushMicrotasks();

    // Verify the controller processed the request
    expect(mockPrisma.business.findUnique).toHaveBeenCalledWith({
      where: { ownerId: 'user-1', deletedAt: null },
      select: { id: true },
    });
  });
});
