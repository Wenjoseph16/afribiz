'use client';

import { useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { useToast } from '@/components/ui/ToastProvider';
import { useNotificationStore } from '@/store/notificationStore';

const SocketContext = createContext<{ isConnected: boolean }>({ isConnected: false });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const businessId = useBusinessStore((s) => s.business?.id);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const handleNewMessage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    queryClient.invalidateQueries({ queryKey: ['business-conversations'] });
  }, [queryClient]);

  const handleNewConversation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    queryClient.invalidateQueries({ queryKey: ['business-conversations'] });
  }, [queryClient]);

  // Événements métier poussés par le backend vers la room business:{id}
  // (nouvelles commandes, réservations, avis, stocks, factures, livraisons...)
  const handleBusinessEvent = useCallback(
    (data?: { type?: string; payload?: Record<string, unknown> }) => {
      queryClient.invalidateQueries();
      const t = data?.type || '';
      if (t.includes('ORDER_') || t.includes('BOOKING_') || t === 'NEW_CLIENT') {
        const isBooking = t.includes('BOOKING_');
        notify({
          title: isBooking ? 'Nouvelle réservation' : 'Nouvelle commande',
          description: "Une mise à jour vient d'arriver sur votre tableau de bord.",
          variant: 'success',
        });
      }
    },
    [queryClient, notify]
  );

  const { addNotification, fetchUnreadCount } = useNotificationStore();

  const handleNewNotification = useCallback(
    (data?: {
      id?: string;
      title?: string;
      description?: string;
      type?: string;
      link?: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });
      if (data?.title) {
        notify({
          title: data.title,
          description: data.description,
          variant: 'success',
        });
        addNotification({
          id: data.id || crypto.randomUUID(),
          type: data.type || 'SYSTEM',
          title: data.title,
          description: data.description,
          link: data.link,
          read: false,
          createdAt: new Date().toISOString(),
          module: data.type?.split('_')[0],
        });
        fetchUnreadCount();
      }
    },
    [queryClient, notify, addNotification, fetchUnreadCount]
  );

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);
    socket.on('message:new', handleNewMessage);
    socket.on('message:sent', handleNewMessage);
    socket.on('conversation:new', handleNewConversation);
    socket.on('notification:new', handleNewNotification);
    socket.on('business:event', handleBusinessEvent);
    if (businessId) socket.emit('join:business', businessId);

    return () => {
      socket.off('connect');
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleNewMessage);
      socket.off('conversation:new', handleNewConversation);
      socket.off('notification:new', handleNewNotification);
      socket.off('business:event', handleBusinessEvent);
    };
  }, [accessToken, businessId, handleNewMessage, handleNewNotification, handleNewConversation, handleBusinessEvent]);

  // Rejoindre/quitter la room business quand le businessId change (chargé par la Sidebar)
  useEffect(() => {
    if (!businessId) return;
    const socket = getSocket();
    if (socket?.connected) socket.emit('join:business', businessId);
    return () => {
      const s = getSocket();
      if (s?.connected) s.emit('leave:business', businessId);
    };
  }, [businessId]);

  const isConnected = getSocket()?.connected ?? false;

  return <SocketContext.Provider value={{ isConnected }}>{children}</SocketContext.Provider>;
}
