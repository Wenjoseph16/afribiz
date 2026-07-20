import { prisma } from '../lib/db';

export class RevokedTokenRepository {
  static async create(data: {
    jti: string;
    userId: string;
    reason?: string;
    exp: Date;
  }): Promise<void> {
    await prisma.revokedToken.create({ data });
  }

  static async findByJti(jti: string): Promise<boolean> {
    const token = await prisma.revokedToken.findUnique({ where: { jti } });
    return !!token;
  }

  static async deleteExpired(): Promise<void> {
    await prisma.revokedToken.deleteMany({
      where: { exp: { lt: new Date() } },
    });
  }

  static async revokeAllByUserId(userId: string, reason?: string): Promise<void> {
    const tokens = await prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, expiresAt: true },
    });

    for (const token of tokens) {
      await prisma.revokedToken.create({
        data: {
          jti: token.id,
          userId,
          reason: reason || 'Session revoked',
          exp: token.expiresAt,
        },
      });
    }
  }
}
