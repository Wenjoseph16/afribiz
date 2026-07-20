'use client';

import { useAsync } from './useAsync';
import {
  getMyDemands,
  getDemandMatches,
  getOpenDemands,
  approveDeveloper,
} from '@/services/api/demands';
import { useState, useCallback } from 'react';

export function useMyDemands() {
  return useAsync(() => getMyDemands());
}

export function useDemandMatches(demandId: string) {
  return useAsync(() => getDemandMatches(demandId));
}

export function useOpenDemands(params?: { moduleType?: string; search?: string }) {
  const [filters, setFilters] = useState(params);
  const async = useAsync(() => getOpenDemands(filters), false);

  const search = useCallback(
    (p?: { moduleType?: string; search?: string }) => {
      setFilters(p);
      return async.execute();
    },
    [async]
  );

  return { ...async, filters, search };
}

export function useApproveDemand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (demandId: string, matchId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await approveDeveloper(demandId, matchId);
      return result;
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'approbation");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { approve, loading, error };
}
