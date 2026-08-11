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

function canTrack(user: any) {
  if (!user) return false;
  const roles = user.roles || [];
  return (
    user.primaryRole === 'BUSINESS' ||
    user.primaryRole === 'ADMIN' ||
    roles.includes('BUSINESS') ||
    roles.includes('ADMIN')
  );
}

export function ProductViewTracker({ businessId, productId, source }: Props) {
  const tracked = useRef(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // Route réservée BUSINESS/ADMIN : on ne tracke que pour le propriétaire du
    // business (visites de SES produits côté CRM) — jamais pour un visiteur public.
    if (tracked.current || !businessId || !productId || !canTrack(user)) return;
    tracked.current = true;

    apiClient
      .trackProductView({
        productId,
        userId: user?.id,
        source: source || 'direct',
      })
      .catch(() => {
        /* tracking non bloquant — jamais de bruit console */
      });
  }, [businessId, productId, source, user]);

  return null;
}

export function useProductClick() {
  const user = useAuthStore((s) => s.user);

  return async (businessId: string, productId: string, source?: string) => {
    if (!canTrack(user)) return;
    try {
      await apiClient.trackProductClick({
        productId,
        userId: user?.id,
        source: source || 'marketplace',
      });
    } catch {
      /* tracking non bloquant */
    }
  };
}
