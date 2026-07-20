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
});
