import { DomainEventType, DomainEvent } from '../events';
import { eventBus } from '../EventBus';
import { getIO } from '../../services/socket';
import { logger } from '../../lib/logger';

let registered = false;

/**
 * Pousse les événements qui nécessitent une action admin (modération, validation,
 * litiges) vers la room socket `admin:alerts`. Le dashboard admin reçoit ainsi
 * les nouveaux signalements / modules à valider / litiges en temps réel.
 */

const ADMIN_EVENT_TYPES: Record<string, { title: string; link: string }> = {
  // Modération / validation
  [DomainEventType.REPORT_CREATED]: {
    title: 'Nouveau signalement',
    link: '/dashboard/admin/moderation',
  },
  [DomainEventType.MODULE_SUBMITTED]: {
    title: 'Nouveau module à valider',
    link: '/dashboard/admin/modules',
  },
  // KYC / Business
  [DomainEventType.BUSINESS_REGISTERED]: {
    title: 'Nouveau business inscrit',
    link: '/dashboard/admin/businesses',
  },
  [DomainEventType.BUSINESS_KYC_SUBMITTED]: {
    title: 'Vérification KYC à traiter',
    link: '/dashboard/admin/businesses',
  },
  // Litiges / Escrow
  [DomainEventType.DISPUTE_OPENED]: { title: 'Litige ouvert', link: '/dashboard/admin/disputes' },
  [DomainEventType.ESCROW_DISPUTED]: {
    title: 'Escrow litigieux',
    link: '/dashboard/admin/payments',
  },
  [DomainEventType.ESCROW_RELEASED]: { title: 'Escrow libéré', link: '/dashboard/admin/payments' },
  [DomainEventType.ESCROW_REFUNDED]: {
    title: 'Escrow remboursé',
    link: '/dashboard/admin/payments',
  },
  // Publicité
  [DomainEventType.AD_CREATED]: {
    title: 'Nouvelle campagne à valider',
    link: '/dashboard/admin/ads',
  },
  // Support
  [DomainEventType.SUPPORT_TICKET_CREATED]: {
    title: 'Nouveau ticket support',
    link: '/dashboard/admin/support',
  },
  [DomainEventType.ESCALATED_TICKET]: {
    title: 'Ticket escaladé',
    link: '/dashboard/admin/support',
  },
  // Sécurité / Fraude
  [DomainEventType.FRAUD_ALERT]: {
    title: 'Alerte fraude',
    link: '/dashboard/admin/reports/fraud',
  },
};

export function registerAdminEventHandlers(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribeToAll(async (event: DomainEvent) => {
    const meta = ADMIN_EVENT_TYPES[event.type];
    if (!meta) return;
    try {
      const io = getIO();
      if (!io) return;
      io.to('admin:alerts').emit('admin:event', {
        type: event.type,
        title: meta.title,
        link: meta.link,
        payload: event.payload || {},
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn(`[admin-events] Émission socket échouée (non-bloquant)`, {
        error: (err as Error).message,
      });
    }
  });

  logger.info('Admin event handlers registered (admin:alerts)');
}
