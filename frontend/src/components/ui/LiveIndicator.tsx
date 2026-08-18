'use client';

import { useSocket } from '@/components/SocketProvider';
import { useNotificationStore } from '@/store/notificationStore';
import { Wifi, WifiOff, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Indicateur de statut en temps réel.
 * Affiche : connecté (vert) / déconnecté (rouge) + badge notifications non lues.
 *
 * Usage : <LiveIndicator /> dans le dashboard ou la topbar.
 */
export function LiveIndicator({ className }: { className?: string }) {
  const { isConnected } = useSocket();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        isConnected
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30'
          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30',
        className
      )}
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <Wifi className="h-3 w-3" />
          <span>En ligne</span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <WifiOff className="h-3 w-3" />
          <span>Hors ligne</span>
        </>
      )}
      {unreadCount > 0 && (
        <span className="flex items-center gap-1 ml-1 pl-2 border-l border-current/20">
          <Bell className="h-3 w-3" />
          <span className="font-bold">{unreadCount}</span>
        </span>
      )}
    </div>
  );
}
