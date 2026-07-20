import { mockPrisma } from '../setup';
import {
  getOrCreateWallet,
  getBalance,
  deposit,
  withdraw,
  listTransactions,
} from '../../services/wallet';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockWallet = {
  id: 'wal-1',
  businessId: 'biz-1',
  balance: 50000,
  locked: 10000,
  currency: 'FCFA',
};

describe('Wallet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('getOrCreateWallet returns existing', async () => {
    jest.spyOn(mockPrisma.wallet, 'findUnique').mockResolvedValue(mockWallet);
    const r = await getOrCreateWallet('biz-1');
    expect(r.id).toBe('wal-1');
  });
  test('getOrCreateWallet creates if missing', async () => {
    jest.spyOn(mockPrisma.wallet, 'findUnique').mockResolvedValue(null);
    jest.spyOn(mockPrisma.wallet, 'create').mockResolvedValue({
      id: 'wal-2',
      businessId: 'biz-1',
      balance: 0,
      locked: 0,
      currency: 'FCFA',
    });
    const r = await getOrCreateWallet('biz-1');
    expect(r.id).toBe('wal-2');
  });
  test('getBalance returns computed', async () => {
    jest.spyOn(mockPrisma.wallet, 'findUnique').mockResolvedValue(mockWallet);
    const r = await getBalance('biz-1');
    expect(r.balance).toBe(50000);
    expect(r.available).toBe(40000);
  });
  test('listTransactions returns paginated', async () => {
    jest.spyOn(mockPrisma.wallet, 'findUnique').mockResolvedValue(mockWallet);
    jest
      .spyOn(mockPrisma.walletTransaction, 'findMany')
      .mockResolvedValue([{ id: 'tx-1', type: 'DEPOSIT', amount: 10000, createdAt: new Date() }]);
    jest.spyOn(mockPrisma.walletTransaction, 'count').mockResolvedValue(1);
    const r = await listTransactions('biz-1', { page: 1 });
    expect(r.total).toBe(1);
  });
});
