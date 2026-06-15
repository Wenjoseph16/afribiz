'use client';

import { useState } from 'react';
import {
  FileText, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Ban, Shield, AlertTriangle, UserX, FileWarning, Gavel,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type FraudTab = 'fraude' | 'spam' | 'arnaque' | 'faux_profils' | 'contenu_illegal' | 'abus';

const TABS: { id: FraudTab; label: string; icon: any }[] = [
  { id: 'fraude', label: 'Fraude', icon: AlertTriangle },
  { id: 'spam', label: 'Spam', icon: FileWarning },
  { id: 'arnaque', label: 'Arnaque', icon: Gavel },
  { id: 'faux_profils', label: 'Faux profils', icon: UserX },
  { id: 'contenu_illegal', label: 'Contenu illégal', icon: Ban },
  { id: 'abus', label: 'Abus', icon: Shield },
];

const TAB_PARAMS: Record<FraudTab, string> = {
  fraude: 'FRAUD',
  spam: 'SPAM',
  arnaque: 'SCAM',
  faux_profils: 'FAKE_PROFILE',
  contenu_illegal: 'ILLEGAL_CONTENT',
  abus: 'ABUSE',
};

export default function AdminFraudReportsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [activeTab, setActiveTab] = useState<FraudTab>('fraude');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const params: any = { page, limit, type: TAB_PARAMS[activeTab] };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'fraud-reports', activeTab, page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/reports/fraud', { params });
      return res.data.data || { reports: [], totalPages: 1 };
    },
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/reports/fraud/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'fraud-reports'] }); setToast({ message: 'Signalement approuvé', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de l\'approbation', type: 'error' }); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/reports/fraud/${id}/reject`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'fraud-reports'] }); setToast({ message: 'Signalement rejeté', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors du rejet', type: 'error' }); },
  });

  const banTargetMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/reports/fraud/${id}/ban`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'fraud-reports'] }); setToast({ message: 'Cible bannie', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors du bannissement', type: 'error' }); },
  });

  const reports = Array.isArray(data) ? data : data?.reports ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Signalements</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto font-bold">&times;</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Signalements</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des signalements fraude, spam et abus</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Signalé par</th>
                  <th className="p-4 font-medium">Cible</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 text-xs text-gray-900 dark:text-gray-100">{r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '-'}</td>
                    <td className="p-4 text-gray-500">{r.reporter?.name || r.reporter?.email || r.reporterId?.slice(0, 8) || '-'}</td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">{r.target?.name || r.target?.email || r.targetId?.slice(0, 8) || '-'}</td>
                    <td className="p-4">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{r.type || '-'}</span>
                    </td>
                    <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate">{r.description || r.reason || '-'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        r.status === 'REJECTED' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{r.status || 'PENDING'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {r.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="xs" onClick={() => approveMutation.mutate(r.id)}>
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Approuver
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => rejectMutation.mutate(r.id)}>
                              <XCircle className="h-3.5 w-3.5 text-red-500" /> Rejeter
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => banTargetMutation.mutate(r.id)}>
                          <Ban className="h-3.5 w-3.5 text-amber-500" /> Bannir cible
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<FileText className="h-8 w-8" />} title="Aucun signalement" description={`Aucun signalement de type « ${TABS.find((t) => t.id === activeTab)?.label || activeTab} » trouvé.`} />
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
