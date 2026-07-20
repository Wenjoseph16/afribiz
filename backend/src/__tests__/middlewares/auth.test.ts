import {
  authMiddleware,
  requireRole,
  requirePrimaryRole,
  requireEmailVerified,
  optionalAuth,
  loginRateLimit,
} from '../../middlewares/auth';

jest.mock('../../lib/jwt', () => ({ verifyAccessToken: jest.fn() }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { verifyAccessToken } from '../../lib/jwt';

const mockRes = {} as any;

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next with 401 if no token provided', async () => {
    const next = jest.fn();
    await authMiddleware({ headers: {} } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should set user on request with valid token', async () => {
    const next = jest.fn();
    const req: any = { headers: { authorization: 'Bearer valid-token' } };
    (verifyAccessToken as jest.Mock).mockReturnValue({
      id: 'u1',
      email: 'test@test.com',
      primaryRole: 'BUSINESS',
      roles: ['BUSINESS'],
    });
    await authMiddleware(req, mockRes, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 401 on invalid token', async () => {
    const next = jest.fn();
    (verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('jwt malformed');
    });
    await authMiddleware({ headers: { authorization: 'Bearer bad-token' } } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requireRole', () => {
  it('should allow user with matching role', async () => {
    const next = jest.fn();
    const req: any = { user: { id: 'u1', roles: ['BUSINESS'], primaryRole: 'BUSINESS' } };
    await requireRole(['BUSINESS', 'ADMIN'])(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 403 if user lacks required role', async () => {
    const next = jest.fn();
    await requireRole(['ADMIN'])(
      { user: { id: 'u1', roles: ['BUSINESS'], primaryRole: 'BUSINESS' } } as any,
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should call next with 401 if user not authenticated', async () => {
    const next = jest.fn();
    await requireRole(['BUSINESS'])({ user: undefined } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('requirePrimaryRole', () => {
  it('should allow user with matching primary role', async () => {
    const next = jest.fn();
    await requirePrimaryRole('BUSINESS')(
      { user: { primaryRole: 'BUSINESS' } } as any,
      mockRes,
      next
    );
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 403 for mismatched role', async () => {
    const next = jest.fn();
    await requirePrimaryRole('ADMIN')({ user: { primaryRole: 'BUSINESS' } } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe('requireEmailVerified', () => {
  it('should proceed if user is authenticated', async () => {
    const next = jest.fn();
    await requireEmailVerified({ user: { id: 'u1' } } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 401 if not authenticated', async () => {
    const next = jest.fn();
    await requireEmailVerified({ user: undefined } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('optionalAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should proceed without token', async () => {
    const next = jest.fn();
    await optionalAuth({ headers: {} } as any, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should decode user from valid token', async () => {
    const next = jest.fn();
    (verifyAccessToken as jest.Mock).mockReturnValue({
      id: 'u1',
      email: 'a@b.com',
      primaryRole: 'CLIENT',
      roles: [],
    });
    const req: any = { headers: { authorization: 'Bearer valid' } };
    await optionalAuth(req, mockRes, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('should silently ignore invalid token', async () => {
    const next = jest.fn();
    (verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('bad');
    });
    const req: any = { headers: { authorization: 'Bearer bad' } };
    await optionalAuth(req, mockRes, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

describe('loginRateLimit', () => {
  it('should allow requests under the limit', () => {
    const next = jest.fn();
    loginRateLimit(3, 60000)({ body: { email: 'test@test.com' } } as any, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should throw when exceeding max attempts', () => {
    const req: any = { body: { email: 'test@test.com' }, ip: '127.0.0.1' };
    const limiter = loginRateLimit(2, 60000);
    limiter(req, mockRes, jest.fn());
    limiter(req, mockRes, jest.fn());
    expect(() => limiter(req, mockRes, jest.fn())).toThrow();
  });
});
