import { PrismaClient, NotificationType, NotificationChannel } from '@prisma/client';
import { prisma } from '../lib/db';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  description?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationFilter {
  userId: string;
  read?: boolean;
  type?: NotificationType[];
  limit?: number;
  offset?: number;
}

export class NotificationRepository {
  async create(params: CreateNotificationParams): Promise<string> {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        link: params.link,
        metadata: params.metadata as any,
      },
    });
    return notification.id;
  }

  async findMany(filter: NotificationFilter) {
    const where: Record<string, unknown> = { userId: filter.userId };
    if (filter.read !== undefined) where.read = filter.read;
    if (filter.type?.length) where.type = { in: filter.type };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 20,
        skip: filter.offset || 0,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async delete(notificationId: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    return result.count > 0;
  }

  async createDelivery(params: {
    notificationId: string;
    channel: NotificationChannel;
  }): Promise<void> {
    await prisma.notificationDelivery.create({
      data: {
        notificationId: params.notificationId,
        channel: params.channel,
        status: 'pending',
      },
    });
  }

  async markDeliverySent(deliveryId: string): Promise<void> {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  async markDeliveryFailed(deliveryId: string, error: string): Promise<void> {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: 'failed', errorMessage: error },
    });
  }
}

export const notificationRepository = new NotificationRepository();
