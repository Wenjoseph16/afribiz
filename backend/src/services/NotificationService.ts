import { NotificationType, NotificationChannel } from '@prisma/client';
import { DomainEvent, DomainEventType } from '../events/events';
import { notificationRepository } from '../repositories/notificationRepository';
import { notificationPreferenceRepository } from '../repositories/notificationPreferenceRepository';
import { notificationTemplateRepository } from '../repositories/notificationTemplateRepository';
import { sendEmail } from '../lib/mail';
import { logger } from '../lib/logger';

const typeMapping: Record<DomainEventType, NotificationType> = {
  ORDER_PLACED: NotificationType.ORDER_PLACED,
  ORDER_CONFIRMED: NotificationType.ORDER_CONFIRMED,
  ORDER_PREPARING: NotificationType.ORDER_PREPARING,
  ORDER_ACCEPTED: NotificationType.ORDER_CONFIRMED,
  ORDER_REFUSED: NotificationType.ORDER_CANCELLED,
  ORDER_PENDING_REMINDER: NotificationType.ORDER_PLACED,
  ORDER_AUTO_CANCELLED: NotificationType.ORDER_CANCELLED,
  ORDER_SHIPPED: NotificationType.ORDER_SHIPPED,
  ORDER_DELIVERED: NotificationType.ORDER_DELIVERED,
  ORDER_CANCELLED: NotificationType.ORDER_CANCELLED,
  BOOKING_CREATED: NotificationType.BOOKING_CONFIRMED,
  BOOKING_CONFIRMED: NotificationType.BOOKING_CONFIRMED,
  BOOKING_CANCELLED: NotificationType.BOOKING_CANCELLED,
  BOOKING_REMINDER: NotificationType.BOOKING_REMINDER,
  PAYMENT_RECEIVED: NotificationType.PAYMENT_RECEIVED,
  PAYMENT_FAILED: NotificationType.ORDER_CANCELLED,
  PAYMENT_REMINDER: NotificationType.PAYMENT_REMINDER,
  PAYMENT_REFUNDED: NotificationType.PAYMENT_REFUNDED,
  REVIEW_PUBLISHED: NotificationType.REVIEW_RESPONSE,
  REVIEW_RESPONSE: NotificationType.REVIEW_RESPONSE,
  NEW_MESSAGE: NotificationType.NEW_MESSAGE,
  PROMOTION_STARTED: NotificationType.PROMOTION,
  FLASH_SALE_STARTED: NotificationType.PROMOTION,
  UPCOMING_EVENT: NotificationType.NEW_EVENT,
  SECURITY_ALERT: NotificationType.SECURITY_ALERT,
  DISPUTE_OPENED: NotificationType.DISPUTE_OPENED,
  DISPUTE_RESOLVED: NotificationType.DISPUTE_RESOLVED,
  SUPPORT_TICKET_CREATED: NotificationType.NEW_MESSAGE,
  SUPPORT_TICKET_RESPONDED: NotificationType.NEW_MESSAGE,
  SUPPORT_TICKET_CLOSED: NotificationType.NEW_MESSAGE,
  LOYALTY_POINTS_EARNED: NotificationType.PROMOTION,
  LOYALTY_TIER_CHANGED: NotificationType.PROMOTION,
  SUBSCRIPTION_EXPIRING: NotificationType.PAYMENT_REMINDER,
  SUBSCRIPTION_CREATED: NotificationType.PAYMENT_RECEIVED,
  SUBSCRIPTION_RENEWED: NotificationType.PAYMENT_RECEIVED,
  DEBT_CREATED: NotificationType.PAYMENT_REMINDER,
  DEBT_OVERDUE: NotificationType.PAYMENT_REMINDER,
  DEBT_SETTLED: NotificationType.PAYMENT_RECEIVED,
  ESCROW_RELEASED: NotificationType.PAYMENT_RECEIVED,
  ESCROW_REFUNDED: NotificationType.PAYMENT_RECEIVED,
  ESCROW_DISPUTED: NotificationType.DISPUTE_OPENED,
  LOW_STOCK: NotificationType.ORDER_PREPARING,
  OUT_OF_STOCK: NotificationType.ORDER_PREPARING,
  BACK_IN_STOCK: NotificationType.ORDER_PREPARING,
  CART_ABANDONED: NotificationType.PAYMENT_REMINDER,
  CLIENT_BIRTHDAY: NotificationType.PROMOTION,
  MODULE_APPROVED: NotificationType.NEW_MESSAGE,
  MODULE_REJECTED: NotificationType.NEW_MESSAGE,
  AD_APPROVED: NotificationType.NEW_MESSAGE,
  AD_REJECTED: NotificationType.NEW_MESSAGE,
  BADGE_EARNED: NotificationType.REVIEW_RESPONSE,
  SCORE_IMPROVED: NotificationType.REVIEW_RESPONSE,
  SCORE_DECREASED: NotificationType.REVIEW_RESPONSE,
  CLIENT_INACTIVE: NotificationType.PAYMENT_REMINDER,
  MODULE_SUBMITTED: NotificationType.NEW_MESSAGE,
  DEVELOPER_REVENUE_EARNED: NotificationType.PAYMENT_RECEIVED,
  DEVELOPER_PAYOUT_PROCESSED: NotificationType.PAYMENT_RECEIVED,
  USER_SIGNED_UP: NotificationType.NEW_MESSAGE,
  BUSINESS_ACTIVATED: NotificationType.NEW_MESSAGE,
  DEVELOPER_ACTIVATED: NotificationType.NEW_MESSAGE,
  COMMISSION_CHARGED: NotificationType.PAYMENT_RECEIVED,
  ESCROW_CREATED: NotificationType.PAYMENT_RECEIVED,
  ESCROW_HELD: NotificationType.PAYMENT_RECEIVED,
  TRIAL_EXPIRING: NotificationType.PAYMENT_REMINDER,
  MODULE_INSTALLED: NotificationType.NEW_MESSAGE,
  MODULE_UNINSTALLED: NotificationType.NEW_MESSAGE,
  NEW_CLIENT: NotificationType.NEW_MESSAGE,
  ONBOARDING_COMPLETED: NotificationType.NEW_MESSAGE,
  ACCOUNT_LOCKED: NotificationType.SECURITY_ALERT,
  SUSPICIOUS_ACTIVITY: NotificationType.SECURITY_ALERT,
  PASSWORD_CHANGED: NotificationType.SECURITY_ALERT,
  USER_LOGGED_IN: NotificationType.SECURITY_ALERT,
  PRODUCT_PUBLISHED: NotificationType.ORDER_PLACED,
  PRODUCT_MODIFIED: NotificationType.ORDER_PLACED,
  PRODUCT_DELETED: NotificationType.ORDER_CANCELLED,
  SERVICE_PUBLISHED: NotificationType.ORDER_PLACED,
  RENTAL_CREATED: NotificationType.BOOKING_CONFIRMED,
  RENTAL_OVERDUE: NotificationType.BOOKING_REMINDER,
  RENTAL_RETURNED: NotificationType.BOOKING_CONFIRMED,
  EMPLOYEE_CREATED: NotificationType.NEW_MESSAGE,
  EMPLOYEE_ABSENT: NotificationType.NEW_MESSAGE,
  LEAVE_REQUESTED: NotificationType.NEW_MESSAGE,
  LEAVE_APPROVED: NotificationType.NEW_MESSAGE,
  PAYROLL_PROCESSED: NotificationType.PAYMENT_RECEIVED,
  DELIVERY_ASSIGNED: NotificationType.ORDER_PREPARING,
  DELIVERY_STARTED: NotificationType.ORDER_SHIPPED,
  DELIVERY_COMPLETED: NotificationType.ORDER_DELIVERED,
  DELIVERY_FAILED: NotificationType.ORDER_CANCELLED,
  SCORE_RECALCULATED: NotificationType.REVIEW_RESPONSE,
  SYSTEM_ERROR: NotificationType.NEW_MESSAGE,
  BACKUP_FAILED: NotificationType.NEW_MESSAGE,
  EVENT_PURCHASED: NotificationType.NEW_EVENT,
  TRAINING_PURCHASED: NotificationType.NEW_EVENT,
  SETUP_INCOMPLETE: NotificationType.NEW_MESSAGE,
  SUBSCRIPTION_CANCELLED: NotificationType.NEW_MESSAGE,
  CLIENT_SEGMENT_CHANGED: NotificationType.NEW_MESSAGE,
  CLIENT_LIFETIME_VALUE_UPDATED: NotificationType.NEW_MESSAGE,
  CAMPAIGN_SCHEDULED: NotificationType.PROMOTION,
  CAMPAIGN_SENT: NotificationType.PROMOTION,
  MODULE_BUG_REPORTED: NotificationType.NEW_MESSAGE,
  AD_CREATED: NotificationType.NEW_MESSAGE,
  AD_COMPLETED: NotificationType.NEW_MESSAGE,
  INVENTORY_ALERT: NotificationType.ORDER_PREPARING,

  // Cart events
  CART_ITEM_ADDED: NotificationType.ORDER_PLACED,
  CART_ITEM_UPDATED: NotificationType.ORDER_PLACED,
  CART_ITEM_REMOVED: NotificationType.ORDER_PLACED,
  CHECKOUT_INITIATED: NotificationType.ORDER_PLACED,
  CHECKOUT_COMPLETED: NotificationType.ORDER_PLACED,
  COUPON_APPLIED: NotificationType.PROMOTION,

  // Referral events
  REFERRAL_CODE_CREATED: NotificationType.PROMOTION,
  REFERRAL_INVITED: NotificationType.NEW_MESSAGE,
  REFERRAL_CONVERTED: NotificationType.PROMOTION,
  REFERRAL_REWARD_AWARDED: NotificationType.PROMOTION,

  // New events
  SURVEY_RESPONDED: NotificationType.NEW_MESSAGE,
  EMPLOYEE_LATE: NotificationType.NEW_MESSAGE,
  DOCUMENT_EXPIRING: NotificationType.NEW_MESSAGE,
  ESCALATED_TICKET: NotificationType.SECURITY_ALERT,
  SATISFACTION_SURVEY: NotificationType.NEW_MESSAGE,
  NEW_DEVICE_DETECTED: NotificationType.SECURITY_ALERT,
  FRAUD_ALERT: NotificationType.SECURITY_ALERT,
  RENTAL_RETURN_REMINDER: NotificationType.BOOKING_REMINDER,
  DEPOSIT_RELEASED: NotificationType.PAYMENT_RECEIVED,
  ESCROW_PARTIAL_RELEASE: NotificationType.PAYMENT_RECEIVED,
  ESCROW_MANUAL_RELEASE: NotificationType.PAYMENT_RECEIVED,
  ESCROW_STEP_RELEASE: NotificationType.PAYMENT_RECEIVED,
  DELIVERY_NO_START: NotificationType.ORDER_PREPARING,
  DELIVERY_REASSIGNED: NotificationType.ORDER_PREPARING,
  LTV_RECALCULATED: NotificationType.NEW_MESSAGE,
  WELCOME_COUPON_ISSUED: NotificationType.PROMOTION,
  CROSS_SELL_OPPORTUNITY: NotificationType.PROMOTION,

  DAILY_REPORT_READY: NotificationType.NEW_MESSAGE,
  WEEKLY_DEV_REPORT: NotificationType.NEW_MESSAGE,
  SCORE_CRITICAL: NotificationType.SECURITY_ALERT,
};

