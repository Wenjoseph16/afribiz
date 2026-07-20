import { mockPrisma } from '../setup';
import {
  getMyReferralCode,
  createReferral,
  processReferralSignup,
  getMyReferrals,
} from '../../services/referral';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/publishers', () => ({
  publishReferralInvited: jest.fn(),
  publishReferralConverted: jest.fn(),
  publishReferralRewardAwarded: jest.fn(),
}));

describe('Referral Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getMyReferralCode returns code', async () => {
    mockPrisma.referral.findFirst.mockResolvedValue({ code: 'REF123' } as any);
    mockPrisma.referral.findMany.mockResolvedValue([]);
    mockPrisma.referralReward.findMany.mockResolvedValue([]);
    const r = await getMyReferralCode('u1');
    expect(r.code).toBe('REF123');
  });

  test('createReferral creates referral', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null); // referee doesn't exist (by email)
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'u1',
      firstName: 'Jean',
      lastName: 'Dupont',
    } as any); // referrer exists (by id)
    mockPrisma.referral.create.mockResolvedValue({
      id: 'ref-1',
      referrerId: 'u1',
      code: 'CODE123',
      status: 'PENDING',
    } as any);
    const r = await createReferral('u1', 'test@test.com');
    expect(r).toBeDefined();
  });

  test('processReferralSignup processes', async () => {
    mockPrisma.referral.findFirst.mockResolvedValue({
      id: 'ref-1',
      referrerId: 'u1',
      code: 'REF123',
      status: 'PENDING',
    } as any);
    mockPrisma.referral.update.mockResolvedValue({} as any);
    mockPrisma.business.findFirst.mockResolvedValue(null); // no business for loyalty
    mockPrisma.referralReward.create.mockResolvedValue({} as any);
    await expect(processReferralSignup('u2', 'REF123')).resolves.not.toThrow();
  });

  test('getMyReferrals returns referrals array', async () => {
    mockPrisma.referral.findMany.mockResolvedValue([
      { id: 'ref-1', referrerId: 'u1', status: 'COMPLETED', createdAt: new Date() } as any,
    ]);
    const r = await getMyReferrals('u1');
    expect(r).toHaveLength(1);
  });
});
