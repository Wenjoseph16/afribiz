'use client';

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
  businessId?: string;
}

export interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  setPrimaryRole: (role: string) => void;
  selectedSpace: string;
  setSelectedSpace: (role: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      selectedSpace: 'CLIENT',

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          document.cookie = `accessToken=${accessToken}; path=/; max-age=900; SameSite=Lax`;
          document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
        }
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          selectedSpace: 'CLIENT',
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; max-age=0';
          document.cookie = 'refreshToken=; path=/; max-age=0';
        }
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

      setSelectedSpace: (role: string) => set({ selectedSpace: role }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        selectedSpace: state.selectedSpace,
      }),
      skipHydration: true,
    }
  )
);
