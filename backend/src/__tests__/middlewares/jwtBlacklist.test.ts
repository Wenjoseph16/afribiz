import { jwtBlacklistMiddleware } from '../../middlewares/jwtBlacklist';

jest.mock('jsonwebtoken', () => ({ decode: jest.fn() }));
jest.mock('../../repositories/revokedTokenRepository', () => ({
  RevokedTokenRepository: { findByJti: jest.fn() },
}));

const jwt = jest.requireMock('jsonwebtoken') as any;
const { RevokedTokenRepository } = jest.requireMock(
  '../../repositories/revokedTokenRepository'
) as any;

describe('jwtBlacklistMiddleware', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = { headers: { authorization: 'Bearer test-token' } };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  it('should proceed if no auth header', async () => {
    const next = jest.fn();
    mockReq.headers = {};
    await jwtBlacklistMiddleware(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should proceed if token has no jti', async () => {
    const next = jest.fn();
    jwt.decode.mockReturnValue({ sub: 'u1' });
    await jwtBlacklistMiddleware(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should proceed if token not revoked', async () => {
    const next = jest.fn();
    jwt.decode.mockReturnValue({ jti: 'jti-1' });
    RevokedTokenRepository.findByJti.mockResolvedValue(null);
    await jwtBlacklistMiddleware(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject revoked token', async () => {
    const next = jest.fn();
    jwt.decode.mockReturnValue({ jti: 'jti-1' });
    RevokedTokenRepository.findByJti.mockResolvedValue({ id: 'revoked-1' });
    await jwtBlacklistMiddleware(mockReq, mockRes, next);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'Token révoqué' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle decode failure silently', async () => {
    const next = jest.fn();
    jwt.decode.mockImplementation(() => {
      throw new Error('bad');
    });
    await jwtBlacklistMiddleware(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
  });
});
