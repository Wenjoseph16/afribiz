'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield, ShieldAlert, ShieldCheck, Users,
  AlertTriangle, Search, Loader, Ban,
  CheckCircle2, DollarSign, TrendingUp,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useClientRisks, useUpdateClientRisk } from '@/features/hooks';

interface ClientRisk {
  id: string;
  clientName: string;
  clientEmail: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  retardsPaiement: number;
  litiges: number;
  detteTotale: number;
  maxCredit: number;
  acompteRequis: boolean;
  blackliste: boolean;
}

const riskLevelConfig: Record<string, { label: string; class: string }> = {
  LOW: { label: 'Faible', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  MEDIUM: { label: 'Moyen', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  HIGH: { label: 'Élevé', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  CRITICAL: { label: 'Critique', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

function getScoreColor(score: number): string {
  if (score < 30) return 'text-red-600 dark:text-red-400';
  if (score < 50) return 'text-amber-600 dark:text-amber-400';
  if (score < 70) return 'text-blue-600 dark:text-blue-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function getScoreBg(score: number): string {
  if (score < 30) return 'bg-red-100 dark:bg-red-900/30';
  if (score < 50) return 'bg-amber-100 dark:bg-amber-900/30';
  if (score < 70) return 'bg-blue-100 dark:bg-blue-900/30';
  return 'bg-emerald-100 dark:bg-emerald-900/30';
}

export default function ClientRisksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: risksData, isLoading, error, refetch } = useClientRisks();
  const updateRisk = useUpdateClientRisk();

  const risks: ClientRisk[] = useMemo(() => {
    return Array.isArray(risksData) ? risksData : (Array.isArray(risksData?.data) ? risksData.data : []);
  }, [risksData]);

  const stats = useMemo(() => {
    const total = risks.length;
    const eleves = risks.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length;
    const blacklistes = risks.filter(r => r.blackliste).length;
    const avgScore = total > 0 ? Math.round(risks.reduce((a, r) => a + r.score, 0) / total) : 0;
    return { total, eleves, blacklistes, avgScore };
  }, [risks]);

  const filtered = useMemo(() => {
    let f = [...risks];
    if (filterLevel !== 'all') {
      f = f.filter(r => r.riskLevel === filterLevel);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(r => r.clientName?.toLowerCase().includes(q) || r.clientEmail?.toLowerCase().includes(q));
    }
    return f;
  }, [risks, filterLevel, searchQuery]);

  const handleToggleAcompte = useCallback(async (clientId: string, current: boolean) => {
    setTogglingId(`acompte-${clientId}`);
    try {
      await apiClient.patch(`/business/finance/client-risks/${clientId}`, { acompteRequis: !current });
      refetch();
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  }, [refetch]);

  const handleToggleBlacklist = useCallback(async (clientId: string, current: boolean) => {
    setTogglingId(`blacklist-${clientId}`);
    try {
      await apiClient.patch(`/business/finance/client-risks/${clientId}`, { blackliste: !current });
      refetch();
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  }, [refetch]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestion des Risques Clients"
        description="Évaluez et suivez les risques associés à vos clients"
        breadcrumbs={[
          { label: 'Accueil', href: '/dashboard' },
          { label: 'Dettes & Paiements', href: '/dashboard/debts-payments' },
          { label: 'Risques Clients' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<Shield className="h-5 w-5" />}
          iconBg="bg-brand-50 dark:bg-brand-900/30"
          iconColor="text-brand"
          label="Clients à risque"
          value={stats.total}
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          iconColor="text-orange-600"
          label="Risques élevés"
          value={stats.eleves}
        />
        <StatsCard
          icon={<Ban className="h-5 w-5" />}
          iconBg="bg-red-50 dark:bg-red-900/30"
          iconColor="text-red-600"
          label="Clients blacklistés"
          value={stats.blacklistes}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Score fiabilité moyen"
          value={`${stats.avgScore}/100`}
        />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {(['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  filterLevel === level
                    ? 'bg-brand text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {level === 'all' ? 'Tous' : riskLevelConfig[level]?.label || level}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Aucun risque client enregistré
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || filterLevel !== 'all' ? 'Essayez d\'autres filtres' : 'Les risques clients apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Niveau de risque</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Score</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Retards</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Litiges</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Dette totale</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Max crédit</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Acompte</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Blacklisté</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((risk) => (
                  <tr
                    key={risk.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{risk.clientName}</p>
                          {risk.clientEmail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{risk.clientEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
                        riskLevelConfig[risk.riskLevel]?.class || ''
                      )}>
                        {risk.riskLevel === 'LOW' && <ShieldCheck className="h-3 w-3" />}
                        {risk.riskLevel === 'MEDIUM' && <Shield className="h-3 w-3" />}
                        {risk.riskLevel === 'HIGH' && <ShieldAlert className="h-3 w-3" />}
                        {risk.riskLevel === 'CRITICAL' && <AlertTriangle className="h-3 w-3" />}
                        {riskLevelConfig[risk.riskLevel]?.label || risk.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'inline-flex items-center justify-center text-xs font-bold px-2 py-1 rounded-lg min-w-[40px]',
                        getScoreBg(risk.score),
                        getScoreColor(risk.score)
                      )}>
                        {risk.score}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{risk.retardsPaiement}</td>
                    <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{risk.litiges}</td>
                    <td className="px-4 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      {risk.detteTotale.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">
                      {risk.maxCredit.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleAcompte(risk.id, risk.acompteRequis)}
                        disabled={togglingId === `acompte-${risk.id}`}
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-md border transition-colors',
                          risk.acompteRequis
                            ? 'bg-brand border-brand text-white'
                            : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-brand/50'
                        )}
                      >
                        {togglingId === `acompte-${risk.id}` ? (
                          <Loader className="h-3 w-3 animate-spin text-current" />
                        ) : risk.acompteRequis ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : null}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleBlacklist(risk.id, risk.blackliste)}
                        disabled={togglingId === `blacklist-${risk.id}`}
                        className={cn(
                          'inline-flex items-center justify-center w-6 h-6 rounded-md border transition-colors',
                          risk.blackliste
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-red-500/50'
                        )}
                      >
                        {togglingId === `blacklist-${risk.id}` ? (
                          <Loader className="h-3 w-3 animate-spin text-current" />
                        ) : risk.blackliste ? (
                          <Ban className="h-4 w-4" />
                        ) : null}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/dashboard/debts-payments/risks/${risk.id}`}>
                        <Button variant="ghost" size="xs">Modifier</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
