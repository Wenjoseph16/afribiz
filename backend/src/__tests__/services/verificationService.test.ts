import { mockPrisma } from '../setup';
import {
  getVerificationLevel,
  upgradeToOr,
  upgradeToPlatine,
  getTransactionStats,
} from '../../services/verificationService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../config/verificationLimits', () => ({
  VERIFICATION_LIMITS: {
    ARGENT: {
      maxTransactionAmount: 200000,
      maxDailyTransactions: 10,
      maxEscrowAmount: 500000,
      commissionRate: 3.5,
      escrowReleaseDelay: 48,
      canMarketplacePriority: false,
      badgeVerifie: false,
    },
    OR: {
      maxTransactionAmount: 2000000,
      maxDailyTransactions: 50,
      maxEscrowAmount: 5000000,
      commissionRate: 2.5,
      escrowReleaseDelay: 24,
      canMarketplacePriority: true,
      badgeVerifie: true,
    },
    PLATINE: {
      maxTransactionAmount: null,
      maxDailyTransactions: null,
      maxEscrowAmount: null,
      commissionRate: 1.5,
      escrowReleaseDelay: 12,
      canMarketplacePriority: true,
      badgeVerifie: true,
    },
  },
}));

const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

describe('Verification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getVerificationLevel returns current level', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'b1',
      verificationLevel: 'OR',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      identityDocument: 'id.jpg',
      companyDocument: 'doc.pdf',
      rejectionReason: null,
    });
    const r = await getVerificationLevel('b1');
    expect(r.level).toBe('OR');
    expect(r.limits.maxTransactionAmount).toBe(2000000);
  });

  test('getVerificationLevel handles ARGENT', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'b1',
      verificationLevel: 'ARGENT',
      verificationStatus: 'PENDING',
      verifiedAt: null,
      identityDocument: null,
      companyDocument: null,
      rejectionReason: null,
    });
    const r = await getVerificationLevel('b1');
    expect(r.level).toBe('ARGENT');
    expect(r.hasIdentityDoc).toBe(false);
  });

  test('upgradeToOr upgrades to OR', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1', verificationLevel: 'ARGENT' });
    mockPrisma.business.update.mockResolvedValue({ id: 'b1', verificationLevel: 'OR' });
    const r = await upgradeToOr('b1', 'id.jpg', 'photo.jpg');
    expect(r.verificationLevel).toBe('OR');
  });

  test('upgradeToPlatine upgrades to PLATINE', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({
      id: 'b1',
      verificationLevel: 'OR',
      createdAt: thirtyOneDaysAgo,
    });
    mockPrisma.business.update.mockResolvedValue({ id: 'b1', verificationLevel: 'PLATINE' });
    const r = await upgradeToPlatine('b1');
    expect(r.verificationLevel).toBe('PLATINE');
  });

  test('getTransactionStats returns stats', async () => {
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1', verificationLevel: 'OR' });
    mockPrisma.order.count.mockResolvedValue(5);
    const r = await getTransactionStats('u1');
    expect(r.todayTransactions).toBe(5);
    expect(r.maxDailyTransactions).toBe(50);
    expect(r.dailyRemaining).toBe(45);
  });
});
