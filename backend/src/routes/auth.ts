import express, { Router } from 'express';
import {
  signup,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification,
  sendOtp,
  verifyOtp,
  getSessions,
  deleteSession,
  activateBusinessRole,
  activateDeveloperRole,
} from '../controllers/auth';
import { validateBody } from '../middlewares/validators';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendEmailVerificationSchema,
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} from '../validators/auth';
import { authMiddleware, loginRateLimit } from '../middlewares/auth';
import { UserRepository } from '../repositories/userRepository';
import { OtpCodeRepository } from '../repositories/otpCodeRepository';
import { OtpType } from '@prisma/client';
import { authLimiter, resendLimiter } from '../middlewares/rateLimiter';

const router: Router = express.Router();

/**
 * Public Routes (No authentication required)
 */

// Register
router.post('/signup', authLimiter, validateBody(signupSchema), signup);

// Login
router.post('/login', authLimiter, validateBody(loginSchema), login);

// 2FA verification
router.post('/verify-2fa', authLimiter, async (req, res, next) => {
  try {
    const { AuthService } = await import('../services/auth');
    const result = await AuthService.verify2FALogin(req.body.tempToken, req.body.totpCode);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: result, message: 'Login successful' });
  } catch (e) {
    next(e);
  }
});

// Refresh token
router.post('/refresh', validateBody(refreshTokenSchema), refreshToken);

// Forgot password
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), forgotPassword);

// Reset password
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPassword);

// Verify email
router.post('/verify-email', validateBody(verifyEmailSchema), verifyEmail);

// Resend email verification
router.post(
  '/resend-verification',
  resendLimiter,
  validateBody(resendEmailVerificationSchema),
  resendEmailVerification
);

// Send OTP
router.post('/send-otp', authLimiter, validateBody(sendOtpSchema), sendOtp);

// Verify OTP
router.post('/verify-otp', authLimiter, validateBody(verifyOtpSchema), verifyOtp);

/**
 * Protected Routes (Authentication required)
 */

// Logout
router.post('/logout', authMiddleware, logout);

// Get sessions
router.get('/sessions', authMiddleware, getSessions);

// Delete session
router.delete('/sessions/:sessionId', authMiddleware, deleteSession);

// Activate business role
router.post('/activate-business', authMiddleware, activateBusinessRole);

// Activate developer role
router.post('/activate-developer', authMiddleware, activateDeveloperRole);

// Development-only debug endpoint to fetch latest OTP for an email
if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/otp', async (req, res) => {
    try {
      const email = String(req.query.email || '');
      const type = (req.query.type as string) || 'LOGIN';
      if (!email) return res.status(400).json({ success: false, error: 'email query required' });
      const user = await UserRepository.findByEmail(email);
      if (!user) return res.status(404).json({ success: false, error: 'user not found' });
      const otp = await OtpCodeRepository.findByUserIdAndType(user.id, type as OtpType);
      if (!otp) return res.status(404).json({ success: false, error: 'otp not found' });
      return res.json({
        success: true,
        data: { code: otp.code, expiresAt: otp.expiresAt, attempts: otp.attempts },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'server error' });
    }
  });
}

export default router;
