'use client';

import React, { useEffect, useState } from 'react';
import {
  initOfflineSync,
  getOfflineStatus,
  subscribeOfflineStatus,
  flushSyncQueue,
} from '@/lib/offline/sync';
import { getPendingSyncCount } from '@/lib/offline/queue';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

/**
 * Gère l'init de la sync offline (events online/offline + flush auto)
 * et affiche un badge flottant quand l'utilisateur est hors-ligne ou
 * pendant une synchronisation.
 */
export function OfflineProvider() {
  const [status, setStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [pending, setPending] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    initOfflineSync();

    const refreshPending = async () => {
      try {
        const count = await getPendingSyncCount();
        setPending(count);
      } catch {
        setPending(0);
      }
    };

    const unsubscribe = subscribeOfflineStatus((s) => {
      setStatus(s);
      if (s === 'offline') {
        setVisible(true);
      } else if (s === 'online') {
        // On laisse le badge 2,5s pour montrer que tout est synchronisé
        setVisible(true);
        refreshPending();
        setTimeout(() => setVisible(false), 2500);
      } else {
        setVisible(true);
      }
    });

    // Mettre à jour le compteur en attente toutes les 15s quand hors-ligne
    const interval = setInterval(() => {
      if (!navigator.onLine) refreshPending();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  const isOffline = status === 'offline';
  const isSyncing = status === 'syncing';
  const Icon = isOffline ? WifiOff : isSyncing ? RefreshCw : Wifi;

  return (
    <button
      onClick={() => !isSyncing && flushSyncQueue()}
      title={
        isOffline
          ? 'Hors-ligne — les actions sont enregistrées localement'
          : 'En ligne — synchronisation automatique'
      }
      className={`fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium shadow-lg transition-all duration-300 ${
        isOffline
          ? 'bg-amber-500 text-white'
          : isSyncing
            ? 'bg-blue-600 text-white'
            : 'bg-emerald-500 text-white'
      }`}
    >
      <Icon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
      {isOffline
        ? `Hors-ligne · ${pending} en attente`
        : isSyncing
          ? 'Synchronisation…'
          : pending > 0
            ? `Synchronisé · ${pending} envoyé(s)`
            : 'En ligne'}
    </button>
  );
}
