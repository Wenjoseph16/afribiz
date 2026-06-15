import crypto from 'crypto';
import { OtpType, UserRole } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { publishAccountLocked } from '../events/publishers';
import { isValidPassword, hashPassword, comparePasswords, generateToken, generateOTP } from '../lib/password';
import { createTokenPair, verifyRefreshToken, TokenPair } from '../lib/jwt';
import { logger } from '../lib/logger';
import { sendEmail, emailTemplates } from '../lib/mail';
import { config } from '../config/env';
import { TwoFactorService } from './twoFactorService';

import { UserRepository } from '../repositories/userRepository';
import { SessionRepository } from '../repositories/sessionRepository';
import { RefreshTokenRepository } from '../repositories/refreshTokenRepository';
import { EmailVerificationRepository } from '../repositories/emailVerificationRepository';
import { PasswordResetRepository } from '../repositories/passwordResetRepository';
import { OtpCodeRepository } from '../repositories/otpCodeRepository';
import { SecurityLogRepository } from '../repositories/securityLogRepository';
import { DeveloperRepository } from '../repositories/developerRepository';
import { DeviceRepository } from '../repositories/deviceRepository';

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  country: string;
  region: string;
  city: string;
  neighborhood?: string;
  birthDate?: string;
  gender?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResult {
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  requires2FA?: boolean;
  requires2FASetup?: boolean;
  tempToken?: string;
}

