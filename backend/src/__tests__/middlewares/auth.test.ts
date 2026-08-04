import {
  authMiddleware,
  requireRole,
  requirePrimaryRole,
  requireEmailVerified,
  optionalAuth,
} from '../../middlewares/auth';

jest.mock('../../lib/jwt', () => ({ verifyAccessToken: jest.fn() }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));

import { verifyAccessToken } from '../../lib/jwt';
import { prisma } from '../../lib/db';

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
  // Attends que les microtâches du catchAsyncErrors (.catch(next)) s'exécutent.
  const flush = () => new Promise((r) => setImmediate(r));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next with 401 if not authenticated', async () => {
    const next = jest.fn();
    await requireEmailVerified({ user: undefined } as any, mockRes, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should proceed if the user email is verified', async () => {
    const next = jest.fn();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: true });
    await requireEmailVerified({ user: { id: 'u1' } } as any, mockRes, next);
    await flush();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { emailVerified: true },
    });
    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with 403 + EMAIL_NOT_VERIFIED if the email is not verified', async () => {
    const next = jest.fn();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ emailVerified: false });
    await requireEmailVerified({ user: { id: 'u1' } } as any, mockRes, next);
    await flush();
    const err = next.mock.calls[0][0];
    expect(err).toMatchObject({ statusCode: 403, data: { code: 'EMAIL_NOT_VERIFIED' } });
  });

  it('should call next with 401 if the user does not exist', async () => {
    const next = jest.fn();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await requireEmailVerified({ user: { id: 'ghost' } } as any, mockRes, next);
    await flush();
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
