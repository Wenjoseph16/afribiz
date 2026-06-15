'use client';

import { useState } from 'react';
import { Megaphone, Plus, Search, CalendarDays, Clock, Target, TrendingUp, Users, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { usePromoCampaigns } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  DRAFT: { label: 'Brouillon', variant: 'default', color: 'bg-gray-100 text-gray-600' },
  ACTIVE: { label: 'Active', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  PAUSED: { label: 'En pause', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Terminée', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Annulée', variant: 'danger', color: 'bg-red-100 text-red-700' },
};

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', channel: 'ALL', budget: '', startDate: '', endDate: '', target: '' });

  const { data: campaignsData, isLoading, refetch } = usePromoCampaigns({ limit: 100 });
  const allCampaigns: any[] = Array.isArray(campaignsData) ? campaignsData : (campaignsData?.campaigns || campaignsData?.data || []);

  const filtered = allCampaigns.filter((c: any) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) { const q = search.toLowerCase(); return (c.name || '').toLowerCase().includes(q); }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createPromoCampaign({
        name: form.name,
        description: form.description || undefined,
        channel: form.channel,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        target: form.target || undefined,
      });
      setShowCreate(false);
      setForm({ name: '', description: '', channel: 'ALL', budget: '', startDate: '', endDate: '', target: '' });
      refetch();
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campagnes marketing</h1><p className="text-sm text-gray-500">Créez et gérez vos campagnes promotionnelles</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />Nouvelle campagne</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Megaphone className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total</p><p className="text-sm font-bold">{allCampaigns.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><TrendingUp className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Actives</p><p className="text-sm font-bold">{allCampaigns.filter((c: any) => c.status === 'ACTIVE').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><Target className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Terminées</p><p className="text-sm font-bold">{allCampaigns.filter((c: any) => c.status === 'COMPLETED').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Budget total</p><p className="text-sm font-bold">{formatPrice(allCampaigns.reduce((s: number, c: any) => s + Number(c.budget || 0), 0))}</p></div></div></Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {[{ key: 'all', label: 'Toutes' }, { key: 'DRAFT', label: 'Brouillons' }, { key: 'ACTIVE', label: 'Actives' },
            { key: 'PAUSED', label: 'En pause' }, { key: 'COMPLETED', label: 'Terminées' }, { key: 'CANCELLED', label: 'Annulées' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')}>{t.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher une campagne..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Megaphone className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune campagne trouvée</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((campaign: any) => {
            const s = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
            const isActive = campaign.status === 'ACTIVE';
            return (
              <Card key={campaign.id} className={cn('p-4', isActive && 'ring-1 ring-brand/20')}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn('p-2 rounded-xl', s.color)}><Megaphone className="w-5 h-5" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{campaign.name}</h3>
                        <Badge variant={s.variant} size="xs">{s.label}</Badge>
                      </div>
                      {campaign.description && <p className="text-xs text-gray-500 mt-1">{campaign.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 flex-wrap">
                        {campaign.channel && <span className="flex items-center gap-1"><Send className="w-3 h-3" />{campaign.channel}</span>}
                        {campaign.target && <span className="flex items-center gap-1"><Users className="w-3 h-3" />Cible: {campaign.target}</span>}
                        {campaign.startDate && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(campaign.startDate).toLocaleDateString('fr-FR')}</span>}
                        {campaign.budget && <span>Budget: {formatPrice(Number(campaign.budget))}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {campaign.budget && <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(campaign.budget))}</p>}
                    {campaign.spent && <p className="text-[10px] text-gray-400">Dépensé: {formatPrice(Number(campaign.spent))}</p>}
                  </div>
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
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nouvelle campagne</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Canal</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                    <option value="ALL">Tous les canaux</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Push</option>
                    <option value="SOCIAL">Réseaux sociaux</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Budget</label>
                  <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date début</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date fin</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cible</label>
                <input type="text" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="Ex: Nouveaux clients, VIP, Tous"
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button type="submit" disabled={!form.name} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
