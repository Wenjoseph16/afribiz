export type StoryMediaType = 'IMAGE' | 'VIDEO' | 'TEXT';
export type StoryTargetType =
  | 'PRODUCT'
  | 'SERVICE'
  | 'MENU_ITEM'
  | 'ROOM'
  | 'EVENT'
  | 'RENTAL'
  | 'PROMOTION'
  | 'ORDER'
  | 'BOOKING'
  | 'BUSINESS_PAGE'
  | 'CUSTOM_LINK';

export interface Story {
  id: string;
  businessId: string;
  mediaType: StoryMediaType;
  mediaUrl: string;
  caption?: string;
  linkTargetType?: StoryTargetType;
  linkTargetId?: string;
  linkUrl?: string;
  isActive: boolean;
  isHighlight?: boolean;
  expiresAt: string;
  viewsCount: number;
  clicksCount: number;
  business?: { id: string; name: string; slug: string; logo?: string };
  views?: StoryView[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryView {
  id: string;
  storyId: string;
  userId?: string;
  visitorId?: string;
  createdAt: string;
}

export interface CreateStoryRequest {
  mediaType: StoryMediaType;
  mediaUrl: string;
  caption?: string;
  linkTargetType?: StoryTargetType;
  linkTargetId?: string;
  linkUrl?: string;
  isHighlight?: boolean;
}

export interface UpdateStoryRequest {
  caption?: string;
  linkTargetType?: StoryTargetType;
  linkTargetId?: string;
  linkUrl?: string;
  isActive?: boolean;
  isHighlight?: boolean;
}

export interface StickerStyle {
  fontSize?: string;
  rotation?: number;
  color?: string;
  bgColor?: string;
  borderRadius?: string;
}

export interface StorySticker {
  id: string;
  type: 'PRODUCT' | 'PROMO' | 'LINK' | 'POLL' | 'QUESTION' | 'LOCATION' | 'HASHTAG';
  label: string;
  value: string;
  positionX: number;
  positionY: number;
  createdAt: string;
  style?: StickerStyle;
}
