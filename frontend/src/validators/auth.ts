import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Email ou téléphone requis')
    .regex(/^[\w@.+\-]+$/, 'Entrez un email ou téléphone valide'),
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
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Inclure au moins un caractère spécial'),
    confirmPassword: z.string(),
    country: z.string().min(2, 'Sélectionnez votre pays'),
    phone: z
      .string()
      .refine((val) => !val || /^\+[1-9]\d{6,16}$/.test(val), {
        message: 'Entrez un numéro valide avec indicatif (ex: +22890123456)',
      })
      .optional()
      .or(z.literal('')),
    region: z.string().min(2, 'Sélectionnez votre région'),
    city: z.string().min(2, 'Sélectionnez votre ville'),
    neighborhood: z.string().min(2, 'Entrez votre quartier'),
    birthDate: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
      message: 'Entrez une date de naissance valide',
    }),
    gender: z.enum(['male', 'female', 'other']).optional(),
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
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Inclure au moins un caractère spécial'),
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