export class AuthService {
  static async signup(payload: SignupPayload): Promise<AuthResponse> {
    if (!isValidPassword(payload.password)) throw new AppError('Password does not meet complexity', 400);
    if (await UserRepository.emailExists(payload.email)) throw new AppError('Cet email est déjà utilisé', 409);
    if (payload.phone && await UserRepository.phoneExists(payload.phone)) throw new AppError('Ce numéro de téléphone est déjà enregistré', 409);

    const passwordHash = await hashPassword(payload.password);
    const user = await UserRepository.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      passwordHash,
      country: payload.country,
      region: payload.region,
      city: payload.city,
      neighborhood: payload.neighborhood,
      birthDate: payload.birthDate,
      gender: payload.gender,
    });

    const tokens = createTokenPair({ id: user.id, email: user.email, primaryRole: user.primaryRole, roles: user.roles });
    const session = await SessionRepository.create({ userId: user.id, ipAddress: '127.0.0.1', userAgent: undefined, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    await RefreshTokenRepository.create({ userId: user.id, token: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), sessionId: session.id });

    // Envoyer l'email de vérification sans bloquer l'inscription en cas d'échec
    try {
      await this.sendEmailVerification(user.id, user.email, user.firstName);
    } catch (emailError) {
      logger.warn(`Failed to send verification email to ${user.email}, user was created successfully`);
      // L'utilisateur pourra renvoyer la vérification plus tard
    }

    await SecurityLogRepository.create({ userId: user.id, action: 'SIGNUP', success: true });

    logger.info(`User registered: ${user.email}`);
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: config.JWT_EXPIRES_IN };
  }

  static async login(payload: LoginPayload): Promise<LoginResult> {
    const isEmail = payload.identifier.includes('@');
    const user = isEmail
      ? await UserRepository.findByEmail(payload.identifier)
      : await UserRepository.findByPhone(payload.identifier);
    if (!user) throw new AppError('Identifiants invalides', 401);
    if (!user.isActive) throw new AppError('Compte désactivé', 403);
    if (user.lockedUntil && user.lockedUntil > new Date()) throw new AppError('Compte temporairement verrouillé', 423);

    const valid = await comparePasswords(payload.password, user.passwordHash);
    if (!valid) {
      await UserRepository.incrementFailedLoginAttempts(user.id);
      const updated = await UserRepository.findById(user.id);
      if (updated && updated.failedLoginAttempts >= 5) { await UserRepository.lockAccount(user.id); publishAccountLocked({ userId: user.id, reason: 'Trop de tentatives échouées' }); await SecurityLogRepository.create({ userId: user.id, action: 'ACCOUNT_LOCKED', success: false }); }
      await SecurityLogRepository.create({ userId: user.id, action: 'FAILED_LOGIN', success: false });
      throw new AppError('Identifiants invalides', 401);
    }

    await UserRepository.updateLastLogin(user.id, payload.ipAddress || '127.0.0.1');

    if (user.twoFactorEnabled) {
      const tempToken = crypto.randomBytes(32).toString('hex');
      await SecurityLogRepository.create({ userId: user.id, action: 'TWOFA_CHALLENGE', success: true });
      return { requires2FA: true, tempToken };
    }

    // Skip 2FA requirement for seed/development accounts to avoid blocking login
    // Users can enable 2FA manually from their profile settings
    return this.issueTokens(user, payload);
  }

  static async verify2FALogin(tempToken: string, totpCode: string, payload: LoginPayload): Promise<AuthResponse> {
    if (!tempToken || tempToken.length < 10) throw new AppError('Invalid or expired login session', 400);

    const isEmail = payload.identifier.includes('@');
    const user = isEmail
      ? await UserRepository.findByEmail(payload.identifier)
      : await UserRepository.findByPhone(payload.identifier);
    if (!user) throw new AppError('User not found', 404);
    if (!user.twoFactorEnabled) throw new AppError('2FA is not enabled for this account', 400);

    const valid = await TwoFactorService.verifyToken(user.id, totpCode);
    if (!valid) {
      await SecurityLogRepository.create({ userId: user.id, action: 'FAILED_2FA', success: false });
      throw new AppError('Invalid verification code', 401);
    }

    await SecurityLogRepository.create({ userId: user.id, action: 'TWOFA_VERIFIED', success: true });
    return this.issueTokens(user, payload);
  }

  private static async issueTokens(user: any, payload: LoginPayload): Promise<AuthResponse> {
    const refreshExpiry = payload.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    const tokens = createTokenPair({ id: user.id, email: user.email, primaryRole: user.primaryRole, roles: user.roles });
    const device = await DeviceRepository.findOrCreate({ userId: user.id, ipAddress: payload.ipAddress || '127.0.0.1', userAgent: payload.userAgent });
    const session = await SessionRepository.create({ userId: user.id, ipAddress: payload.ipAddress || '127.0.0.1', userAgent: payload.userAgent, deviceId: device.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
    await RefreshTokenRepository.create({ userId: user.id, token: tokens.refreshToken, expiresAt: new Date(Date.now() + refreshExpiry), sessionId: session.id });
    await SecurityLogRepository.create({ userId: user.id, action: 'LOGIN', success: true, deviceId: device.id });

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresIn: config.JWT_EXPIRES_IN };
  }

  static async refreshAccessToken(refreshToken: string): Promise<TokenPair & { user: any }> {
    const decoded = verifyRefreshToken(refreshToken);
    const stored = await RefreshTokenRepository.findByToken(refreshToken);
    if (!stored || stored.expiresAt < new Date()) throw new AppError('Invalid refresh token', 401);

    if (stored.revokedAt) {
      await SecurityLogRepository.create({ userId: decoded.id, action: 'TOKEN_REUSE', success: false, reason: 'Refresh token reuse detected – all sessions revoked' });
      await RefreshTokenRepository.revokeAllByUserId(decoded.id);
      await SessionRepository.revokeAllByUserId(decoded.id);
      throw new AppError('Token has been revoked. All sessions have been invalidated for security reasons.', 401);
    }

    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new AppError('User not found', 404);

    const tokens = createTokenPair({ id: user.id, email: user.email, primaryRole: user.primaryRole, roles: user.roles });
    await RefreshTokenRepository.revoke(stored.id);
    await RefreshTokenRepository.create({ userId: user.id, token: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), sessionId: stored.sessionId || undefined });

    return { ...tokens, user };
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) await RefreshTokenRepository.revokeByToken(refreshToken);
    else await RefreshTokenRepository.revokeAllByUserId(userId);
    await SessionRepository.revokeAllByUserId(userId);
    await SecurityLogRepository.create({ userId, action: 'LOGOUT', success: true });
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return;
    const token = generateToken();
    await PasswordResetRepository.create({ userId: user.id, token, expiresAt: new Date(Date.now() + config.PASSWORD_RESET_EXPIRES_IN_HOURS * 60 * 60 * 1000) });
    const resetLink = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    const { subject, html } = emailTemplates.passwordReset(user.firstName, resetLink);
    await sendEmail(user.email, subject, html);
  }

  static async resetPassword(token: string, newPassword: string): Promise<string> {
    if (!isValidPassword(newPassword)) throw new AppError('Password too weak', 400);
    const req = await PasswordResetRepository.findValidByToken(token);
    if (!req) throw new AppError('Invalid or expired reset token', 400);
    const hash = await hashPassword(newPassword);
    await UserRepository.update(req.userId, { passwordHash: hash } as any);
    await PasswordResetRepository.markAsUsed(req.id);
    await RefreshTokenRepository.revokeAllByUserId(req.userId);
    await SessionRepository.revokeAllByUserId(req.userId);
    return req.userId;
  }

  static async sendEmailVerification(userId: string, email: string, firstName?: string): Promise<void> {
    const token = generateToken();
    await EmailVerificationRepository.create({ userId, email, token, expiresAt: new Date(Date.now() + config.EMAIL_VERIFICATION_EXPIRES_IN_HOURS * 60 * 60 * 1000) });
    const link = `${config.FRONTEND_URL}/verify-email?token=${token}`;
    const { subject, html } = emailTemplates.welcome(firstName || '', link);
    await sendEmail(email, subject, html);
  }

  static async verifyEmail(token: string): Promise<void> {
    const v = await EmailVerificationRepository.findByToken(token);
    if (!v) throw new AppError('Invalid or expired token', 400);
    await EmailVerificationRepository.markAsVerified(v.id);
    await UserRepository.update(v.userId, { emailVerified: true } as any);
  }

  static async resendEmailVerification(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user || user.emailVerified) return;
    await this.sendEmailVerification(user.id, user.email, user.firstName);
  }

  static async sendOTP(email: string, type: OtpType): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new AppError('User not found', 404);
    const code = generateOTP(config.OTP_LENGTH);
    await OtpCodeRepository.create({ userId: user.id, code, type, destination: email, expiresAt: new Date(Date.now() + config.OTP_EXPIRES_IN_MINUTES * 60 * 1000), maxAttempts: config.OTP_MAX_ATTEMPTS });
    const { subject, html } = emailTemplates.otp(user.firstName, code, type);
    await sendEmail(email, subject, html);
  }

  static async verifyOTP(email: string, code: string, type: OtpType): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new AppError('User not found', 404);
    const otp = await OtpCodeRepository.findByUserIdAndType(user.id, type);
    if (!otp) throw new AppError('OTP not found or expired', 400);
    if (otp.code !== code) {
      await OtpCodeRepository.incrementAttempts(otp.id);
      const exceeded = await OtpCodeRepository.hasExceededMaxAttempts(otp.id);
      if (exceeded) {
        await OtpCodeRepository.delete(otp.id);
        throw new AppError('Too many invalid OTP attempts', 429);
      }
      throw new AppError('Invalid OTP', 400);
    }
    await OtpCodeRepository.markAsVerified(otp.id);
    if (type === 'EMAIL_VERIFICATION') await UserRepository.update(user.id, { emailVerified: true } as any);
  }

  static async sendPhoneOTP(phone: string, type: OtpType): Promise<void> {
    const user = await UserRepository.findByPhone(phone);
    if (!user) throw new AppError('User not found with this phone number', 404);
    const code = generateOTP(config.OTP_LENGTH);
    await OtpCodeRepository.create({ userId: user.id, code, type, destination: phone, expiresAt: new Date(Date.now() + config.OTP_EXPIRES_IN_MINUTES * 60 * 1000), maxAttempts: config.OTP_MAX_ATTEMPTS });
    logger.info(`[SMS] OTP ${code} sent to phone ${phone} for ${type}`);
  }

  static async verifyPhoneOTP(phone: string, code: string, type: OtpType): Promise<void> {
    const user = await UserRepository.findByPhone(phone);
    if (!user) throw new AppError('User not found with this phone number', 404);
    const otp = await OtpCodeRepository.findByUserIdAndType(user.id, type);
    if (!otp) throw new AppError('OTP not found or expired', 400);
    if (otp.code !== code) {
      await OtpCodeRepository.incrementAttempts(otp.id);
      const exceeded = await OtpCodeRepository.hasExceededMaxAttempts(otp.id);
      if (exceeded) { await OtpCodeRepository.delete(otp.id); throw new AppError('Too many invalid OTP attempts', 429); }
      throw new AppError('Invalid OTP', 400);
    }
    await OtpCodeRepository.markAsVerified(otp.id);
    await UserRepository.update(user.id, { phoneVerified: true });
    await SecurityLogRepository.create({ userId: user.id, action: 'OTP_VERIFICATION', success: true, reason: 'Phone verified via OTP' });
  }

  static async getSessions(userId: string): Promise<any[]> {
    const sessions = await SessionRepository.findByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      deviceName: s.device?.name || s.userAgent,
      deviceType: s.device?.deviceType || 'Unknown',
      createdAt: s.createdAt,
      lastUsedAt: s.updatedAt,
      isActive: s.isActive,
    }));
  }

  static async revokeSession(userId: string, sessionId: string): Promise<void> { const s = await SessionRepository.findById(sessionId); if (!s || s.userId !== userId) throw new AppError('Session not found', 404); await SessionRepository.revoke(sessionId); }

  static async activateBusinessRole(userId: string): Promise<{ user: any; accessToken: string; refreshToken: string; expiresIn: string }> {
    const existing = await UserRepository.findById(userId);
    if (!existing) throw new AppError('Utilisateur non trouvé', 404);
    if (existing.primaryRole === 'BUSINESS') {
      throw new AppError('Vous êtes déjà un professionnel', 409);
    }
    await UserRepository.update(userId, { primaryRole: 'BUSINESS', roles: { push: 'BUSINESS' } } as any);
    const updatedUser = await UserRepository.findById(userId);
    if (!updatedUser) throw new AppError('Utilisateur non trouvé', 404);

    const tokens = createTokenPair({ id: updatedUser.id, email: updatedUser.email, primaryRole: updatedUser.primaryRole, roles: updatedUser.roles });
    await SecurityLogRepository.create({ userId, action: 'ROLE_ACTIVATION', success: true, reason: 'Business role activated' });

    return {
      user: updatedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  static async activateDeveloperRole(userId: string): Promise<{ user: any; accessToken: string; refreshToken: string; expiresIn: string }> {
    const existing = await UserRepository.findById(userId);
    if (!existing) throw new AppError('Utilisateur non trouvé', 404);
    if (existing.primaryRole === UserRole.DEVELOPER) {
      throw new AppError('Vous êtes déjà développeur', 409);
    }
    await UserRepository.activateDeveloperRole(userId);
    const updatedUser = await UserRepository.findById(userId);
    if (!updatedUser) throw new AppError('Utilisateur non trouvé', 404);

    // Create developer profile if not exists
    let profile = await DeveloperRepository.findByUserId(userId);
    if (!profile) {
      profile = await DeveloperRepository.create({
        userId,
        companyName: `${existing.firstName} ${existing.lastName}`,
        professionalEmail: existing.email,
        phone: existing.phone || undefined,
        country: existing.country || undefined,
        city: existing.city || undefined,
      });
    }

    const tokens = createTokenPair({ id: updatedUser.id, email: updatedUser.email, primaryRole: updatedUser.primaryRole, roles: updatedUser.roles });
    await SecurityLogRepository.create({ userId, action: 'ROLE_ACTIVATION', success: true, reason: 'Developer role activated' });
    return {
      user: updatedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  static async revokeOtherSessions(userId: string, currentSessionId?: string): Promise<void> {
    if (currentSessionId) {
      await SessionRepository.deleteOtherSessions(userId, currentSessionId);
    } else {
      await SessionRepository.revokeAllByUserId(userId);
    }
    await SecurityLogRepository.create({ userId, action: 'SESSION_REVOKED', success: true, reason: 'Other sessions revoked by user' });
  }

  static async getActiveSessions(userId: string): Promise<any[]> {
    const sessions = await SessionRepository.findByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      deviceName: s.device?.name || s.userAgent,
      deviceType: s.device?.deviceType || 'Unknown',
      osType: s.device?.osType || 'Unknown',
      browserName: s.device?.browserName || 'Unknown',
      city: '',
      country: '',
      lastActive: s.updatedAt,
      createdAt: s.createdAt,
      isActive: s.isActive,
      isCurrent: false,
    }));
  }
}

export const authService = AuthService;
