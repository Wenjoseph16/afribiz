'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/services/socket';

export function useMessageNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMsg = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      qc.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      qc.invalidateQueries({ queryKey: ['sidebar-unread-count'] });
    };

    const handleMsgRead = (data: { conversationId: string; messageId: string }) => {
      qc.invalidateQueries({ queryKey: ['messages', 'conversation', data.conversationId] });
      qc.invalidateQueries({ queryKey: ['sidebar-unread-count'] });
    };

    socket.on('message:new', handleNewMsg);
    socket.on('message:sent', handleNewMsg);
    socket.on('message:read', handleMsgRead);

    return () => {
      socket.off('message:new', handleNewMsg);
      socket.off('message:sent', handleNewMsg);
      socket.off('message:read', handleMsgRead);
    };
  }, [qc]);
}
