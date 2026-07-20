'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'afribiz-recently-viewed';
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  type: string;
  category?: string;
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  viewedAt: number;
}

function loadFromStorage(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item: any) => item && item.id && item.name);
  } catch {
    return [];
  }
}

function saveToStorage(items: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {}
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(loadFromStorage());
  }, []);

  const trackView = useCallback(
    (business: {
      id: string;
      name: string;
      slug: string;
      logo?: string;
      type?: string;
      category?: string;
      city?: string;
      country?: string;
      rating?: number;
      reviewCount?: number;
    }) => {
      setItems((prev) => {
        const filtered = prev.filter((item) => item.id !== business.id);
        const newItem: RecentlyViewedItem = {
          id: business.id,
          name: business.name,
          slug: business.slug,
          logo: business.logo,
          type: business.type || 'business',
          category: business.category,
          city: business.city,
          country: business.country,
          rating: business.rating,
          reviewCount: business.reviewCount,
          viewedAt: Date.now(),
        };
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
        saveToStorage(updated);
        return updated;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { items, trackView, clearHistory };
}
