'use client';

import { useState } from 'react';
import { Scale, Search, AlertTriangle, CheckCircle, Clock, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useDisputes } from '@/features/hooks';

const STATUS_TABS = ['TOUS', 'OUVERT', 'EN_COURS', 'RESOLU', 'FERME'];

export default function DisputesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');

  const { data: disputes, isLoading } = useDisputes();

  const list: any[] = Array.isArray(disputes) ? disputes : [];
  const filtered = list.filter((d: any) => {
    if (search && !d.title?.toLowerCase().includes(search.toLowerCase()) && !d.reference?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'TOUS' && d.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: list.length,
    ouvert: list.filter((d: any) => d.status === 'OUVERT').length,
    enCours: list.filter((d: any) => d.status === 'EN_COURS').length,
    resolu: list.filter((d: any) => d.status === 'RESOLU').length,
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'OUVERT': return <Badge className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">Ouvert</Badge>;
      case 'EN_COURS': return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">En cours</Badge>;
      case 'RESOLU': return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Résolu</Badge>;
      case 'FERME': return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Fermé</Badge>;
      default: return <Badge>{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Litiges"
        description="Gérez les réclamations et litiges avec vos clients"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Litiges' }]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">Total</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-red-600">{stats.ouvert}</p><p className="text-sm text-gray-500">Ouverts</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-amber-600">{stats.enCours}</p><p className="text-sm text-gray-500">En cours</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-emerald-600">{stats.resolu}</p><p className="text-sm text-gray-500">Résolus</p></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un litige..." className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button key={t} onClick={() => setStatusFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === t ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>{t === 'TOUS' ? 'Tous' : t === 'EN_COURS' ? 'En cours' : t.charAt(0) + t.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Scale className="h-12 w-12 text-gray-400" />} title="Aucun litige" description="Vous n'avez pas de litige pour le moment" />
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => (
            <Card key={d.id} className="p-4 hover:border-brand/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-xl ${d.status === 'OUVERT' ? 'bg-red-50' : d.status === 'EN_COURS' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    {d.status === 'RESOLU' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className={`h-5 w-5 ${d.status === 'OUVERT' ? 'text-red-600' : 'text-amber-600'}`} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{d.title || 'Litige'}</p>
                      {statusBadge(d.status)}
                    </div>
                    {d.reference && <p className="text-xs text-gray-500 mt-0.5">Réf: {d.reference}</p>}
                    {d.description && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{d.description}</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm"><MessageCircle className="h-3.5 w-3.5" /></Button>
                  {d.status !== 'RESOLU' && d.status !== 'FERME' && (
                    <Button variant="outline" size="sm"><ThumbsUp className="h-3.5 w-3.5 text-emerald-600" /></Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
