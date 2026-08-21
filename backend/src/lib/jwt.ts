import jwt, { SignOptions, JwtPayload as JwtPayloadBase } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { config } from '../config/env';

export interface JWTPayload extends JwtPayloadBase {
  id: string;
  email: string;
  primaryRole: string;
  roles: string[];
  sessionId?: string;
  impersonating?: boolean;
  impersonatorId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Token employé (Chantier 7) : JWT séparé du boss, portant les permissions
 * de l'employé pour CE business. Le champ `authType` permet au middleware
 * de distinguer un token boss ( absent = backward-compatible ) d'un token
 * employé.
 */
export interface EmployeeTokenPayload {
  authType: 'employee';
  employeeId: string;
  businessId: string;
  permissions: string[];
  maxDiscountPercentage?: number;
  iat?: number;
  exp?: number;
}

/** Union : tout token JWT possible (boss OU employé). */
export type AnyJWTPayload = JWTPayload | EmployeeTokenPayload;

/** Type guard : vérifie si un payload est un token employé. */
export function isEmployeeToken(payload: AnyJWTPayload): payload is EmployeeTokenPayload {
  return (payload as EmployeeTokenPayload).authType === 'employee';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Create access token
 */
export const createAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const signPayload: any = {
    id: payload.id,
    email: payload.email,
    primaryRole: payload.primaryRole,
    roles: payload.roles,
  };
  if (payload.sessionId) signPayload.sessionId = payload.sessionId;

  return jwt.sign(
    signPayload,
    config.JWT_SECRET as jwt.Secret,
    {
      expiresIn: config.JWT_EXPIRES_IN,
      algorithm: 'HS256',
    } as SignOptions
  );
};

/**
 * Create impersonation token (voir-comme) : court (15 min), marqué comme
 * impersonation pour que le middleware bloque les mutations (lecture seule).
 */
export const createImpersonationToken = (payload: {
  id: string;
  email: string;
  primaryRole: string;
  roles: string[];
  impersonatorId: string;
}): string => {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      primaryRole: payload.primaryRole,
      roles: payload.roles,
      impersonating: true,
      impersonatorId: payload.impersonatorId,
    },
    config.JWT_SECRET as jwt.Secret,
    {
      expiresIn: '15m',
      algorithm: 'HS256',
    } as SignOptions
  );
};

/**
 * Create refresh token
 */
export const createRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const signPayload: any = {
    id: payload.id,
    email: payload.email,
    // jti aléatoire : garantit l'unicité du refresh token même à la même seconde
    // (la colonne token a une contrainte UNIQUE — deux iat identiques sinon).
    jti: randomUUID(),
  };

  return jwt.sign(
    signPayload,
    config.JWT_REFRESH_SECRET as jwt.Secret,
    {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      algorithm: 'HS256',
    } as SignOptions
  );
};

/**
 * Create both access and refresh tokens
 */
export const createTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair => {
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
    expiresIn: config.JWT_EXPIRES_IN,
  };
};

/**
 * Create employee auth token (Chantier 7)
 *
 * JWT dédié aux employés — TTL 12h, portant employeeId, businessId,
 * permissions et maxDiscountPercentage. Même SECRET que le boss pour
 * simplifier le middleware (un seul verifyAccessToken).
 */
export const createEmployeeToken = (payload: Omit<EmployeeTokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(
    {
      authType: 'employee' as const,
      employeeId: payload.employeeId,
      businessId: payload.businessId,
      permissions: payload.permissions,
      ...(payload.maxDiscountPercentage !== undefined
        ? { maxDiscountPercentage: payload.maxDiscountPercentage }
        : {}),
    },
    config.JWT_SECRET as jwt.Secret,
    {
      expiresIn: '12h',
      algorithm: 'HS256',
    } as SignOptions
  );
};

/**
 * Verify access token (boss OU employé)
 *
 * Retourne soit un JWTPayload (boss), soit un EmployeeTokenPayload
 * (employé). Le champ `authType` permet de distinguer les deux cas.
 */
export const verifyAccessToken = (token: string): AnyJWTPayload => {
  return jwt.verify(token, config.JWT_SECRET as jwt.Secret) as AnyJWTPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET as jwt.Secret) as JWTPayload;
};
