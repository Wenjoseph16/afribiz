'use client';

import { useState } from 'react';
import {
  BarChart3, Globe, PieChart, Building2,
  Download, FileText, Search,
  TrendingUp, Users, Target, Lightbulb,
  HeartHandshake, ShoppingBag, Eye, MessageCircle,
  AlertTriangle, CheckCircle2, ArrowRight, Star,
  Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import {
  useHubPlatformStats, useHubSectorBenchmarks, useHubGeographicStats,
  useHubGrowthStats, useHubPaymentTrends, usePartnerReports, useOrderPartnerReport,
  usePartnerBusinesses,
  useConversionFunnel, useRetentionCohorts, useProductRecommendations,
  useEngagementAnalytics, useDailyTips, useBusinessHealth,
} from '@/features/afriScoreHooks';

type Tab = 'overview' | 'sectors' | 'geographic' | 'reports' | 'businesses' | 'analytics' | 'copilot' | 'recommendations';

export default function DataHubPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const isPartner = user?.roles?.includes('ADMIN') || user?.primaryRole === 'PARTNER';

  const tabs = [
    { id: 'overview' as Tab, label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
    { id: 'copilot' as Tab, label: 'Copilot', icon: Lightbulb },
    { id: 'recommendations' as Tab, label: 'Recommandations', icon: Star },
    { id: 'sectors' as Tab, label: 'Secteurs', icon: PieChart },
    { id: 'geographic' as Tab, label: 'Géographique', icon: Globe },
    ...(isPartner ? [{ id: 'reports' as Tab, label: 'Rapports', icon: FileText }] : []),
    ...(isPartner ? [{ id: 'businesses' as Tab, label: 'Businesses', icon: Building2 }] : []),
  ];

  const { data: platformStats } = useHubPlatformStats();
  const { data: sectorBenchmarks } = useHubSectorBenchmarks();
  const { data: geoStats } = useHubGeographicStats();
  const { data: growthStats } = useHubGrowthStats();
  const { data: paymentTrends } = useHubPaymentTrends();
  const { data: reportsData } = usePartnerReports(isPartner ? { limit: 20 } : undefined);
  const { data: businessesData } = usePartnerBusinesses(isPartner ? { q: searchQuery || undefined, limit: 20 } : undefined);
  const { data: funnel } = useConversionFunnel();
  const { data: cohorts } = useRetentionCohorts();
  const { data: recommendations } = useProductRecommendations(12);
  const { data: engagement } = useEngagementAnalytics();
  const { data: tips } = useDailyTips();
  const { data: health } = useBusinessHealth();
  const orderReportMutation = useOrderPartnerReport();

  const reports = Array.isArray(reportsData) ? reportsData : reportsData?.reports ?? [];
  const sectors = Array.isArray(sectorBenchmarks) ? sectorBenchmarks : sectorBenchmarks?.sectors ?? [];
  const geo = Array.isArray(geoStats) ? geoStats : geoStats?.regions ?? [];
  const businesses = Array.isArray(businessesData) ? businessesData : businessesData?.businesses ?? [];

  const handleOrderReport = async (type: string) => {
    try {
      await orderReportMutation.mutateAsync({ type });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Data Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Données agrégées et analyses du marché africain
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Statistiques plateforme
            </h3>
            {platformStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{platformStats.totalBusinesses ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Businesses</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{platformStats.totalOrders ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Commandes</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{platformStats.totalRevenue ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Revenu total</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{platformStats.avgScore ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Score moyen</p>
                </div>
              </div>
            ) : (
              <Loader className="py-8" />
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              Croissance
            </h3>
            {growthStats ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nouveaux businesses</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{growthStats.newBusinesses ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Croissance des transactions</p>
                  <p className="text-lg font-bold text-emerald-600">{growthStats.transactionGrowth ?? '-'}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Taux d&apos;adoption</p>
                  <p className="text-lg font-bold text-blue-600">{growthStats.adoptionRate ?? '-'}%</p>
                </div>
              </div>
            ) : (
              <Loader className="py-8" />
            )}
          </Card>

          {paymentTrends && (
            <Card className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Tendances des paiements
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{paymentTrends.totalPayments ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Paiements</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{paymentTrends.successRate ?? '-'}%</p>
                  <p className="text-xs text-gray-500 mt-1">Taux de succès</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{paymentTrends.avgAmount ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">Montant moyen</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{paymentTrends.pendingAmount ?? '-'}</p>
                  <p className="text-xs text-gray-500 mt-1">En attente</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Conversion Funnel */}
          <Card title="Entonnoir de conversion (30 jours)" titleIcon={<Target className="h-4 w-4" />}>
            {funnel ? (
              <div className="space-y-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel.stages} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={120} />
                      <Tooltip
                        content={({ active, payload }) => active && payload?.[0] ? (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p className="text-brand font-bold text-lg">{payload[0].value?.toLocaleString()}</p>
                          </div>
                        ) : null}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} name="Quantité" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Taux de conversion */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Visite → Clic', value: funnel.conversionRates?.viewToClick, color: 'text-brand' },
                    { label: 'Clic → Panier', value: funnel.conversionRates?.clickToCart, color: 'text-purple-600' },
                    { label: 'Panier → Commande', value: funnel.conversionRates?.cartToOrder, color: 'text-emerald-600' },
                    { label: 'Commande → Paiement', value: funnel.conversionRates?.orderToPayment, color: 'text-blue-600' },
                    { label: 'Global', value: funnel.conversionRates?.overall, color: 'text-amber-600', bold: true },
                  ].map((rate, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
                      <p className="text-[10px] text-gray-500 mb-1">{rate.label}</p>
                      <p className={cn('text-lg font-bold', rate.color)}>{rate.value ?? '-'}%</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Loader className="py-12" />
            )}
          </Card>

          {/* Cohorts */}
          <Card title="Cohorts de rétention clients" titleIcon={<Users className="h-4 w-4" />}>
            {cohorts ? (
              Array.isArray(cohorts) && cohorts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Période</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Nouveaux</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">J+7</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">J+28</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">J+84</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((c: any, i: number) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-2.5 pr-4 font-medium">{c.period}</td>
                          <td className="py-2.5 px-4 text-right">{c.total}</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={cn('font-semibold', c.week1 >= 50 ? 'text-emerald-600' : c.week1 >= 20 ? 'text-amber-600' : 'text-gray-500')}>
                              {c.week1}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={cn('font-semibold', c.week4 >= 30 ? 'text-emerald-600' : c.week4 >= 10 ? 'text-amber-600' : 'text-gray-500')}>
                              {c.week4}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={cn('font-semibold', c.week12 >= 15 ? 'text-emerald-600' : c.week12 >= 5 ? 'text-amber-600' : 'text-gray-500')}>
                              {c.week12}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={<Users className="h-8 w-8" />} title="Pas assez de données" description="Les cohorts seront disponibles avec plus de clients." />
              )
            ) : (
              <Loader className="py-12" />
            )}
          </Card>

          {/* Engagement */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {engagement ? [
              { label: 'Clients totaux', value: engagement.totalClients, icon: Users, color: 'text-brand', bg: 'bg-brand-50 dark:bg-brand-900/20' },
              { label: 'Clients actifs (30j)', value: engagement.activeClients, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: "Taux d'engagement", value: engagement.engagementRate + '%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Pages vues (30j)', value: engagement.pageViews30d, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Conversations (30j)', value: engagement.conversations30d, icon: MessageCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="text-center">
                  <div className={cn('inline-flex p-2.5 rounded-xl mb-3', item.bg)}>
                    <Icon className={cn('h-5 w-5', item.color)} />
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{item.value ?? '-'}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.label}</p>
                </Card>
              );
            }) : [1,2,3,4,5].map(i => (
              <Card key={i}><Loader className="py-8" /></Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Health */}
          <Card title="Santé du business" titleIcon={<HeartHandshake className="h-4 w-4" />} className="lg:col-span-1">
            {health ? (
              <div className="text-center">
                <div className={cn(
                  'inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold mb-4',
                  health.status === 'excellent' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                  health.status === 'good' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                  health.status === 'fair' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                  'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                )}>
                  {health.healthScore ?? '-'}
                </div>
                <p className={cn(
                  'text-sm font-semibold mb-4',
                  health.status === 'excellent' ? 'text-emerald-600' :
                  health.status === 'good' ? 'text-blue-600' :
                  health.status === 'fair' ? 'text-amber-600' :
                  'text-red-600'
                )}>
                  {health.status === 'excellent' ? 'Excellent' :
                   health.status === 'good' ? 'Bon' :
                   health.status === 'fair' ? 'Moyen' : 'Critique'}
                </p>
                <div className="space-y-2 text-left">
                  {[
                    { label: 'AfriScore', value: health.metrics?.afriScore ?? '-' },
                    { label: 'Commandes (30j)', value: health.metrics?.orders30d ?? 0 },
                    { label: 'Pages vues (30j)', value: health.metrics?.pageViews30d ?? 0 },
                    { label: 'Produits', value: health.metrics?.totalProducts ?? 0 },
                    { label: 'Campagnes pub', value: health.metrics?.activeAdCampaigns ?? 0 },
                  ].map((m, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{m.label}</span>
                      <span className="font-semibold">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Loader className="py-12" />
            )}
          </Card>

          {/* Daily Tips */}
          <Card title="Conseils du jour" titleIcon={<Lightbulb className="h-4 w-4" />} className="lg:col-span-2">
            {tips ? (
              Array.isArray(tips.tips) && tips.tips.length > 0 ? (
                <div className="space-y-3">
                  {tips.tips.map((tip: any, i: number) => (
                    <div key={i} className={cn(
                      'flex items-start gap-3 p-3 rounded-xl transition-colors',
                      tip.priority === 'high' ? 'bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20' :
                      tip.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20' :
                      'bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700'
                    )}>
                      <div className={cn(
                        'p-1.5 rounded-lg shrink-0 mt-0.5',
                        tip.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                        tip.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-gray-200 dark:bg-gray-700'
                      )}>
                        {tip.priority === 'high' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                         tip.priority === 'medium' ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                         <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{tip.message}</p>
                        {tip.action && (
                          <button className="mt-1.5 text-xs font-medium text-brand hover:text-brand-700 inline-flex items-center gap-1">
                            {tip.action} <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                        tip.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        tip.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      )}>
                        {tip.type}
                      </span>
                    </div>
                  ))}
                  {tips.totalUnresolvedIssues > 0 && (
                    <p className="text-xs text-gray-400 text-center pt-2">
                      {tips.totalUnresolvedIssues} point(s) nécessitant votre attention
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />} title="Tout va bien !" description="Aucun conseil pour le moment." />
              )
            ) : (
              <Loader className="py-12" />
            )}
          </Card>
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div>
          {recommendations ? (
            Array.isArray(recommendations) && recommendations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendations.map((product: any) => (
                  <Card key={product.id} hoverable className="group">
                    {product.images?.[0] ? (
                      <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gray-100 dark:bg-gray-700 relative">
                        <Image
                          src={product.images[0] ?? ''}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] rounded-xl mb-3 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-brand/40" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{product.name}</h4>
                      {product.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">{product.category}</span>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-brand">
                          {product.price ? `${Number(product.price).toLocaleString()} FCFA` : 'Gratuit'}
                        </p>
                        {product.rating && (
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            {product.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Aucune recommandation" description="Les recommandations apparaîtront quand les clients interagiront avec vos produits." />
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Card key={i}><Loader className="py-16" /></Card>)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sectors' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.length > 0 ? sectors.map((sector: any) => (
            <Card key={sector.sector || sector.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{sector.sector}</h3>
                <span className="text-xs font-medium text-brand">{sector.businessCount} businesses</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Score moyen</span>
                  <span className="font-semibold">{sector.avgScore ?? '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Revenu moyen</span>
                  <span className="font-semibold">{sector.avgRevenue ?? '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Croissance</span>
                  <span className={`font-semibold ${sector.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {sector.growth ?? 0}%
                  </span>
                </div>
              </div>
            </Card>
          )) : (
            <div className="col-span-full">
              <EmptyState
                icon={<PieChart className="h-8 w-8" />}
                title="Aucune donnée sectorielle"
                description="Les benchmarks sectoriels seront disponibles une fois les données suffisantes."
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'geographic' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {geo.length > 0 ? geo.map((region: any) => (
            <Card key={region.country || region.region}>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{region.country || region.region}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Businesses</span>
                  <span className="font-semibold">{region.businessCount ?? '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Villes actives</span>
                  <span className="font-semibold">{region.activeCities ?? '-'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Score moyen</span>
                  <span className="font-semibold">{region.avgScore ?? '-'}</span>
                </div>
              </div>
            </Card>
          )) : (
            <div className="col-span-full">
              <EmptyState
                icon={<Globe className="h-8 w-8" />}
                title="Aucune donnée géographique"
                description="Les données géographiques seront disponibles une fois les analyses effectuées."
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => handleOrderReport('individuel')}>
              <FileText className="h-4 w-4" />
              Rapport individuel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleOrderReport('sectoriel')}>
              <PieChart className="h-4 w-4" />
              Rapport sectoriel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleOrderReport('geographique')}>
              <Globe className="h-4 w-4" />
              Rapport géographique
            </Button>
          </div>

          {reports.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report: any) => (
                <Card key={report.id}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      report.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      report.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{report.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{report.title || `Rapport ${report.type}`}</p>
                  {report.summary && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.summary}</p>}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">{report.createdAt ? new Date(report.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                    {report.status === 'COMPLETED' && (
                      <Button variant="ghost" size="xs">
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Aucun rapport"
              description="Commandez votre premier rapport pour accéder aux analyses."
            />
          )}
        </div>
      )}

      {activeTab === 'businesses' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            />
          </div>

          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses.map((b: any) => (
                <Card key={b.id}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                      {b.name?.[0] || 'B'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{b.name}</p>
                      <p className="text-[11px] text-gray-500">{b.type || b.sector} · {b.country || b.city}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-medium text-brand">{b.afriScore ?? b.score ?? '-'} pts</span>
                        {b.badges?.slice(0, 2).map((badge: string, i: number) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">{badge}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="Aucun business trouvé"
              description={searchQuery ? 'Essayez un autre terme de recherche.' : 'Les données des businesses seront disponibles sous condition de consentement.'}
            />
          )}
        </div>
      )}
    </div>
  );
}
