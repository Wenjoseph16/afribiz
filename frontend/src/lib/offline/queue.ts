/**
 * File de synchronisation CLIENT (IndexedDB).
 *
 * Chaque action hors-ligne est enregistrée avec :
 *  - un `id` uuid généré par le client (idempotence : le serveur ignore les doublons)
 *  - un `createdAt` horodatage (ordre de replay + tri)
 *  - `status` : PENDING | SYNCING | FAILED
 *
 * Au retour du signal, `flushSyncQueue()` rejoue chaque action dans l'ordre
 * (le plus ancien d'abord) puis la marque synced / la supprime.
 */
import { dbGetAll, dbPut, dbDelete, isIndexedDBAvailable } from './db';

export interface SyncQueueItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  payload: Record<string, unknown>;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

const QUEUE_STORE = 'syncQueue' as const;

export function generateClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Met une action hors-ligne en file. Si IndexedDB n'est pas dispo, l'action est
 * perdue (fallback : on prévient l'appelant).
 */
export async function enqueueSyncItem(item: {
  id?: string; // uuid client (idempotence) — généré si absent
  action: string;
  entityType: string;
  entityId?: string;
  payload: Record<string, unknown>;
}): Promise<SyncQueueItem | null> {
  if (!isIndexedDBAvailable()) return null;

  const entry: SyncQueueItem = {
    id: item.id || generateClientId(),
    action: item.action,
    entityType: item.entityType,
    entityId: item.entityId,
    payload: item.payload,
    status: 'PENDING',
    createdAt: Date.now(),
    retryCount: 0,
  };
  await dbPut(QUEUE_STORE, entry, entry.id);
  return entry;
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  if (!isIndexedDBAvailable()) return [];
  const all = await dbGetAll<SyncQueueItem>(QUEUE_STORE);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getPendingSyncCount(): Promise<number> {
  const items = await getPendingSyncItems();
  return items.filter((i) => i.status !== 'SYNCING').length;
}

export async function removeSyncItem(id: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  await dbDelete(QUEUE_STORE, id);
}

export async function markSyncFailed(id: string, error: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  const items = await dbGetAll<SyncQueueItem>(QUEUE_STORE);
  const found = items.find((i) => i.id === id);
  if (!found) return;
  await dbPut(
    QUEUE_STORE,
    { ...found, status: 'FAILED', retryCount: found.retryCount + 1, lastError: error },
    id
  );
}
