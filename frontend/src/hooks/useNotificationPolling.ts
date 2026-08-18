'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Polling automatique des notifications.
 * Toutes les 30 secondes, on refresh le compteur de non-lues.
 * Quand une nouvelle notification arrive, on ajoute au store.
 *
 * Réalité : le WebSocket peut manquer des événements (reconnexion, 2G).
 * Le polling est le filet de sécurité.
 */
export function useNotificationPolling(intervalMs = 30000) {
  const { fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) return;

    // Fetch immédiat
    fetchUnreadCount();

    // Polling périodique
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, fetchUnreadCount, intervalMs]);
}
