import {
  signup,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../../controllers/auth';

jest.mock('../../services/auth', () => ({
  AuthService: {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshAccessToken: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}));
jest.mock('../../config/env', () => ({ config: { NODE_ENV: 'test' } }));

import { AuthService } from '../../services/auth';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.cookie = jest.fn().mockReturnValue(r);
  r.clearCookie = jest.fn().mockReturnValue(r);
  return r;
}

const tokens = { accessToken: 'at1', refreshToken: 'rt1' };

describe('signup', () => {
  it('should create account and set cookies', async () => {
    (AuthService.signup as jest.Mock).mockResolvedValue(tokens);
    const res = mockRes();
    const next = jest.fn();
    signup({ body: { email: 'a@b.com', password: '123' } } as any, res, next);
    await flush();
    expect(AuthService.signup).toHaveBeenCalledWith({ email: 'a@b.com', password: '123' });
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should propagate errors', async () => {
    (AuthService.signup as jest.Mock).mockRejectedValue(new Error('Email exists'));
    const res = mockRes();
    const next = jest.fn();
    signup({ body: { email: 'a@b.com', password: '123' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Email exists' }));
  });
});

describe('login', () => {
  it('should login and set cookies', async () => {
    (AuthService.login as jest.Mock).mockResolvedValue(tokens);
    const res = mockRes();
    const next = jest.fn();
    login(
      {
        body: { identifier: 'a@b.com', password: '123' },
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('agent'),
        socket: { remoteAddress: '::1' },
      } as any,
      res,
      next
    );
    await flush();
    expect(AuthService.login).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('logout', () => {
  it('should logout and clear cookies', async () => {
    (AuthService.logout as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    logout({ user: { id: 'u1' }, cookies: { refreshToken: 'rt1' } } as any, res, next);
    await flush();
    expect(AuthService.logout).toHaveBeenCalledWith('u1', 'rt1');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('refreshToken', () => {
  it('should call refreshAccessToken', async () => {
    (AuthService.refreshAccessToken as jest.Mock).mockResolvedValue(tokens);
    const res = mockRes();
    const next = jest.fn();
    refreshToken({ cookies: { refreshToken: 'rt1' } } as any, res, next);
    await flush();
    expect(AuthService.refreshAccessToken).toHaveBeenCalledWith('rt1');
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });

  it('should handle missing token', async () => {
    const res = mockRes();
    const next = jest.fn();
    refreshToken({ cookies: {} } as any, res, next);
    await flush();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('verifyEmail', () => {
  it('should verify email', async () => {
    (AuthService.verifyEmail as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    verifyEmail({ body: { token: 'tok1' } } as any, res, next);
    await flush();
    expect(AuthService.verifyEmail).toHaveBeenCalledWith('tok1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('forgotPassword', () => {
  it('should call forgotPassword service', async () => {
    (AuthService.forgotPassword as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    forgotPassword({ body: { email: 'a@b.com' } } as any, res, next);
    await flush();
    expect(AuthService.forgotPassword).toHaveBeenCalledWith('a@b.com');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('resetPassword', () => {
  it('should reset password', async () => {
    (AuthService.resetPassword as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    resetPassword({ body: { token: 't1', password: 'new123' } } as any, res, next);
    await flush();
    expect(AuthService.resetPassword).toHaveBeenCalledWith('t1', 'new123');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
