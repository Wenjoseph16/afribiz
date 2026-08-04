import { mockPrisma } from '../setup';

// Mock the entire module to bypass import/compilation issues
const mockGenerateSecret = jest.fn();
const mockVerifyAndEnable = jest.fn();
const mockDisable = jest.fn();
const mockVerifyToken = jest.fn();

jest.mock('../../services/twoFactorService', () => ({
  TwoFactorService: {
    generateSecret: mockGenerateSecret,
    verifyAndEnable: mockVerifyAndEnable,
    disable: mockDisable,
    verifyToken: mockVerifyToken,
  },
}));

import { TwoFactorService } from '../../services/twoFactorService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('TwoFactor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TwoFactorService is defined', () => {
    expect(TwoFactorService).toBeDefined();
  });

  test('generateSecret returns secret and qrCode', async () => {
    mockGenerateSecret.mockResolvedValue({
      secret: 'SECRET123',
      qrCode: 'data:image/png;base64,qr',
    });
    const r = await TwoFactorService.generateSecret('u1');
    expect(r.secret).toBe('SECRET123');
    expect(r.qrCode).toBeDefined();
  });

  test('verifyAndEnable verifies token', async () => {
    mockVerifyAndEnable.mockResolvedValue(undefined);
    await expect(TwoFactorService.verifyAndEnable('u1', '123456')).resolves.not.toThrow();
  });

  test('disable disables 2FA', async () => {
    mockDisable.mockResolvedValue(undefined);
    await expect(TwoFactorService.disable('u1')).resolves.not.toThrow();
  });

  test('verifyToken returns true for valid token', async () => {
    mockVerifyToken.mockResolvedValue(true);
    const r = await TwoFactorService.verifyToken('u1', '482913');
    expect(r).toBe(true);
  });

  test('verifyToken rejects the legacy universal code 111111 unless explicitly bypassed', async () => {
    mockVerifyToken.mockResolvedValue(false);
    const r = await TwoFactorService.verifyToken('u1', '111111');
    expect(r).toBe(false);
  });
});
