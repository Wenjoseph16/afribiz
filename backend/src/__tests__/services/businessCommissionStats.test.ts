/**
 * Business commission stats unit tests
 *
 * Tests: getBusinessCommissionStats
 */

import { Request, Response, NextFunction } from 'express';
import { mockPrisma } from '../setup';
import * as businessController from '../../controllers/business';
import * as monetizationConfig from '../../services/monetizationConfig';

jest.mock('../../lib/db', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../services/monetizationConfig', () => ({
  getTransactionCommissionRate: jest.fn(),
  getEscrowCommissionRate: jest.fn(),
}));

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('getBusinessCommissionStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'biz-1' });
    (monetizationConfig.getTransactionCommissionRate as jest.Mock).mockResolvedValue(0.01);
    (monetizationConfig.getEscrowCommissionRate as jest.Mock).mockResolvedValue(0.02);

    (mockPrisma.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalAmount: 500000 } });
    (mockPrisma.financialLog.findMany as jest.Mock).mockResolvedValue([
      { id: 'log-1', amount: -5000, metadata: { commissionType: 'TRANSACTION_FEE' }, businessId: 'biz-1' },
      { id: 'log-2', amount: -2000, metadata: { commissionType: 'ESCROW_FEE' }, businessId: 'biz-1' },
      { id: 'log-3', amount: -3000, metadata: { commissionType: 'TRANSACTION_FEE' }, businessId: 'biz-1' },
    ]);
    (mockPrisma.paymentTransaction.count as jest.Mock).mockResolvedValue(25);
  });

  it('should return commission stats for a business', async () => {
    const req = { user: { id: 'user-1' }, query: { period: '30d' } } as any;
    const res = mockRes();

    await businessController.getBusinessCommissionStats(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        totalRevenue: 500000,
        totalCommissions: 10000,
        netRevenue: 490000,
        transactionCount: 25,
        commissionRate: 0.01,
        escrowRate: 0.02,
        period: '30d',
      }),
    });
  });

  it('should return 404 if business not found', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);

    const req = { user: { id: 'user-1' }, query: {} } as any;
    const res = mockRes();

    await businessController.getBusinessCommissionStats(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: 'Business non trouvé',
    }));
  });

  it('should return 401 if not authenticated', async () => {
    const req = { user: null, query: {} } as any;
    const res = mockRes();

    await businessController.getBusinessCommissionStats(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle different periods', async () => {
    const req = { user: { id: 'user-1' }, query: { period: '90d' } } as any;
    const res = mockRes();

    await businessController.getBusinessCommissionStats(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({ period: '90d' }),
    });
  });
});
