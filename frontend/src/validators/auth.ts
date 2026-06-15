import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Email ou téléphone requis')
    .regex(/^[\w@.-]+$/, 'Entrez un email ou téléphone valide'),
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Inclure au moins une lettre majuscule')
      .regex(/[a-z]/, 'Inclure au moins une lettre minuscule')
      .regex(/[0-9]/, 'Inclure au moins un chiffre')
      .regex(/[!@#$%^&*()_+=@[\]{}';":\\|,.<>/?]/, 'Inclure au moins un caractère spécial'),
    confirmPassword: z.string(),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{6,16}$/, 'Entrez un numéro valide avec indicatif (ex: +22890123456)'),
    country: z.string().min(2, 'Le pays est requis'),
    region: z.string().min(2, 'La région est requise'),
    city: z.string().min(2, 'La ville est requise'),
    neighborhood: z.string().min(2, 'Le quartier est requis'),
    birthDate: z.string().optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    termsAccepted: z.boolean().refine((value) => value === true, {
      message: 'Vous devez accepter les conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Inclure au moins une lettre majuscule')
      .regex(/[a-z]/, 'Inclure au moins une lettre minuscule')
      .regex(/[0-9]/, 'Inclure au moins un chiffre')
      .regex(/[!@#$%^&*()_+=@[\]{};':"\\|,.<>/?]/, 'Inclure au moins un caractère spécial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  email: z.string().email('Enter a valid email'),
  code: z.string().length(6, 'Enter the 6-digit code'),
});
