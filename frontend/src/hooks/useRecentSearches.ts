'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'afribiz-recent-searches';
const MAX_ITEMS = 8;

function loadSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveSearches(searches: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches.slice(0, MAX_ITEMS)));
  } catch (e) {
    console.error('Erreur sauvegarde recherches:', e);
  }
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setSearches(loadSearches());
  }, []);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...filtered].slice(0, MAX_ITEMS);
      saveSearches(updated);
      return updated;
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setSearches((prev) => {
      const updated = prev.filter((s) => s !== query);
      saveSearches(updated);
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { searches, addSearch, removeSearch, clearSearches };
}
