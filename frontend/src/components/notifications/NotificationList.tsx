'use client';

import { useState, useMemo } from 'react';
import { Bell, CheckCheck, Trash2, Filter, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/components/ui/ToastProvider';
import {
  getTypeIcon,
  getTypeColor,
  getModuleKey,
  getModuleLabel,
  MODULE_LABELS,
} from './notificationMeta';
import { NotificationDetailModal } from './NotificationDetailModal';
import type { Notification } from '@/store/notificationStore';

export function NotificationList() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    groupedByModule,
    setGroupedByModule,
  } = useNotificationStore();
  const { notify } = useToast();
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [detail, setDetail] = useState<Notification | null>(null);

  const openDetail = (notif: Notification) => {
    setDetail(notif);
    if (!notif.read) markAsRead(notif.id);
  };

  const filtered = useMemo(() => {
    let items = [...notifications];
    if (filterType) {
      items = items.filter((n) => getModuleKey(n.type) === filterType);
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, filterType]);

  const moduleTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => getModuleKey(n.type)));
    return Array.from(types).sort();
  }, [notifications]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((n) => {
      const key = getModuleLabel(n.type);
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand mx-auto" />
          <p className="text-sm text-gray-500">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  const renderNotification = (notif: any) => {
    const Icon = getTypeIcon(notif.type);
    const colorStyle = getTypeColor(notif.type);
    const timeAgo = (() => {
      try {
        return formatDistanceToNow(new Date(notif.createdAt), {
          addSuffix: true,
          locale: fr,
        });
      } catch {
        return '';
      }
    })();

    const content = (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl transition-all group',
          notif.read
            ? 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'
            : 'bg-brand/5 dark:bg-brand/10 border border-brand/10 dark:border-brand/20 hover:bg-brand/10 dark:hover:bg-brand/15'
        )}
      >
        <div className={cn('p-2.5 rounded-lg shrink-0', colorStyle)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={cn(
                  'text-sm leading-tight',
                  notif.read
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-900 dark:text-gray-100 font-semibold'
                )}
              >
                {notif.title}
              </p>
              {notif.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {notif.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!notif.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notif.id);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand hover:bg-brand/10 opacity-0 group-hover:opacity-100 transition-all"
                  title="Marquer comme lu"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                notif.read
                  ? 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  : 'bg-brand/10 text-brand'
              )}
            >
              {notif.read ? 'Lu' : 'Nouveau'}
            </span>
          </div>
        </div>
      </div>
    );

    if (notif.link) {
      return (
        <button key={notif.id} onClick={() => openDetail(notif)} className="block w-full text-left">
          {content}
        </button>
      );
    }
    return (
      <button key={notif.id} onClick={() => openDetail(notif)} className="block w-full text-left">
        {content}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="brand" size="sm">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupedByModule(!groupedByModule)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              groupedByModule
                ? 'bg-brand text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            Grouper par module
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              filterType
                ? 'bg-brand text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            title="Filtrer"
          >
            <Filter className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                setMarkAllLoading(true);
                try {
                  await markAllAsRead();
                  notify({ title: 'Notifications marquées comme lues', variant: 'success' });
                } catch {
                  notify({
                    title: 'Erreur lors du marquage',
                    description: 'Réessayez plus tard',
                    variant: 'error',
                  });
                } finally {
                  setMarkAllLoading(false);
                }
              }}
              disabled={markAllLoading}
            >
              {markAllLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
              )}
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <Card padding="md">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                !filterType
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              )}
            >
              Toutes
            </button>
            {moduleTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  filterType === type
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                )}
              >
                {type && MODULE_LABELS[type] ? MODULE_LABELS[type] : type || 'Toutes'}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Bell className="h-10 w-10" />}
            title={filterType ? 'Aucune notification filtrée' : 'Aucune notification'}
            description={
              filterType
                ? 'Essayez un autre filtre.'
                : "Vous n'avez pas encore de notifications. Elles apparaîtront ici lorsque quelque chose se produit."
            }
          />
        </Card>
      ) : groupedByModule ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([module, items]) => (
            <div key={module}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {module}
                </h3>
                <Badge variant="default" size="xs">
                  {items.length}
                </Badge>
              </div>
              <div className="space-y-1">{items.map(renderNotification)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">{filtered.map(renderNotification)}</div>
      )}
      <NotificationDetailModal
        notif={detail}
        onClose={() => setDetail(null)}
        onMarkRead={markAsRead}
        onDelete={deleteNotification}
      />
    </div>
  );
}
