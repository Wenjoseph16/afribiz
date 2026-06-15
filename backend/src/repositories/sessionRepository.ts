import { Session } from '@prisma/client';
import { prisma } from '../lib/db';

export class SessionRepository {
  /**
   * Create a new session
   */
  static async create(data: {
    userId: string;
    ipAddress: string;
    userAgent?: string;
    deviceId?: string;
    expiresAt: Date;
  }): Promise<Session> {
    return prisma.session.create({
      data,
    });
  }

  /**
   * Find session by ID
   */
  static async findById(id: string): Promise<Session | null> {
    return prisma.session.findUnique({
      where: { id },
      include: { device: true },
    });
  }

  /**
   * Find all sessions for a user
   */
  static async findByUserId(userId: string) {
    return prisma.session.findMany({
      where: { userId, isActive: true },
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update session
   */
  static async update(id: string, data: Partial<Session>): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data,
    });
  }

  /**
   * Revoke session
   */
  static async revoke(id: string): Promise<Session> {
    return prisma.session.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Revoke all sessions for a user
   */
  static async revokeAllByUserId(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
  }

  /**
   * Delete expired sessions
   */
  static async deleteExpired(): Promise<void> {
    await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /**
   * Delete all sessions for a user except one
   */
  static async deleteOtherSessions(userId: string, sessionId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, id: { not: sessionId } },
      data: { isActive: false, revokedAt: new Date() },
    });
  }
}
