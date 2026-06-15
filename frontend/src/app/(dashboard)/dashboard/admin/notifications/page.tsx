'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  Bell, CheckCheck, Mail, UserPlus, CreditCard,
  AlertTriangle, Flag, Bug, AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';

type NotifTab = 'system' | 'users' | 'payments' | 'disputes' | 'reports' | 'errors';

const tabConfig: { id: NotifTab; label: string; icon: any; color: string }[] = [
  { id: 'system', label: 'Système', icon: Bell, color: 'text-brand' },
  { id: 'users', label: 'Nouveaux utilisateurs', icon: UserPlus, color: 'text-emerald-600' },
  { id: 'payments', label: 'Paiements importants', icon: CreditCard, color: 'text-blue-600' },
  { id: 'disputes', label: 'Litiges', icon: AlertTriangle, color: 'text-red-600' },
  { id: 'reports', label: 'Signalements', icon: Flag, color: 'text-amber-600' },
  { id: 'errors', label: 'Erreurs', icon: Bug, color: 'text-rose-600' },
];

const typeIcons: Record<string, any> = {
  system: Bell,
  user: UserPlus,
  payment: CreditCard,
  dispute: AlertTriangle,
  report: Flag,
  error: Bug,
};

const typeColors: Record<string, string> = {
  system: 'text-brand bg-brand-50 dark:bg-brand-900/30',
  user: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
  payment: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  dispute: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  report: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  error: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30',
};

export default function AdminNotificationsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<NotifTab>('system');
  const [page, setPage] = useState(1);
  const limit = 15;

  const isAdmin = user?.roles?.includes('ADMIN');

  const typeFilter = activeTab === 'system' ? undefined : activeTab;

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['admin', 'notifications', activeTab, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/notifications', {
        params: { type: typeFilter, page, limit },
      });
      return res.data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  const notifications = Array.isArray(notifData) ? notifData : notifData?.notifications ?? notifData?.data ?? [];
  const total = notifData?.total ?? notifData?.count ?? notifications.length;
  const totalPages = Math.ceil(total / limit) || 1;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Centre de notifications
        </h1>
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Centre de notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les notifications et alertes de la plateforme
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <Loader className="py-12" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="Aucune notification"
          description="Aucune notification trouvée pour cette catégorie."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif: any) => {
            const Icon = typeIcons[notif.type] || AlertCircle;
            const colorClass = typeColors[notif.type] || 'text-gray-500 bg-gray-50 dark:bg-gray-800/50';
            return (
              <Card key={notif.id} padding="sm">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-semibold ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {notif.description || notif.message || '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleString('fr-FR') : '-'}
                        </span>
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => markReadMutation.mutate(notif.id)}
                            isLoading={markReadMutation.isPending}
                          >
                            <CheckCheck className="h-3.5 w-3.5 text-brand" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(notif.metadata).slice(0, 3).map(([key, val]: any) => (
                          <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {key}: {String(val).slice(0, 30)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
