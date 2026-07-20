'use client';

import { useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { useToast } from '@/components/ui/ToastProvider';
import { useNotificationStore } from '@/store/notificationStore';

const SocketContext = createContext<{ isConnected: boolean }>({ isConnected: false });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
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

    return () => {
      socket.off('connect');
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleNewMessage);
      socket.off('conversation:new', handleNewConversation);
      socket.off('notification:new', handleNewNotification);
    };
  }, [accessToken, handleNewMessage, handleNewNotification, handleNewConversation]);

  const isConnected = getSocket()?.connected ?? false;

  return <SocketContext.Provider value={{ isConnected }}>{children}</SocketContext.Provider>;
}
