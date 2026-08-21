import { Request, Response } from 'express';
import { AppError, catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthService } from '../services/auth';
import { AuthenticatedRequest } from '../middlewares/auth';
import { config } from '../config/env';
import { OtpType } from '@prisma/client';

export const signup = catchAsyncErrors(async (req: Request, res: Response) => {
  const result = await AuthService.signup(req.body);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    data: result,
    message: 'Account created successfully. Please verify your email.',
  });
});

export const login = catchAsyncErrors(async (req: Request, res: Response) => {
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('user-agent');
  const { identifier, password, rememberMe } = req.body as {
    identifier: string;
    password: string;
    rememberMe?: boolean;
  };

  const result = await AuthService.login({
    identifier,
    password,
    rememberMe,
    ipAddress,
    userAgent,
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({ success: true, data: result, message: 'Login successful' });
});

export const refreshToken = catchAsyncErrors(async (req: Request, res: Response) => {
  const refreshToken = (req.body && req.body.refreshToken) || req.cookies.refreshToken;

  if (!refreshToken)
    return res.status(401).json({ success: false, error: 'Refresh token required' });

  const result = await AuthService.refreshAccessToken(refreshToken);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.status(200).json({ success: true, data: result, message: 'Token refreshed successfully' });
});

export const logout = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const refreshToken = req.cookies.refreshToken || (req.body && req.body.refreshToken);
  await AuthService.logout(req.user.id, refreshToken);

  res.clearCookie('refreshToken');
  res.clearCookie('accessToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const forgotPassword = catchAsyncErrors(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body.email);
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

export const resetPassword = catchAsyncErrors(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
  });
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
  const sessions = await AuthService.getSessions(req.user.id, req.sessionId);
  res.status(200).json({ success: true, data: sessions });
});

export const deleteSession = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  const { sessionId } = req.params;
  // On ne peut pas révoquer la session courante (ce serait se déconnecter soi-même).
  if (req.sessionId && sessionId === req.sessionId) {
    throw new AppError('Impossible de déconnecter la session actuelle', 400);
  }
  await AuthService.revokeSession(req.user.id, sessionId);
  res.status(200).json({ success: true, message: 'Session deleted successfully' });
});

export const revokeOtherSessions = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    await AuthService.revokeOtherSessions(req.user.id, req.sessionId);
    res.status(200).json({ success: true, message: 'Other sessions revoked successfully' });
  }
);

export const activateBusinessRole = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    await AuthService.activateBusinessRole(req.user.id);
    res.status(200).json({ success: true, message: 'Business role activated successfully' });
  }
);

export const activateDeveloperRole = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    await AuthService.activateDeveloperRole(req.user.id);
    res.status(200).json({ success: true, message: 'Developer role activated successfully' });
  }
);
// end of file
