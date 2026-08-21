'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/services/apiClient';
import { getPendingSyncItems, getPendingSyncCount } from '@/lib/offline/queue';
import { flushSyncQueue } from '@/lib/offline/sync';

export default function OfflineSyncPage() {
  const [items, setItems] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [clientPending, setClientPending] = useState(0);
  const [clientItems, setClientItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsRes, countRes] = await Promise.all([
        apiClient.getSyncItems().catch(() => ({ data: { data: [] } })),
        apiClient.getPendingSyncCount().catch(() => ({ data: { data: { count: 0 } } })),
      ]);
      setItems(itemsRes.data?.data || []);
      setPendingCount(countRes.data?.data?.count || 0);

      // File CLIENT (IndexedDB) — les actions hors-ligne en attente
      try {
        const clientPendingItems = await getPendingSyncItems();
        setClientItems(clientPendingItems);
        setClientPending(await getPendingSyncCount());
      } catch {
        setClientItems([]);
        setClientPending(0);
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncErrors(0);
    let failures = 0;

    // 1. File CLIENT (IndexedDB) : rejouée via le serveur (actions réelles)
    if (clientPending > 0) {
      try {
        const result = await flushSyncQueue();
        failures += result.failed;
      } catch {
        failures += clientPending;
      }
    }

    // 2. File SERVEUR : marquer les PENDING comme traitées
    const pending = items.filter((i) => i.status === 'PENDING');
    for (const item of pending) {
      try {
        await apiClient.processSyncItem(item.id);
      } catch {
        failures++;
      }
    }
    setSyncErrors(failures);
    await loadData();
    setSyncing(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );

  const syncedCount = items.filter((i) => i.status === 'SYNCED').length;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Mode Hors-ligne"
        description="Service Worker, cache local, synchronisation automatique"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Mode hors-ligne' }]}
        actions={
          <button
            onClick={handleSyncAll}
            disabled={syncing || (pendingCount === 0 && clientPending === 0)}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing
              ? 'Synchro...'
              : `Sync (${clientPending > 0 ? clientPending + ' local + ' : ''}${pendingCount})`}
            {syncErrors > 0 && !syncing && (
              <span className="ml-2 text-xs text-red-500">{syncErrors} échec(s)</span>
            )}
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Éléments en cache',
            value: String(items.length),
            icon: HardDrive,
            color: 'text-blue-500',
            desc: 'Total',
          },
          {
            label: 'En attente',
            value: String(pendingCount),
            icon: Upload,
            color: 'text-amber-500',
            desc: 'File serveur',
          },
          {
            label: 'Sur ce téléphone',
            value: String(clientPending),
            icon: HardDrive,
            color: 'text-violet-500',
            desc: 'File locale (IndexedDB)',
          },
          {
            label: 'Synchronisés',
            value: String(syncedCount),
            icon: CheckCircle2,
            color: 'text-green-500',
            desc: 'Terminés',
          },
          {
            label: 'Statut',
            value: isOnline ? 'En ligne' : 'Hors-ligne',
            icon: isOnline ? Wifi : WifiOff,
            color: isOnline ? 'text-green-500' : 'text-red-500',
            desc: 'Connexion',
          },
        ].map((f) => (
          <Card key={f.label} className="p-5">
            <f.icon className={`w-8 h-8 ${f.color}`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{f.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{f.label}</p>
            <p className="text-xs text-gray-400 mt-1">{f.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            File de synchronisation
          </h3>
        </div>
        {items.length === 0 && clientItems.length === 0 ? (
          <div className="p-8 text-center">
            <WifiOff className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Aucun élément
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Toutes les données sont à jour. Les éléments apparaîtront ici lorsque vous
              travaillerez hors-ligne.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* File CLIENT (IndexedDB) — actions hors-ligne en attente sur ce téléphone */}
            {clientItems.map((item: any) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between bg-violet-50/40 dark:bg-violet-950/20"
              >
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-violet-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.action === 'CREATE_BUSINESS_ORDER'
                        ? 'Vente POS (hors-ligne)'
                        : item.entityType}{' '}
                      <span className="text-xs text-gray-400">#{item.id?.substring(0, 8)}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Sur ce téléphone · {new Date(item.createdAt).toLocaleString('fr-FR')}
                      {item.lastError ? ` · ${item.lastError}` : ''}
                    </p>
                  </div>
                </div>
                <Badge variant="warning">LOCAL</Badge>
              </div>
            ))}
            {/* File SERVEUR */}
            {items.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(item.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.entityType} #{item.entityId?.substring(0, 8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.action} ·{' '}
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === 'SYNCED'
                      ? 'success'
                      : item.status === 'FAILED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
