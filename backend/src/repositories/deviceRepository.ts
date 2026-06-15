import { Device } from '@prisma/client';
import { prisma } from '../lib/db';

export class DeviceRepository {
  static async findOrCreate(data: {
    userId: string;
    ipAddress: string;
    userAgent?: string;
  }): Promise<Device> {
    const ua = data.userAgent || '';
    const osType = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : ua.includes('Android') ? 'Android' : ua.includes('iOS') ? 'iOS' : 'Unknown';
    const browserName = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : ua.includes('Edge') ? 'Edge' : 'Unknown';
    const deviceType = ua.includes('Mobile') || ua.includes('Android') ? 'MOBILE' : ua.includes('Tablet') ? 'TABLET' : 'DESKTOP';
    const name = `${osType} - ${browserName}`;

    const existing = await prisma.device.findFirst({
      where: { userId: data.userId, userAgent: ua, revokedAt: null },
      orderBy: { lastUsedAt: 'desc' },
    });

    if (existing) {
      return prisma.device.update({
        where: { id: existing.id },
        data: { lastUsedAt: new Date(), ipAddress: data.ipAddress },
      });
    }

    return prisma.device.create({
      data: {
        userId: data.userId,
        name,
        deviceType,
        osType,
        browserName,
        ipAddress: data.ipAddress,
        userAgent: ua,
        lastUsedAt: new Date(),
      },
    });
  }

  static async findByUserId(userId: string): Promise<Device[]> {
    return prisma.device.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  static async revoke(id: string): Promise<Device> {
    return prisma.device.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
