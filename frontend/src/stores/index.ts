import { create } from 'zustand';

interface UiStore {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebarCollapsed: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

// Note: N'exportez PAS les stores depuis ce fichier — importez-les directement depuis leurs fichiers
// pour éviter les dépendances circulaires qui causent l'erreur "Cannot read properties of undefined (reading 'call')"
// Utilisez plutôt :
//   import { useAuthStore } from '@/stores/authStore';
//   import { useBusinessStore } from '@/stores/businessStore';
//   import { useCartStore } from '@/stores/cartStore';
