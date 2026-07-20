import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

interface VelocityCheckResult {
  blocked: boolean;
  reason?: string;
  severity: string;
}

export class FraudDetectionService {
  static async checkLoginVelocity(userId: string, ipAddress: string): Promise<VelocityCheckResult> {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);

    const recentLogins = await prisma.securityLog.count({
      where: {
        userId,
        action: 'FAILED_LOGIN',
        createdAt: { gte: windowStart },
      },
    });

    if (recentLogins >= 3) {
      await this.logFraudEvent({
        userId,
        ruleName: 'Login velocity > 3 in 15min',
        eventType: 'LOGIN_VELOCITY',
        severity: 'MEDIUM',
        action: 'FLAG',
        ipAddress,
      });
      return { blocked: false, reason: 'Tentatives de connexion anormales', severity: 'MEDIUM' };
    }

    return { blocked: false, severity: 'LOW' };
  }

  static async checkTransactionVelocity(userId: string): Promise<VelocityCheckResult> {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);

    const recentPayments = await prisma.payment.count({
      where: {
        userId,
        createdAt: { gte: windowStart },
      },
    });

    if (recentPayments >= 10) {
      await this.logFraudEvent({
        userId,
        ruleName: 'Payment velocity > 10 in 15min',
        eventType: 'PAYMENT_VELOCITY',
        severity: 'HIGH',
        action: 'BLOCK',
      });
      return { blocked: true, reason: 'Trop de tentatives de paiement', severity: 'HIGH' };
    }

    return { blocked: false, severity: 'LOW' };
  }

  static async checkOrderVelocity(userId: string): Promise<VelocityCheckResult> {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);

    const recentOrders = await prisma.order.count({
      where: {
        buyerId: userId,
        createdAt: { gte: windowStart },
      },
    });

    if (recentOrders >= 3) {
      await this.logFraudEvent({
        userId,
        ruleName: 'Order velocity > 3 in 15min',
        eventType: 'ORDER_VELOCITY',
        severity: 'HIGH',
        action: 'FLAG',
      });
      return { blocked: false, reason: 'Trop de commandes en peu de temps', severity: 'HIGH' };
    }

    return { blocked: false, severity: 'LOW' };
  }

  static async checkDeviceTrust(
    userId: string,
    deviceId?: string
  ): Promise<{ isTrusted: boolean; isNewDevice: boolean }> {
    if (!deviceId) return { isTrusted: false, isNewDevice: true };

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return { isTrusted: false, isNewDevice: true };

    const isTrusted =
      device.isTrusted && (!device.trustExpiresAt || device.trustExpiresAt > new Date());

    if (!isTrusted && device.lastVerifiedAt) {
      const daysSinceVerification =
        (Date.now() - device.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceVerification > 30) {
        await prisma.device.update({
          where: { id: deviceId },
          data: { isTrusted: false },
        });
      }
    }

    return { isTrusted: !!isTrusted, isNewDevice: !device.lastVerifiedAt };
  }

  static async verifyDevice(userId: string, deviceId: string): Promise<void> {
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        isTrusted: true,
        lastVerifiedAt: new Date(),
        trustExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private static async logFraudEvent(data: {
    userId?: string;
    ruleName: string;
    eventType: string;
    severity: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await prisma.fraudEvent.create({
        data: {
          userId: data.userId,
          ruleName: data.ruleName,
          eventType: data.eventType,
          severity: data.severity as any,
          action: data.action as any,
          blocked: data.action === 'BLOCK',
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: (data.metadata || {}) as any,
        },
      });
    } catch (error) {
      logger.error('Failed to log fraud event', { error, eventType: data.eventType });
    }
  }
}
