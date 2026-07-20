jest.mock('../../services/growthCoachingService', () => null); // not needed

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import { mockPrisma } from '../setup';
import * as gdprCtrl from '../../controllers/gdpr';
import { RefreshTokenRepository } from '../../repositories/refreshTokenRepository';

jest.mock('../../repositories/refreshTokenRepository', () => ({
  RefreshTokenRepository: { revokeAllByUserId: jest.fn() },
}));

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('gdpr controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should export user data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@test.com' });
      mockPrisma.payment.findMany.mockResolvedValue([]);
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.debt.findMany.mockResolvedValue([]);
      mockPrisma.notificationPreference.findMany.mockResolvedValue([]);
      const res = mockRes();
      gdprCtrl.exportUserData(req(), res, jest.fn());
      await flush();
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } })
      );
      expect(res.json).toHaveBeenCalled();
      const data = (res.json as jest.Mock).mock.calls[0][0];
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('test@test.com');
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      gdprCtrl.exportUserData({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('deleteAccount', () => {
    it('should delete account with correct confirmation', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      mockPrisma.user.update.mockResolvedValue({ id: 'u1' });
      (RefreshTokenRepository.revokeAllByUserId as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      gdprCtrl.deleteAccount(req({ body: { confirmation: 'CONFIRM_DELETE' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(RefreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 if confirmation invalid', async () => {
      const res = mockRes();
      const next = jest.fn();
      gdprCtrl.deleteAccount(req({ body: { confirmation: 'nope' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      gdprCtrl.deleteAccount({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
