import { mockPrisma } from '../setup';
import { getWallet } from '../../controllers/payments';

function createMockReq(overrides: Record<string, any> = {}) {
  return {
    user: { id: 'user-1' },
    query: {},
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res;
}

describe('getWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper: spyOn crée un espion qui contourne le proxy pour un mock fiable
  function mockFindMany(...results: any[][]) {
    const spy = jest.spyOn(mockPrisma.payment, 'findMany');
    for (const r of results) {
      spy.mockResolvedValueOnce(r);
    }
    return spy;
  }

  // catchAsyncErrors retourne void — il faut attendre les microtasks manuellement
  async function flushMicrotasks() {
    await new Promise<void>(process.nextTick);
  }

  it('should compute wallet with completed payments minus refunds', async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    mockFindMany([{ amount: 10000 }, { amount: 5000 }], [{ amount: 2000 }]);

    getWallet(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalled();
    const callArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArg.success).toBe(true);
    expect(callArg.data.balance).toBe(13000);
    expect(callArg.data.totalPaid).toBe(15000);
    expect(callArg.data.totalRefunded).toBe(2000);
  });

  it('should handle no completed payments', async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    mockFindMany([], []);

    getWallet(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalled();
    const callArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArg.data.balance).toBe(0);
    expect(callArg.data.totalPaid).toBe(0);
  });

  it('should not produce negative cashback', async () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    mockFindMany([{ amount: 1000 }], [{ amount: 5000 }]);

    getWallet(req, res, next);
    await flushMicrotasks();

    expect(res.json).toHaveBeenCalled();
    const callArg = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArg.data.balance).toBe(-4000);
    expect(callArg.data.cashback).toBe(0);
  });

  it('should require authentication', async () => {
    const req = createMockReq({ user: null });
    const res = createMockRes();
    const next = jest.fn();

    getWallet(req, res, next);
    await flushMicrotasks();

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeDefined();
  });
});
