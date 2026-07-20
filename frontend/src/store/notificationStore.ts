'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/services/apiClient';

export interface Notification {
  id: string;
  type: string;
  title: string;
  description?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
  module?: string;
}

interface NotificationState {
  // Data
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;

  // Settings
  soundEnabled: boolean;
  desktopEnabled: boolean;
  groupedByModule: boolean;

  // Actions
  fetchNotifications: (limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notif: Notification) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDesktopEnabled: (enabled: boolean) => void;
  setGroupedByModule: (grouped: boolean) => void;

  // Grouped helpers
  getNotificationsByModule: () => Record<string, Notification[]>;
  getNotificationsByType: (type: string) => Notification[];
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      soundEnabled: true,
      desktopEnabled: true,
      groupedByModule: false,

      fetchNotifications: async (limit = 20) => {
        set({ isLoading: true });
        try {
          const res = await apiClient.getNotifications({ limit });
          const data = res.data.data;
          const items = Array.isArray(data) ? data : data?.notifications || data?.items || [];
          set({ notifications: items, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchUnreadCount: async () => {
        try {
          const res = await apiClient.getUnreadCount();
          const count =
            typeof res.data.data === 'number'
              ? res.data.data
              : ((res.data.data as { count?: number })?.count ?? 0);
          set({ unreadCount: count });
        } catch {
          // silent
        }
      },

      markAsRead: async (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        try {
          await apiClient.markNotificationRead(id);
        } catch {
          // revert on failure
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: false } : n
            ),
            unreadCount: state.unreadCount + 1,
          }));
        }
      },

      markAllAsRead: async () => {
        const prevUnread = get().unreadCount;
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        try {
          await apiClient.markAllNotificationsRead();
        } catch (err) {
          // Rollback et relancer pour que l'appelant (ex: toast erreur) puisse réagir
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: false })),
            unreadCount: prevUnread,
          }));
          throw err;
        }
      },

      deleteNotification: async (id: string) => {
        const notif = get().notifications.find((n) => n.id === id);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notif?.read ? state.unreadCount : Math.max(0, state.unreadCount - 1),
        }));
        try {
          await apiClient.deleteNotification(id);
        } catch {
          // revert
          if (notif) {
            set((state) => ({
              notifications: [...state.notifications, notif],
              unreadCount: notif.read ? state.unreadCount : state.unreadCount + 1,
            }));
          }
        }
      },

      addNotification: (notif: Notification) => {
        set((state) => ({
          notifications: [notif, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }));
      },

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setDesktopEnabled: (enabled) => set({ desktopEnabled: enabled }),
      setGroupedByModule: (grouped) => set({ groupedByModule: grouped }),

      getNotificationsByModule: () => {
        const grouped: Record<string, Notification[]> = {};
        get().notifications.forEach((n) => {
          const notifModule = n.module;
          const groupKey = notifModule || n.type?.split('_')[0] || 'Autres';
          if (!grouped[groupKey]) grouped[groupKey] = [];
          grouped[groupKey].push(n);
        });
        return grouped;
      },

      getNotificationsByType: (type: string) => {
        return get().notifications.filter((n) => n.type === type);
      },
    }),
    {
      name: 'afribiz-notification-store',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        desktopEnabled: state.desktopEnabled,
        groupedByModule: state.groupedByModule,
      }),
    }
  )
);
