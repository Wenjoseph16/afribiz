/**
 * Résolution de conflits par horodatage.
 *
 * STRATÉGIE (niveau AWS DynamoDB) :
 *
 *   1. DONNÉES READ-ONLY (catalogue, promotions) :
 *      → "Server wins" : le serveur est la source de vérité.
 *        Le client écrase son cache local avec les données serveur.
 *
 *   2. DONNÉES MUTABLES (commandes, paiements, dettes) :
 *      → "First write wins" : la première écriture enregistrée gagne.
 *        On utilise `createdAt` comme horodatage d'origine.
 *        Les retries du même item sont idempotents (même UUID client).
 *
 *   3. DONNÉES CONCURRENTES (stock, prix) :
 *      → "Server wins" + notification de conflit.
 *        Si le stock serveur est différent du stock local, on affiche un
 *        warning au gérant ("Stock mis à jour par un autre utilisateur").
 *
 * Chaque item offline porte un `createdAt` (client) et peut porter un
 * `updatedAt` (serveur) pour la résolution.
 */
import { dbGet, dbPut, dbGetAll } from './db';

const CONFLICT_LOG_STORE = 'conflictLog' as const;

export interface ConflictEntry {
  id: string;
  entityType: string;
  entityId: string;
  localTimestamp: number;
  serverTimestamp: number;
  resolution: 'server_wins' | 'client_wins' | 'merged';
  resolvedAt: number;
}

/**
 * Compare deux timestamps et retourne la résolution.
 *
 * @param localTime - Timestamp de la version locale (client)
 * @param serverTime - Timestamp de la version serveur
 * @param strategy - Stratégie de résolution
 * @returns 'server_wins' | 'client_wins' | 'merged'
 */
export function resolveConflict(
  localTime: number,
  serverTime: number,
  strategy: 'server_wins' | 'last_write_wins' | 'merge' = 'server_wins'
): 'server_wins' | 'client_wins' | 'merged' {
  if (strategy === 'server_wins') {
    return 'server_wins';
  }

  if (strategy === 'last_write_wins') {
    return serverTime > localTime ? 'server_wins' : 'client_wins';
  }

  // merge : on garde le plus récent mais on note le conflit
  return serverTime > localTime ? 'server_wins' : 'client_wins';
}

/**
 * Enregistre un conflit résolu dans le log.
 */
export async function logConflict(entry: Omit<ConflictEntry, 'resolvedAt'>): Promise<void> {
  const full: ConflictEntry = {
    ...entry,
    resolvedAt: Date.now(),
  };
  await dbPut(CONFLICT_LOG_STORE, full, full.id);
}

/**
 * Récupère l'historique des conflits.
 */
export async function getConflictLog(): Promise<ConflictEntry[]> {
  const all = await dbGetAll<ConflictEntry>(CONFLICT_LOG_STORE);
  return all.sort((a, b) => b.resolvedAt - a.resolvedAt);
}

/**
 * Résout un conflit de stock.
 * Si le stock serveur est différent du stock local, retourne le stock
 * serveur + un flag de conflit pour afficher un warning.
 */
export function resolveStockConflict(
  localStock: number,
  serverStock: number
): { stock: number; hasConflict: boolean; message?: string } {
  if (localStock === serverStock) {
    return { stock: serverStock, hasConflict: false };
  }

  return {
    stock: serverStock, // Server wins pour le stock
    hasConflict: true,
    message: `Stock mis à jour : ${localStock} → ${serverStock} (par un autre utilisateur)`,
  };
}