const eventTitles: Record<DomainEventType, string> = {
  ORDER_PLACED: 'Commande passée',
  ORDER_CONFIRMED: 'Commande confirmée',
  ORDER_ACCEPTED: 'Commande prise en charge',
  ORDER_REFUSED: 'Commande refusée',
  ORDER_PENDING_REMINDER: 'Commande en attente',
  ORDER_AUTO_CANCELLED: 'Commande annulée automatiquement',
  ORDER_PREPARING: 'Commande en préparation',
  ORDER_SHIPPED: 'Commande expédiée',
  ORDER_DELIVERED: 'Commande livrée',
  ORDER_CANCELLED: 'Commande annulée',
  BOOKING_CREATED: 'Nouvelle réservation',
  BOOKING_CONFIRMED: 'Réservation confirmée',
  BOOKING_CANCELLED: 'Réservation annulée',
  BOOKING_REMINDER: 'Rappel de réservation',
  PAYMENT_RECEIVED: 'Paiement reçu',
  PAYMENT_FAILED: 'Paiement échoué',
  PAYMENT_REMINDER: 'Rappel de paiement',
  PAYMENT_REFUNDED: 'Remboursement effectué',
  REVIEW_PUBLISHED: 'Nouvel avis',
  REVIEW_RESPONSE: 'Réponse à votre avis',
  NEW_MESSAGE: 'Nouveau message',
  PROMOTION_STARTED: 'Promotion spéciale',
  FLASH_SALE_STARTED: 'Offre flash !',
  UPCOMING_EVENT: 'Événement à venir',
  SECURITY_ALERT: 'Alerte de sécurité',
  DISPUTE_OPENED: 'Litige ouvert',
  DISPUTE_RESOLVED: 'Litige résolu',
  USER_SIGNED_UP: 'Bienvenue',
  USER_LOGGED_IN: 'Connexion détectée',
  PASSWORD_CHANGED: 'Mot de passe modifié',
  BUSINESS_ACTIVATED: 'Business activé',
  DEVELOPER_ACTIVATED: 'Mode développeur',
  TRIAL_EXPIRING: 'Essai bientôt expiré',
  MODULE_INSTALLED: 'Module installé',
  MODULE_UNINSTALLED: 'Module désinstallé',
  RENTAL_CREATED: 'Nouvelle location',
  RENTAL_RETURNED: 'Location retournée',
  RENTAL_OVERDUE: 'Location en retard',
  PRODUCT_PUBLISHED: 'Produit publié',
  PRODUCT_MODIFIED: 'Produit modifié',
  PRODUCT_DELETED: 'Produit supprimé',
  LOW_STOCK: 'Stock faible',
  OUT_OF_STOCK: 'Rupture de stock',
  BACK_IN_STOCK: 'De retour en stock',
  SERVICE_PUBLISHED: 'Service publié',
  LOYALTY_POINTS_EARNED: 'Points gagnés',
  LOYALTY_TIER_CHANGED: 'Niveau changé',
  CAMPAIGN_SCHEDULED: 'Campagne programmée',
  CAMPAIGN_SENT: 'Campagne envoyée',
  CART_ABANDONED: 'Panier abandonné',
  CLIENT_INACTIVE: 'Client inactif',
  CLIENT_BIRTHDAY: 'Anniversaire client',
  SUPPORT_TICKET_CREATED: 'Ticket créé',
  SUPPORT_TICKET_RESPONDED: 'Ticket répondu',
  SUPPORT_TICKET_CLOSED: 'Ticket fermé',
  MODULE_SUBMITTED: 'Module soumis',
  MODULE_APPROVED: 'Module approuvé',
  MODULE_REJECTED: 'Module refusé',
  MODULE_BUG_REPORTED: 'Bug signalé',
  DEVELOPER_REVENUE_EARNED: 'Nouveau revenu',
  DEVELOPER_PAYOUT_PROCESSED: 'Paiement effectué',
  AD_CREATED: 'Publicité créée',
  AD_APPROVED: 'Publicité approuvée',
  AD_REJECTED: 'Publicité refusée',
  AD_COMPLETED: 'Publicité terminée',
  EMPLOYEE_CREATED: 'Nouvel employé',
  EMPLOYEE_ABSENT: 'Absence',
  LEAVE_REQUESTED: 'Congé demandé',
  LEAVE_APPROVED: 'Congé approuvé',
  PAYROLL_PROCESSED: 'Paie traitée',
  DELIVERY_ASSIGNED: 'Livraison assignée',
  DELIVERY_STARTED: 'Livraison en cours',
  DELIVERY_COMPLETED: 'Livraison terminée',
  DELIVERY_FAILED: 'Livraison échouée',
  SCORE_RECALCULATED: 'Score recalculé',
  BADGE_EARNED: 'Badge obtenu',
  SCORE_IMPROVED: 'Score amélioré',
  SCORE_DECREASED: 'Score diminué',
  SUSPICIOUS_ACTIVITY: 'Activité suspecte',
  ACCOUNT_LOCKED: 'Compte verrouillé',
  SYSTEM_ERROR: 'Erreur système',
  BACKUP_FAILED: 'Sauvegarde échouée',
  EVENT_PURCHASED: 'Billet acheté',
  TRAINING_PURCHASED: 'Formation achetée',
  ONBOARDING_COMPLETED: 'Bienvenue',
  SETUP_INCOMPLETE: 'Configuration',
  DEBT_CREATED: 'Dette créée',
  DEBT_SETTLED: 'Dette réglée',
  DEBT_OVERDUE: 'Dette en retard',
  SUBSCRIPTION_CREATED: 'Abonnement créé',
  SUBSCRIPTION_CANCELLED: 'Abonnement annulé',
  SUBSCRIPTION_RENEWED: 'Abonnement renouvelé',
  SUBSCRIPTION_EXPIRING: 'Abonnement expire',
  CLIENT_SEGMENT_CHANGED: 'Segment changé',
  CLIENT_LIFETIME_VALUE_UPDATED: 'Valeur client',
  NEW_CLIENT: 'Nouveau client',
  ESCROW_CREATED: 'Escrow créé',
  ESCROW_HELD: 'Fonds bloqués',
  ESCROW_RELEASED: 'Fonds libérés',
  ESCROW_REFUNDED: 'Escrow remboursé',
  ESCROW_DISPUTED: 'Litige escrow',
  COMMISSION_CHARGED: 'Commission prélevée',
  INVENTORY_ALERT: 'Alerte inventaire',

  // Cart events
  CART_ITEM_ADDED: 'Article ajouté au panier',
  CART_ITEM_UPDATED: 'Panier mis à jour',
  CART_ITEM_REMOVED: 'Article retiré du panier',
  CHECKOUT_INITIATED: 'Commande en cours',
  CHECKOUT_COMPLETED: 'Commande confirmée',
  COUPON_APPLIED: 'Code promo appliqué',

  // Referral events
  REFERRAL_CODE_CREATED: 'Code de parrainage créé',
  REFERRAL_INVITED: 'Invitation envoyée',
  REFERRAL_CONVERTED: 'Parrainage converti',
  REFERRAL_REWARD_AWARDED: 'Récompense de parrainage',

  // New events
  EMPLOYEE_LATE: 'Retard signalé',
  DOCUMENT_EXPIRING: 'Document bientôt expiré',
  ESCALATED_TICKET: 'Ticket escaladé',
  SATISFACTION_SURVEY: 'Votre avis compte',
  NEW_DEVICE_DETECTED: 'Nouvel appareil détecté',
  FRAUD_ALERT: 'Alerte fraude',
  RENTAL_RETURN_REMINDER: 'Rappel retour de location',
  DEPOSIT_RELEASED: 'Caution libérée',
  ESCROW_PARTIAL_RELEASE: 'Libération partielle escrow',
  ESCROW_MANUAL_RELEASE: 'Libération manuelle escrow',
  ESCROW_STEP_RELEASE: 'Libération par étapes escrow',
  DELIVERY_NO_START: 'Livraison non démarrée',
  DELIVERY_REASSIGNED: 'Livraison réassignée',
  LTV_RECALCULATED: 'Valeur client mise à jour',
  WELCOME_COUPON_ISSUED: 'Bienvenue - coupon offert',
  CROSS_SELL_OPPORTUNITY: 'Produit recommandé',
  SURVEY_RESPONDED: 'Réponse à l\'enquête',
  DAILY_REPORT_READY: 'Rapport quotidien',
  WEEKLY_DEV_REPORT: 'Rapport hebdomadaire développeur',
  SCORE_CRITICAL: 'Score critique',
};

