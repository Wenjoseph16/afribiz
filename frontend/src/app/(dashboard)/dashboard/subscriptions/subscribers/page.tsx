'use client';

import { useState, useMemo } from 'react';
import { Users, Search, Loader, User, CalendarDays, CreditCard, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSubscribers, useSubscriptionPlans } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  EXPIRED: { label: 'Expiré', variant: 'danger' },
  CANCELLED: { label: 'Résilié', variant: 'warning' },
  SUSPENDED: { label: 'Suspendu', variant: 'info' },
};

export default function SubscribersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ planId: '', clientName: '', clientPhone: '', clientEmail: '' });
  const [creating, setCreating] = useState(false);

  const { data: subsData, isLoading, refetch } = useSubscribers({ limit: 200 });
  const { data: plansData } = useSubscriptionPlans();

  const subscribers: any[] = useMemo(() => {
    const raw = Array.isArray(subsData) ? subsData : (subsData?.subscribers || subsData?.data || []);
    return raw;
  }, [subsData]);

  const plans: any[] = useMemo(() => {
    const raw = Array.isArray(plansData) ? plansData : (plansData?.plans || plansData?.data || []);
    return raw;
  }, [plansData]);

  const filtered = subscribers.filter((s: any) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.clientName || '').toLowerCase().includes(q) || (s.clientEmail || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCancel = async (id: string) => {
    try { await apiClient.cancelSubscription(id); refetch(); } catch (err) { console.error(err); }
  };

  const handleRenew = async (id: string) => {
    try { await apiClient.renewSubscription(id); refetch(); } catch (err) { console.error(err); }
  };

  const handleCreate = async () => {
    if (!createForm.planId || !createForm.clientName) return;
    setCreating(true);
    try {
      await apiClient.createSubscription(createForm);
      setShowCreate(false);
      setCreateForm({ planId: '', clientName: '', clientPhone: '', clientEmail: '' });
      refetch();
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const stats = useMemo(() => ({
    active: subscribers.filter((s: any) => s.status === 'ACTIVE').length,
    expired: subscribers.filter((s: any) => s.status === 'EXPIRED').length,
    cancelled: subscribers.filter((s: any) => s.status === 'CANCELLED').length,
    revenue: subscribers.reduce((sum: number, s: any) => sum + (s.amount || s.plan?.price || 0), 0),
  }), [subscribers]);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Abonnés</h1><p className="text-sm text-gray-500">Gérez les clients abonnés à vos formules</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Users className="h-4 w-4 mr-1.5" />Nouvel abonné</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><Users className="w-4 h-4 text-brand mb-1" /><p className="text-[10px] text-gray-500">Total</p><p className="text-lg font-bold">{subscribers.length}</p></Card>
        <Card className="p-3"><CheckCircle className="w-4 h-4 text-emerald-600 mb-1" /><p className="text-[10px] text-gray-500">Actifs</p><p className="text-lg font-bold text-emerald-600">{stats.active}</p></Card>
        <Card className="p-3"><Clock className="w-4 h-4 text-amber-600 mb-1" /><p className="text-[10px] text-gray-500">Expirés</p><p className="text-lg font-bold text-amber-600">{stats.expired}</p></Card>
        <Card className="p-3"><CreditCard className="w-4 h-4 text-blue-600 mb-1" /><p className="text-[10px] text-gray-500">Revenus</p><p className="text-lg font-bold">{stats.revenue.toLocaleString()} FCFA</p></Card>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex gap-1 overflow-x-auto">
          {[{ key: 'all', label: 'Tous' }, { key: 'ACTIVE', label: 'Actifs' }, { key: 'EXPIRED', label: 'Expirés' }, { key: 'CANCELLED', label: 'Résiliés' }, { key: 'SUSPENDED', label: 'Suspendus' }].map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                statusFilter === tab.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>{tab.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un abonné..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Users className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun abonné trouvé</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub: any) => {
            const sc = STATUS_CONFIG[sub.status] || STATUS_CONFIG.ACTIVE;
            const plan = plans.find((p: any) => p.id === sub.planId) || sub.plan;
            const isExpiring = sub.status === 'ACTIVE' && sub.endDate && new Date(sub.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-sm font-bold text-brand">
                      {(sub.clientName || '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{sub.clientName}</p>
                      <p className="text-xs text-gray-500">{plan?.name || sub.planName || 'Abonnement'} — {sub.clientEmail || sub.clientPhone || '—'}</p>
                      {sub.endDate && (
                        <p className={cn('text-[10px] mt-0.5 flex items-center gap-1', isExpiring ? 'text-amber-500' : 'text-gray-400')}>
                          <CalendarDays className="w-3 h-3" />Expire le {new Date(sub.endDate).toLocaleDateString('fr-FR')}
                          {isExpiring && ' (bientôt)'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sc.variant} size="xs">{sc.label}</Badge>
                    {sub.status === 'ACTIVE' && (
                      <button onClick={() => handleCancel(sub.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4" /></button>
                    )}
                    {(sub.status === 'EXPIRED' || sub.status === 'CANCELLED') && (
                      <button onClick={() => handleRenew(sub.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-500"><Clock className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
                {sub.amount && <p className="text-xs text-gray-400 mt-2">Montant : {sub.amount.toLocaleString()} FCFA</p>}
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nouvel abonné</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Formule *</label>
                <select value={createForm.planId} onChange={e => setCreateForm(f => ({ ...f, planId: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  <option value="">Sélectionner...</option>
                  {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.price?.toLocaleString()} FCFA</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom client *</label>
                <input type="text" value={createForm.clientName} onChange={e => setCreateForm(f => ({ ...f, clientName: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                <input type="tel" value={createForm.clientPhone} onChange={e => setCreateForm(f => ({ ...f, clientPhone: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                <input type="email" value={createForm.clientEmail} onChange={e => setCreateForm(f => ({ ...f, clientEmail: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleCreate} disabled={creating || !createForm.planId || !createForm.clientName} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
