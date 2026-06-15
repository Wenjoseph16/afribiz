'use client';

import { useState, useMemo, useEffect } from 'react';
import { Activity, Search, Loader, User, CalendarDays, Filter, Repeat, CreditCard, XCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

const ACTION_ICONS: Record<string, any> = {
  SUBSCRIBED: User, RENEWED: Repeat, CANCELLED: XCircle,
  PAYMENT: CreditCard, ACTIVATED: CheckCircle, EXPIRED: XCircle,
};

export default function SubscriptionLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getSubscriptionLogs({ limit: 200, order: 'desc' });
        const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.logs || res.data.data?.activities || []);
        setLogs(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((l: any) => l.action));
    return Array.from(actions);
  }, [logs]);

  const filtered = logs.filter((log: any) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (log.description || '').toLowerCase().includes(q) || (log.clientName || log.subscriberName || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activités abonnements</h1>
        <p className="text-sm text-gray-500">Historique complet des actions sur les abonnements</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><Activity className="w-4 h-4 text-brand mb-1" /><p className="text-[10px] text-gray-500">Total activités</p><p className="text-lg font-bold">{logs.length}</p></Card>
        <Card className="p-3"><User className="w-4 h-4 text-blue-600 mb-1" /><p className="text-[10px] text-gray-500">Souscriptions</p><p className="text-lg font-bold">{logs.filter((l: any) => l.action === 'SUBSCRIBED').length}</p></Card>
        <Card className="p-3"><Repeat className="w-4 h-4 text-emerald-600 mb-1" /><p className="text-[10px] text-gray-500">Renouvellements</p><p className="text-lg font-bold">{logs.filter((l: any) => l.action === 'RENEWED').length}</p></Card>
        <Card className="p-3"><CreditCard className="w-4 h-4 text-amber-600 mb-1" /><p className="text-[10px] text-gray-500">Paiements</p><p className="text-lg font-bold">{logs.filter((l: any) => l.action === 'PAYMENT').length}</p></Card>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setActionFilter('all')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
              actionFilter === 'all' ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>Tous</button>
          {['SUBSCRIBED', 'RENEWED', 'CANCELLED', 'PAYMENT', 'EXPIRED'].map(action => (
            <button key={action} onClick={() => setActionFilter(action)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                actionFilter === action ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>
              {action === 'SUBSCRIBED' ? 'Souscriptions' : action === 'RENEWED' ? 'Renouvellements' : action === 'CANCELLED' ? 'Résiliations' : action === 'PAYMENT' ? 'Paiements' : 'Expirations'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Activity className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune activité trouvée</p></Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {filtered.map((log: any) => {
              const Icon = ACTION_ICONS[log.action] || Activity;
              return (
                <div key={log.id} className="relative flex items-start gap-4 pl-0">
                  <div className={cn('p-2 rounded-xl z-10',
                    log.action === 'SUBSCRIBED' ? 'bg-emerald-50' :
                    log.action === 'RENEWED' ? 'bg-blue-50' :
                    log.action === 'CANCELLED' || log.action === 'EXPIRED' ? 'bg-red-50' : 'bg-amber-50')}>
                    <Icon className={cn('w-4 h-4',
                      log.action === 'SUBSCRIBED' ? 'text-emerald-600' :
                      log.action === 'RENEWED' ? 'text-blue-600' :
                      log.action === 'CANCELLED' || log.action === 'EXPIRED' ? 'text-red-600' : 'text-amber-600')} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.clientName || log.subscriberName || 'Client'}
                      <span className="text-gray-500 font-normal"> — {log.description || log.action}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                      <CalendarDays className="w-3 h-3" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      {log.amount && <Badge variant="info" size="xs">{(log.amount || 0).toLocaleString()} FCFA</Badge>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
