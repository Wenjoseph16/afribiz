import { Request, Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { publishUserSignedUp, publishUserLoggedIn, publishPasswordChanged, publishBusinessActivated, publishDeveloperActivated, publishSecurityAlert, publishSuspiciousActivity, publishAccountLocked } from '../events/publishers';
import { AuthService } from '../services/auth';
import { AuthenticatedRequest } from '../middlewares/auth';
import { config } from '../config/env';
import { OtpType } from '@prisma/client';
import { RefreshTokenRepository } from '../repositories/refreshTokenRepository';
import { accessTokenOptions, refreshTokenOptions } from '../config/cookies';

export const signup = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await AuthService.signup(req.body);

  publishUserSignedUp({ userId: result.user.id, email: result.user.email, name: `${result.user.firstName} ${result.user.lastName}` });

  res.cookie('accessToken', result.accessToken, accessTokenOptions());
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions());

  res.status(201).json({ success: true, data: result, message: 'Account created successfully. Please verify your email.' });
});

export const login = catchAsyncErrors(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('user-agent');
  const { identifier, password, rememberMe } = req.body as { identifier: string; password: string; rememberMe?: boolean };

  const result = await AuthService.login({ identifier, password, rememberMe, ipAddress, userAgent });

  if (result.requires2FA) {
    res.status(200).json({
      success: true,
      data: { requires2FA: true, tempToken: result.tempToken },
      message: '2FA verification required',
    });
    return;
  }

  if (result.requires2FASetup) {
    res.status(200).json({
      success: true,
      data: { requires2FASetup: true },
      message: '2FA setup required for security. Please configure two-factor authentication.',
    });
    return;
  }

  publishUserLoggedIn({ userId: result.user!.id, device: req.headers['user-agent'] || '', location: req.ip || '' });

  res.cookie('accessToken', result.accessToken!, accessTokenOptions());
  res.cookie('refreshToken', result.refreshToken!, refreshTokenOptions(rememberMe));

  res.status(200).json({ success: true, data: result, message: 'Login successful' });
});

export const refreshToken = catchAsyncErrors(async (req: Request, res: Response) => {
  const refreshToken = (req.body && req.body.refreshToken) || req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ success: false, error: 'Refresh token required' });

  const result = await AuthService.refreshAccessToken(refreshToken);

  res.cookie('accessToken', result.accessToken, accessTokenOptions());
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions());

  res.status(200).json({ success: true, data: result, message: 'Token refreshed successfully' });
});

export const logout = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const refreshToken = req.cookies.refreshToken || (req.body && req.body.refreshToken);
  await AuthService.logout(req.user.id, refreshToken);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const forgotPassword = catchAsyncErrors(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body.email);
  res.status(200).json({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' });
});

export const resetPassword = catchAsyncErrors(async (req: Request, res: Response) => {
  const userId = await AuthService.resetPassword(req.body.token, req.body.password);
  publishPasswordChanged({ userId });
  res.status(200).json({ success: true, message: 'Password reset successfully. Please log in with your new password.' });
});

export const verifyEmail = catchAsyncErrors(async (req: Request, res: Response) => {
  await AuthService.verifyEmail(req.body.token);
  res.status(200).json({ success: true, message: 'Email verified successfully' });
});

export const resendEmailVerification = catchAsyncErrors(async (req: Request, res: Response) => {
  await AuthService.resendEmailVerification(req.body.email);
  res.status(200).json({ success: true, message: 'Verification email sent successfully' });
});

export const sendOtp = catchAsyncErrors(async (req: Request, res: Response) => {
  const { email, phone, type } = req.body;
  if (phone) {
    await AuthService.sendPhoneOTP(phone, type as OtpType);
  } else {
    await AuthService.sendOTP(email, type as OtpType);
  }
  res.status(200).json({ success: true, message: 'OTP sent successfully' });
});

export const verifyOtp = catchAsyncErrors(async (req: Request, res: Response) => {
  const { email, phone, code, type } = req.body;
  if (phone) {
    await AuthService.verifyPhoneOTP(phone, code, type as OtpType);
  } else {
    await AuthService.verifyOTP(email, code, type as OtpType);
  }
  res.status(200).json({ success: true, message: 'OTP verified successfully' });
});

export const getSessions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  const sessions = await AuthService.getSessions(req.user.id);
  res.status(200).json({ success: true, data: sessions });
});

export const deleteSession = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  const { sessionId } = req.params;
  await AuthService.revokeSession(req.user.id, sessionId);
  res.status(200).json({ success: true, message: 'Session deleted successfully' });
});

export const activateBusinessRole = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await AuthService.activateBusinessRole(req.user.id);

  publishBusinessActivated({ userId: result.user.id, businessId: result.user.id, businessName: result.user.businessName || `${result.user.firstName} ${result.user.lastName}` });

  res.cookie('accessToken', result.accessToken, accessTokenOptions());
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions());

  res.status(200).json({ success: true, data: result, message: 'Rôle professionnel activé avec succès' });
});

export const activateDeveloperRole = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await AuthService.activateDeveloperRole(req.user.id);

  publishDeveloperActivated({ userId: result.user.id });

  res.cookie('accessToken', result.accessToken, accessTokenOptions());
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions());

  res.status(200).json({ success: true, data: result, message: 'Rôle développeur activé avec succès' });
});

export const revokeOtherSessions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  const stored = await RefreshTokenRepository.findByToken(req.cookies.refreshToken);
  await AuthService.revokeOtherSessions(req.user.id, stored?.sessionId || undefined);
  res.status(200).json({ success: true, message: 'Other sessions revoked successfully' });
});

export const getActiveSessions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  const sessions = await AuthService.getActiveSessions(req.user.id);
  res.status(200).json({ success: true, data: sessions });
});

export const verify2FALogin = catchAsyncErrors(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('user-agent');
  const { identifier, password, rememberMe, tempToken, totpCode } = req.body as {
    identifier: string; password: string; rememberMe?: boolean;
    tempToken: string; totpCode: string;
  };

  const result = await AuthService.verify2FALogin(tempToken, totpCode, { identifier, password, rememberMe, ipAddress, userAgent });

  publishUserLoggedIn({ userId: result.user.id, device: req.headers['user-agent'] || '', location: req.ip || '' });

  res.cookie('accessToken', result.accessToken, accessTokenOptions());
  res.cookie('refreshToken', result.refreshToken, refreshTokenOptions(rememberMe));

  res.status(200).json({ success: true, data: result, message: '2FA verified. Login successful.' });
});