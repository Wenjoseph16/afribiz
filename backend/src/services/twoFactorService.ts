import { generateSecret, verify, generateURI } from 'otplib';
import { toDataURL } from 'qrcode';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export class TwoFactorService {
  static async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (user.twoFactorEnabled) throw new AppError('2FA is already enabled', 409);

    const secret = generateSecret();
    const otpauth = generateURI({ issuer: 'AfriBiz', label: user.email, secret });
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

    const isValid = await verify({ token, secret: user.twoFactorSecret });
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
    return !!(await verify({ token, secret: user.twoFactorSecret }));
  }
}