function buildDescription(event: DomainEvent): string {
  const meta = event.metadata || {};
  switch (event.type) {
    case DomainEventType.ORDER_PLACED:
      return `Votre commande #${meta.orderId || ''} chez ${meta.businessName || ''} a été passée avec succès.`;
    case DomainEventType.ORDER_ACCEPTED:
      return `Votre commande #${meta.orderId || ''} a été prise en charge par ${meta.businessName || ''}.`;
    case DomainEventType.ORDER_REFUSED:
      return `Votre commande #${meta.orderId || ''} a été refusée par ${meta.businessName || ''}.${meta.reason ? ' Motif: ' + meta.reason : ''}`;
    case DomainEventType.ORDER_PENDING_REMINDER:
      return `Rappel: la commande #${meta.orderId || ''} chez ${meta.businessName || ''} est toujours en attente de validation.`;
    case DomainEventType.ORDER_AUTO_CANCELLED:
      return `Votre commande #${meta.orderId || ''} chez ${meta.businessName || ''} a été annulée automatiquement faute de réponse.`;
    case DomainEventType.ORDER_SHIPPED:
      return `Votre commande #${meta.orderId || ''} est en route vers votre adresse.`;
    case DomainEventType.ORDER_DELIVERED:
      return `Votre commande #${meta.orderId || ''} a été livrée. N'oubliez pas de laisser un avis !`;
    case DomainEventType.BOOKING_REMINDER:
      return `Rappel : votre réservation chez ${meta.businessName || ''} est prévue aujourd'hui.`;
    case DomainEventType.PAYMENT_RECEIVED:
      return `Paiement de ${meta.amount || ''} confirmé via ${meta.businessName || ''}.`;
    case DomainEventType.PAYMENT_REMINDER:
      return `Paiement de ${meta.amount || ''} en attente pour ${meta.businessName || ''}.`;
    case DomainEventType.PAYMENT_REFUNDED:
      return `Remboursement de ${meta.amount || ''} effectué sur votre compte.`;
    case DomainEventType.PROMOTION_STARTED:
    case DomainEventType.FLASH_SALE_STARTED:
      return `${meta.businessName || ''} vous offre une promotion spéciale !`;
    case DomainEventType.UPCOMING_EVENT:
      return `Ne manquez pas l'événement organisé par ${meta.businessName || 'AfriBiz'}.`;
    case DomainEventType.NEW_MESSAGE:
      return `Vous avez reçu un nouveau message de ${meta.businessName || 'AfriBiz'}.`;
    case DomainEventType.SECURITY_ALERT:
      return `Nouvelle connexion détectée sur votre compte.`;
    case DomainEventType.DISPUTE_OPENED:
      return `Un litige a été ouvert pour la commande #${meta.orderId || ''}.`;
    case DomainEventType.DISPUTE_RESOLVED:
      return `Le litige pour la commande #${meta.orderId || ''} a été résolu.`;
    case DomainEventType.CART_ITEM_ADDED:
      return `${meta.productId ? 'Un article' : ''} a été ajouté à votre panier.`;
    case DomainEventType.CHECKOUT_INITIATED:
      return `Votre commande de ${meta.amount || ''} est en cours de traitement.`;
    case DomainEventType.CHECKOUT_COMPLETED:
      return `Votre commande #${meta.orderId || ''} de ${meta.amount || ''} a été confirmée.`;
    case DomainEventType.COUPON_APPLIED:
      return `Code promo appliqué avec succès à votre panier.`;
    case DomainEventType.REFERRAL_INVITED:
      return `Votre invitation a été envoyée à ${meta.email || 'un ami'}.`;
    case DomainEventType.REFERRAL_CONVERTED:
      return `Un de vos filleuls a rejoint AfriBiz !`;
    case DomainEventType.REFERRAL_REWARD_AWARDED:
      return `Vous avez gagné ${meta.points || ''} points de parrainage !`;
    case DomainEventType.TRIAL_EXPIRING:
      return `Votre essai de ${meta.businessName || ''} expire dans ${event.payload?.daysLeft || 0} jour(s). Achetez le module pour continuer à l'utiliser.`;
    default:
      return String(event.payload?.message || '');
  }
}

