/**
 * AuthService unit tests
 */

import { AuthService } from '../../services/auth';
import { mockPrisma } from '../setup';
import {
  validSignupPayload,
  validLoginPayload,
  createMockUser,
  weakPassword,
  passwordNoUpper,
  passwordNoSpecial,
} from '../helpers';
import { AppError } from '../../middlewares/errorHandler';
import { hashPassword, comparePasswords, isValidPassword } from '../../lib/password';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { TwoFactorService } from '../../services/twoFactorService';

jest.mock('../../services/twoFactorService', () => ({
  TwoFactorService: { verifyToken: jest.fn() },
}));

// Publishers auth : on garde les vrais (requireActual) mais on remplace les 6 utilisés
// par auth.ts par des jest.fn() pour pouvoir asserter le câblage événementiel.
jest.mock('../../events/publishers', () => {
  const actual = jest.requireActual('../../events/publishers');
  return {
    ...actual,
    publishUserSignedUp: jest.fn(),
    publishUserLoggedIn: jest.fn(),
    publishUserLoggedOut: jest.fn(),
    publishPasswordChanged: jest.fn(),
    publishAccountLocked: jest.fn(),
    publishNewDeviceDetected: jest.fn(),
  };
});
import {
  publishUserSignedUp,
  publishUserLoggedIn,
  publishUserLoggedOut,
  publishPasswordChanged,
  publishAccountLocked,
  publishNewDeviceDetected,
} from '../../events/publishers';

