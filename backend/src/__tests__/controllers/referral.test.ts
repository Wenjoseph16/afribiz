import { mockPrisma } from '../setup';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data, message = 'Success') => ({ success: true, data, message })),
}));

jest.mock('../../services/referral', () => ({
  getMyReferralCode: jest.fn(),
  createReferral: jest.fn(),
  getMyReferrals: jest.fn(),
  getMyReferralRewards: jest.fn(),
  getReferralStats: jest.fn(),
}));

import * as referralCtrl from '../../controllers/referral';
import * as referralService from '../../services/referral';
import { successResponse } from '../../utils/response';

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
  return { user: { id: 'u1' }, body: {}, ...overrides } as any;
}

describe('referral controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyReferralCode', () => {
    it('should return referral code', async () => {
      (referralService.getMyReferralCode as jest.Mock).mockResolvedValue({
        code: 'ABC123',
        shareUrl: '...',
        totalReferrals: 0,
        totalRewards: 0,
        referrals: [],
        rewards: [],
      });
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getMyReferralCode(req(), res, next);
      await flush();
      expect(referralService.getMyReferralCode).toHaveBeenCalledWith('u1');
      expect(successResponse).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getMyReferralCode({ user: null } as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Non authentifié' })
      );
    });
  });

  describe('inviteReferral', () => {
    it('should invite a referral', async () => {
      (referralService.createReferral as jest.Mock).mockResolvedValue({ id: 'r1', code: 'ABC123' });
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.inviteReferral(req({ body: { email: 'friend@mail.com' } }), res, next);
      await flush();
      expect(referralService.createReferral).toHaveBeenCalledWith('u1', 'friend@mail.com');
      expect(successResponse).toHaveBeenCalledWith(expect.anything(), 'Invitation envoyée');
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.inviteReferral(
        { user: null, body: { email: 'friend@mail.com' } } as any,
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMyReferrals', () => {
    it('should return referrals list', async () => {
      (referralService.getMyReferrals as jest.Mock).mockResolvedValue([
        { id: 'r1', referee: { email: 'a@b.com' } },
      ]);
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getMyReferrals(req(), res, next);
      await flush();
      expect(referralService.getMyReferrals).toHaveBeenCalledWith('u1');
      expect(successResponse).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getMyReferrals({ user: null } as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMyReferralRewards', () => {
    it('should return referral rewards', async () => {
      (referralService.getMyReferralRewards as jest.Mock).mockResolvedValue([
        { id: 'rw1', points: 100 },
      ]);
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getMyReferralRewards(req(), res, next);
      await flush();
      expect(referralService.getMyReferralRewards).toHaveBeenCalledWith('u1');
      expect(successResponse).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getMyReferralRewards({ user: null } as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getReferralStats', () => {
    it('should return referral stats', async () => {
      (referralService.getReferralStats as jest.Mock).mockResolvedValue({
        totalReferrals: 5,
        convertedReferrals: 2,
        conversionRate: 40,
        totalPointsEarned: 200,
        totalCashEarned: 0,
      });
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getReferralStats(req(), res, next);
      await flush();
      expect(referralService.getReferralStats).toHaveBeenCalledWith('u1');
      expect(successResponse).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      referralCtrl.getReferralStats({ user: null } as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
