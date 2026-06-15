import { PrismaClient, NotificationType, NotificationChannel } from '@prisma/client';
import { prisma } from '../lib/db';

interface PreferenceKey {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
}

export class NotificationPreferenceRepository {
  async getPreferences(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId },
    });
  }

  async getEnabledChannels(userId: string, type: NotificationType): Promise<NotificationChannel[]> {
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId, type, enabled: true },
    });
    return prefs.map((p) => p.channel);
  }

  async setPreference(key: PreferenceKey, enabled: boolean): Promise<void> {
    await prisma.notificationPreference.upsert({
      where: {
        userId_type_channel: {
          userId: key.userId,
          type: key.type,
          channel: key.channel,
        },
      },
      create: {
        userId: key.userId,
        type: key.type,
        channel: key.channel,
        enabled,
      },
      update: { enabled },
    });
  }

  async setDefaults(userId: string): Promise<void> {
    const types = Object.values(NotificationType);
    const channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];

    const data = types.flatMap((type) =>
      channels.map((channel) => ({
        userId,
        type,
        channel,
        enabled: channel === NotificationChannel.IN_APP,
      }))
    );

    await prisma.notificationPreference.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async bulkUpdate(
    userId: string,
    updates: Array<{ type: NotificationType; channel: NotificationChannel; enabled: boolean }>
  ): Promise<void> {
    for (const update of updates) {
      await this.setPreference(
        { userId, type: update.type, channel: update.channel },
        update.enabled
      );
    }
  }
}

export const notificationPreferenceRepository = new NotificationPreferenceRepository();
