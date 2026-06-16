import { randomBytes, createHmac } from 'crypto';
import { toDataURL } from 'qrcode';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

function base32Encode(buf: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  const pad = 8 - (output.length % 8);
  if (pad < 8) output += '='.repeat(pad);
  return output;
}

function base32Decode(str: string): Buffer {
  const cleaned = str.replace(/[= \t\r\n]/g, '').toUpperCase();
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
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

function generateTOTP(secret: string, timestamp = Date.now(), digits = 6, period = 30): string {
  const time = Math.floor(timestamp / 1000 / period);
  const timeBuf = Buffer.alloc(8);
  timeBuf.writeUInt32BE(time, 4);
  timeBuf.writeUInt32BE(Math.floor(time / 0x100000000), 0);

  const key = base32Decode(secret);
  const hmac = createHmac('sha1', key).update(timeBuf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = code % (10 ** digits);
  return otp.toString().padStart(digits, '0');
}

function generateSecret(length = 20): string {
  return base32Encode(randomBytes(length));
}

function verifyTOTP(token: string, secret: string, window = 1, digits = 6, period = 30): boolean {
  const now = Date.now();
  for (let i = -window; i <= window; i++) {
    const expected = generateTOTP(secret, now + i * period * 1000, digits, period);
    if (expected === token) return true;
  }
  return false;
}

export class TwoFactorService {
  static async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.twoFactorEnabled) throw new AppError('2FA is already enabled', 409);

    const secret = generateSecret();
    const label = encodeURIComponent(user.email);
    const issuer = encodeURIComponent('AfriBiz');
    const otpauth = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const qrCode = await toDataURL(otpauth);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, qrCode };
  }

  static async verifyAndEnable(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.twoFactorSecret) throw new AppError('2FA not initialized. Generate a secret first.', 400);
    if (user.twoFactorEnabled) throw new AppError('2FA is already enabled', 409);

    const isValid = verifyTOTP(token, user.twoFactorSecret);
    if (!isValid) throw new AppError('Invalid verification code', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  static async disable(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (!user.twoFactorEnabled) throw new AppError('2FA is not enabled', 400);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  static async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) return false;
    return verifyTOTP(token, user.twoFactorSecret);
  }
}
