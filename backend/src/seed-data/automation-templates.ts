import { prisma } from '../lib/db';

export const AUTOMATION_TEMPLATES = [
  {
    name: 'Bienvenue - Nouveau Client',
    description:
      'Sequence de bienvenue pour un nouveau client : notification + coupon de bienvenue',
    trigger: 'NEW_CLIENT',
    triggerConfig: {},
    conditions: [],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Bienvenue {{clientName}} !',
      description:
        'Merci de votre confiance ! Profitez de -10% sur votre premiere commande avec le code BIENVENUE10',
      link: '/dashboard/promotions',
      notificationType: 'WELCOME',
    },
    cooldownMinutes: 1440,
    status: 'ACTIVE',
  },
  {
    name: 'Panier Abandonne - Relance 1h',
    description: 'Relance client 1h apres commande en statut PENDING',
    trigger: 'ORDER_PLACED',
    triggerConfig: {},
    conditions: [{ field: 'status', operator: 'eq', value: 'PENDING' }],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Votre panier vous attend !',
      description: 'Vous avez des articles dans votre panier. Finalisez votre commande maintenant.',
      link: '/dashboard/cart',
    },
    cooldownMinutes: 30,
    status: 'ACTIVE',
  },
  {
    name: 'Reactivation - Client Inactif 30j',
    description: 'Relance client inactif depuis 30 jours avec coupon de reduction',
    trigger: 'CLIENT_INACTIVE',
    triggerConfig: {},
    conditions: [{ field: 'daysInactive', operator: 'gte', value: 30 }],
    actionType: 'APPLY_DISCOUNT',
    actionConfig: {
      percentage: 15,
      reason: 'Vous nous avez manque ! Voici -15% pour votre prochaine commande',
    },
    cooldownMinutes: 43200,
    status: 'ACTIVE',
  },
  {
    name: 'Avis Publie - Alerte Business',
    description: 'Alerte le business quand un nouvel avis est publie',
    trigger: 'REVIEW_PUBLISHED',
    triggerConfig: {},
    conditions: [],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Nouvel avis client',
      description: 'Un client a laisse un avis sur votre page. Consultez-le et repondez-y.',
      link: '/dashboard/reviews',
    },
    cooldownMinutes: 0,
    status: 'ACTIVE',
  },
  {
    name: 'Avis Negatif - Action Urgente',
    description: 'Cree une tache urgente quand un avis est <= 3 etoiles',
    trigger: 'REVIEW_PUBLISHED',
    triggerConfig: {},
    conditions: [{ field: 'rating', operator: 'lte', value: 3 }],
    actionType: 'CREATE_TASK',
    actionConfig: {
      title: 'Repondre a un avis negatif',
      description: 'Un client a laisse un avis <= 3 etoiles. Repondez sous 24h.',
      priority: 'HIGH',
    },
    cooldownMinutes: 0,
    status: 'ACTIVE',
  },
  {
    name: 'Stock Faible - Alerte Reappro',
    description: 'Alerte le business quand un produit atteint le seuil critique',
    trigger: 'STOCK_LOW',
    triggerConfig: {},
    conditions: [{ field: 'remainingStock', operator: 'lte', value: 5 }],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Stock faible : {{productName}}',
      description:
        'Il ne reste que {{remainingStock}} unites de {{productName}}. Pensez a reapprovisionner.',
      link: '/dashboard/products',
    },
    cooldownMinutes: 1440,
    status: 'ACTIVE',
  },
  {
    name: 'Paiement Recu - Confirmation Client',
    description: 'Confirme au client que son paiement a ete recu',
    trigger: 'PAYMENT_RECEIVED',
    triggerConfig: {},
    conditions: [],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Paiement recu !',
      description: 'Votre paiement de {{amount}} a ete confirme. Merci pour votre commande !',
      link: '/dashboard/orders',
    },
    cooldownMinutes: 0,
    status: 'ACTIVE',
  },
  {
    name: 'Paiement Echoue - Relance Client',
    description: 'Relance le client en cas de paiement echoue',
    trigger: 'PAYMENT_FAILED',
    triggerConfig: {},
    conditions: [],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Paiement echoue',
      description: 'Votre paiement n a pas pu aboutir. Veuillez reessayer.',
      link: '/dashboard/cart',
    },
    cooldownMinutes: 60,
    status: 'ACTIVE',
  },
  {
    name: 'Abonnement Expiration - Rappel J-7',
    description: 'Rappelle au business que son abonnement expire',
    trigger: 'SUBSCRIPTION_EXPIRING',
    triggerConfig: {},
    conditions: [{ field: 'daysUntilExpiry', operator: 'lte', value: 7 }],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Votre abonnement expire bientot',
      description:
        'Votre abonnement {{planName}} expire dans {{daysUntilExpiry}} jours. Renouvelez !',
      link: '/dashboard/subscriptions',
    },
    cooldownMinutes: 1440,
    status: 'ACTIVE',
  },
  {
    name: 'Dette Impayee - Creation Tache',
    description: 'Cree une tache de relance quand une dette est en retard',
    trigger: 'DEBT_OVERDUE',
    triggerConfig: {},
    conditions: [],
    actionType: 'CREATE_TASK',
    actionConfig: {
      title: 'Relance client - Dette impayee',
      description: 'Un client a une dette de {{amount}} arrivee a echeance. Contactez-le.',
      priority: 'HIGH',
    },
    cooldownMinutes: 1440,
    status: 'ACTIVE',
  },
  {
    name: 'Badge Gagne - Felicitations',
    description: 'Felicite le business quand il gagne un badge',
    trigger: 'BADGE_EARNED',
    triggerConfig: {},
    conditions: [],
    actionType: 'SEND_NOTIFICATION',
    actionConfig: {
      title: 'Badge gagne : {{badgeType}} !',
      description: 'Felicitations ! Vous avez gagne le badge {{badgeType}}.',
      link: '/dashboard/afriscore',
    },
    cooldownMinutes: 0,
    status: 'ACTIVE',
  },
];

export async function seedAutomationTemplates(businessId?: string): Promise<number> {
  let count = 0;
  for (const tmpl of AUTOMATION_TEMPLATES) {
    const existing = await prisma.automationRule.findFirst({
      where: { name: tmpl.name, trigger: tmpl.trigger as any },
    });
    if (!existing) {
      const data: any = {
        name: tmpl.name,
        description: tmpl.description,
        trigger: tmpl.trigger as any,
        triggerConfig: tmpl.triggerConfig,
        conditions: tmpl.conditions,
        actionType: tmpl.actionType as any,
        actionConfig: tmpl.actionConfig,
        cooldownMinutes: tmpl.cooldownMinutes,
        status: tmpl.status as any,
      };
      if (businessId) data.businessId = businessId;
      await prisma.automationRule.create({ data });
      count++;
    }
  }
  return count;
}
