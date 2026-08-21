/**
 * Cache catalogue local pour lecture hors-ligne.
 *
 * Le gérant doit pouvoir CONSULTER son catalogue même sans réseau :
 * - Liste produits (avec recherche)
 * - Détail produit
 * - Catégories
 *
 * Stratégie :
 * - Au chargement online : on peuple le cache avec les données du serveur
 * - Hors-ligne : on lit depuis le cache IndexedDB
 * - Chaque produit est horodaté (`cachedAt`) pour la résolution de conflits
 *
 * Réalité africaine : le réseau peut tomber au comptoir pendant une vente.
 * Le gérant doit pouvoir afficher le catalogue pour scanner/vendre.
 */
import { dbGet, dbPut, dbGetAll, dbDelete, dbClear, type StoreName } from './db';

const CATALOG_PRODUCTS_STORE = 'catalogProducts' as const;
const CATALOG_CATEGORIES_STORE = 'catalogCategories' as const;
const CATALOG_META_STORE = 'catalogMeta' as const;

// Types
export interface CachedProduct {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  barcode?: string;
  sku?: string;
  categoryId?: string;
  categoryName?: string;
  unit?: string;
  isActive: boolean;
  cachedAt: number; // timestamp de mise en cache
  updatedAt?: string; // horodatage serveur pour conflits
}

export interface CachedCategory {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  cachedAt: number;
}

// ── ÉCRITURE (appelée quand on est en ligne) ──

/**
 * Met à jour le cache catalogue avec les produits du serveur.
 * Appelé après un fetch réussi en ligne.
 */
export async function cacheProducts(products: any[]): Promise<void> {
  for (const p of products) {
    const cached: CachedProduct = {
      id: p.id,
      businessId: p.businessId || '',
      name: p.name,
      slug: p.slug || '',
      price: Number(p.price) || 0,
      currency: p.currency || 'FCFA',
      stock: p.stock ?? 0,
      images: p.images || [],
      barcode: p.barcode || undefined,
      sku: p.sku || undefined,
      categoryId: p.categoryId || undefined,
      categoryName: p.category?.name || undefined,
      unit: p.unit || 'piece',
      isActive: p.isActive ?? true,
      cachedAt: Date.now(),
      updatedAt: p.updatedAt,
    };
    await dbPut(CATALOG_PRODUCTS_STORE, cached, p.id);
  }
}

/**
 * Met à jour le cache catalogue avec les catégories du serveur.
 */
export async function cacheCategories(categories: any[]): Promise<void> {
  for (const c of categories) {
    const cached: CachedCategory = {
      id: c.id,
      businessId: c.businessId || '',
      name: c.name,
      slug: c.slug || '',
      icon: c.icon || undefined,
      image: c.image || undefined,
      parentId: c.parentId || undefined,
      sortOrder: c.sortOrder || 0,
      cachedAt: Date.now(),
    };
    await dbPut(CATALOG_CATEGORIES_STORE, cached, c.id);
  }
}

/**
 * Enregistre le moment du dernier sync catalogue.
 */
export async function setLastCatalogSync(timestamp: number): Promise<void> {
  await dbPut(CATALOG_META_STORE, { lastSync: timestamp }, 'lastSync');
}

/**
 * Récupère le moment du dernier sync catalogue.
 */
export async function getLastCatalogSync(): Promise<number> {
  const meta = await dbGet<{ lastSync: number }>(CATALOG_META_STORE, 'lastSync');
  return meta?.lastSync || 0;
}

// ── LECTURE (appelée quand on est hors-ligne ou en ligne) ──

/**
 * Récupère tous les produits en cache.
 */
export async function getCachedProducts(): Promise<CachedProduct[]> {
  const all = await dbGetAll<CachedProduct>(CATALOG_PRODUCTS_STORE);
  return all.filter((p) => p.isActive);
}

/**
 * Recherche dans le cache local (nom, barcode, sku).
 * Utile quand on est hors-ligne et qu'on cherche un produit.
 */
export async function searchCachedProducts(query: string): Promise<CachedProduct[]> {
  const all = await getCachedProducts();
  const q = query.toLowerCase();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
  );
}

/**
 * Récupère un produit par son ID depuis le cache.
 */
export async function getCachedProduct(id: string): Promise<CachedProduct | undefined> {
  return dbGet<CachedProduct>(CATALOG_PRODUCTS_STORE, id);
}

/**
 * Récupère un produit par son code-barres depuis le cache.
 * Utile pour le scanner hors-ligne.
 */
export async function getCachedProductByBarcode(
  barcode: string
): Promise<CachedProduct | undefined> {
  const all = await getCachedProducts();
  return all.find((p) => p.barcode === barcode);
}

/**
 * Récupère toutes les catégories en cache.
 */
export async function getCachedCategories(): Promise<CachedCategory[]> {
  return dbGetAll<CachedCategory>(CATALOG_CATEGORIES_STORE);
}

/**
 * Vérifie si le cache catalogue est disponible (au moins 1 produit).
 */
export async function hasCatalogCache(): Promise<boolean> {
  const products = await getCachedProducts();
  return products.length > 0;
}

/**
 * Vide le cache catalogue (avant un refresh complet).
 */
export async function clearCatalogCache(): Promise<void> {
  await dbClear(CATALOG_PRODUCTS_STORE);
  await dbClear(CATALOG_CATEGORIES_STORE);
  await dbClear(CATALOG_META_STORE);
}

/**
 * Nombre de produits en cache.
 */
export async function getCatalogCacheSize(): Promise<number> {
  const products = await getCachedProducts();
  return products.length;
}

// ── SYNC (appelée quand on revient en ligne) ──

/**
 * Résolution de conflits par horodatage.
 * Si le produit serveur est plus récent que le cache local, on écrase.
 * Si le cache local est plus récent (modifié hors-ligne), on garde le local
 * et on envoie la modification au serveur au prochain flush.
 *
 * STRATÉGIE : "Server wins" pour les données read-only (catalogue).
 * Les modifications locales (ventes, etc.) passent par la file de sync.
 */
export async function mergeCatalogWithServer(
  serverProducts: any[],
  serverCategories: any[]
): Promise<{ updated: number; kept: number }> {
  let updated = 0;
  let kept = 0;

  // Merge produits
  for (const sp of serverProducts) {
    const local = await getCachedProduct(sp.id);
    const serverTime = new Date(sp.updatedAt || 0).getTime();

    if (!local || serverTime > (local.cachedAt || 0)) {
      // Serveur plus récent ou nouveau produit → écraser
      await cacheProducts([sp]);
      updated++;
    } else {
      // Cache local plus récent → garder (modifié hors-ligne)
      kept++;
    }
  }

  // Merge catégories (toujours server wins, pas de modif locale)
  await cacheCategories(serverCategories);

  return { updated, kept };
}
