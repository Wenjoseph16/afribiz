'use client';

import { useMyBusiness } from '@/features/hooks/business';
import type { BusinessModule } from '@/types/business';

export interface SetupGuardState {
  configured: boolean;
  missing: string[];
  loading: boolean;
}

export function useSetupGuard(module: BusinessModule): SetupGuardState {
  const { data: business, isLoading } = useMyBusiness();
  const setup = business?.setup?.[module];

  return {
    configured: setup ? setup.configured : !isLoading,
    missing: setup?.missing ?? [],
    loading: isLoading,
  };
}
