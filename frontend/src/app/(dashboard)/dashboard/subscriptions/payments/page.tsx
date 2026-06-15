'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Search, Loader, User, CalendarDays, CheckCircle, XCircle, Clock, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

export default function SubscriptionPaymentsPage() {
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecord, setShowRecord] = useState(false);
  const [form, setForm] = useState({ subscriberId: '', amount: 0, method: 'CASH', notes: '' });
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.getSubscriptionPayments({ limit: 200, order: 'desc' });
        const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.payments || []);
        setPayments(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const filtered = payments.filter((p: any) =>
    !search || p.subscriberName?.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = useMemo(() => ({
    total: payments.reduce((s: number, p: any) => s + (p.amount || 0), 0),
    count: payments.length,
    succeeded: payments.filter((p: any) => p.status === 'SUCCEEDED' || p.status === 'COMPLETED').length,
    failed: payments.filter((p: any) => p.status === 'FAILED').length,
  }), [payments]);

  const handleRecord = async () => {
    if (!form.subscriberId || !form.amount) return;
    setRecording(true);
    try {
      await apiClient.recordSubscriptionPayment(form);
      setShowRecord(false);
      setForm({ subscriberId: '', amount: 0, method: 'CASH', notes: '' });
      const res = await apiClient.getSubscriptionPayments({ limit: 200, order: 'desc' });
      const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.payments || []);
      setPayments(data);
    } catch (err) { console.error(err); }
    setRecording(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiements abonnements</h1><p className="text-sm text-gray-500">Historique des paiements récurrents</p></div>
        <Button size="sm" onClick={() => setShowRecord(true)}><Plus className="h-4 w-4 mr-1.5" />Enregistrer paiement</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><CreditCard className="w-4 h-4 text-brand mb-1" /><p className="text-[10px] text-gray-500">Total</p><p className="text-lg font-bold">{stats.count}</p></Card>
        <Card className="p-3"><CheckCircle className="w-4 h-4 text-emerald-600 mb-1" /><p className="text-[10px] text-gray-500">Réussis</p><p className="text-lg font-bold text-emerald-600">{stats.succeeded}</p></Card>
        <Card className="p-3"><XCircle className="w-4 h-4 text-red-600 mb-1" /><p className="text-[10px] text-gray-500">Échoués</p><p className="text-lg font-bold text-red-600">{stats.failed}</p></Card>
        <Card className="p-3"><CreditCard className="w-4 h-4 text-blue-600 mb-1" /><p className="text-[10px] text-gray-500">Montant total</p><p className="text-lg font-bold">{stats.total.toLocaleString()} FCFA</p></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher par client..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12"><CreditCard className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun paiement trouvé</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <Card key={p.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', p.status === 'SUCCEEDED' || p.status === 'COMPLETED' ? 'bg-emerald-50' : p.status === 'FAILED' ? 'bg-red-50' : 'bg-amber-50')}>
                    {p.status === 'SUCCEEDED' || p.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                     p.status === 'FAILED' ? <XCircle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.clientName || p.subscriberName || 'Client'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <CalendarDays className="w-3 h-3" />{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '—'}
                      <Badge variant="info" size="xs">{p.method || p.paymentMethod || 'CASH'}</Badge>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{(p.amount || 0).toLocaleString()} FCFA</p>
                  <Badge variant={p.status === 'SUCCEEDED' || p.status === 'COMPLETED' ? 'success' : p.status === 'FAILED' ? 'danger' : 'warning'} size="xs">
                    {p.status === 'SUCCEEDED' || p.status === 'COMPLETED' ? 'Payé' : p.status === 'FAILED' ? 'Échoué' : 'En attente'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowRecord(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Enregistrer un paiement</h3>
              <button onClick={() => setShowRecord(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">ID abonné</label>
                <input type="text" value={form.subscriberId} onChange={e => setForm(f => ({ ...f, subscriberId: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="ID de l'abonné" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Méthode</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  <option value="CASH">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARD">Carte bancaire</option>
                  <option value="BANK_TRANSFER">Virement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowRecord(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleRecord} disabled={recording || !form.amount} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {recording ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
