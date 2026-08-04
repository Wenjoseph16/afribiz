import { mockPrisma } from '../setup';

jest.mock('../../services/twoFactorService', () => ({
  TwoFactorService: {
    generateSecret: jest.fn(),
    verifyAndEnable: jest.fn(),
    disable: jest.fn(),
    generateBackupCodes: jest.fn(),
  },
}));

jest.mock('../../lib/password', () => ({
  comparePasswords: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import * as ctrl from '../../controllers/twoFactorController';
import { TwoFactorService } from '../../services/twoFactorService';
import { comparePasswords } from '../../lib/password';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, body: {}, ...overrides } as any;
}

describe('twoFactor controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setup2FA', () => {
    it('should generate secret', async () => {
      const result = { secret: 'abc', qrCode: 'data:image/png;base64,...' };
      (TwoFactorService.generateSecret as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.setup2FA(req(), res, jest.fn());
      await flush();
      expect(TwoFactorService.generateSecret).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Secret generated. Scan the QR code with your authenticator app.',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.setup2FA({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('verify2FA', () => {
    it('should verify, enable and return the backup codes', async () => {
      (TwoFactorService.verifyAndEnable as jest.Mock).mockResolvedValue(['CODE1', 'CODE2']);
      const res = mockRes();
      ctrl.verify2FA(req({ body: { token: '123456' } }), res, jest.fn());
      await flush();
      expect(TwoFactorService.verifyAndEnable).toHaveBeenCalledWith('u1', '123456');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { backupCodes: ['CODE1', 'CODE2'] },
        message: expect.stringContaining('codes de secours'),
      });
    });

    it('should return 400 if token missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.verify2FA(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('regenerateRecoveryCodes', () => {
    it('should regenerate codes with a valid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: true,
      });
      (comparePasswords as jest.Mock).mockResolvedValue(true);
      (TwoFactorService.generateBackupCodes as jest.Mock).mockReturnValue(['NEW1', 'NEW2']);
      const res = mockRes();
      ctrl.regenerateRecoveryCodes(req({ body: { password: 'correct' } }), res, jest.fn());
      await flush();
      expect(comparePasswords).toHaveBeenCalledWith('correct', 'hashed');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ twoFactorBackupCodes: '["NEW1","NEW2"]' }),
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { backupCodes: ['NEW1', 'NEW2'] } })
      );
    });

    it('should return 400 if password missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.regenerateRecoveryCodes(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if 2FA is not enabled', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: false,
      });
      (comparePasswords as jest.Mock).mockResolvedValue(true);
      const res = mockRes();
      const next = jest.fn();
      ctrl.regenerateRecoveryCodes(req({ body: { password: 'correct' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: 'hashed',
        twoFactorEnabled: true,
      });
      (comparePasswords as jest.Mock).mockResolvedValue(false);
      const res = mockRes();
      const next = jest.fn();
      ctrl.regenerateRecoveryCodes(req({ body: { password: 'wrong' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.regenerateRecoveryCodes(req({ body: { password: 'test' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA with valid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'hashed' });
      (comparePasswords as jest.Mock).mockResolvedValue(true);
      (TwoFactorService.disable as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.disable2FA(req({ body: { password: 'correct' } }), res, jest.fn());
      await flush();
      expect(comparePasswords).toHaveBeenCalledWith('correct', 'hashed');
      expect(TwoFactorService.disable).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: '2FA has been disabled',
      });
    });

    it('should return 400 if password missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.disable2FA(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'hashed' });
      (comparePasswords as jest.Mock).mockResolvedValue(false);
      const res = mockRes();
      const next = jest.fn();
      ctrl.disable2FA(req({ body: { password: 'wrong' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 404 if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.disable2FA(req({ body: { password: 'test' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('get2FAStatus', () => {
    it('should return enabled status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ twoFactorEnabled: true });
      const res = mockRes();
      ctrl.get2FAStatus(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { enabled: true } });
    });

    it('should return false by default', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const res = mockRes();
      ctrl.get2FAStatus(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { enabled: false } });
    });
  });
});
