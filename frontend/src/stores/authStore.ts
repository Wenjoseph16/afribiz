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

/** Données employé (token PIN, Chantier 7) */
export interface EmployeeAuthData {
  isEmployee: true;
  employeeId: string;
  businessId: string;
  firstName: string;
  lastName: string;
  position: string;
  photo: string | null;
  permissions: string[];
  maxDiscountPercentage: number | null;
  token: string;
}

export interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Chantier 7 : auth employé par PIN
  employee: EmployeeAuthData | null;
  setEmployee: (emp: EmployeeAuthData | null) => void;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
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
      employee: null,

      setUser: (user) => set({ user }),

      setEmployee: (emp) => {
        set({ employee: emp });
        if (emp && typeof window !== 'undefined') {
          localStorage.setItem('employeeToken', emp.token);
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('employeeToken');
        }
      },

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

      hasPermission: (permission: string) => {
        const { user, employee } = get();
        // Boss (ownerId) → ALL_ACCESS
        if (user?.primaryRole === 'BUSINESS' && user.roles.includes('BUSINESS')) {
          // Vérifier si c'est le boss ou un employé via le store employee
          if (employee) {
            return employee.permissions.includes(permission);
          }
          // Pas d'employee data = boss = ALL_ACCESS
          return true;
        }
        // Employé → vérifier ses permissions
        if (employee) {
          return employee.permissions.includes(permission);
        }
        return false;
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
