import {
  authLimiter,
  resendLimiter,
  apiLimiter,
  sensitiveLimiter,
  adminLimiter,
  otpLimiter,
  strictLimiter,
  webhookLimiter,
  roleBasedLimiter,
  roleAdaptiveLimiter,
} from '../../middlewares/rateLimiter';

describe('Rate limiters', () => {
  it('authLimiter should be configured', () => {
    expect(authLimiter).toBeDefined();
  });

  it('resendLimiter should be configured', () => {
    expect(resendLimiter).toBeDefined();
  });

  it('apiLimiter should be configured', () => {
    expect(apiLimiter).toBeDefined();
  });

  it('sensitiveLimiter should be configured', () => {
    expect(sensitiveLimiter).toBeDefined();
  });

  it('adminLimiter should be configured', () => {
    expect(adminLimiter).toBeDefined();
  });

  it('otpLimiter should be configured', () => {
    expect(otpLimiter).toBeDefined();
  });

  it('strictLimiter should be configured', () => {
    expect(strictLimiter).toBeDefined();
  });

  it('webhookLimiter should be configured', () => {
    expect(webhookLimiter).toBeDefined();
  });

  it('roleBasedLimiter should be configured', () => {
    expect(roleBasedLimiter).toBeDefined();
  });

  describe('roleAdaptiveLimiter', () => {
    it('should create a rate limiter with allowed roles', () => {
      const limiter = roleAdaptiveLimiter('ADMIN', 'BUSINESS');
      expect(limiter).toBeDefined();
    });
  });
});
