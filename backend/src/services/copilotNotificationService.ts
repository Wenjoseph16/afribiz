import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { notificationRepository } from '../repositories/notificationRepository';
import * as copilotService from './businessCopilot';

import { NotificationType } from '@prisma/client';

const NOTIFICATION_TYPE = NotificationType.SYSTEM;

export async function generateAllCopilotNotifications(): Promise<{
  total: number;
  created: number;
  errors: number;
}> {
  logger.info('CopilotNotifications: generating alerts for all active businesses...');
  let created = 0;
  let errors = 0;
  let total = 0;

  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true, name: true, ownerId: true },
    });
    total = businesses.length;

    for (const business of businesses) {
      try {
        const count = await generateBusinessNotifications(business.id, business.ownerId, business.name);
        created += count;
      } catch (err) {
        errors++;
        logger.error('CopilotNotifications: failed for business ' + business.id, { error: err });
      }
    }

    logger.info('CopilotNotifications: done - ' + created + ' notifications created for ' + total + ' businesses (' + errors + ' errors)');
  } catch (err) {
    logger.error('CopilotNotifications: failed to fetch businesses', { error: err });
  }

  return { total, created, errors };
}

export async function generateBusinessNotifications(
  businessId: string,
  ownerId: string,
  businessName: string
): Promise<number> {
  let count = 0;

  // 1. Verifier la sante du business
  try {
    const health = await copilotService.getBusinessHealth(businessId);
    if (health && health.status === 'critical') {
      await notificationRepository.create({
        userId: ownerId,
        type: NOTIFICATION_TYPE,
        title: 'Santé business critique',
        description: 'Votre business "' + businessName + '" a un score de santé de ' + health.healthScore + '/100. Consultez vos conseils pour améliorer la situation.',
        link: '/dashboard/datahub',
        metadata: { businessId, healthScore: health.healthScore, source: 'copilot' },
      });
      count++;
    } else if (health && health.status === 'fair') {
      await notificationRepository.create({
        userId: ownerId,
        type: NOTIFICATION_TYPE,
        title: 'Santé business à surveiller',
        description: 'Le score de santé de "' + businessName + '" est de ' + health.healthScore + '/100. Des améliorations sont possibles.',
        link: '/dashboard/datahub',
        metadata: { businessId, healthScore: health.healthScore, source: 'copilot' },
      });
      count++;
    }
  } catch (err) {
    logger.error('CopilotNotifications: health check failed for ' + businessId, { error: err });
  }

  // 2. Verifier les tips haute priorite
  try {
    const tips = await copilotService.generateDailyTips(businessId);
    if (tips && Array.isArray(tips.tips)) {
      const highPriority = tips.tips.filter(function(t: any) { return t.priority === 'high'; });
      const mediumPriority = tips.tips.filter(function(t: any) { return t.priority === 'medium'; });

      for (const tip of highPriority) {
        if (count >= 5) break;
        const tipTitle = tip.type === 'score' ? 'AfriScore prioritaire' :
          tip.type === 'activity' ? 'Activité requise' :
          tip.type === 'reviews' ? 'Avis à traiter' :
          tip.type === 'profile' ? 'Profil à compléter' : tip.type === 'reliability' ? 'Fiabilité opérationnelle' : 'Action recommandée';

        await notificationRepository.create({
          userId: ownerId,
          type: NOTIFICATION_TYPE,
          title: tipTitle,
          description: tip.message,
          link: tip.action ? '/dashboard/datahub' : undefined,
          metadata: { businessId, tipType: tip.type, priority: tip.priority, source: 'copilot' },
        });
        count++;
      }

      if (count < 5 && mediumPriority.length > 0) {
        await notificationRepository.create({
          userId: ownerId,
          type: NOTIFICATION_TYPE,
          title: 'Améliorations suggérées',
          description: mediumPriority.length + ' point(s) à améliorer pour "' + businessName + '". Consultez votre tableau de bord Data Hub.',
          link: '/dashboard/datahub',
          metadata: { businessId, mediumCount: mediumPriority.length, source: 'copilot' },
        });
        count++;
      }
    }
  } catch (err) {
    logger.error('CopilotNotifications: tips generation failed for ' + businessId, { error: err });
  }

  return count;
}