export async function handleNotificationEvent(event: DomainEvent): Promise<{
  id: string;
  type: string;
  title: string;
  description?: string;
  link?: string;
  createdAt: Date;
} | null> {
  try {
    const notifType = typeMapping[event.type];
    if (!notifType) return null;

    const channels = await notificationPreferenceRepository.getEnabledChannels(
      event.userId,
      notifType
    );

    if (channels.length === 0) return null;

    let title = eventTitles[event.type];
    let description = buildDescription(event);

    // Check if a business has a custom template for this notification type
    const businessId = event.metadata?.businessId as string | undefined;
    if (businessId) {
      try {
        const template = await notificationTemplateRepository.findByBusinessAndType(businessId, notifType);
        if (template?.isActive) {
          const customDesc = template.customDescription
            ? template.customDescription
                .replace('{businessName}', (event.metadata?.businessName as string) || '')
                .replace('{orderId}', (event.metadata?.orderId as string) || '')
                .replace('{amount}', (event.metadata?.amount as string) || '')
                .replace('{clientName}', ((event.metadata as any)?.clientName as string) || '')
            : undefined;
          title = template.customTitle;
          if (customDesc) description = customDesc;
        }
      } catch {
        // Silently continue with default if template lookup fails
      }
    }

    const notificationId = await notificationRepository.create({
      userId: event.userId,
      type: notifType,
      title,
      description,
      link: event.metadata?.link as string | undefined,
      metadata: event.metadata as Record<string, unknown> | undefined,
    });

    for (const channel of channels) {
      await notificationRepository.createDelivery({
        notificationId,
        channel: channel as NotificationChannel,
      });
    }

    return {
      id: notificationId,
      type: notifType,
      title,
      description,
      link: event.metadata?.link as string | undefined,
      createdAt: new Date(),
    };
  } catch (error) {
    logger.error(`Failed to handle notification for event ${event.type}:`, error);
    return null;
  }
}

