import { csrfProtection, generateCsrfToken, setCsrfCookie } from '../../middlewares/csrf';

jest.mock('../../config/env', () => ({ config: { NODE_ENV: 'production' } }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('generateCsrfToken', () => {
  it('should generate a token', () => {
    expect(generateCsrfToken()).toBeDefined();
    expect(typeof generateCsrfToken()).toBe('string');
  });
});

describe('setCsrfCookie', () => {
  it('should set CSRF cookie', () => {
    const res: any = { cookie: jest.fn(), headersSent: false };
    setCsrfCookie(res);
    expect(res.cookie).toHaveBeenCalledWith(
      'csrf-token',
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: 'strict',
      })
    );
  });

  it('should not set cookie if headers already sent', () => {
    const res: any = { cookie: jest.fn(), headersSent: true };
    setCsrfCookie(res);
    expect(res.cookie).not.toHaveBeenCalled();
  });
});

describe('csrfProtection middleware', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = { method: 'GET', path: '/api/test', headers: {}, cookies: {} };
    mockRes = { cookie: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  it('should allow safe methods (GET, HEAD, OPTIONS)', () => {
    const next = jest.fn();
    csrfProtection(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should set cookie on first GET request', () => {
    const next = jest.fn();
    csrfProtection(mockReq, mockRes, next);
    expect(mockRes.cookie).toHaveBeenCalledWith(
      'csrf-token',
      expect.any(String),
      expect.any(Object)
    );
  });

  it('should reject POST without CSRF token', () => {
    const next = jest.fn();
    mockReq.method = 'POST';
    csrfProtection(mockReq, mockRes, next);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
