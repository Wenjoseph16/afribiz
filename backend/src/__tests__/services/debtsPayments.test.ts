import { mockPrisma } from '../setup';
import {
  listDebts,
  getDebt,
  updateDebt,
  registerDebtPayment,
  listEscrows,
  createEscrow,
  releaseEscrow,
  refundEscrow,
  getDebtAging,
  getPaymentStats,
} from '../../services/debtsPayments';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishDebtSettled: jest.fn(),
  publishEscrowCreated: jest.fn(),
  publishEscrowReleased: jest.fn(),
  publishEscrowRefunded: jest.fn(),
  publishEscrowDisputed: jest.fn(),
}));
jest.mock('../../lib/fedapay', () => ({
  isFedaPayAvailable: jest.fn().mockReturnValue(false),
  createTransaction: jest.fn(),
}));
jest.mock('../../services/wallet', () => ({
  getOrCreateWallet: jest
    .fn()
    .mockResolvedValue({ id: 'wal-1', businessId: 'biz-1', balance: 0, locked: 0 }),
}));
jest.mock('../../services/monetizationConfig', () => ({
  calculateCommission: jest
    .fn()
    .mockResolvedValue({ rate: 0.01, commission: 100, netAmount: 9900 }),
}));

const mockBiz = { id: 'biz-1', name: 'TestBiz', modules: [], settings: {} };
const mockDebt = {
  id: 'debt-1',
  businessId: 'biz-1',
  buyerId: 'u1',
  totalAmount: 50000,
  amountPaid: 0,
  remainingAmount: 50000,
  status: 'ACTIVE',
  priority: 'NORMAL',
  dueDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockEscrow = {
  id: 'esc-1',
  businessId: 'biz-1',
  amount: 30000,
  status: 'HELD',
  createdAt: new Date(),
};

describe('Debts & Escrow Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
  });
  test('listDebts returns paginated', async () => {
    jest.spyOn(mockPrisma.debt, 'findMany').mockResolvedValue([mockDebt]);
    jest.spyOn(mockPrisma.debt, 'count').mockResolvedValue(1);
    const r = await listDebts('u1', {});
    expect(r.total).toBe(1);
  });
  test('getDebt returns', async () => {
    jest.spyOn(mockPrisma.debt, 'findFirst').mockResolvedValue(mockDebt);
    expect((await getDebt('u1', 'debt-1')).id).toBe('debt-1');
  });
  test('registerDebtPayment processes', async () => {
    jest
      .spyOn(mockPrisma.debt, 'findFirst')
      .mockResolvedValue({ ...mockDebt, amountPaid: 20000, remainingAmount: 30000 });
    jest.spyOn(mockPrisma.debt, 'update').mockResolvedValue(mockDebt);
    jest.spyOn(mockPrisma.financialLog, 'create').mockResolvedValue({});
    const r = await registerDebtPayment('u1', 'debt-1', { amount: 10000 });
    expect(r).toBeDefined();
  });
  test('listEscrows returns paginated', async () => {
    jest.spyOn(mockPrisma.escrow, 'findMany').mockResolvedValue([mockEscrow]);
    jest.spyOn(mockPrisma.escrow, 'count').mockResolvedValue(1);
    const r = await listEscrows('u1', {});
    expect(r.total).toBe(1);
  });
  test('createEscrow creates', async () => {
    jest.spyOn(mockPrisma.escrow, 'create').mockResolvedValue(mockEscrow);
    jest.spyOn(mockPrisma.financialLog, 'create').mockResolvedValue({});
    const r = await createEscrow('u1', { amount: 30000 });
    expect(r.id).toBe('esc-1');
  });
  test('releaseEscrow releases with fee', async () => {
    jest.spyOn(mockPrisma.escrow, 'findFirst').mockResolvedValue(mockEscrow);
    jest
      .spyOn(mockPrisma.escrow, 'update')
      .mockResolvedValue({ ...mockEscrow, status: 'RELEASED' });
    jest.spyOn(mockPrisma.financialLog, 'create').mockResolvedValue({});
    const r = await releaseEscrow('u1', 'esc-1');
    expect(r.status).toBe('RELEASED');
  });
  test('refundEscrow refunds', async () => {
    jest.spyOn(mockPrisma.escrow, 'findFirst').mockResolvedValue(mockEscrow);
    jest
      .spyOn(mockPrisma.escrow, 'update')
      .mockResolvedValue({ ...mockEscrow, status: 'REFUNDED' });
    jest.spyOn(mockPrisma.financialLog, 'create').mockResolvedValue({});
    const r = await refundEscrow('u1', 'esc-1', 'Test');
    expect(r.status).toBe('REFUNDED');
  });
  test('getDebtAging returns buckets', async () => {
    jest.spyOn(mockPrisma.debt, 'findMany').mockResolvedValue([mockDebt]);
    const r = await getDebtAging('u1');
    expect(r.totalActive).toBe(1);
  });
  test('getPaymentStats aggregates', async () => {
    jest.spyOn(mockPrisma.debt, 'count').mockResolvedValue(5);
    jest.spyOn(mockPrisma.debt, 'aggregate').mockResolvedValue({ _sum: { totalAmount: 200000 } });
    jest.spyOn(mockPrisma.escrow, 'aggregate').mockResolvedValue({ _sum: { amount: 50000 } });
    const r = await getPaymentStats('u1');
    expect(r.totalDebts).toBe(5);
  });
});
