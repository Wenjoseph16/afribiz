'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCachedProducts,
  searchCachedProducts,
  getCachedProduct,
  getCachedProductByBarcode,
  getCachedCategories,
  hasCatalogCache,
  getCatalogCacheSize,
  type CachedProduct,
  type CachedCategory,
} from '@/lib/offline/catalogCache';
import { getOfflineStatus, type OfflineStatus } from '@/lib/offline/sync';
import { getPendingSyncCount } from '@/lib/offline/queue';

/**
 * Hook pour le catalogue offline.
 * Retourne les produits/catégories depuis le cache local si hors-ligne,
 * ou les données fraîches du serveur si en ligne.
 *
 * Usage :
 *   const { products, isOffline, isCached } = useOfflineCatalog();
 */
export function useOfflineCatalog() {
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [categories, setCategories] = useState<CachedCategory[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = getOfflineStatus();
    setIsOffline(status === 'offline');

    const loadCache = async () => {
      try {
        const cachedProducts = await getCachedProducts();
        const cachedCategories = await getCachedCategories();
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setIsCached(cachedProducts.length > 0);
      } catch {
        // IndexedDB pas disponible
      } finally {
        setLoading(false);
      }
    };

    loadCache();
  }, []);

  const search = useCallback(async (query: string) => {
    return searchCachedProducts(query);
  }, []);

  const getProduct = useCallback(async (id: string) => {
    return getCachedProduct(id);
  }, []);

  const getProductByBarcode = useCallback(async (barcode: string) => {
    return getCachedProductByBarcode(barcode);
  }, []);

  return {
    products,
    categories,
    isOffline,
    isCached,
    loading,
    search,
    getProduct,
    getProductByBarcode,
  };
}

/**
 * Hook pour le statut offline avec compteur de pending sync.
 */
export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>('online');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      setStatus(getOfflineStatus());
      try {
        const count = await getPendingSyncCount();
        setPendingCount(count);
      } catch {
        setPendingCount(0);
      }
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return { status, pendingCount, isOffline: status === 'offline' };
}
