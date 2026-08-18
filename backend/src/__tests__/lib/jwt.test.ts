import jwt from 'jsonwebtoken';
import {
  createAccessToken,
  createRefreshToken,
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  type JWTPayload,
} from '../../lib/jwt';

const mockPayload = {
  id: 'user-1',
  email: 'test@example.com',
  primaryRole: 'CLIENT',
  roles: ['CLIENT'],
};

jest.mock('../../config/env', () => ({
  config: {
    JWT_SECRET: 'test-jwt-secret-key-min-32-chars-long-here!!',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-min-32-chars-long-!!',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

describe('JWT Lib', () => {
  describe('createAccessToken', () => {
    it('should return a signed JWT string', () => {
      const token = createAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include id, email, primaryRole, roles in payload', () => {
      const token = createAccessToken(mockPayload);
      const decoded = jwt.decode(token) as Record<string, any>;
      expect(decoded.id).toBe('user-1');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.primaryRole).toBe('CLIENT');
      expect(decoded.roles).toEqual(['CLIENT']);
    });
  });

  describe('createRefreshToken', () => {
    it('should return a signed JWT string', () => {
      const token = createRefreshToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include id and email in payload', () => {
      const token = createRefreshToken(mockPayload);
      const decoded = jwt.decode(token) as Record<string, any>;
      expect(decoded.id).toBe('user-1');
      expect(decoded.email).toBe('test@example.com');
    });
  });

  describe('createTokenPair', () => {
    it('should return accessToken, refreshToken, and expiresIn', () => {
      const pair = createTokenPair(mockPayload);
      expect(pair).toHaveProperty('accessToken');
      expect(pair).toHaveProperty('refreshToken');
      expect(pair).toHaveProperty('expiresIn');
      expect(pair.accessToken.split('.')).toHaveLength(3);
      expect(pair.refreshToken.split('.')).toHaveLength(3);
      expect(pair.expiresIn).toBe('15m');
    });
  });

  describe('verifyAccessToken', () => {
    it('should decode a valid access token', () => {
      const token = createAccessToken(mockPayload);
      const decoded = verifyAccessToken(token) as JWTPayload;
      expect(decoded.id).toBe('user-1');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw on token signed with different secret', () => {
      const token = jwt.sign({ id: 'user-1' }, 'wrong-secret');
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should decode a valid refresh token', () => {
      const token = createRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe('user-1');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });
});
