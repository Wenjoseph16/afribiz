'use client';

import { useState, useEffect } from 'react';
import {
  Save, Shield, Download, Trash2, AlertTriangle,
  Clock, FileText, BarChart3, Bell, HardDrive,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const DATA_TYPES = [
  { key: 'logs', label: 'Journaux système', icon: FileText, defaultDays: 90 },
  { key: 'analytics', label: 'Analytiques', icon: BarChart3, defaultDays: 365 },
  { key: 'notifications', label: 'Notifications', icon: Bell, defaultDays: 180 },
  { key: 'backups', label: 'Sauvegardes', icon: HardDrive, defaultDays: 730 },
  { key: 'audit_trail', label: 'Piste d\'audit', icon: Clock, defaultDays: 365 },
  { key: 'export_history', label: 'Historique des exports', icon: Download, defaultDays: 90 },
];

const DATA_TYPES_FOR_EXPORT = [
  { value: 'users', label: 'Utilisateurs' },
  { value: 'businesses', label: 'Commerces' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'logs', label: 'Journaux' },
  { value: 'analytics', label: 'Analytiques' },
  { value: 'bookings', label: 'Réservations' },
  { value: 'orders', label: 'Commandes' },
  { value: 'messages', label: 'Messages' },
];

const TABS_LIST = [
  { id: 'retention', label: 'Rétention', icon: Clock },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'cleanup', label: 'Nettoyage', icon: Trash2 },
];

const UNIT_OPTIONS = [
  { value: 'days', label: 'Jours' },
  { value: 'months', label: 'Mois' },
  { value: 'years', label: 'Années' },
];

const DEFAULT_RETENTION: Record<string, { value: number; unit: string }> = {};
DATA_TYPES.forEach((dt) => { DEFAULT_RETENTION[dt.key] = { value: dt.defaultDays, unit: 'days' }; });

export default function AdminDataRetentionPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('retention');
  const [retention, setRetention] = useState<any>(DEFAULT_RETENTION);
  const [exportType, setExportType] = useState('users');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [cleanupType, setCleanupType] = useState('logs');
  const [cleanupDate, setCleanupDate] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'datahub'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings');
      return res.data.data?.datahub || {};
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settings?.retention) setRetention(settings.retention);
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/admin/settings', { datahub: { retention: data } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'settings', 'datahub'] }); setToast({ message: 'Politiques de rétention enregistrées', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de l\'enregistrement', type: 'error' }),
  });

  const exportMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/data/export', data),
    onSuccess: () => setToast({ message: 'Export démarré. Vérifiez vos notifications.', type: 'success' }),
    onError: () => setToast({ message: 'Erreur lors de l\'export', type: 'error' }),
  });

  const purgeMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/data/purge', data),
    onSuccess: () => { setConfirmPurge(false); setToast({ message: 'Purge effectuée', type: 'success' }); },
    onError: () => setToast({ message: 'Erreur lors de la purge', type: 'error' }),
  });

  const saveRetention = () => { updateMutation.mutate(retention); };
  const handleExport = () => { exportMutation.mutate({ type: exportType, dateFrom: exportFrom || undefined, dateTo: exportTo || undefined }); };
  const handlePurge = () => { purgeMutation.mutate({ type: cleanupType, before: cleanupDate }); };

  const updateRetention = (key: string, field: string, value: any) => {
    setRetention((prev: any) => ({
      ...prev,
      [key]: { ...(prev[key] || { value: 90, unit: 'days' }), [field]: value },
    }));
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Rétention des données</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Rétention des données</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez la conservation, l&apos;export et le nettoyage des données</p>
        </div>
      </div>

      <Tabs tabs={TABS_LIST.map(t => ({ id: t.id, label: t.label, icon: t.icon({ className: 'h-4 w-4' }) }))}
        activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      {/* Retention Policies */}
      {activeTab === 'retention' && (
        <div className="space-y-4">
          {isLoading ? (
            <Loader className="py-12" />
          ) : (
            <>
              {DATA_TYPES.map((dt) => {
                const Icon = dt.icon;
                const r = retention[dt.key] || { value: dt.defaultDays, unit: 'days' };
                return (
                  <Card key={dt.key}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{dt.label}</p>
                          <p className="text-xs text-gray-500">Par défaut : {dt.defaultDays} jours</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={r.value} onChange={(e) => updateRetention(dt.key, 'value', Number(e.target.value))}
                          className="!w-24" min={1} />
                        <select value={r.unit} onChange={(e) => updateRetention(dt.key, 'unit', e.target.value)}
                          className="px-3 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                          {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </Card>
                );
              })}

              <div className="flex justify-end">
                <Button onClick={saveRetention} isLoading={updateMutation.isPending}>
                  <Save className="h-4 w-4" /> Enregistrer les politiques
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Data Export */}
      {activeTab === 'export' && (
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de données</label>
              <select value={exportType} onChange={(e) => setExportType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                {DATA_TYPES_FOR_EXPORT.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Du</label>
                <input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Au</label>
                <input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
              </div>
            </div>
            <Button onClick={handleExport} isLoading={exportMutation.isPending}>
              <Download className="h-4 w-4" /> Exporter
            </Button>
          </div>
        </Card>
      )}

      {/* Data Cleanup */}
      {activeTab === 'cleanup' && (
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de données à purger</label>
              <select value={cleanupType} onChange={(e) => setCleanupType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                {DATA_TYPES.map((dt) => <option key={dt.key} value={dt.key}>{dt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Purger les données antérieures au</label>
              <input type="date" value={cleanupDate} onChange={(e) => setCleanupDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">Cette action est irréversible. Assurez-vous d&apos;avoir exporté les données importantes avant de les purger.</p>
            </div>

            {!confirmPurge ? (
              <Button variant="danger" onClick={() => setConfirmPurge(true)} disabled={!cleanupDate}>
                <Trash2 className="h-4 w-4" /> Purger les données
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400 flex-1">Confirmer la purge irréversible ?</p>
                <Button variant="danger" size="sm" onClick={handlePurge} isLoading={purgeMutation.isPending}>
                  <Trash2 className="h-4 w-4" /> Confirmer
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirmPurge(false)}>Annuler</Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
