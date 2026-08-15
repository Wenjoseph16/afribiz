/**
 * Moteur de synchronisation.
 *
 * - `flushSyncQueue()` : rejoue la file client vers `POST /api/sync/bulk`.
 *   Idempotent grâce à l'`id` client (le serveur ignore les doublons avec
 *   skipDuplicates) — un retry après perte de réponse ne crée pas de doublon.
 * - `initOfflineSync()` : écoute online/offline et flush automatiquement au
 *   retour du signal (avec un léger délai pour laisser le réseau se stabiliser).
 */
import { apiClient } from '@/services/apiClient';
import { getPendingSyncItems, removeSyncItem, markSyncFailed, type SyncQueueItem } from './queue';

export type OfflineStatus = 'online' | 'offline' | 'syncing';

type StatusListener = (status: OfflineStatus, pendingCount: number) => void;

const listeners = new Set<StatusListener>();
let currentStatus: OfflineStatus = 'online';
let flushing = false;

export function getOfflineStatus(): OfflineStatus {
  return currentStatus;
}

export function subscribeOfflineStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  // Notifier immédiatement l'état courant
  queueMicrotask(() => listener(currentStatus, 0));
  return () => listeners.delete(listener);
}

function notify(status: OfflineStatus) {
  currentStatus = status;
  listeners.forEach((l) => l(status, 0));
}

/**
 * Rejoue toute la file client. Retourne { synced, failed }.
 */
export async function flushSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (flushing) return { synced: 0, failed: 0 };
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { synced: 0, failed: 0 };

  flushing = true;
  notify('syncing');
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingSyncItems();
    if (pending.length === 0) {
      return { synced: 0, failed: 0 };
    }

    // On envoie tout en UN appel bulk (moins de requêtes, réalité mobile).
    const items = pending.map((i: SyncQueueItem) => ({
      id: i.id,
      action: i.action,
      entityType: i.entityType,
      entityId: i.entityId,
      payload: i.payload,
    }));

    const res = await apiClient.bulkSync(items);
    const ok = res?.data?.success !== false;

    if (ok) {
      // Tout est accepté côté serveur -> on vide la file locale
      for (const item of pending) {
        await removeSyncItem(item.id);
      }
      synced = pending.length;
    } else {
      failed = pending.length;
    }
  } catch (e: any) {
    // Erreur réseau/serveur : on marque en FAILED (retry au prochain flush)
    const pending = await getPendingSyncItems();
    for (const item of pending) {
      await markSyncFailed(item.id, e?.message || 'Erreur de synchronisation');
    }
    failed = pending.length;
  } finally {
    flushing = false;
    const remaining = await getPendingSyncItems();
    const pendingCount = remaining.filter((i) => i.status !== 'SYNCING').length;
    notify(pendingCount > 0 ? 'offline' : 'online');
  }

  return { synced, failed };
}

let initialized = false;

export function initOfflineSync(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const updateOnline = () => {
    const online = navigator.onLine;
    notify(online ? 'online' : 'offline');
    if (online) {
      // Délai pour laisser le réseau se stabiliser (connexion mobile 2G/3G)
      setTimeout(() => flushSyncQueue(), 1500);
    }
  };

  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();

  // Flush au chargement si on est en ligne (relance de l'app avec file en attente)
  if (navigator.onLine) {
    setTimeout(() => flushSyncQueue(), 2000);
  }
}
