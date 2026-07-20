import {
  checkTransactionLimit,
  checkDailyTransactionLimit,
} from '../../middlewares/verificationGuard';
import { mockPrisma } from '../setup';

jest.mock('../../config/verificationLimits', () => ({
  VERIFICATION_LIMITS: {
    BRONZE: { maxTransactionAmount: 100000, maxDailyTransactions: 5 },
    SILVER: { maxTransactionAmount: 500000, maxDailyTransactions: 20 },
    GOLD: { maxTransactionAmount: null, maxDailyTransactions: null },
  },
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockRes = {} as any;

describe('checkTransactionLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow transaction under limit', async () => {
    const next = jest.fn();
    mockPrisma.business.findUnique.mockResolvedValue({ verificationLevel: 'SILVER' });
    await checkTransactionLimit(
      { user: { id: 'u1' }, body: { amount: 50000 } } as any,
      mockRes,
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('should block transaction over limit', async () => {
    const next = jest.fn();
    mockPrisma.business.findUnique.mockResolvedValue({ verificationLevel: 'BRONZE' });
    await expect(
      checkTransactionLimit({ user: { id: 'u1' }, body: { amount: 999999 } } as any, mockRes, next)
    ).rejects.toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow unlimited for GOLD', async () => {
    const next = jest.fn();
    mockPrisma.business.findUnique.mockResolvedValue({ verificationLevel: 'GOLD' });
    await checkTransactionLimit(
      { user: { id: 'u1' }, body: { amount: 99999999 } } as any,
      mockRes,
      next
    );
    expect(next).toHaveBeenCalled();
  });

  it('should skip if no amount', async () => {
    const next = jest.fn();
    await checkTransactionLimit({ user: { id: 'u1' }, body: {} } as any, mockRes, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('checkDailyTransactionLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow if under daily limit', async () => {
    const next = jest.fn();
    mockPrisma.business.findUnique.mockResolvedValue({ verificationLevel: 'BRONZE' });
    mockPrisma.order.count.mockResolvedValue(3);
    await checkDailyTransactionLimit({ user: { id: 'u1' } } as any, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should block if daily limit reached', async () => {
    const next = jest.fn();
    mockPrisma.business.findUnique.mockResolvedValue({ verificationLevel: 'BRONZE' });
    mockPrisma.order.count.mockResolvedValue(5);
    await expect(
      checkDailyTransactionLimit({ user: { id: 'u1' } } as any, mockRes, next)
    ).rejects.toThrow();
    expect(next).not.toHaveBeenCalled();
  });
});
