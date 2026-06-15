import { OtpCode, OtpType } from '@prisma/client';
import { prisma } from '../lib/db';

export class OtpCodeRepository {
  /**
   * Create OTP code
   */
  static async create(data: {
    userId: string;
    code: string;
    type: OtpType;
    destination: string;
    expiresAt: Date;
    maxAttempts: number;
  }): Promise<OtpCode> {
    // Invalidate any existing active OTP for this user and type
    await prisma.otpCode.updateMany({
      where: { userId: data.userId, type: data.type, verifiedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() }, // Mark as expired
    });

    return prisma.otpCode.create({
      data,
    });
  }

  /**
   * Find by code and type
   */
  static async findByCodeAndType(code: string, type: OtpType): Promise<OtpCode | null> {
    return prisma.otpCode.findFirst({
      where: { code, type, verifiedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find by user ID and type
   */
  static async findByUserIdAndType(userId: string, type: OtpType): Promise<OtpCode | null> {
    return prisma.otpCode.findFirst({
      where: { userId, type, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Increment attempts
   */
  static async incrementAttempts(id: string): Promise<OtpCode> {
    return prisma.otpCode.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
      },
    });
  }

  /**
   * Mark as verified
   */
  static async markAsVerified(id: string): Promise<OtpCode> {
    return prisma.otpCode.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  /**
   * Check if attempts exceeded maxAttempts
   */
  static async hasExceededMaxAttempts(id: string): Promise<boolean> {
    const otp = await prisma.otpCode.findUnique({ where: { id } });
    if (!otp) return false;
    return otp.attempts >= otp.maxAttempts;
  }

  /**
   * Delete OTP by id
   */
  static async delete(id: string): Promise<void> {
    await prisma.otpCode.delete({ where: { id } });
  }

  /**
   * Delete expired records
   */
  static async deleteExpired(): Promise<void> {
    await prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
