import { Response, NextFunction } from 'express';
import { AppError, catchAsyncErrors } from './errorHandler';
import { AuthenticatedRequest } from './auth';
import { comparePasswords } from '../lib/password';
import { prisma } from '../lib/db';
import { TwoFactorService } from '../services/twoFactorService';

/**
 * Garde anti brute-force en mémoire : 5 échecs consécutifs → verrouillage 15 min.
 * Léger et suffisant : le compte est déjà authentifié (admin), on protège juste
 * la re-confirmation.
 */
const failureMap = new Map<string, { count: number; lockedUntil: number }>();

const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * Double validation des actions admin sensibles (G2).
 *
 * L'admin authentifié doit re-saisir son mot de passe pour confirmer l'action.
 * Si son compte a la 2FA activée, un code OTP est en plus exigé.
 *
 * Les champs `adminPassword` / `otpCode` sont retirés du body après vérification
 * pour que les contrôleurs existants restent inchangés.
 *
 * Ordre d'utilisation : DOIT être placé AVANT `validateBody` (les schémas zod
 * stripent les champs inconnus par défaut, ce qui retirerait adminPassword/otpCode).
 */
/**
 * Logique de double validation — exportée séparément pour les tests unitaires
 * (elle THROW ses erreurs directement, contrairement au wrapper Express qui
 * les transmet à `next(error)`).
 */
export const requireAdminConfirmationInner = async (
  req: AuthenticatedRequest,
  _res: Response,
  _next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // Garde anti brute-force
  const guard = failureMap.get(req.user.id);
  if (guard && guard.lockedUntil > Date.now()) {
    throw new AppError(
      'Trop de tentatives de confirmation. Réessayez dans quelques minutes.',
      429
    );
  }

  const { adminPassword, otpCode } = (req.body || {}) as {
    adminPassword?: string;
    otpCode?: string;
  };

  if (!adminPassword) {
    throw new AppError(
      'Action sensible : confirmez avec votre mot de passe administrateur.',
      403,
      { code: 'CONFIRMATION_REQUIRED' }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { passwordHash: true, twoFactorEnabled: true },
  });
  if (!user) {
    throw new AppError('User not found', 401);
  }

  const valid = await comparePasswords(adminPassword, user.passwordHash);
  if (!valid) {
    const entry = failureMap.get(req.user.id) || { count: 0, lockedUntil: 0 };
    entry.count += 1;
    if (entry.count >= MAX_FAILURES) {
      entry.lockedUntil = Date.now() + LOCKOUT_MS;
      entry.count = 0;
    }
    failureMap.set(req.user.id, entry);
    throw new AppError('Mot de passe invalide. Action annulée.', 403);
  }

  // 2FA activée → OTP obligatoire
  if (user.twoFactorEnabled) {
    if (!otpCode) {
      throw new AppError(
        'Code 2FA requis pour confirmer cette action.',
        403,
        { code: 'OTP_REQUIRED' }
      );
    }
    const otpValid = await TwoFactorService.verifyToken(req.user.id, otpCode);
    if (!otpValid) {
      throw new AppError('Code 2FA invalide. Action annulée.', 403);
    }
  }

  // Succès : réinitialise la garde et retire les champs de confirmation du body
  failureMap.delete(req.user.id);
  delete req.body.adminPassword;
  delete req.body.otpCode;

  _next();
};

/**
 * Middleware Express — enveloppe le handler interne et transmet les erreurs à
 * `next(error)` (pattern catchAsyncErrors du projet).
 */
export const requireAdminConfirmation = catchAsyncErrors(
  requireAdminConfirmationInner
);
