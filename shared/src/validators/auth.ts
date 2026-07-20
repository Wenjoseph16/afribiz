import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email ou téléphone requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const signupSchema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis').max(50),
    lastName: z.string().min(1, 'Nom requis').max(50),
    email: z.string().email('Email invalide'),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Doit contenir une majuscule')
      .regex(/[0-9]/, 'Doit contenir un chiffre')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Doit contenir un caractère spécial'),
    confirmPassword: z.string(),
    country: z.string().min(1, 'Pays requis'),
    phone: z.string().regex(/^\+?[\d\s\-().]{7,20}$/, 'Format de téléphone invalide'),
    region: z.string().optional(),
    city: z.string().optional(),
    neighborhood: z.string().optional(),
    birthDate: z.string().optional(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'Vous devez accepter les conditions' }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const passwordResetSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[!@#$%^&*(),.?":{}|<>]/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, 'Code 2FA invalide'),
  method: z.enum(['APP', 'SMS', 'EMAIL']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;
