import { OtpType } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../middlewares/errorHandler';
import {
  isValidPassword,
  hashPassword,
  comparePasswords,
  generateToken,
  generateOTP,
} from '../lib/password';
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
import {
  publishUserSignedUp,
  publishUserLoggedIn,
  publishUserLoggedOut,
  publishPasswordChanged,
  publishAccountLocked,
  publishNewDeviceDetected,
} from '../events/publishers';
import { trackAnalyticsEvent } from './analyticsService';
import { forceDisconnectUser } from './socket';

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  country?: string;
  region?: string;
  city?: string;
  neighborhood?: string;
  birthDate?: string;
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
  requires2FA?: boolean;
  requires2FASetup?: boolean;
  tempToken?: string;
}

export class AuthService {
  static async signup(payload: SignupPayload): Promise<AuthResponse> {
    if (!isValidPassword(payload.password))
      throw new AppError('Password does not meet complexity', 400);
    if (await UserRepository.emailExists(payload.email))
      throw new AppError('Cet email est déjà utilisé', 409);
    if (payload.phone && (await UserRepository.phoneExists(payload.phone)))
      throw new AppError('Ce numéro de téléphone est déjà enregistré', 409);

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
    });

    const tokens = createTokenPair({
      id: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      roles: user.roles,
    });
    const session = await SessionRepository.create({
      userId: user.id,
      ipAddress: '127.0.0.1',
      userAgent: undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await RefreshTokenRepository.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionId: session.id,
    });

    await this.sendEmailVerification(user.id, user.email, user.firstName);
    await SecurityLogRepository.create({ userId: user.id, action: 'SIGNUP', success: true });

    // Inscription → écosystème : événement (notif « Bienvenue » + email) + analytics
    publishUserSignedUp({
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName || ''}`.trim(),
    });
    trackAnalyticsEvent({
      userId: user.id,
      type: 'auth',
      category: 'navigation',
      eventName: 'USER_SIGNED_UP',
      properties: { email: user.email },
    }).catch(() => {});

    logger.info(`User registered: ${user.email}`);
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    };
  }

  static async login(payload: LoginPayload): Promise<AuthResponse> {
    const isEmail = payload.identifier.includes('@');
    const user = isEmail
      ? await UserRepository.findByEmail(payload.identifier)
      : await UserRepository.findByPhone(payload.identifier);
    if (!user) throw new AppError('Identifiants invalides', 401);
    if (!user.isActive) throw new AppError('Compte désactivé', 403);
    if (user.lockedUntil && user.lockedUntil > new Date())
      throw new AppError('Compte temporairement verrouillé', 423);
    // Gel temporaire par l'admin (observation/enquête) : auto-expire via frozenUntil
    if (user.frozenUntil && user.frozenUntil > new Date())
      throw new AppError(
        `Compte gelé temporairement jusqu'au ${user.frozenUntil.toLocaleDateString('fr-FR')}. Contactez le support.`,
        423
      );

    const valid = await comparePasswords(payload.password, user.passwordHash);
    if (!valid) {
      await UserRepository.incrementFailedLoginAttempts(user.id);
      const updated = await UserRepository.findById(user.id);
      if (updated && updated.failedLoginAttempts >= 5) {
        await UserRepository.lockAccount(user.id);
        await SecurityLogRepository.create({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          success: false,
        });
        // Verrouillage → alerte de sécurité (map notification déjà prête)
        publishAccountLocked({ userId: user.id, reason: '5 échecs de connexion' });
        trackAnalyticsEvent({
          userId: user.id,
          type: 'auth',
          category: 'security',
          eventName: 'ACCOUNT_LOCKED',
          properties: { reason: '5 échecs de connexion' },
        }).catch(() => {});
      }
      await SecurityLogRepository.create({
        userId: user.id,
        action: 'FAILED_LOGIN',
        success: false,
      });
      throw new AppError('Identifiants invalides', 401);
    }

    if (user.twoFactorEnabled) {
      // On embarque device/location dans le tempToken pour que la détection de nouvel
      // appareil fonctionne aussi pour les utilisateurs 2FA (verify2FALogin n'a pas le payload).
      const tempToken = jwt.sign(
        {
          id: user.id,
          purpose: '2fa_login',
          device: payload.userAgent || '',
          location: payload.ipAddress || '',
        },
        config.JWT_SECRET,
        { expiresIn: '5m' }
      );
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryRole: user.primaryRole,
        roles: user.roles,
      };
      await SecurityLogRepository.create({
        userId: user.id,
        action: 'TWOFA_CHALLENGE',
        success: true,
      });
      return {
        user: safeUser,
        accessToken: '',
        refreshToken: '',
        expiresIn: '5m',
        requires2FA: true,
        tempToken,
      };
    }

    await UserRepository.updateLastLogin(user.id, payload.ipAddress || '127.0.0.1');
    await this.detectNewDevice(user.id, payload.userAgent, payload.ipAddress);
    const tokens = createTokenPair({
      id: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      roles: user.roles,
    });
    const session = await SessionRepository.create({
      userId: user.id,
      ipAddress: payload.ipAddress || '127.0.0.1',
      userAgent: payload.userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await RefreshTokenRepository.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionId: session.id,
    });
    await SecurityLogRepository.create({ userId: user.id, action: 'LOGIN', success: true });

    // Connexion → écosystème : notification « Connexion détectée » + analytics
    publishUserLoggedIn({
      userId: user.id,
      device: payload.userAgent || '',
      location: payload.ipAddress || '',
    });
    trackAnalyticsEvent({
      userId: user.id,
      type: 'auth',
      category: 'navigation',
      eventName: 'USER_LOGGED_IN',
      properties: { method: 'password' },
    }).catch(() => {});

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    };
  }

  /**
   * Détection d'un nouveau dispositif : compare le userAgent courant aux sessions
   * précédentes. Si inconnu → `NEW_DEVICE_DETECTED` (alerte de sécurité).
   * NB : si l'utilisateur n'a AUCUNE session antérieure (premier login d'un compte
   * neuf), on ne déclenche pas d'alerte — c'est son propre premier appareil.
   */
  static async detectNewDevice(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    if (!userAgent) return;
    const previous = await SessionRepository.findByUserId(userId);
    if (previous.length === 0) return; // premier login → pas de faux positif
    const known = previous.some((s) => s.userAgent === userAgent);
    if (!known) {
      publishNewDeviceDetected({
        userId,
        device: userAgent.length > 120 ? userAgent.slice(0, 120) : userAgent,
        location: ipAddress || 'Inconnue',
      });
    }
  }

  static async verify2FALogin(tempToken: string, totpCode: string): Promise<AuthResponse> {
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, config.JWT_SECRET);
    } catch {
      throw new AppError('Session de vérification expirée', 401);
    }
    if (decoded.purpose !== '2fa_login') throw new AppError('Token invalide', 401);

    const isValid = await TwoFactorService.verifyToken(decoded.id, totpCode);
    if (!isValid) throw new AppError('Code de vérification invalide', 401);

    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new AppError('Utilisateur introuvable', 404);
    if (!user.isActive) throw new AppError('Compte désactivé', 403);

    const device = (decoded.device as string) || '';
    const location = (decoded.location as string) || '';
    // Nouvel appareil détecté pour les utilisateurs 2FA (même logique que le login classique).
    await this.detectNewDevice(decoded.id, device || undefined, location || undefined);

    await UserRepository.updateLastLogin(user.id, location || '127.0.0.1');
    const tokens = createTokenPair({
      id: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      roles: user.roles,
    });
    const session = await SessionRepository.create({
      userId: user.id,
      ipAddress: location || '127.0.0.1',
      userAgent: device || undefined,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await RefreshTokenRepository.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionId: session.id,
    });
    await SecurityLogRepository.create({
      userId: user.id,
      action: 'LOGIN',
      success: true,
      reason: '2FA',
    });

    // Connexion 2FA réussie → même cascade qu'un login classique
    // (device/location proviennent du tempToken, cohérents avec detectNewDevice ci-dessus)
    publishUserLoggedIn({ userId: user.id, device, location });
    trackAnalyticsEvent({
      userId: user.id,
      type: 'auth',
      category: 'navigation',
      eventName: 'USER_LOGGED_IN',
      properties: { method: '2fa' },
    }).catch(() => {});

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: config.JWT_EXPIRES_IN,
    };
  }

  static async refreshAccessToken(refreshToken: string): Promise<TokenPair & { user: any }> {
    const decoded = verifyRefreshToken(refreshToken);
    const stored = await RefreshTokenRepository.findByToken(refreshToken);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date())
      throw new AppError('Invalid refresh token', 401);
    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new AppError('User not found', 404);

    const tokens = createTokenPair({
      id: user.id,
      email: user.email,
      primaryRole: user.primaryRole,
      roles: user.roles,
    });
    await RefreshTokenRepository.revoke(stored.id);
    await RefreshTokenRepository.create({
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionId: stored.sessionId || undefined,
    });

    return { ...tokens, user };
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) await RefreshTokenRepository.revokeByToken(refreshToken);
    else await RefreshTokenRepository.revokeAllByUserId(userId);
    await SessionRepository.revokeAllByUserId(userId);
    await SecurityLogRepository.create({ userId, action: 'LOGOUT', success: true });
    // Force la déconnexion des sockets du user (défense en profondeur : la présence
    // décrémente même si un socket client survit, ex. autre onglet).
    try {
      forceDisconnectUser(userId);
    } catch (err) {
      logger.warn('Force disconnect failed on logout', { error: (err as Error).message });
    }

    // Déconnexion → le compteur de présence décrémentera via le disconnect socket ;
    // on publie l'événement + analytics pour le reste de l'écosystème.
    publishUserLoggedOut({ userId });
    trackAnalyticsEvent({
      userId,
      type: 'auth',
      category: 'navigation',
      eventName: 'USER_LOGGED_OUT',
    }).catch(() => {});
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return;
    const token = generateToken();
    await PasswordResetRepository.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + config.PASSWORD_RESET_EXPIRES_IN_HOURS * 60 * 60 * 1000),
    });
    const resetLink = `${config.FRONTEND_URL}/reset-password?token=${token}`;
    const { subject, html } = emailTemplates.passwordReset(user.firstName, resetLink);
    await sendEmail(user.email, subject, html);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!isValidPassword(newPassword)) throw new AppError('Password too weak', 400);
    const req = await PasswordResetRepository.findValidByToken(token);
    if (!req) throw new AppError('Invalid or expired reset token', 400);
    const hash = await hashPassword(newPassword);
    await UserRepository.update(req.userId, { passwordHash: hash } as any);
    await PasswordResetRepository.markAsUsed(req.id);
    await RefreshTokenRepository.revokeAllByUserId(req.userId);
    await SessionRepository.revokeAllByUserId(req.userId);

    // Mot de passe modifié → notification « Mot de passe modifié » + analytics
    publishPasswordChanged({ userId: req.userId });
    trackAnalyticsEvent({
      userId: req.userId,
      type: 'auth',
      category: 'security',
      eventName: 'PASSWORD_CHANGED',
    }).catch(() => {});
  }

  static async sendEmailVerification(
    userId: string,
    email: string,
    firstName?: string
  ): Promise<void> {
    const token = generateToken();
    await EmailVerificationRepository.create({
      userId,
      email,
      token,
      expiresAt: new Date(Date.now() + config.EMAIL_VERIFICATION_EXPIRES_IN_HOURS * 60 * 60 * 1000),
    });
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
    if (!user) throw new AppError('User not found', 404);
    if (user.emailVerified) throw new AppError('Email already verified', 400);
    await this.sendEmailVerification(user.id, user.email, user.firstName);
  }

  static async sendOTP(email: string, type: OtpType): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new AppError('User not found', 404);
    const code = generateOTP(config.OTP_LENGTH);
    await OtpCodeRepository.create({
      userId: user.id,
      code,
      type,
      destination: email,
      expiresAt: new Date(Date.now() + config.OTP_EXPIRES_IN_MINUTES * 60 * 1000),
      maxAttempts: config.OTP_MAX_ATTEMPTS,
    });
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
    if (type === 'EMAIL_VERIFICATION')
      await UserRepository.update(user.id, { emailVerified: true } as any);
  }

  static async sendPhoneOTP(phone: string, type: OtpType): Promise<void> {
    const user = await UserRepository.findByPhone(phone);
    if (!user) throw new AppError('User not found with this phone number', 404);
    const code = generateOTP(config.OTP_LENGTH);
    await OtpCodeRepository.create({
      userId: user.id,
      code,
      type,
      destination: phone,
      expiresAt: new Date(Date.now() + config.OTP_EXPIRES_IN_MINUTES * 60 * 1000),
      maxAttempts: config.OTP_MAX_ATTEMPTS,
    });
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
      if (exceeded) {
        await OtpCodeRepository.delete(otp.id);
        throw new AppError('Too many invalid OTP attempts', 429);
      }
      throw new AppError('Invalid OTP', 400);
    }
    await OtpCodeRepository.markAsVerified(otp.id);
    await UserRepository.update(user.id, { phoneVerified: true });
    await SecurityLogRepository.create({
      userId: user.id,
      action: 'OTP_VERIFICATION',
      success: true,
      reason: 'Phone verified via OTP',
    });
  }

  static async getSessions(userId: string): Promise<any[]> {
    const sessions = await SessionRepository.findByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.updatedAt,
      isActive: s.isActive,
    }));
  }

  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    const s = await SessionRepository.findById(sessionId);
    if (!s || s.userId !== userId) throw new AppError('Session not found', 404);
    await SessionRepository.revoke(sessionId);
  }

  static async activateBusinessRole(userId: string): Promise<void> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('Utilisateur introuvable', 404);
    const currentRoles = user.roles as string[];
    const updatedRoles = currentRoles.includes('BUSINESS')
      ? currentRoles
      : [...currentRoles, 'BUSINESS'];
    await UserRepository.update(userId, { primaryRole: 'BUSINESS', roles: updatedRoles } as any);
    await SecurityLogRepository.create({
      userId,
      action: 'ROLE_ACTIVATION',
      success: true,
      reason: 'Business role activated',
    });
  }

  static async activateDeveloperRole(userId: string): Promise<void> {
    await UserRepository.activateDeveloperRole(userId);
    await SecurityLogRepository.create({
      userId,
      action: 'ROLE_ACTIVATION',
      success: true,
      reason: 'Developer role activated',
    });
  }
}

export const authService = AuthService;
