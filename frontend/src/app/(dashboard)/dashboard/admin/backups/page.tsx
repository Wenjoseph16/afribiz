'use client';

import { useState } from 'react';
import {
  Database, Download, Upload, RefreshCw, ChevronLeft, ChevronRight,
  Shield, CheckCircle, XCircle, Clock, HardDrive,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

export default function AdminBackupsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [page, setPage] = useState(1);
  const limit = 15;
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'backups', page],
    queryFn: async () => {
      const res = await apiClient.get('/admin/backups', { params: { page, limit } });
      return res.data.data || { status: {}, history: [], totalPages: 1 };
    },
    enabled: isAdmin,
  });

  const runBackupMutation = useMutation({
    mutationFn: () => apiClient.post('/admin/backups'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'backups'] }); setToast({ message: 'Sauvegarde lancée avec succès', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' }); },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/backups/${id}/restore`),
    onSuccess: () => { setShowRestoreConfirm(null); qc.invalidateQueries({ queryKey: ['admin', 'backups'] }); setToast({ message: 'Restauration effectuée', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la restauration', type: 'error' }); },
  });

  const toggleAutoBackupMutation = useMutation({
    mutationFn: (enabled: boolean) => apiClient.put('/admin/backups/auto', { enabled }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'backups'] }); setToast({ message: 'Sauvegarde automatique mise à jour', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur lors de la mise à jour', type: 'error' }); },
  });

  const downloadMutation = useMutation({
    mutationFn: (id: string) => apiClient.get(`/admin/backups/${id}/download`, { responseType: 'blob' }),
    onSuccess: () => { setToast({ message: 'Téléchargement démarré', type: 'success' }); },
    onError: () => { setToast({ message: 'Erreur de téléchargement', type: 'error' }); },
  });

  const status = data?.status || {};
  const history = Array.isArray(data?.history) ? data.history : [];
  const totalPages = data?.totalPages ?? 1;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Sauvegardes</h1>
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

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Sauvegardes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion des sauvegardes de la plateforme</p>
        </div>
        <Button onClick={() => runBackupMutation.mutate()} isLoading={runBackupMutation.isPending}>
          <RefreshCw className="h-4 w-4" /> Lancer sauvegarde
        </Button>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Clock className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-gray-500">Dernière sauvegarde</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{status.lastBackup ? new Date(status.lastBackup).toLocaleString('fr-FR') : '-'}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><HardDrive className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-gray-500">Nombre de sauvegardes</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{status.totalBackups ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><Database className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-gray-500">Sauvegarde auto</p>
              <p className="text-sm font-semibold">
                <span className={status.autoBackup ? 'text-emerald-600' : 'text-gray-400'}>{status.autoBackup ? 'Activée' : 'Désactivée'}</span>
              </p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.integrity === 'OK' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}>
              {status.integrity === 'OK' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-xs text-gray-500">Intégrité</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{status.integrity || '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Auto-backup toggle & Restore actions */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={status.autoBackup || false}
              onClick={() => toggleAutoBackupMutation.mutate(!status.autoBackup)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${status.autoBackup ? 'bg-brand' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status.autoBackup ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sauvegarde automatique</span>
          </label>
          <Button variant="secondary" size="sm" onClick={() => runBackupMutation.mutate()} isLoading={runBackupMutation.isPending}>
            <Upload className="h-4 w-4" /> Lancer une sauvegarde manuelle
          </Button>
        </div>
      </Card>

      {/* History Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Taille</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((b: any) => (
                  <tr key={b.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 text-xs text-gray-900 dark:text-gray-100">{b.createdAt || b.date ? new Date(b.createdAt || b.date).toLocaleString('fr-FR') : '-'}</td>
                    <td className="p-4 text-xs text-gray-500">{b.size ? `${(b.size / (1024 * 1024)).toFixed(2)} Mo` : '-'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        b.type === 'auto' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>{b.type === 'auto' ? 'Automatique' : 'Manuelle'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium flex items-center gap-1 ${
                        b.status === 'COMPLETED' ? 'text-emerald-600' : b.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {b.status === 'COMPLETED' && <CheckCircle className="h-3 w-3" />}
                        {b.status === 'FAILED' && <XCircle className="h-3 w-3" />}
                        {b.status === 'RUNNING' && <RefreshCw className="h-3 w-3 animate-spin" />}
                        {b.status || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="xs" onClick={() => setShowRestoreConfirm(b.id)}>
                          <Upload className="h-3.5 w-3.5" /> Restaurer
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => downloadMutation.mutate(b.id)}>
                          <Download className="h-3.5 w-3.5" /> Télécharger
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<Database className="h-8 w-8" />} title="Aucune sauvegarde" description="Lancer une sauvegarde pour voir l'historique." />
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

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Confirmer la restauration</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action peut entraîner une perte de données récentes.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowRestoreConfirm(null)}>Annuler</Button>
              <Button variant="danger" onClick={() => restoreMutation.mutate(showRestoreConfirm)} isLoading={restoreMutation.isPending}>
                <Upload className="h-4 w-4" /> Restaurer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
