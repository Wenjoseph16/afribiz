import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified: boolean;
  roles: string[];
  primaryRole: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  /** Espace sélectionné par l'utilisateur (CLIENT | BUSINESS | DEVELOPER | ADMIN).
   *  Définit l'espace à afficher dans la sidebar, indépendant du primaryRole. */
  selectedSpace: string | null;

  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  setPrimaryRole: (role: string) => void;
  setSelectedSpace: (space: string | null) => void;
  hydrateFromCookies: () => void;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
    selectedSpace: null,

    setUser: (user) => set({ user }),

    setTokens: (accessToken, refreshToken) => {
      set({ accessToken, refreshToken });
    },

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    logout: () => {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        error: null,
        selectedSpace: null,
      });
    },

    clearError: () => set({ error: null }),

    isAuthenticated: () => {
      const { accessToken } = get();
      return !!accessToken;
    },

    hasRole: (role: string) => {
      const { user } = get();
      return user ? user.roles.includes(role) : false;
    },

    setPrimaryRole: (role: string) => {
      const { user } = get();
      if (user) {
        set({
          user: {
            ...user,
            primaryRole: role,
            roles: Array.from(new Set([...user.roles, role])),
          },
        });
      }
    },

    setSelectedSpace: (space: string | null) => {
      set({ selectedSpace: space });
    },

    hydrateFromCookies: async () => {
      const getCookie = (name: string): string | undefined => {
        if (typeof document === 'undefined') return undefined;
        const match = document.cookie.match(new RegExp(`(?:^|;\\\\s*)${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}=([^;]*)`));
        return match ? decodeURIComponent(match[1]) : undefined;
      };
      const token = getCookie('accessToken');
      if (!token) {
        set({ accessToken: null, user: null, isLoading: false });
        return;
      }
      set({ accessToken: token, isLoading: true });
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          set({ user: json.data, isLoading: false, selectedSpace: null });
        } else {
          set({ accessToken: null, user: null, isLoading: false });
        }
      } catch {
        set({ accessToken: null, user: null, isLoading: false });
      }
    },
  })
);
