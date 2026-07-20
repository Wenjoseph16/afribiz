'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/services/socket';

interface UseConversationSocketOptions {
  conversationId: string | null;
  onTypingStart?: (userId: string, name: string) => void;
  onTypingStop?: (userId: string) => void;
}

export function useConversationSocket({
  conversationId,
  onTypingStart,
  onTypingStop,
}: UseConversationSocketOptions) {
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Rejoindre/quitter la room
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit('join:conversation', conversationId);

    return () => {
      socket.emit('leave:conversation', conversationId);
    };
  }, [conversationId]);

  // Écouter typing events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTypingStart = (data: { conversationId: string; userId: string; email: string }) => {
      if (data.conversationId !== conversationId) return;

      const name = data.email.split('@')[0] || "Quelqu'un";
      onTypingStart?.(data.userId, name);

      // Sécurité: auto-clear après 8s
      const timeouts = typingTimeoutsRef.current;
      if (timeouts.has(data.userId)) clearTimeout(timeouts.get(data.userId)!);
      timeouts.set(
        data.userId,
        setTimeout(() => {
          onTypingStop?.(data.userId);
          timeouts.delete(data.userId);
        }, 8000)
      );
    };

    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId !== conversationId) return;
      onTypingStop?.(data.userId);
      const timeouts = typingTimeoutsRef.current;
      if (timeouts.has(data.userId)) {
        clearTimeout(timeouts.get(data.userId)!);
        timeouts.delete(data.userId);
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };
  }, [conversationId, onTypingStart, onTypingStop]);
}
