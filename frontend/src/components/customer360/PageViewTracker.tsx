'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

interface Props {
  businessId: string;
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

export function PageViewTracker({ businessId }: Props) {
  const tracked = useRef(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // Route réservée BUSINESS/ADMIN (CRM du propriétaire) — jamais pour un visiteur public.
    if (tracked.current || !businessId || !canTrack(user)) return;
    tracked.current = true;

    const duration = 0;

    apiClient
      .trackPageView({
        userId: user?.id,
        visitorId: !user ? `anon-${crypto.randomUUID?.() || Date.now()}` : undefined,
        referrer: document.referrer || undefined,
        duration,
      })
      .catch(() => {});
  }, [businessId, user]);

  return null;
}
