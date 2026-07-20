import { mockPrisma } from '../setup';
import * as verifCtrl from '../../controllers/verificationController';

jest.mock('../../services/verificationService', () => ({
  getVerificationLevel: jest.fn(),
  getTransactionStats: jest.fn(),
  upgradeToOr: jest.fn(),
  upgradeToPlatine: jest.fn(),
}));

import {
  getVerificationLevel,
  getTransactionStats,
  upgradeToOr,
  upgradeToPlatine,
} from '../../services/verificationService';

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
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('verification controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVerification', () => {
    it('should call both services and return merged data', async () => {
      const business = { level: 'ARGENT', limits: { maxTransactionAmount: 50000 } };
      const stats = { todayTransactions: 3, dailyRemaining: 7 };
      (getVerificationLevel as jest.Mock).mockResolvedValue(business);
      (getTransactionStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.getVerification(req(), res, next);
      await flush();
      expect(getVerificationLevel).toHaveBeenCalledWith('u1');
      expect(getTransactionStats).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { ...business, stats } });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.getVerification({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('upgradeToOr', () => {
    it('should upgrade to Or successfully', async () => {
      const result = { id: 'b1', verificationLevel: 'OR' };
      (upgradeToOr as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.upgradeToOr(
        req({ body: { identityDocument: 'id.jpg', responsiblePhoto: 'photo.jpg' } }),
        res,
        next
      );
      await flush();
      expect(upgradeToOr).toHaveBeenCalledWith('u1', 'id.jpg', 'photo.jpg');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Félicitations ! Vous êtes passé au niveau Or.',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.upgradeToOr({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if identityDocument or responsiblePhoto missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.upgradeToOr(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('upgradeToPlatine', () => {
    it('should upgrade to Platine successfully', async () => {
      const result = { id: 'b1', verificationLevel: 'PLATINE' };
      (upgradeToPlatine as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.upgradeToPlatine(req(), res, next);
      await flush();
      expect(upgradeToPlatine).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Félicitations ! Vous êtes passé au niveau Platine.',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      verifCtrl.upgradeToPlatine({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
