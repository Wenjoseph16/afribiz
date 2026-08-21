/**
 * Wrapper IndexedDB natif ultra-léger (zéro dépendance).
 * Stores :
 *  - 'syncQueue' : file de synchronisation client (ventes POS, sorties de caisse…)
 *  - 'kv'        : paires clé/valeur (état offline, derniers prix, etc.)
 *
 * API : openDB() -> db.get(store, key) / db.put(store, value, key) / db.getAll(store) / db.delete(store, key)
 */

const DB_NAME = 'afribiz-offline';
const DB_VERSION = 2;
const STORES = [
  'syncQueue',
  'kv',
  'catalogProducts',
  'catalogCategories',
  'catalogMeta',
  'negotiations',
  'conflictLog',
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB non disponible (navigateur ou contexte hors-ligne)'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Échec ouverture IndexedDB'));
  });

  return dbPromise;
}

export async function dbGet<T = unknown>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store: StoreName, value: unknown, key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbGetAll<T = unknown>(store: StoreName): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(store: StoreName, key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbClear(store: StoreName): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}
