'use client';

import { useMemo } from 'react';
import { TrendingUp, Percent, Gift, Tag, Target, Loader, Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { usePromoStats, useMyPromotions, usePromoCoupons, usePromoBundles, usePromoCampaigns } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

export default function PromoStatsPage() {
  const { data: statsData, isLoading } = usePromoStats();
  const { data: promosData } = useMyPromotions({ limit: 500 });
  const { data: couponsData } = usePromoCoupons({ limit: 500 });
  const { data: bundlesData } = usePromoBundles({ limit: 500 });
  const { data: campaignsData } = usePromoCampaigns({ limit: 500 });

  const promos = useMemo(() => {
    const raw = Array.isArray(promosData) ? promosData : (promosData?.promotions || promosData?.data || []) as any[];
    return raw;
  }, [promosData]);

  const coupons = useMemo(() => {
    const raw = Array.isArray(couponsData) ? couponsData : (couponsData?.coupons || couponsData?.data || []) as any[];
    return raw;
  }, [couponsData]);

  const bundles = useMemo(() => {
    const raw = Array.isArray(bundlesData) ? bundlesData : (bundlesData?.bundles || bundlesData?.data || []) as any[];
    return raw;
  }, [bundlesData]);

  const campaigns = useMemo(() => {
    const raw = Array.isArray(campaignsData) ? campaignsData : (campaignsData?.campaigns || campaignsData?.data || []) as any[];
    return raw;
  }, [campaignsData]);

  const stats = (statsData?.data || statsData) as any || {};

  const now = new Date();
  const activePromos = promos.filter((p: any) => p.isActive && (!p.endsAt || new Date(p.endsAt) > now));
  const expiredPromos = promos.filter((p: any) => p.endsAt && new Date(p.endsAt) <= now);
  const percentagePromos = promos.filter((p: any) => p.discountType === 'PERCENTAGE');
  const fixedPromos = promos.filter((p: any) => p.discountType === 'FIXED');
  const shippingPromos = promos.filter((p: any) => p.discountType === 'FREE_SHIPPING');

  const typeDistribution = [
    { label: 'Pourcentage', count: percentagePromos.length, pct: promos.length > 0 ? Math.round(percentagePromos.length / promos.length * 100) : 0, color: 'bg-brand' },
    { label: 'Montant fixe', count: fixedPromos.length, pct: promos.length > 0 ? Math.round(fixedPromos.length / promos.length * 100) : 0, color: 'bg-blue-500' },
    { label: 'Livraison offerte', count: shippingPromos.length, pct: promos.length > 0 ? Math.round(shippingPromos.length / promos.length * 100) : 0, color: 'bg-emerald-500' },
    { label: 'Autres', count: promos.length - percentagePromos.length - fixedPromos.length - shippingPromos.length, pct: promos.length > 0 ? Math.round((promos.length - percentagePromos.length - fixedPromos.length - shippingPromos.length) / promos.length * 100) : 0, color: 'bg-purple-500' },
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques promotions</h1>
        <p className="text-sm text-gray-500">Analysez la performance de vos promotions et offres</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10"><Percent className="w-4 h-4 text-brand" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Promotions</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalPromotions ?? promos.length}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Actives</p><p className="text-lg font-bold text-gray-900 dark:text-white">{stats.activePromotions ?? activePromos.length}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Tag className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Coupons</p><p className="text-lg font-bold text-gray-900 dark:text-white">{coupons.length}</p></div>
          </div>
        </Card>
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100"><Gift className="w-4 h-4 text-purple-600" /></div>
            <div><p className="text-[10px] text-gray-500 uppercase font-semibold">Bundles</p><p className="text-lg font-bold text-gray-900 dark:text-white">{bundles.length}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Type Distribution */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4" />Distribution par type</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                {typeDistribution.reduce((acc: any[], t, i) => {
                  const prevPct = acc.length > 0 ? acc[acc.length - 1].end : 0;
                  const pct = t.pct / 100 * 360;
                  const end = prevPct + pct;
                  const x1 = 18 + 15.5 * Math.cos((prevPct * Math.PI) / 180);
                  const y1 = 18 + 15.5 * Math.sin((prevPct * Math.PI) / 180);
                  const x2 = 18 + 15.5 * Math.cos((end * Math.PI) / 180);
                  const y2 = 18 + 15.5 * Math.sin((end * Math.PI) / 180);
                  const largeArc = pct > 180 ? 1 : 0;
                  acc.push({ i, pct, end, d: `M 18 18 L ${x1} ${y1} A 15.5 15.5 0 ${largeArc} 1 ${x2} ${y2} Z`, color: t.color });
                  return acc;
                }, []).map((slice: any) => (
                  <path key={slice.i} d={slice.d} fill={slice.color === 'bg-brand' ? '#2D8A5B' : slice.color.replace('bg-', '#').replace('-500', '').replace('bg-', '').replace('blue-', '3B82F6').replace('emerald-', '10B981').replace('purple-', '8B5CF6')} />
                ))}
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            {typeDistribution.filter(t => t.count > 0).map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className={cn('w-2.5 h-2.5 rounded-full', t.color)} /><span className="text-gray-600 dark:text-gray-400">{t.label}</span></div>
                <span className="font-medium text-gray-900 dark:text-white">{t.count} ({t.pct}%)</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Campaigns */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Megaphone className="w-4 h-4" />Campagnes marketing</h3>
          {campaigns.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Aucune campagne</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"><p className="text-xs font-bold text-emerald-700">{campaigns.filter((c: any) => c.status === 'ACTIVE').length}</p><p className="text-[9px] text-emerald-600">Actives</p></div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"><p className="text-xs font-bold text-blue-700">{campaigns.filter((c: any) => c.status === 'COMPLETED').length}</p><p className="text-[9px] text-blue-600">Terminées</p></div>
              </div>
              {campaigns.slice(0, 3).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{c.name}</span>
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : c.status === 'COMPLETED' ? 'info' : 'default'} size="xs">{c.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Metrics */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Indicateurs clés</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-600 dark:text-gray-400">Promos actives</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{activePromos.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-600 dark:text-gray-400">Promos expirées</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{expiredPromos.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-600 dark:text-gray-400">Coupons actifs</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{coupons.filter((c: any) => c.isActive !== false).length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-600 dark:text-gray-400">Bundles</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{bundles.length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-600 dark:text-gray-400">Campagnes</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{campaigns.length}</span>
            </div>
            {stats.revenue && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <span className="text-xs text-emerald-600 font-medium">Revenus générés</span>
                <span className="text-sm font-bold text-emerald-700">{formatPrice(Number(stats.revenue))}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent data summary */}
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{promos.length}</p><p className="text-[10px] text-gray-500">Promotions créées</p></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{coupons.length}</p><p className="text-[10px] text-gray-500">Coupons générés</p></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{bundles.length}</p><p className="text-[10px] text-gray-500">Bundles créés</p></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p><p className="text-[10px] text-gray-500">Campagnes lancées</p></div>
        </div>
      </Card>

      {/* Automation suggestions */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/30">
        <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Suggestions automatiques</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">📦 Produits à promouvoir</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              {promos.length === 0 ? 'Créez votre première promotion pour booster vos ventes' : `${promos.length} promotions actives — pensez à en créer pour vos nouveaux produits`}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">🎯 Client fidèle</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              {coupons.length > 0 ? `${coupons.length} coupons disponibles — envoyez des codes personnalisés à vos meilleurs clients` : 'Créez des coupons pour fidéliser votre clientèle'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">📊 Campagne recommandée</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              {campaigns.length === 0 ? 'Lancez une campagne marketing pour augmenter votre visibilité' : 'Analysez les performances de vos campagnes pour optimiser votre budget'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
