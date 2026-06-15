'use client';

import { useState } from 'react';
import { Tag, Plus, Search, Copy, CheckCircle2, Loader, Clock, Percent, DollarSign, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePromoCoupons } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

export default function CouponsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', minPurchase: '', usageLimit: '', expiresAt: '' });
  const [copied, setCopied] = useState<string | null>(null);

  const { data: couponsData, isLoading, refetch } = usePromoCoupons({ limit: 100 });
  const allCoupons: any[] = Array.isArray(couponsData) ? couponsData : (couponsData?.coupons || couponsData?.data || []);

  const filtered = allCoupons.filter((c: any) => {
    if (filter !== 'all' && c.status !== filter && c.isActive?.toString() !== filter) return false;
    if (search) { const q = search.toLowerCase(); return (c.code || '').toLowerCase().includes(q); }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createPromoCoupon({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      });
      setShowCreate(false);
      setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', minPurchase: '', usageLimit: '', expiresAt: '' });
      refetch();
    } catch (err) { console.error(err); }
  };

  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000); } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coupons & Codes Promo</h1><p className="text-sm text-gray-500">Gérez vos codes de réduction et coupons clients</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />Nouveau coupon</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Tag className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total</p><p className="text-sm font-bold">{allCoupons.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Actifs</p><p className="text-sm font-bold">{allCoupons.filter((c: any) => c.isActive !== false).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Percent className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">% réduction</p><p className="text-sm font-bold">{allCoupons.filter((c: any) => c.discountType === 'PERCENTAGE').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><DollarSign className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Montant fixe</p><p className="text-sm font-bold">{allCoupons.filter((c: any) => c.discountType === 'FIXED').length}</p></div></div></Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {[{ key: 'all', label: 'Tous' }, { key: 'true', label: 'Actifs' }, { key: 'false', label: 'Inactifs' }].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300')}>{t.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par code promo..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Tag className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun coupon trouvé</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((coupon: any) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            return (
              <Card key={coupon.id} className={cn('p-4', isExpired && 'opacity-60')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-brand/10"><Tag className="w-4 h-4 text-brand" /></div>
                    <div>
                      <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{coupon.code}</p>
                      <p className="text-[10px] text-gray-400">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}</p>
                    </div>
                  </div>
                  <button onClick={() => copyCode(coupon.code)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand">
                    {copied === coupon.code ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  {coupon.minPurchase && <p>Achat min: {formatPrice(coupon.minPurchase)}</p>}
                  {coupon.usageLimit && <p>Limite: {coupon.usageLimit} utilisations</p>}
                  {coupon.expiresAt && <p className="flex items-center gap-1"><Clock className="w-3 h-3" />Expire: {new Date(coupon.expiresAt).toLocaleDateString('fr-FR')}</p>}
                </div>
                <div className="mt-3">
                  <Badge variant={isExpired ? 'danger' : coupon.isActive !== false ? 'success' : 'warning'} size="xs">
                    {isExpired ? 'Expiré' : coupon.isActive !== false ? 'Actif' : 'Inactif'}
                  </Badge>
                  {coupon.usedCount > 0 && <span className="ml-2 text-[10px] text-gray-400">{coupon.usedCount} utilisé(s)</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nouveau coupon</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Code promo *</label>
                <input type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required placeholder="EX: PROMO2025"
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                    <option value="PERCENTAGE">Pourcentage</option>
                    <option value="FIXED">Montant fixe</option>
                    <option value="FREE_SHIPPING">Livraison offerte</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Valeur *</label>
                  <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} required
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Achat min</label>
                  <input type="number" value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Limite d'utilisation</label>
                  <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date d'expiration</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90">Créer le coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
