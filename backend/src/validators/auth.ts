import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must contain at least one special character');

const emailSchema = z.string().email('Invalid email address').toLowerCase();

/**
 * Country-aware phone schema
 * Accepts a phone with country code (e.g., +22890123456) or countryCode + number separately
 */
const phoneSchema = z
  .string()
  .min(4, 'Enter a valid phone number with country code')
  .max(18, 'Phone number too long')
  .regex(/^\+[1-9]\d{6,16}$/, 'Enter a valid international phone number (e.g., +22890123456)');

export const signupSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    email: emailSchema,
    phone: phoneSchema,
    countryCode: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    region: z.string().min(2, 'Region is required'),
    city: z.string().min(2, 'City is required'),
    neighborhood: z.string().min(2, 'Neighborhood is required'),
    birthDate: z.string().optional().refine((date) => !date || !Number.isNaN(Date.parse(date)), { message: 'Enter a valid date of birth' }),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Login validation - supports email OR phone (identifier)
 */
export const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * Forgot password validation
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password validation
 */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Verify email validation
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Resend email verification validation
 */
export const resendEmailVerificationSchema = z.object({
  email: emailSchema,
});

/**
 * Send OTP validation - supports email OR phone
 */
export const sendOtpSchema = z.object({
  email: emailSchema.optional(),
  phone: z.string().regex(/^\+[1-9]\d{6,16}$/, 'Invalid phone number').optional(),
  type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

/**
 * Verify OTP validation - supports email OR phone
 */
export const verifyOtpSchema = z.object({
  email: emailSchema.optional(),
  phone: z.string().regex(/^\+[1-9]\d{6,16}$/, 'Invalid phone number').optional(),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
}).refine((data) => data.email || data.phone, {
  message: 'Either email or phone is required',
});

/**
 * Refresh token validation
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendEmailVerificationInput = z.infer<typeof resendEmailVerificationSchema>;
export type OtpVerifyInput = z.infer<typeof verifyOtpSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;