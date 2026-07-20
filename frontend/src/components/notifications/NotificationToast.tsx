'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Bell, ShoppingBag, Calendar, Wallet, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { getSocket } from '@/services/socket';

const TOAST_DURATION = 6000;
const MAX_TOASTS = 3;

interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type?: string;
  link?: string;
}

const TOAST_ICONS: Record<string, React.ComponentType<any>> = {
  ORDER_PLACED: ShoppingBag,
  BOOKING_CONFIRMED: Calendar,
  PAYMENT_RECEIVED: Wallet,
  NEW_MESSAGE: MessageCircle,
};

const TOAST_COLORS: Record<string, string> = {
  ORDER_PLACED: 'border-l-purple-500',
  BOOKING_CONFIRMED: 'border-l-cyan-500',
  PAYMENT_RECEIVED: 'border-l-emerald-500',
  NEW_MESSAGE: 'border-l-rose-500',
  default: 'border-l-brand',
};

export function NotificationToastContainer() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { addNotification } = useNotificationStore();

  const addToast = useCallback((toast: ToastNotification) => {
    setToasts((prev) => {
      const next = [toast, ...prev].slice(0, MAX_TOASTS);
      return next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, TOAST_DURATION);
    // Play notification sound (fichier optionnel)
    try {
      const audio = new Audio();
      audio.volume = 0.3;
      // Le son est joué silencieusement si le fichier n'existe pas
      audio.src = '/notification.mp3';
      audio.play().catch(() => {});
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (data: any) => {
      if (data?.title) {
        addToast({
          id: data.id || crypto.randomUUID(),
          title: data.title,
          description: data.description,
          type: data.type,
          link: data.link,
        });
        addNotification({
          id: data.id || crypto.randomUUID(),
          type: data.type || 'SYSTEM',
          title: data.title || 'Notification',
          description: data.description,
          link: data.link,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    };

    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [addToast, addNotification]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = TOAST_ICONS[toast.type || ''] || Bell;
        const borderColor = TOAST_COLORS[toast.type || ''] || TOAST_COLORS.default;

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto bg-white dark:bg-gray-800 rounded-xl shadow-dropdown border border-gray-200 dark:border-gray-700 border-l-4 overflow-hidden',
              'animate-slide-up-fade',
              borderColor
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {toast.title}
                </p>
                {toast.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
