import {
  auditLogMiddleware,
  logAuditEvent,
  MANDATORY_AUDIT_EVENTS,
} from '../../middlewares/auditLog';

jest.mock('../../lib/db', () => ({ prisma: { securityLog: { create: jest.fn() } } }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { prisma } = jest.requireMock('../../lib/db') as any;

describe('MANDATORY_AUDIT_EVENTS', () => {
  it('should contain key security events', () => {
    expect(MANDATORY_AUDIT_EVENTS).toContain('LOGIN');
    expect(MANDATORY_AUDIT_EVENTS).toContain('PASSWORD_CHANGE');
    expect(MANDATORY_AUDIT_EVENTS).toContain('ADMIN_ACTION');
  });
});

describe('auditLogMiddleware', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      path: '/api/auth/login',
      user: { id: 'u1' },
      ip: '127.0.0.1',
      headers: {},
    };
    mockRes = { json: jest.fn(), status: jest.fn().mockReturnThis(), statusCode: 200 };
    jest.clearAllMocks();
  });

  it('should wrap res.json and proceed', () => {
    const next = jest.fn();
    auditLogMiddleware(mockReq, mockRes, next);
    expect(next).toHaveBeenCalled();
    expect(typeof mockRes.json).toBe('function');
  });
});

describe('logAuditEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create security log entry', async () => {
    prisma.securityLog.create.mockResolvedValue({ id: 'log-1' });
    await logAuditEvent({ userId: 'u1', action: 'LOGIN', success: true });
    expect(prisma.securityLog.create).toHaveBeenCalled();
  });

  it('should not throw on failure', async () => {
    prisma.securityLog.create.mockRejectedValue(new Error('DB error'));
    await expect(
      logAuditEvent({ userId: 'u1', action: 'LOGIN', success: true })
    ).resolves.toBeUndefined();
  });
});
