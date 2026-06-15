import jwt, { SignOptions, JwtPayload as JwtPayloadBase } from 'jsonwebtoken';
import { config } from '../config/env';

export interface JWTPayload extends JwtPayloadBase {
  id: string;
  email: string;
  primaryRole: string;
  roles: string[];
  iat?: number;
  exp?: number;
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

  return jwt.sign(signPayload, config.JWT_SECRET as jwt.Secret, {
    expiresIn: config.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  } as SignOptions);
};

/**
 * Create refresh token
 */
export const createRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const signPayload: any = {
    id: payload.id,
    email: payload.email,
  };

  return jwt.sign(signPayload, config.JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256',
  } as SignOptions);
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
 * Verify access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.JWT_SECRET as jwt.Secret) as JWTPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET as jwt.Secret) as JWTPayload;
};