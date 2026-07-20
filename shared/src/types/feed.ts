import type { StoryTargetType } from './story';

export type FeedItemType =
  | 'STORY'
  | 'SHORT'
  | 'PRODUCT'
  | 'SERVICE'
  | 'PROMOTION'
  | 'EVENT'
  | 'RENTAL'
  | 'PORTFOLIO'
  | 'BUSINESS_UPDATE'
  | 'OFFER_FLASH'
  | 'LIVE'
  | 'POST';

export interface FeedItem {
  id: string;
  businessId: string;
  type: FeedItemType;
  referenceId?: string;
  mediaUrl?: string;
  title?: string;
  description?: string;
  linkTargetType?: StoryTargetType;
  linkTargetId?: string;
  linkUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  expiresAt?: string;
  business?: { id: string; name: string; slug: string; logo?: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedItemRequest {
  type: FeedItemType;
  referenceId?: string;
  mediaUrl?: string;
  title?: string;
  description?: string;
  linkTargetType?: StoryTargetType;
  linkTargetId?: string;
  linkUrl?: string;
  isFeatured?: boolean;
  expiresAt?: string;
}
