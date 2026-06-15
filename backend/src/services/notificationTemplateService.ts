import { NotificationType } from '@prisma/client';
import { notificationTemplateRepository } from '../repositories/notificationTemplateRepository';
import { prisma } from '../lib/db';

export const notificationTemplateService = {
  async getTemplates(businessId: string) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!biz) throw new Error('Business non trouvé');
    return notificationTemplateRepository.findByBusiness(businessId);
  },

  async upsertTemplate(
    businessId: string,
    ownerId: string,
    type: NotificationType,
    data: { customTitle: string; customDescription?: string; isActive?: boolean }
  ) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!biz) throw new Error('Business non trouvé');
    if (biz.ownerId !== ownerId) throw new Error('Action non autorisée');

    return notificationTemplateRepository.upsert(businessId, type, {
      businessId,
      type,
      customTitle: data.customTitle,
      customDescription: data.customDescription,
      isActive: data.isActive,
    });
  },

  async deleteTemplate(businessId: string, ownerId: string, type: NotificationType) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!biz) throw new Error('Business non trouvé');
    if (biz.ownerId !== ownerId) throw new Error('Action non autorisée');

    return notificationTemplateRepository.deleteByBusinessAndType(businessId, type);
  },

  async toggleTemplate(businessId: string, ownerId: string, type: NotificationType, isActive: boolean) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });
    if (!biz) throw new Error('Business non trouvé');
    if (biz.ownerId !== ownerId) throw new Error('Action non autorisée');

    return notificationTemplateRepository.updateByBusinessAndType(businessId, type, { isActive });
  },

  async getAvailableTypes() {
    return Object.values(NotificationType).filter((t) =>
      !['SECURITY_ALERT', 'SYSTEM', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED'].includes(t)
    );
  },
};
