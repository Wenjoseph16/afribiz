import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

interface OnboardingStep {
  day: number;
  title: string;
  message: string;
  action?: string;
  actionLink?: string;
}

const ONBOARDING_SEQUENCE: OnboardingStep[] = [
  {
    day: 0,
    title: 'Bienvenue sur AfriBiz !',
    message:
      'Félicitations pour votre inscription ! Ajoutez votre logo et une photo de couverture pour personnaliser votre profil.',
    action: 'Ajouter mon logo',
    actionLink: '/dashboard/settings',
  },
  {
    day: 1,
    title: 'Complétez votre profil',
    message:
      "Ajoutez une description, vos horaires d'ouverture, votre adresse et votre numéro de téléphone. Les profils complets reçoivent 3x plus de visites.",
    action: 'Compléter mon profil',
    actionLink: '/dashboard/settings',
  },
  {
    day: 3,
    title: 'Ajoutez vos premiers produits',
    message:
      'Publiez au moins 3 produits ou services pour commencer à vendre. Vos clients vous cherchent déjà !',
    action: 'Ajouter un produit',
    actionLink: '/dashboard/products',
  },
  {
    day: 7,
    title: 'Créez votre première promotion',
    message:
      'Lancez une offre spéciale pour attirer vos premiers clients. Les promotions augmentent les ventes de 40% en moyenne.',
    action: 'Créer une promotion',
    actionLink: '/dashboard/promotions',
  },
  {
    day: 14,
    title: 'Invitez vos clients',
    message:
      'Partagez votre lien AfriBiz sur WhatsApp et vos réseaux sociaux. Plus vous avez de clients, plus votre score augmente.',
    action: 'Partager mon lien',
    actionLink: '/dashboard/settings',
  },
  {
    day: 30,
    title: 'Votre premier bilan',
    message:
      'Ça fait 30 jours ! Consultez vos statistiques et voyez comment améliorer votre activité. Bravo pour ce début prometteur !',
    action: 'Voir mes stats',
    actionLink: '/dashboard',
  },
];

export type OnboardingTrigger = 'signup' | 'admin_manual';

export async function scheduleOnboardingSequence(
  businessId: string,
  trigger: OnboardingTrigger = 'signup'
): Promise<void> {
  try {
    await prisma.copilotOnboardingLog.deleteMany({ where: { businessId } });

    for (const step of ONBOARDING_SEQUENCE) {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + step.day);

      await prisma.copilotOnboardingLog.create({
        data: {
          businessId,
          day: step.day,
          title: step.title,
          message: step.message,
          action: step.action,
          actionLink: step.actionLink,
          scheduledFor,
          status: 'PENDING',
        },
      });
    }

    logger.info(`Onboarding sequence scheduled for business ${businessId} (trigger: ${trigger})`);
  } catch (err) {
    logger.error(`Failed to schedule onboarding for business ${businessId}:`, err);
  }
}

export async function sendPendingOnboardingSteps(): Promise<number> {
  const now = new Date();
  const pending = await prisma.copilotOnboardingLog.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    include: { business: { select: { ownerId: true, name: true } } },
  });

  let sent = 0;
  for (const step of pending) {
    try {
      await prisma.notification.create({
        data: {
          userId: step.business.ownerId,
          type: 'SYSTEM',
          title: step.title,
          description: step.message,
          link: step.actionLink || undefined,
          metadata: {
            businessId: step.businessId,
            onboardingDay: step.day,
            source: 'copilot-onboarding',
          },
        },
      });

      await prisma.copilotOnboardingLog.update({
        where: { id: step.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      sent++;
    } catch (err) {
      logger.error(`Failed to send onboarding step ${step.id}:`, err);
    }
  }

  return sent;
}
