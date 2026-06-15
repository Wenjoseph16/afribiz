import { prisma } from '../lib/db';
import { NotificationType } from '@prisma/client';

interface CreateTemplateParams {
  businessId: string;
  type: NotificationType;
  customTitle: string;
  customDescription?: string;
  isActive?: boolean;
}

interface UpdateTemplateParams {
  customTitle?: string;
  customDescription?: string;
  isActive?: boolean;
}

export const notificationTemplateRepository = {
  async findByBusiness(businessId: string) {
    return prisma.businessNotificationTemplate.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findActiveByBusiness(businessId: string) {
    return prisma.businessNotificationTemplate.findMany({
      where: { businessId, isActive: true },
    });
  },

  async findByBusinessAndType(businessId: string, type: NotificationType) {
    return prisma.businessNotificationTemplate.findUnique({
      where: { businessId_type: { businessId, type } },
    });
  },

  async upsert(businessId: string, type: NotificationType, params: CreateTemplateParams) {
    return prisma.businessNotificationTemplate.upsert({
      where: { businessId_type: { businessId, type } },
      update: {
        customTitle: params.customTitle,
        customDescription: params.customDescription,
        isActive: params.isActive ?? true,
      },
      create: {
        businessId,
        type,
        customTitle: params.customTitle,
        customDescription: params.customDescription,
        isActive: params.isActive ?? true,
      },
    });
  },

  async update(id: string, params: UpdateTemplateParams) {
    return prisma.businessNotificationTemplate.update({
      where: { id },
      data: params,
    });
  },

  async delete(id: string) {
    return prisma.businessNotificationTemplate.delete({ where: { id } });
  },

  async deleteByBusinessAndType(businessId: string, type: NotificationType) {
    return prisma.businessNotificationTemplate.delete({
      where: { businessId_type: { businessId, type } },
    });
  },

  async updateByBusinessAndType(businessId: string, type: NotificationType, params: UpdateTemplateParams) {
    return prisma.businessNotificationTemplate.update({
      where: { businessId_type: { businessId, type } },
      data: params,
    });
  },
};
