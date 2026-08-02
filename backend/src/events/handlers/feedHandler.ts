import { DomainEventType, DomainEvent } from '../events';
import { eventBus } from '../EventBus';
import { createFeedItem } from '../../services/feedService';
import { FeedItemType } from '@prisma/client';
import { logger } from '../../lib/logger';

const eventToFeedType: Partial<Record<DomainEventType, FeedItemType>> = {
  [DomainEventType.PRODUCT_PUBLISHED]: FeedItemType.PRODUCT,
  [DomainEventType.SERVICE_PUBLISHED]: FeedItemType.SERVICE,
  [DomainEventType.PROMOTION_STARTED]: FeedItemType.PROMOTION,
  [DomainEventType.FLASH_SALE_STARTED]: FeedItemType.OFFER_FLASH,
  [DomainEventType.UPCOMING_EVENT]: FeedItemType.EVENT,
  [DomainEventType.RENTAL_CREATED]: FeedItemType.RENTAL,
  [DomainEventType.BUSINESS_ACTIVATED]: FeedItemType.BUSINESS_UPDATE,
};

export function registerFeedHandlers(): void {
  for (const [eventType, feedType] of Object.entries(eventToFeedType)) {
    eventBus.subscribe(eventType as DomainEventType, async (event: DomainEvent) => {
      const meta = event.metadata || {};
      const businessId = meta.businessId as string | undefined;
      if (!businessId) return;

      let title = '';
      let description = '';
      let referenceId = '';
      let mediaUrl: string | undefined;

      switch (event.type) {
        case DomainEventType.PRODUCT_PUBLISHED: {
          const p = event.payload;
          referenceId = p.productId as string;
          title = p.productName as string;
          description = `Nouveau produit publié`;
          break;
        }
        case DomainEventType.SERVICE_PUBLISHED: {
          const p = event.payload;
          referenceId = p.serviceId as string;
          title = p.serviceName as string;
          description = `Nouveau service publié`;
          break;
        }
        case DomainEventType.PROMOTION_STARTED: {
          const p = event.payload;
          referenceId = p.promotionId as string;
          title = p.promotionName as string;
          description = `Nouvelle promotion disponibles`;
          break;
        }
        case DomainEventType.FLASH_SALE_STARTED: {
          const p = event.payload;
          referenceId = p.promotionId as string;
          title = p.promotionName as string;
          description = `Offre flash en cours !`;
          break;
        }
        case DomainEventType.UPCOMING_EVENT: {
          const p = event.payload;
          referenceId = p.eventId as string;
          title = p.eventName as string;
          description = `Événement à venir`;
          break;
        }
        case DomainEventType.RENTAL_CREATED: {
          const p = event.payload;
          referenceId = p.rentalId as string;
          title = p.businessName as string;
          description = `Nouvelle location disponible`;
          break;
        }
        case DomainEventType.BUSINESS_ACTIVATED: {
          const p = event.payload;
          referenceId = p.businessId as string;
          title = (p.businessName as string) || 'Nouvelle entreprise';
          description = `Rejoint la communauté AfriBiz`;
          break;
        }
      }

      if (!businessId || !title) return;

      try {
        await createFeedItem({
          businessId,
          type: feedType as FeedItemType,
          referenceId: referenceId || undefined,
          title,
          description,
          mediaUrl,
          linkUrl: meta.link as string | undefined,
        });
      } catch (err) {
        logger.error(`Failed to create feed item for ${event.type}:`, err);
      }
    });
  }

  logger.info(`Feed handlers registered for ${Object.keys(eventToFeedType).length} event types`);
}
