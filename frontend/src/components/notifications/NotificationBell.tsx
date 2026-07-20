'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, X, Loader2, ExternalLink, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, useUnreadCount, useMarkAllNotificationsRead } from '@/features/hooks';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();
  const { data: unreadData } = useUnreadCount();
  const { data: notifications, isLoading } = useNotifications({ limit: 5 });
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = (unreadData as { count?: number } | undefined)?.count ?? 0;
  const items = Array.isArray(notifications) ? notifications : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated()) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full ring-2 ring-background animate-pulse-once">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card rounded-2xl border border-border shadow-dropdown overflow-hidden z-50 animate-fade-in-down">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate(undefined)}
                  disabled={markAllRead.isPending}
                  className="text-xs font-medium text-brand hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors flex items-center gap-1"
                >
                  {markAllRead.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Tout lu
                </button>
              )}
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                <Settings className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Les notifications apparaîtront ici
                </p>
              </div>
            ) : (
              items.map((notif: any) => (
                <NotificationItem key={notif.id} notif={notif} onClose={() => setOpen(false)} />
              ))
            )}
          </div>

          {/* Footer */}
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-t border-border"
          >
            Voir toutes les notifications
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notif,
  onClose,
}: {
  notif: {
    id: string;
    title: string;
    description?: string;
    type: string;
    read: boolean;
    link?: string;
    createdAt: string;
  };
  onClose: () => void;
}) {
  const [isRead, setIsRead] = useState(notif.read);
  const [isDeleted, setIsDeleted] = useState(false);
  const { mutate: markRead } = useMarkAllNotificationsRead();

  const handleClick = () => {
    if (!isRead) {
      setIsRead(true);
      markRead(undefined);
    }
    onClose();
  };

  if (isDeleted) return null;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  })();

  const typeColors: Record<string, string> = {
    ORDER_PLACED: 'text-blue-500',
    ORDER_CONFIRMED: 'text-emerald-500',
    ORDER_CANCELLED: 'text-red-500',
    ORDER_SHIPPED: 'text-amber-500',
    ORDER_DELIVERED: 'text-emerald-500',
    NEW_MESSAGE: 'text-purple-500',
    PAYMENT_RECEIVED: 'text-emerald-500',
    PAYMENT_FAILED: 'text-red-500',
    BOOKING_CONFIRMED: 'text-cyan-500',
    BOOKING_REMINDER: 'text-amber-500',
    SYSTEM: 'text-gray-500',
    SECURITY_ALERT: 'text-red-500',
    PROMOTION: 'text-pink-500',
    NEW_EVENT: 'text-orange-500',
    DISPUTE_OPENED: 'text-red-500',
    REVIEW_RESPONSE: 'text-yellow-500',
  };

  const content = (
    <>
      {/* Dot indicator */}
      <div className="relative shrink-0 mt-1">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            typeColors[notif.type] || 'text-brand',
            isRead ? 'bg-transparent' : 'bg-current'
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-tight',
              isRead ? 'text-foreground/70' : 'text-foreground font-semibold'
            )}
          >
            {notif.title}
          </p>
        </div>
        {notif.description && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">
            {notif.description}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/50 mt-1">{timeAgo}</p>
      </div>
    </>
  );

  const wrapperClass = cn(
    'flex gap-3 px-4 py-3 transition-colors cursor-pointer group/item',
    'hover:bg-muted/80',
    !isRead && 'bg-brand/5 dark:bg-brand/10'
  );

  if (notif.link) {
    return (
      <Link href={notif.link} onClick={handleClick} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={handleClick} className={wrapperClass}>
      {content}
    </div>
  );
}