export async function handleEmailEvent(event: DomainEvent): Promise<void> {
  try {
    const notifType = typeMapping[event.type];
    if (!notifType) return;

    const channels = await notificationPreferenceRepository.getEnabledChannels(
      event.userId,
      notifType
    );

    if (!channels.includes(NotificationChannel.EMAIL)) return;

    const title = eventTitles[event.type];
    const description = buildDescription(event);

    const { prisma } = await import('../lib/db');
    const user = await prisma.user.findUnique({
      where: { id: event.userId },
      select: { email: true, firstName: true },
    });

    if (!user?.email) return;

    await sendEmail(
      user.email,
      `${title} - AfriBiz`,
      generateEmailHtml(user.firstName || 'Client', title, description, event.metadata?.link as string | undefined)
    );
  } catch (error) {
    logger.error(`Failed to send email for event ${event.type}:`, error);
  }
}

function generateEmailHtml(name: string, title: string, description: string, link?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2D8A5B; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 20px; }
          .content { background: #ffffff; padding: 30px 24px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #2D8A5B; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>Bonjour ${name},</p>
            <p>${description}</p>
            ${link ? `<p style="text-align: center; margin-top: 24px;"><a href="${link}" class="button">Voir les détails</a></p>` : ''}
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">L'équipe AfriBiz</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AfriBiz. Tous droits réservés.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
