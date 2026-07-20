import { create } from 'zustand';
import type { Business, BusinessModule } from '@/types/business';

export interface ModuleAssignment {
  id: string;
  businessId: string;
  module: BusinessModule;
  status: string;
  config: any | null;
  activatedAt: string;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BusinessState {
  business: Business | null;
  moduleAssignments: ModuleAssignment[];
  setBusiness: (business: Business | null) => void;
  setModuleAssignments: (assignments: ModuleAssignment[]) => void;
  hasModule: (mod: BusinessModule) => boolean;
  hasModules: boolean;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  business: null,
  moduleAssignments: [],
  setBusiness: (business) => set({ business, hasModules: (business?.modules?.length ?? 0) > 0 }),
  setModuleAssignments: (assignments) => set({ moduleAssignments: assignments }),
  hasModule: (mod) =>
    (get().business?.modules ?? []).includes(mod) ||
    get().moduleAssignments.some((a) => a.module === mod && a.status === 'ACTIVE'),
  hasModules: false,
  clearBusiness: () => set({ business: null, moduleAssignments: [], hasModules: false }),
}));
