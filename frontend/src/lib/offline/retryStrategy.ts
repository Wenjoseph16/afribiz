/**
 * Stratégie de retry exponentiel pour les items de sync FAILED.
 *
 * Au lieu de réessayer immédiatement (et échouer encore), on attend :
 *   - 1er retry :  5 secondes
 *   - 2e retry  : 30 secondes
 *   - 3e retry  :  2 minutes
 *   - 4e retry  : 10 minutes
 *   - 5e+ retry : abandon (marqué PERMANENT_FAILED)
 *
 * Réalité africaine : le réseau peut revenir par intermittence (2G/3G).
 * Un retry trop agressif gaspille la batterie. Un retry trop lent fait
 * perdre des données. L'exponentiel est le bon compromis.
 */
import { dbGetAll, dbPut } from './db';

const QUEUE_STORE = 'syncQueue' as const;

const RETRY_DELAYS = [
  5 * 1000,       // 5s
  30 * 1000,      // 30s
  2 * 60 * 1000,  // 2min
  10 * 60 * 1000, // 10min
  30 * 60 * 1000, // 30min (max)
];

const MAX_RETRY_BEFORE_ABANDON = 5;

/**
 * Calcule le délai de retry en fonction du nombre de tentatives.
 */
export function getRetryDelay(retryCount: number): number {
  const index = Math.min(retryCount, RETRY_DELAYS.length - 1);
  return RETRY_DELAYS[index];
}

/**
 * Vérifie si un item doit être réessayé maintenant.
 */
export function shouldRetryNow(retryCount: number, lastAttemptAt: number): boolean {
  if (retryCount >= MAX_RETRY_BEFORE_ABANDON) return false;
  const delay = getRetryDelay(retryCount);
  return Date.now() - lastAttemptAt >= delay;
}

/**
 * Récupère les items prêts pour un retry.
 */
export async function getRetryableItems(): Promise<any[]> {
  const all = await dbGetAll<any>(QUEUE_STORE);
  return all
    .filter((item) => item.status === 'FAILED' && shouldRetryNow(item.retryCount || 0, item.lastAttemptAt || 0))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

/**
 * Marque un item comme "en cours de retry".
 */
export async function markRetrying(id: string): Promise<void> {
  const item = await dbGetAll<any>(QUEUE_STORE);
  const found = item.find((i) => i.id === id);
  if (found) {
    await dbPut(QUEUE_STORE, { ...found, status: 'SYNCING', lastAttemptAt: Date.now() }, id);
  }
}

/**
 * Marque un retry comme échoué (incrémente le compteur).
 */
export async function markRetryFailed(id: string, error: string): Promise<void> {
  const all = await dbGetAll<any>(QUEUE_STORE);
  const found = all.find((i) => i.id === id);
  if (found) {
    const newCount = (found.retryCount || 0) + 1;
    const status = newCount >= MAX_RETRY_BEFORE_ABANDON ? 'PERMANENT_FAILED' : 'FAILED';
    await dbPut(
      QUEUE_STORE,
      {
        ...found,
        status,
        retryCount: newCount,
        lastError: error,
        lastAttemptAt: Date.now(),
      },
      id
    );
  }
}

/**
 * Nombre maximum de retries avant abandon.
 */
export const MAX_RETRIES = MAX_RETRY_BEFORE_ABANDON;
