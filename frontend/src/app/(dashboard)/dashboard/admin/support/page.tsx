'use client';

import { useState } from 'react';
import {
  Headphones, Ticket, Clock, CheckCircle, AlertCircle, Shield,
  Eye, UserCheck, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type SupportTab = 'Tous' | 'Ouverts' | 'En cours' | 'Résolus';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  module?: string;
  developer?: { name: string; email: string };
  developerName?: string;
  createdAt: string;
  updatedAt: string;
}

const TABS: { id: SupportTab; label: string }[] = [
  { id: 'Tous', label: 'Tous' },
  { id: 'Ouverts', label: 'Ouverts' },
  { id: 'En cours', label: 'En cours' },
  { id: 'Résolus', label: 'Résolus' },
];

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RESOLVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const PRIORITY_LABELS: Record<string, string> = {
  HAUTE: 'Haute',
  MOYENNE: 'Moyenne',
  BASSE: 'Basse',
};

const PRIORITY_STYLES: Record<string, string> = {
  HAUTE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MOYENNE: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BASSE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function useAdminTickets(params?: any) {
  return useQuery({
    queryKey: ['admin', 'support', 'tickets', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/support/tickets', { params });
      return res.data.data;
    },
  });
}

function useAdminTicketStats() {
  return useQuery({
    queryKey: ['admin', 'support', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/support/stats');
      return res.data.data;
    },
  });
}

function useAdminTicketAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/support/tickets/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'support'] });
    },
  });
}

export default function AdminSupportPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState<SupportTab>('Tous');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (activeTab !== 'Tous') params.status = activeTab;

  const { data: ticketsData, isLoading } = useAdminTickets(params);
  const { data: stats, isLoading: statsLoading } = useAdminTicketStats();
  const actionMutation = useAdminTicketAction();

  const tickets: SupportTicket[] = Array.isArray(ticketsData)
    ? ticketsData
    : ticketsData?.tickets ?? [];
  const totalPages = ticketsData?.totalPages ?? 1;

  const handleAction = async (id: string, action: string, label: string) => {
    const confirmed = window.confirm(`Confirmer l'action « ${label} » sur ce ticket ?`);
    if (!confirmed) return;
    try {
      await actionMutation.mutateAsync({ id, action });
      setToast({ message: `Ticket ${label.toLowerCase()} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de « ${label} »`, type: 'error' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion du support
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Gestion du support
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les tickets de support technique
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.total ?? '-'}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.open ?? '-'}</p>
              <p className="text-xs text-gray-500">Ouverts</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.inProgress ?? '-'}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.resolved ?? '-'}</p>
              <p className="text-xs text-gray-500">Résolus</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.avgTime ?? '-'}</p>
              <p className="text-xs text-gray-500">Temps moyen</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Sujet</th>
                  <th className="p-4 font-medium">Développeur</th>
                  <th className="p-4 font-medium">Module</th>
                  <th className="p-4 font-medium">Priorité</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                      {ticket.subject}
                    </td>
                    <td className="p-4 text-gray-500">
                      {ticket.developer?.name || ticket.developerName || '-'}
                    </td>
                    <td className="p-4 text-gray-500">
                      {ticket.module || '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        PRIORITY_STYLES[ticket.priority] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_STYLES[ticket.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="xs">
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Button>
                        {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(ticket.id, 'assign', 'Assigner')}
                            isLoading={actionMutation.isPending}
                          >
                            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                            Assigner
                          </Button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(ticket.id, 'resolve', 'Résoudre')}
                            isLoading={actionMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Résoudre
                          </Button>
                        )}
                        {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(ticket.id, 'close', 'Fermer')}
                            isLoading={actionMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5 text-red-500" />
                            Fermer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Headphones className="h-8 w-8" />}
            title="Aucun ticket"
            description="Aucun ticket de support trouvé."
          />
        )}
      </Card>

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
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
