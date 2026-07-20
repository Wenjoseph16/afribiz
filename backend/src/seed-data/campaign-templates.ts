import { prisma } from '../lib/db';

export const CAMPAIGN_TEMPLATES = [
  {
    name: 'Bienvenue Nouveau Client',
    description: "Sequence d'accueil en 3 etapes pour les nouveaux clients",
    trigger: 'NEW_CLIENT',
    triggerConfig: {},
    isTemplate: true,
    steps: [
      {
        stepOrder: 1,
        name: 'Notification bienvenue',
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {
          title: 'Bienvenue {{clientName}} !',
          description: 'Merci de nous rejoindre !',
          link: '/dashboard/products',
        },
        delayMinutes: 0,
      },
      {
        stepOrder: 2,
        name: 'Email bienvenue',
        actionType: 'SEND_EMAIL',
        actionConfig: {
          subject: 'Bienvenue chez nous !',
          content: 'Bonjour {{clientName}}, merci de votre inscription.',
        },
        delayMinutes: 60,
      },
      {
        stepOrder: 3,
        name: 'Coupon bienvenue -10%',
        actionType: 'APPLY_DISCOUNT',
        actionConfig: { percentage: 10, reason: 'Bienvenue ! -10% premiere commande' },
        delayMinutes: 1440,
      },
    ],
    status: 'ACTIVE',
  },
  {
    name: 'Relance Panier Abandonne',
    description: 'Sequence de relance en 2 etapes apres abandon de panier',
    trigger: 'ORDER_PLACED',
    triggerConfig: {},
    isTemplate: true,
    steps: [
      {
        stepOrder: 1,
        name: 'Rappel panier',
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {
          title: 'Votre panier vous attend !',
          description: 'Vous avez des articles dans votre panier.',
          link: '/dashboard/cart',
        },
        delayMinutes: 60,
      },
      {
        stepOrder: 2,
        name: 'Coupon reconquete',
        actionType: 'APPLY_DISCOUNT',
        actionConfig: { percentage: 5, reason: 'Panier abandonne -5%' },
        delayMinutes: 1440,
      },
    ],
    status: 'ACTIVE',
  },
  {
    name: 'Reactivation Client Inactif',
    description: 'Sequence de reconquete clients inactifs depuis 30 jours',
    trigger: 'CLIENT_INACTIVE',
    triggerConfig: {},
    isTemplate: true,
    steps: [
      {
        stepOrder: 1,
        name: 'Notification reactivation',
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {
          title: 'Vous nous avez manque !',
          description: 'Une offre speciale pour vous.',
        },
        delayMinutes: 0,
      },
      {
        stepOrder: 2,
        name: 'Coupon reactivation -15%',
        actionType: 'APPLY_DISCOUNT',
        actionConfig: { percentage: 15, reason: 'Offre reactivation -15%' },
        delayMinutes: 1440,
      },
      {
        stepOrder: 3,
        name: 'Email relance finale',
        actionType: 'SEND_EMAIL',
        actionConfig: { subject: 'On veut vous revoir !', content: 'Profitez de -15%' },
        delayMinutes: 4320,
      },
    ],
    status: 'ACTIVE',
  },
  {
    name: 'Felicitations Anniversaire',
    description: 'Souhaite un bon anniversaire avec offre speciale',
    trigger: 'NEW_CLIENT',
    triggerConfig: {},
    isTemplate: true,
    steps: [
      {
        stepOrder: 1,
        name: 'Souhait anniversaire',
        actionType: 'SEND_NOTIFICATION',
        actionConfig: {
          title: 'Joyeux anniversaire !',
          description: 'Toute notre equipe vous souhaite un joyeux anniversaire !',
        },
        delayMinutes: 0,
      },
      {
        stepOrder: 2,
        name: 'Offre anniversaire',
        actionType: 'APPLY_DISCOUNT',
        actionConfig: { percentage: 20, reason: 'Cadeau anniversaire -20%' },
        delayMinutes: 30,
      },
    ],
    status: 'ACTIVE',
  },
];

export async function seedCampaignTemplates(): Promise<number> {
  let count = 0;
  for (const tmpl of CAMPAIGN_TEMPLATES) {
    const existing = await prisma.campaign.findFirst({
      where: { name: tmpl.name, isTemplate: true },
    });
    if (!existing) {
      const campaign = await prisma.campaign.create({
        data: {
          businessId: 'seed-template',
          name: tmpl.name,
          description: tmpl.description,
          trigger: tmpl.trigger as any,
          triggerConfig: tmpl.triggerConfig,
          isTemplate: tmpl.isTemplate,
          status: tmpl.status as any,
        } as any,
      });
      for (const step of tmpl.steps) {
        await prisma.campaignStep.create({
          data: {
            campaignId: campaign.id,
            stepOrder: step.stepOrder,
            name: step.name,
            actionType: step.actionType as any,
            actionConfig: step.actionConfig,
            delayMinutes: (step as any).delayMinutes || null,
            delayHours: (step as any).delayHours || null,
            delayDays: (step as any).delayDays || null,
          } as any,
        });
      }
      count++;
    }
  }
  return count;
}
