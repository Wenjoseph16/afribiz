export interface Short {
  id: string;
  businessId: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
  isActive: boolean;
  likesCount: number;
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  business?: { id: string; name: string; slug: string; logo?: string };
  likes?: ShortLike[];
  comments?: ShortComment[];
  createdAt: string;
  updatedAt: string;
}

export interface ShortLike {
  id: string;
  shortId: string;
  userId?: string;
  createdAt: string;
}

export interface ShortComment {
  id: string;
  shortId: string;
  userId?: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface ShortView {
  id: string;
  shortId: string;
  userId?: string;
  visitorId?: string;
  createdAt: string;
}

export interface ShortSave {
  id: string;
  shortId: string;
  userId: string;
  createdAt: string;
}

export interface CreateShortRequest {
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
}

export interface UpdateShortRequest {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
  isActive?: boolean;
}

export interface AddCommentRequest {
  content: string;
}
