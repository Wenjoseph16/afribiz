'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

interface Props {
  businessId: string;
  productId: string;
  source?: string;
  trackView?: boolean;
  trackClick?: boolean;
}

export function ProductViewTracker({ businessId, productId, source }: Props) {
  const tracked = useRef(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (tracked.current || !businessId || !productId) return;
    tracked.current = true;

    apiClient.trackProductView({
      productId,
      userId: user?.id,
      source: source || 'direct',
    }).catch(() => {});
  }, [businessId, productId, source, user?.id]);

  return null;
}

export function useProductClick() {
  const user = useAuthStore((s) => s.user);

  return async (businessId: string, productId: string, source?: string) => {
    try {
      await apiClient.trackProductClick({
        productId,
        userId: user?.id,
        source: source || 'marketplace',
      });
    } catch {}
  };
}
