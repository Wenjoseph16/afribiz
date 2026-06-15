import { EmailVerification } from '@prisma/client';
import { prisma } from '../lib/db';

export class EmailVerificationRepository {
  /**
   * Create email verification record
   */
  static async create(data: {
    userId: string;
    token: string;
    email: string;
    expiresAt: Date;
  }): Promise<EmailVerification> {
    return prisma.emailVerification.create({
      data,
    });
  }

  /**
   * Find by token (only unverified, non-expired)
   */
  static async findByToken(token: string): Promise<EmailVerification | null> {
    return prisma.emailVerification.findFirst({
      where: { token, verifiedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  /**
   * Find by user ID
   */
  static async findByUserId(userId: string): Promise<EmailVerification | null> {
    return prisma.emailVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark as verified
   */
  static async markAsVerified(id: string): Promise<EmailVerification> {
    return prisma.emailVerification.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  /**
   * Delete expired records
   */
  static async deleteExpired(): Promise<void> {
    await prisma.emailVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /**
   * Delete by user ID
   */
  static async deleteByUserId(userId: string): Promise<void> {
    await prisma.emailVerification.deleteMany({
      where: { userId },
    });
  }
}
