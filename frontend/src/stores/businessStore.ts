import { create } from 'zustand';
import type { Business, BusinessModule } from '@/types/business';

interface BusinessState {
  business: Business | null;
  setBusiness: (business: Business | null) => void;
  hasModule: (mod: BusinessModule) => boolean;
  hasModules: boolean;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  business: null,
  setBusiness: (business) => set({ business, hasModules: (business?.modules?.length ?? 0) > 0 }),
  hasModule: (mod) => (get().business?.modules ?? []).includes(mod),
  hasModules: false,
  clearBusiness: () => set({ business: null, hasModules: false }),
}));
