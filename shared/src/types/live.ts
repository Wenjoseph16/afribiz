export type LiveStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface Live {
  id: string;
  businessId: string;
  title: string;
  description?: string;
  coverImage?: string;
  streamUrl?: string;
  streamKey?: string;
  status: LiveStatus;
  hasEscrow: boolean;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  viewerCount: number;
  maxViewers?: number;
  viewerCountPeak: number;
  business?: { id: string; name: string; slug: string; logo?: string };
  products?: LiveProduct[];
  participants?: LiveParticipant[];
  chats?: LiveChat[];
  createdAt: string;
  updatedAt: string;
}

export interface LiveProduct {
  id: string;
  liveId: string;
  productId?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  image?: string;
  stock: number;
  remainingStock: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface LiveParticipant {
  id: string;
  liveId: string;
  userId?: string;
  userName?: string;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
}

export interface LiveChat {
  id: string;
  liveId: string;
  userId?: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface LiveReaction {
  id: string;
  liveId: string;
  userId?: string;
  emoji: string;
  createdAt: string;
}

export interface CreateLiveRequest {
  title: string;
  description?: string;
  coverImage?: string;
  hasEscrow?: boolean;
  scheduledAt?: string;
  maxViewers?: number;
}

export interface UpdateLiveRequest {
  title?: string;
  description?: string;
  coverImage?: string;
  status?: LiveStatus;
  streamUrl?: string;
}

export interface AddLiveProductRequest {
  productId?: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  image?: string;
  stock: number;
}

export interface SendLiveChatRequest {
  message: string;
  userName?: string;
}

export interface LiveStats {
  totalLives: number;
  activeViewers: number;
  totalViewers: number;
  productsSold: number;
  revenue: number;
  averageWatchTime: number;
}
