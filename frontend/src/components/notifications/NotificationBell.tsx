'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  X,
  Loader2,
  ExternalLink,
  ShoppingBag,
  Package,
  Calendar,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  Shield,
  Gift,
  Clock,
  Star,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
} from '@/features/hooks';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotificationDetailModal } from './NotificationDetailModal';

const CATEGORY_CONFIG = {
  ORDER: {
    label: 'Commandes',
    color: 'emerald',
    dotClass: 'bg-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    textClass: 'text-emerald-400',
    glowClass: 'shadow-[0_0_8px_rgba(16,185,129,0.3)]',
    icon: ShoppingBag,
  },
  PAYMENT: {
    label: 'Paiements',
    color: 'amber',
    dotClass: 'bg-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    textClass: 'text-amber-400',
    glowClass: 'shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    icon: CreditCard,
  },
  BOOKING: {
    label: 'Reservations',
    color: 'cyan',
    dotClass: 'bg-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    textClass: 'text-cyan-400',
    glowClass: 'shadow-[0_0_8px_rgba(6,182,212,0.3)]',
    icon: Calendar,
  },
  MESSAGE: {
    label: 'Messages',
    color: 'rose',
    dotClass: 'bg-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/20',
    textClass: 'text-rose-400',
    glowClass: 'shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    icon: MessageCircle,
  },
  SECURITY: {
    label: 'Securite',
    color: 'red',
    dotClass: 'bg-red-400',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    textClass: 'text-red-400',
    glowClass: 'shadow-[0_0_8px_rgba(239,68,68,0.3)]',
    icon: Shield,
  },
  DISPUTE: {
    label: 'Litiges',
    color: 'orange',
    dotClass: 'bg-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
    textClass: 'text-orange-400',
    glowClass: 'shadow-[0_0_8px_rgba(249,115,22,0.3)]',
    icon: AlertTriangle,
  },
  PROMOTION: {
    label: 'Promotions',
    color: 'pink',
    dotClass: 'bg-pink-400',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/20',
    textClass: 'text-pink-400',
    glowClass: 'shadow-[0_0_8px_rgba(236,72,153,0.3)]',
    icon: Gift,
  },
  EVENT: {
    label: 'Evenements',
    color: 'indigo',
    dotClass: 'bg-indigo-400',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
    textClass: 'text-indigo-400',
    glowClass: 'shadow-[0_0_8px_rgba(99,102,241,0.3)]',
    icon: Sparkles,
  },
  REVIEW: {
    label: 'Avis',
    color: 'yellow',
    dotClass: 'bg-yellow-400',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/20',
    textClass: 'text-yellow-400',
    glowClass: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]',
    icon: Star,
  },
  SYSTEM: {
    label: 'Systeme',
    color: 'slate',
    dotClass: 'bg-slate-400',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/20',
    textClass: 'text-slate-400',
    glowClass: 'shadow-[0_0_8px_rgba(148,163,184,0.2)]',
    icon: Bell,
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_CONFIG;

function getCategory(type: string): CategoryKey {
  const key = type.split('_')[0] as CategoryKey;
  return CATEGORY_CONFIG[key] ? key : 'SYSTEM';
}

interface NotificationBellProps {
  variant?: 'topbar' | 'header';
}

export function NotificationBell({ variant = 'topbar' }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();

  const { data: unreadData } = useUnreadCount();
  const { data: notifications, isLoading } = useNotifications({ limit: 30 });
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const deleteNotif = useDeleteNotification();

  const unreadCount = (unreadData as { count?: number } | undefined)?.count ?? 0;
  const items: any[] = Array.isArray(notifications)
    ? notifications
    : Array.isArray((notifications as any)?.notifications)
      ? (notifications as any).notifications
      : Array.isArray((notifications as any)?.items)
        ? (notifications as any).items
        : [];

  const filteredItems = activeCategory
    ? items.filter((n: any) => getCategory(n.type) === activeCategory)
    : items;

  const categories = Array.from(new Set(items.map((n: any) => getCategory(n.type))));

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate(undefined);
  }, [markAllRead]);

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

  const isHeader = variant === 'header';

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-xl transition-all duration-200 group',
          isHeader
            ? 'p-2.5 text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10'
            : 'p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title="Notifications"
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -8, 8, -6, 6, -3, 3, 0] } : { rotate: 0 }}
          transition={
            unreadCount > 0 ? { duration: 0.6, repeat: Infinity, repeatDelay: 4 } : { duration: 0 }
          }
        >
          <Bell className="h-[18px] w-[18px]" />
        </motion.div>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full',
                isHeader
                  ? 'text-slate-950 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  : 'text-white bg-destructive ring-2 ring-background'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-2xl rounded-2xl border border-emerald-500/10 shadow-[-8px_0_40px_-15px_rgba(16,185,129,0.08)] z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="relative px-5 py-4 border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-white tracking-tight">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tabular-nums">
                        {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        disabled={markAllRead.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-200"
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
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Category tabs */}
                {categories.length > 2 && (
                  <div className="relative flex gap-1 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
                    <button
                      onClick={() => setActiveCategory(null)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-200 border',
                        !activeCategory
                          ? 'bg-white/10 border-white/10 text-white'
                          : 'bg-transparent border-transparent text-white/30 hover:text-white/50 hover:bg-white/5'
                      )}
                    >
                      Toutes
                    </button>
                    {categories.map((cat) => {
                      const config = CATEGORY_CONFIG[cat as CategoryKey];
                      if (!config) return null;
                      const count = items.filter((n: any) => getCategory(n.type) === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all duration-200 border',
                            activeCategory === cat
                              ? cn(config.bgClass, config.borderClass, config.textClass)
                              : 'bg-transparent border-transparent text-white/30 hover:text-white/50 hover:bg-white/5'
                          )}
                        >
                          {config.label}
                          <span className="opacity-50">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500/50" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12 px-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-6 h-6 text-emerald-500/30" />
                    </div>
                    <p className="text-sm text-white/40 font-medium">Aucune notification</p>
                    <p className="text-xs text-white/20 mt-1">Les alertes apparaitront ici</p>
                  </div>
                ) : (
                  <div className="py-1">
                    <AnimatePresence mode="popLayout">
                      {filteredItems.map((notif: any, idx: number) => (
                        <NotificationItem
                          key={notif.id}
                          notif={notif}
                          index={idx}
                          onOpen={() => {
                            setOpen(false);
                            setDetail(notif);
                          }}
                          onMarkRead={(id) => markRead.mutate(id)}
                          onDelete={(id) => deleteNotif.mutate(id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-white/5 px-5 py-3">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400/70 hover:text-emerald-400 transition-colors duration-200"
                  >
                    Voir toutes les notifications
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      {detail && (
        <NotificationDetailModal
          notif={detail}
          onClose={() => setDetail(null)}
          onMarkRead={(id: string) => markRead.mutate(id)}
        />
      )}
    </div>
  );
}

function NotificationItem({
  notif,
  index,
  onOpen,
  onMarkRead,
  onDelete,
}: {
  notif: any;
  index: number;
  onOpen: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isRead, setIsRead] = useState(notif.read);
  const [isDeleted, setIsDeleted] = useState(false);
  const category = getCategory(notif.type);
  const config = CATEGORY_CONFIG[category];
  const Icon = config?.icon || Bell;

  const handleClick = () => {
    if (!isRead) {
      setIsRead(true);
      onMarkRead(notif.id);
    }
    if (notif.link) {
      window.location.href = notif.link;
    } else {
      onOpen();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleted(true);
    onDelete(notif.id);
  };

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr });
    } catch {
      return '';
    }
  })();

  if (isDeleted) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex gap-3 px-5 py-3 text-left transition-all duration-200 group/item relative',
          !isRead ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]' : 'hover:bg-white/[0.03]'
        )}
      >
        {/* Unread indicator line */}
        {!isRead && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
        )}

        {/* Icon */}
        <div
          className={cn(
            'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-200',
            config?.bgClass || 'bg-white/5',
            config?.borderClass || 'border-white/10',
            !isRead && config?.glowClass
          )}
        >
          <Icon className={cn('w-4 h-4', config?.textClass || 'text-white/40')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-[13px] leading-snug line-clamp-2',
              isRead ? 'text-white/40' : 'text-white/90 font-semibold'
            )}
          >
            {notif.title}
          </p>
          {notif.description && (
            <p className="text-[11px] text-white/25 mt-0.5 line-clamp-1">{notif.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-white/20 tabular-nums">{timeAgo}</span>
            <span
              className={cn(
                'text-[9px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wider',
                !isRead
                  ? cn(config?.bgClass || 'bg-white/5', config?.textClass || 'text-white/40')
                  : 'bg-white/5 text-white/20'
              )}
            >
              {config?.label || 'Info'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200">
          {!isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsRead(true);
                onMarkRead(notif.id);
              }}
              className="p-1.5 rounded-lg text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
              title="Marquer comme lu"
            >
              <CheckCheck className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </button>
    </motion.div>
  );
}
