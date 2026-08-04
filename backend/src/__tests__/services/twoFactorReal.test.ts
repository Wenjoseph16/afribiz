/**
 * Tests RÉELS du TwoFactorService (implémentation, pas le mock).
 * Couvre les correctifs de sécurité :
 *  1. bypass 2FA UNIQUEMENT via le flag explicite DEV_BYPASS_2FA_CODE (+ log fort)
 *  2. refus de l'ancien code universel "111111" quand aucun bypass n'est configuré
 *  3. génération + stockage des codes de secours à l'activation (TOTP réel end-to-end)
 */
import { createHmac } from 'crypto';
import { TwoFactorService } from '../../services/twoFactorService';
import { mockPrisma } from '../setup';
import { config } from '../../config/env';

// Le setup global mocke le service par alias — ici on teste le VRAI module.
jest.unmock('../../services/twoFactorService');
// qrcode est requis par le module réel (generateSecret) — évite un rendu QR réel.
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,QR'),
}));

// ── Mini-TOTP RFC 6238 (miroir de l'implémentation du service) pour générer un code valide ──
function base32Decode(str: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = str.replace(/[= \t\r\n]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totp(secret: string, timestamp = Date.now()): string {
  const period = 30;
  const time = Math.floor(timestamp / 1000 / period);
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeUInt32BE(time, 4);
  timeBuf.writeUInt32BE(Math.floor(time / 0x100000000), 0);
  const hmac = createHmac('sha1', base32Decode(secret)).update(timeBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 10 ** 6).toString().padStart(6, '0');
}

describe('TwoFactorService (réel)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateBackupCodes returns 10 unique 8-char hex codes', () => {
    const codes = TwoFactorService.generateBackupCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    codes.forEach((c) => expect(c).toMatch(/^[0-9A-F]{8}$/));
  });

  test('verifyToken accepts ONLY the explicit DEV_BYPASS_2FA_CODE (and it is logged)', async () => {
    const original = config.DEV_BYPASS_2FA_CODE;
    (config as any).DEV_BYPASS_2FA_CODE = 'BYPASS-CODE';
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      twoFactorEnabled: true,
      twoFactorSecret: null,
      twoFactorBackupCodes: '[]',
    });

    const r = await TwoFactorService.verifyToken('u1', 'BYPASS-CODE');
    expect(r).toBe(true);

    // Le bypass doit être LOGUÉ (audit) — jamais silencieux.
    const { logger } = require('../../lib/logger');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('BYPASS 2FA'),
      expect.objectContaining({ userId: 'u1' })
    );

    (config as any).DEV_BYPASS_2FA_CODE = original;
  });

  test('verifyToken REJECTS the old universal 111111 when no bypass is configured', async () => {
    const original = config.DEV_BYPASS_2FA_CODE;
    (config as any).DEV_BYPASS_2FA_CODE = '';
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      twoFactorEnabled: true,
      twoFactorSecret: null,
      twoFactorBackupCodes: '[]',
    });

    const r = await TwoFactorService.verifyToken('u1', '111111');
    expect(r).toBe(false);
    expect(require('../../lib/logger').logger.warn).not.toHaveBeenCalledWith(
      expect.stringContaining('BYPASS 2FA'),
      expect.anything()
    );

    (config as any).DEV_BYPASS_2FA_CODE = original;
  });

  test('verifyAndEnable stores + returns backup codes on a REAL TOTP code', async () => {
    // 1. Génère un vrai secret via generateSecret (prisma mocké).
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'test@afribiz.com',
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValueOnce({ id: 'u1' });
    const { secret } = await TwoFactorService.generateSecret('u1');
    expect(secret).toBeDefined();

    // 2. Code TOTP valide à l'instant présent.
    const code = totp(secret);

    // 3. verifyAndEnable : user avec le secret, update mocké.
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'test@afribiz.com',
      twoFactorEnabled: false,
      twoFactorSecret: secret,
      twoFactorBackupCodes: '[]',
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValueOnce({ id: 'u1' });

    const codes = await TwoFactorService.verifyAndEnable('u1', code);
    expect(codes).toHaveLength(10);

    // Dernier update = celui de verifyAndEnable (le 1er était generateSecret).
    const updateCalls = (mockPrisma.user.update as jest.Mock).mock.calls;
    const lastUpdate = updateCalls[updateCalls.length - 1]?.[0];
    expect(lastUpdate?.data?.twoFactorEnabled).toBe(true);
    const storedCodes: string[] = JSON.parse(lastUpdate?.data?.twoFactorBackupCodes ?? '[]');
    expect(storedCodes).toHaveLength(10);
    storedCodes.forEach((c) => expect(c).toMatch(/^[0-9A-F]{8}$/));
  });

  test('verifyAndEnable REJECTS a wrong TOTP code (no codes generated)', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
      email: 'test@afribiz.com',
      twoFactorEnabled: false,
      twoFactorSecret: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
      twoFactorBackupCodes: '[]',
    });

    await expect(TwoFactorService.verifyAndEnable('u1', '000000')).rejects.toThrow(
      'Invalid verification code'
    );
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
});
