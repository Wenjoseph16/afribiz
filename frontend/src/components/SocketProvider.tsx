'use client';

import { useCallback, useEffect, createContext, useContext, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { connectSocket, disconnectSocket, getSocket } from '@/services/socket';
import { useToast } from '@/components/ui/ToastProvider';

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
  }, [queryClient]);

  const handleNewNotification = useCallback((data?: { title?: string; description?: string }) => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    if (data?.title) {
      notify({
        title: data.title,
        description: data.description,
        variant: 'success',
      });
    }
  }, [queryClient, notify]);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket(accessToken);

    socket.on('message:new', handleNewMessage);
    socket.on('message:sent', handleNewMessage);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:sent', handleNewMessage);
      socket.off('notification:new', handleNewNotification);
    };
  }, [accessToken, handleNewMessage, handleNewNotification]);

  const isConnected = getSocket()?.connected ?? false;

  return (
    <SocketContext.Provider value={{ isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
