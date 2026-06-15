'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Megaphone, Lightbulb, Target, TrendingUp, DollarSign,
  Star, Download, Eye, Award, Send, MessageCircle, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useDeveloperDashboard, useDeveloperModules } from '@/features/developerHooks';
import type { DeveloperModule } from '@/types/developer';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

function SimpleTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}: <strong>{entry.value}</strong></span>
        </p>
      ))}
    </div>
  );
}

const OPTIMIZATION_TIPS = [
  { icon: Lightbulb, title: 'Optimisez vos descriptions', description: 'Une description claire avec des mots-clés ciblés augmente la visibilité dans la marketplace.', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
  { icon: Target, title: 'Ajoutez des captures d\'écran', description: 'Les modules avec des visuels ont 40% plus de chances d\'être installés.', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
  { icon: Star, title: 'Encouragez les avis', description: 'Les modules bien notés sont mis en avant dans les recherches.', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' },
  { icon: TrendingUp, title: 'Publiez des mises à jour', description: 'Les modules activement maintenus sont favorisés par l\'algorithme.', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
  { icon: Download, title: 'Proposez un essai gratuit', description: 'Les modules avec version d\'essai convertissent 3x mieux.', color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600' },
  { icon: MessageCircle, title: 'Répondez aux avis', description: 'Montrez votre réactivité pour renforcer la confiance des utilisateurs.', color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' },
];

export default function MarketingPage() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useDeveloperDashboard();
  const { data: modules, isLoading: modsLoading } = useDeveloperModules();
  const [sortBy, setSortBy] = useState<'installs' | 'rating' | 'revenue'>('installs');

  const moduleList = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const overview = useMemo(() => {
    if (!dashboard) return null;
    return {
      totalRevenue: dashboard?.revenue?.total || 0,
      totalInstalls: dashboard?.modules?.totalInstalls || 0,
      totalModules: dashboard?.modules?.total || 0,
      averageRating: dashboard?.reviews?.averageRating || 0,
      totalReviews: dashboard?.reviews?.total || 0,
    };
  }, [dashboard]);

  // Ranked modules
  const rankedModules = useMemo(() => {
    const list = [...moduleList] as DeveloperModule[];
    if (sortBy === 'installs') return list.sort((a, b) => (b.totalInstalls || 0) - (a.totalInstalls || 0));
    if (sortBy === 'rating') return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
  }, [moduleList, sortBy]);

  // Revenue distribution for chart
  const revenueDist = useMemo(() => {
    if (moduleList.length === 0) return [];
    return moduleList.slice(0, 6).map((m: DeveloperModule, i: number) => ({
      name: m.name.length > 12 ? m.name.slice(0, 12) + '...' : m.name,
      value: m.totalRevenue || Math.round(m.totalInstalls * (m.price || 5000)),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [moduleList]);

  // Rating distribution
  const ratingData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    moduleList.forEach((m: DeveloperModule) => {
      const r = Math.round(m.rating || 0);
      if (r > 0 && r <= 5) counts[r - 1]++;
    });
    return counts.map((c, i) => ({ stars: `${i + 1}★`, count: c }));
  }, [moduleList]);

  if (dashError) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Marketing" description="Outils promotionnels pour vos modules" />
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="Données non disponibles" description="Impossible de charger les données marketing." />
      </div>
    );
  }

  if (dashLoading || modsLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const formatCurrency = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA';
  const formatNumber = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

  const totalInstallsAll = moduleList.reduce((s: number, m: DeveloperModule) => s + (m.totalInstalls || 0), 0);
  const totalRevenueAll = moduleList.reduce((s: number, m: DeveloperModule) => s + (m.totalRevenue || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Marketing"
        description="Promouvez vos modules et suivez votre visibilité sur la marketplace"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Marketing' },
        ]}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: 'Modules publiés', value: moduleList.filter((m: DeveloperModule) => m.status === 'PUBLISHED').length, color: 'bg-brand-50 dark:bg-brand-900/30 text-brand' },
          { icon: Download, label: 'Installations totales', value: formatNumber(totalInstallsAll), color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
          { icon: Star, label: 'Note moyenne', value: overview?.averageRating ? `${overview.averageRating.toFixed(1)} / 5` : '—', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
          { icon: DollarSign, label: 'Revenu total', value: formatCurrency(totalRevenueAll), color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-lg', s.color)}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Module Ranking */}
        <Card padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Classement des modules
            </h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(['installs', 'rating', 'revenue'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all',
                    sortBy === s ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {s === 'installs' ? 'Popularité' : s === 'rating' ? 'Note' : 'Revenu'}
                </button>
              ))}
            </div>
          </div>
          {rankedModules.length === 0 ? (
            <EmptyState icon={<Award className="h-8 w-8" />} title="Aucun module" description="Créez votre premier module pour apparaître ici." />
          ) : (
            <div className="space-y-2">
              {rankedModules.map((mod: DeveloperModule, idx: number) => (
                <div key={mod.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    idx === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    idx === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                    idx === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                    'bg-gray-50 dark:bg-gray-800 text-gray-400'
                  )}>
                    {idx + 1}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {mod.logo ? <Image src={mod.logo ?? ''} alt={mod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized /> : <Megaphone className="h-4 w-4 text-brand" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{mod.name}</p>
                    <p className="text-xs text-gray-400">{mod.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {sortBy === 'installs' ? formatNumber(mod.totalInstalls || 0) :
                       sortBy === 'rating' ? `${(mod.rating || 0).toFixed(1)} ★` :
                       formatCurrency(mod.totalRevenue || 0)}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {sortBy === 'installs' ? 'installations' : sortBy === 'rating' ? 'note' : 'revenu'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Revenue Distribution Pie */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Répartition du revenu
          </h3>
          {revenueDist.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDist}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {revenueDist.map((entry: {color: string}, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<SimpleTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-1.5">
            {revenueDist.map((entry: {name: string; color: string}, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-500 dark:text-gray-400 truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Rating Distribution + Campaign CTA */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Distribution des notes
          </h3>
          {ratingData.every(d => d.count === 0) ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Aucun avis</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="stars" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<SimpleTooltip />} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Modules" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Promotion CTA */}
        <Card padding="lg" className="bg-gradient-to-br from-brand-500 to-purple-600 text-white">
          <div className="flex flex-col items-center text-center py-4">
            <div className="p-3 rounded-full bg-white/20 mb-4">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">Mettez en avant vos modules</h3>
            <p className="text-sm text-white/80 mb-6">
              Contactez l'équipe AfriBiz pour proposer vos modules en featured sur la marketplace et augmentez votre visibilité.
            </p>
            <Link href="/dashboard/support">
              <Button variant="secondary" className="bg-white text-brand hover:bg-gray-100 border-0">
                <Send className="h-4 w-4" />
                Contacter le support
              </Button>
            </Link>
          </div>
        </Card>

        {/* Quick stats */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Indicateurs rapides
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Taux de conversion (estimé)', value: totalInstallsAll > 0 ? `${((moduleList.filter((m: DeveloperModule) => m.totalInstalls > 0).length / Math.max(moduleList.length, 1)) * 100).toFixed(0)}%` : '—', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
              { label: 'Revenu moyen par module', value: moduleList.length > 0 ? formatCurrency(Math.round(totalRevenueAll / moduleList.length)) : '—', icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
              { label: 'Avis positifs', value: overview?.totalReviews ? `${Math.round((overview.averageRating / 5) * 100)}%` : '—', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
              { label: 'Moy. installations/module', value: moduleList.length > 0 ? formatNumber(Math.round(totalInstallsAll / moduleList.length)) : '—', icon: Download, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', item.bg)}><Icon className={cn('h-4 w-4', item.color)} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Optimization Tips */}
      <Card padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Conseils pour améliorer votre visibilité</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {OPTIMIZATION_TIPS.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className={cn('p-2.5 rounded-lg shrink-0', tip.color)}>
                <tip.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{tip.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
