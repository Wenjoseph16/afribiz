import { SecurityLog, SecurityLogAction } from '@prisma/client';
import { prisma } from '../lib/db';

export class SecurityLogRepository {
  /**
   * Create a new security log entry
   */
  static async create(data: {
    userId: string;
    action: SecurityLogAction;
    ipAddress?: string;
    userAgent?: string;
    deviceId?: string;
    success?: boolean;
    reason?: string;
    metadata?: any;
  }): Promise<SecurityLog> {
    return prisma.securityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        success: data.success,
        reason: data.reason,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      },
    });
  }

  /**
   * Find logs by user ID
   */
  static async findByUserId(userId: string, skip: number = 0, take: number = 10): Promise<SecurityLog[]> {
    return prisma.securityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  /**
   * Find logs by action
   */
  static async findByAction(action: SecurityLogAction, skip: number = 0, take: number = 10): Promise<SecurityLog[]> {
    return prisma.securityLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }
}