describe('Password Utilities', () => {
  test('hashPassword: returns a hash string', async () => {
    const hash = await hashPassword('TestPass123!');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
  });

  test('comparePasswords: matches correct password', async () => {
    const password = 'TestPass123!';
    const hash = await hashPassword(password);
    const match = await comparePasswords(password, hash);
    expect(match).toBe(true);
  });

  test('comparePasswords: rejects wrong password', async () => {
    const hash = await hashPassword('TestPass123!');
    const match = await comparePasswords('WrongPassword', hash);
    expect(match).toBe(false);
  });

  test('isValidPassword: rejects weak password (< 8 chars)', () => {
    expect(isValidPassword('Ab1!')).toBe(false);
  });

  test('isValidPassword: rejects password without uppercase', () => {
    expect(isValidPassword('testpass123!')).toBe(false);
  });

  test('isValidPassword: accepts strong password', () => {
    expect(isValidPassword('TestPass123!')).toBe(true);
  });
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset cached proxy methods to prevent cross-file mockResolvedValueOnce contamination
    jest.spyOn(mockPrisma.user, 'findFirst').mockReset();
    jest.spyOn(mockPrisma.user, 'create').mockReset();
    jest.spyOn(mockPrisma.device, 'findFirst').mockReset();
    jest.spyOn(mockPrisma.device, 'create').mockReset();
    jest.spyOn(mockPrisma.session, 'create').mockReset();
    jest.spyOn(mockPrisma.refreshToken, 'create').mockReset();
    jest.spyOn(mockPrisma.emailVerification, 'create').mockReset();
    jest.spyOn(mockPrisma.securityLog, 'create').mockReset();
    jest.spyOn(mockPrisma.passwordReset, 'findFirst').mockReset();
    jest.spyOn(mockPrisma.passwordReset, 'create').mockReset();
  });

  // ==========================================
  // SIGNUP
  // ==========================================
  describe('signup', () => {
    it('should reject a weak password', async () => {
      await expect(
        AuthService.signup({ ...validSignupPayload, password: weakPassword })
      ).rejects.toThrow(AppError);
    });

    it('should reject password without uppercase letter', async () => {
      await expect(
        AuthService.signup({ ...validSignupPayload, password: passwordNoUpper })
      ).rejects.toThrow(AppError);
    });

    it('should reject password without special character', async () => {
      await expect(
        AuthService.signup({ ...validSignupPayload, password: passwordNoSpecial })
      ).rejects.toThrow(AppError);
    });

    it('should reject duplicate email', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'existing-id' });

      await expect(AuthService.signup(validSignupPayload)).rejects.toThrow(
        'Cet email est déjà utilisé'
      );
    });

    it('should reject duplicate phone', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce({ id: 'existing-id' });

      await expect(AuthService.signup(validSignupPayload)).rejects.toThrow(
        'Ce numéro de téléphone est déjà enregistré'
      );
    });

    it('should create a user successfully with valid data', async () => {
      const mockUser = createMockUser();

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      // sendEmailVerification calls UserRepository.findById
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockPrisma.device.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.device.create as jest.Mock).mockResolvedValue({ id: 'device-id' });
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-id' });
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.emailVerification.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.signup(validSignupPayload);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ipAddress: '127.0.0.1',
          }),
        })
      );
    });

    it('should pass ipAddress to session creation', async () => {
      const mockUser = createMockUser();

      // Replace the cached mock with a fresh one to avoid cross-test contamination
      const freshFindFirst = jest
        .fn()
        .mockResolvedValueOnce(null) // 1er appel: emailExists
        .mockResolvedValueOnce(null) // 2e appel: phoneExists
        .mockResolvedValueOnce(mockUser); // 3e appel: findById
      Object.assign(mockPrisma.user, { findFirst: freshFindFirst });

      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.device.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.device.create as jest.Mock).mockResolvedValue({ id: 'device-id' });
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-id' });
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.emailVerification.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.signup(validSignupPayload);

      expect(mockPrisma.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ipAddress: '127.0.0.1',
            // Note: signup hardcodes userAgent: undefined, so we only check ipAddress
          }),
        })
      );
    });
  });

  // ==========================================
  // LOGIN - rejection cases only (success needs bcrypt mock)
  // ==========================================
  describe('login', () => {
    it('should reject login with non-existent email', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(AuthService.login(validLoginPayload)).rejects.toThrow('Identifiants invalides');
    });

    it('should reject login for inactive account', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        createMockUser({ isActive: false })
      );

      await expect(AuthService.login(validLoginPayload)).rejects.toThrow('Compte désactivé');
    });

    it('should reject login for locked account', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(
        createMockUser({ lockedUntil: new Date(Date.now() + 100000) })
      );

      await expect(AuthService.login(validLoginPayload)).rejects.toThrow(
        'Compte temporairement verrouillé'
      );
    });
  });

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================
  describe('forgotPassword', () => {
    it('should not throw if email does not exist (security, do not reveal)', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(AuthService.forgotPassword('nonexistent@example.com')).resolves.toBeUndefined();
    });

    it('should send password reset email for existing user', async () => {
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(createMockUser());
      (mockPrisma.passwordReset.create as jest.Mock).mockResolvedValue({});

      await expect(AuthService.forgotPassword('test@example.com')).resolves.toBeUndefined();
    });
  });

  // ==========================================
  // PASSWORD RESET
  // ==========================================
  describe('resetPassword', () => {
    it('should reject weak password on reset', async () => {
      (mockPrisma.passwordReset.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'reset-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      });

      await expect(AuthService.resetPassword('valid-token', weakPassword)).rejects.toThrow(
        AppError
      );
    });
  });

  // ==========================================
  // AUTH → ÉCOSYSTÈME (événements + analytics)
  // ==========================================
  describe('Auth → Écosystème', () => {
    it('publishes USER_SIGNED_UP + analytics event on signup', async () => {
      const mockUser = createMockUser();
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (mockPrisma.device.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (mockPrisma.device.create as jest.Mock).mockResolvedValue({ id: 'device-id' });
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-id' });
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.emailVerification.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.signup(validSignupPayload);

      expect(publishUserSignedUp).toHaveBeenCalledWith(
        expect.objectContaining({ userId: mockUser.id, email: mockUser.email, name: 'Jean Test' })
      );
      const events = (mockPrisma.analyticsEvent.create as jest.Mock).mock.calls.map(
        (c: any) => c[0].data
      );
      expect(events.some((e: any) => e.eventName === 'USER_SIGNED_UP' && e.type === 'auth')).toBe(
        true
      );
    });

    it('publishes PASSWORD_CHANGED + analytics on successful password reset', async () => {
      (mockPrisma.passwordReset.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'reset-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-id' });
      (mockPrisma.passwordReset.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await AuthService.resetPassword('valid-token', 'NewPass123!');

      expect(publishPasswordChanged).toHaveBeenCalledWith({ userId: 'user-id' });
      const events = (mockPrisma.analyticsEvent.create as jest.Mock).mock.calls.map(
        (c: any) => c[0].data
      );
      expect(events.some((e: any) => e.eventName === 'PASSWORD_CHANGED')).toBe(true);
    });

    it('publishes ACCOUNT_LOCKED after 5 failed attempts', async () => {
      const user = {
        ...createMockUser(),
        passwordHash: await hashPassword('TestPass123!'),
      };
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(user);
      (mockPrisma.user.update as jest.Mock).mockResolvedValueOnce({
        ...user,
        failedLoginAttempts: 1,
      });
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
        ...user,
        failedLoginAttempts: 5,
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValueOnce({
        ...user,
        lockedUntil: new Date(),
      });
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      await expect(
        AuthService.login({ ...validLoginPayload, password: 'WrongPassword123!' })
      ).rejects.toThrow('Identifiants invalides');

      expect(publishAccountLocked).toHaveBeenCalledWith(
        expect.objectContaining({ userId: user.id, reason: '5 échecs de connexion' })
      );
    });

    it('publishes USER_LOGGED_OUT + analytics on logout', async () => {
      (mockPrisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.session.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      await AuthService.logout('user-1');

      expect(publishUserLoggedOut).toHaveBeenCalledWith({ userId: 'user-1' });
      const events = (mockPrisma.analyticsEvent.create as jest.Mock).mock.calls.map(
        (c: any) => c[0].data
      );
      expect(events.some((e: any) => e.eventName === 'USER_LOGGED_OUT')).toBe(true);
    });

    it('does NOT flag a new device on first-ever login (no previous sessions)', async () => {
      (mockPrisma.session.findMany as jest.Mock).mockResolvedValue([]);
      await AuthService.detectNewDevice('user-1', 'agent-1', 'ip-1');
      expect(publishNewDeviceDetected).not.toHaveBeenCalled();
    });

    it('flags NEW_DEVICE_DETECTED when the userAgent differs from known sessions', async () => {
      (mockPrisma.session.findMany as jest.Mock).mockResolvedValue([{ userAgent: 'old-agent' }]);
      await AuthService.detectNewDevice('user-1', 'new-agent', 'ip-1');
      expect(publishNewDeviceDetected).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', device: 'new-agent', location: 'ip-1' })
      );
    });

    it('does NOT flag when the userAgent is already known', async () => {
      (mockPrisma.session.findMany as jest.Mock).mockResolvedValue([{ userAgent: 'known-agent' }]);
      await AuthService.detectNewDevice('user-1', 'known-agent', 'ip-1');
      expect(publishNewDeviceDetected).not.toHaveBeenCalled();
    });

    it('publishes USER_LOGGED_IN (2FA) + analytics on successful 2FA login', async () => {
      const user = { ...createMockUser(), twoFactorEnabled: false };
      (TwoFactorService.verifyToken as jest.Mock).mockResolvedValue(true);
      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValueOnce(user); // findById
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(user); // updateLastLogin
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-id' });
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      const tempToken = jwt.sign({ id: user.id, purpose: '2fa_login' }, config.JWT_SECRET, {
        expiresIn: '5m',
      });
      await AuthService.verify2FALogin(tempToken, '123456');

      expect(publishUserLoggedIn).toHaveBeenCalledWith(
        expect.objectContaining({ userId: user.id })
      );
      const events = (mockPrisma.analyticsEvent.create as jest.Mock).mock.calls.map(
        (c: any) => c[0].data
      );
      expect(
        events.some((e: any) => e.eventName === 'USER_LOGGED_IN' && e.properties?.method === '2fa')
      ).toBe(true);
    });
  });
});
