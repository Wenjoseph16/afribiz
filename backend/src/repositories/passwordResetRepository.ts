import { PasswordReset } from '@prisma/client';
import { prisma } from '../lib/db';

export class PasswordResetRepository {
  /**
   * Create password reset record
   */
  static async create(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<PasswordReset> {
    return prisma.passwordReset.create({
      data,
    });
  }

  /**
   * Find by token
   */
  static async findByToken(token: string): Promise<PasswordReset | null> {
    return prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Find valid (non-expired, non-used) token
   */
  static async findValidByToken(token: string): Promise<PasswordReset | null> {
    return prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Mark as used
   */
  static async markAsUsed(id: string): Promise<PasswordReset> {
    return prisma.passwordReset.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  /**
   * Delete expired records
   */
  static async deleteExpired(): Promise<void> {
    await prisma.passwordReset.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /**
   * Delete by user ID
   */
  static async deleteByUserId(userId: string): Promise<void> {
    await prisma.passwordReset.deleteMany({
      where: { userId },
    });
  }
}
