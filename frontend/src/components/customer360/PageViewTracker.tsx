'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

interface Props {
  businessId: string;
}

export function PageViewTracker({ businessId }: Props) {
  const tracked = useRef(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (tracked.current || !businessId) return;
    tracked.current = true;

    const duration = 0;

    apiClient.trackPageView({
      userId: user?.id,
      visitorId: !user ? `anon-${crypto.randomUUID?.() || Date.now()}` : undefined,
      referrer: document.referrer || undefined,
      duration,
    }).catch(() => {});
  }, [businessId, user?.id]);

  return null;
}
