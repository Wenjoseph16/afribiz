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

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      (mockPrisma.session.create as jest.Mock).mockResolvedValue({ id: 'session-id' });
      (mockPrisma.refreshToken.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.emailVerification.create as jest.Mock).mockResolvedValue({});
      (mockPrisma.securityLog.create as jest.Mock).mockResolvedValue({});

      const result = await AuthService.signup(validSignupPayload);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
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

      await expect(
        AuthService.resetPassword('valid-token', weakPassword)
      ).rejects.toThrow(AppError);
    });
  });
});
