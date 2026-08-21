'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, ExternalLink, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getTypeIcon, getTypeColor, getModuleLabel } from './notificationMeta';
import type { Notification } from '@/store/notificationStore';

interface NotificationDetailModalProps {
  notif: Notification | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationDetailModal({
  notif,
  onClose,
  onMarkRead,
  onDelete,
}: NotificationDetailModalProps) {
  useEffect(() => {
    if (notif && !notif.read) {
      onMarkRead(notif.id);
    }
  }, [notif, onMarkRead]);

  useEffect(() => {
    if (!notif) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [notif, onClose]);

  if (!notif) return null;

  const Icon = getTypeIcon(notif.type);
  const colorStyle = getTypeColor(notif.type);
  const time = (() => {
    try {
      return formatDistanceToNow(new Date(notif.createdAt), {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return '';
    }
  })();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Détail de la notification"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', colorStyle)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400 dark:text-gray-500">
                {getModuleLabel(notif.type)}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
            {notif.title}
          </h3>
          {notif.description ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {notif.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
              Aucune description supplémentaire.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-100 dark:border-gray-800">
          {notif.link ? (
            <Link href={notif.link} onClick={onClose} className="flex-1">
              <Button className="w-full" variant="primary">
                Voir la page
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">Aucune action associée</span>
          )}
          <div className="flex items-center gap-2">
            {!notif.read && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onMarkRead(notif.id);
                  onClose();
                }}
              >
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Marquer lu
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete(notif.id);
                  onClose();
                }}
              >
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
