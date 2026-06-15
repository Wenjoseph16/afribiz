'use client';

import { useState } from 'react';
import { Shield, Search, Loader, User, Phone, AlertTriangle, CheckCircle2, DollarSign, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useClientRisks, useUpdateClientRisk } from '@/features/hooks';

const RISK_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }> = {
  LOW: { label: 'Faible', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  MEDIUM: { label: 'Moyen', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  HIGH: { label: 'Élevé', variant: 'danger', color: 'bg-orange-100 text-orange-700' },
  CRITICAL: { label: 'Critique', variant: 'danger', color: 'bg-red-100 text-red-700' },
};

export default function ClientRisksPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const params = { limit: 100, riskLevel: filter !== 'all' ? filter : undefined, search: search || undefined };
  const { data, isLoading } = useClientRisks(params);
  const updateRisk = useUpdateClientRisk();

  const allRisks: any[] = Array.isArray(data) ? data : (data?.risks || data?.items || []);
  const highRisk = allRisks.filter((r: any) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL');

  const updateRiskLevel = async (id: string, level: string) => {
    try {
      await updateRisk.mutateAsync({ clientId: id, riskLevel: level });
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Risques Clients</h1>
        <p className="text-sm text-gray-500">Évaluez et gérez les risques clients</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Shield className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total</p><p className="text-sm font-bold">{allRisks.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Faible risque</p><p className="text-sm font-bold">{allRisks.filter((r: any) => r.riskLevel === 'LOW').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><AlertTriangle className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Moyen</p><p className="text-sm font-bold">{allRisks.filter((r: any) => r.riskLevel === 'MEDIUM').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100"><AlertTriangle className="w-4 h-4 text-red-600" /></div><div><p className="text-[10px] text-gray-500">Haut risque</p><p className="text-sm font-bold">{highRisk.length}</p></div></div></Card>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'all', label: 'Tous' }, { key: 'LOW', label: 'Faible' },
            { key: 'MEDIUM', label: 'Moyen' }, { key: 'HIGH', label: 'Élevé' },
            { key: 'CRITICAL', label: 'Critique' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par client..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* Risk Cards */}
      {allRisks.length === 0 ? (
        <Card className="text-center py-12"><Shield className="h-12 w-12 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun client évalué</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allRisks.map((risk: any) => {
            const r = RISK_CONFIG[risk.riskLevel] || RISK_CONFIG.LOW;
            const score = risk.reliabilityScore ?? 75;
            return (
              <Card key={risk.id} className={cn('p-4', risk.blacklisted && 'ring-2 ring-red-300 dark:ring-red-700')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-lg', r.color)}><User className="w-4 h-4" /></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{risk.customerName || 'Client'}</p>
                      {risk.customerPhone && <p className="text-[10px] text-gray-400">{risk.customerPhone}</p>}
                    </div>
                  </div>
                  <Badge variant={r.variant} size="xs">{r.label}</Badge>
                </div>

                {/* Score */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Fiabilité</span><span className="font-medium">{score}/100</span></div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${score}%` }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{risk.incidentCount || 0} incidents</span>
                  {risk.requireDeposit && <span className="flex items-center gap-1 text-amber-600"><DollarSign className="w-3 h-3" />Acompte requis</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-wrap">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(level => (
                    <button key={level} onClick={() => updateRiskLevel(risk.id, level)}
                      className={cn('px-2 py-0.5 rounded text-[9px] font-medium border transition-colors',
                        risk.riskLevel === level
                          ? 'bg-brand text-white border-brand'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}>{level}</button>
                  ))}
                  {risk.blacklisted && <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-red-100 text-red-700">Blacklisté</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
