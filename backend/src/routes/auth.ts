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
  revokeOtherSessions,
  getActiveSessions,
  verify2FALogin,
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
import { authMiddleware } from '../middlewares/auth';
import { authLimiter, otpLimiter, resendLimiter } from '../middlewares/rateLimiter';

const router: Router = express.Router();

/**
 * Public Routes (No authentication required)
 */

// Register
router.post('/signup', authLimiter, validateBody(signupSchema), signup);

// Login
router.post('/login', authLimiter, validateBody(loginSchema), login);

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

// Verify OTP (strict rate limiting for brute force protection)
router.post('/verify-otp', otpLimiter, authLimiter, validateBody(verifyOtpSchema), verifyOtp);

/**
 * Protected Routes (Authentication required)
 */

// 2FA verification during login
router.post('/verify-2fa', authLimiter, verify2FALogin);

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

// Revoke other sessions
router.post('/sessions/revoke-others', authMiddleware, revokeOtherSessions);

export default router;