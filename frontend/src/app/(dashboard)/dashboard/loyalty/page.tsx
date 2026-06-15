'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Award, Gift, Star, TrendingUp, Ticket, Percent, CheckCircle,
  ChevronRight, Clock, Sparkles, Zap, ShoppingBag,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

const REWARD_ICONS: Record<string, React.ComponentType<any>> = {
  DISCOUNT: Percent,
  FREE_ITEM: Gift,
  FREE_SHIPPING: ShoppingBag,
  POINTS_BONUS: Star,
};

const REWARD_COLORS: Record<string, string> = {
  DISCOUNT: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  FREE_ITEM: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  FREE_SHIPPING: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  POINTS_BONUS: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: loyaltyData, isLoading } = useQuery({
    queryKey: ['client-loyalty'],
    queryFn: async () => {
      const res = await apiClient.getMyLoyalty();
      return res.data.data;
    },
  });

  const redeemMutation = useMutation({
    mutationFn: (data: { businessId: string; points: number; rewardTitle?: string }) =>
      apiClient.redeemLoyaltyPoints(data),
    onSuccess: (res) => {
      setRedeemMsg(res.data.data.message || 'Points échangés avec succès !');
      qc.invalidateQueries({ queryKey: ['client-loyalty'] });
      setTimeout(() => setRedeemMsg(null), 5000);
    },
    onError: (err: any) => {
      setRedeemMsg(err?.response?.data?.error || 'Erreur lors de l\'échange');
      setTimeout(() => setRedeemMsg(null), 5000);
    },
  });

  const handleRedeem = useCallback((reward: any) => {
    const businessId = reward.businessId || loyaltyData?.businessId;
    if (!businessId) { setRedeemMsg('Impossible d\'identifier le commerce'); setTimeout(() => setRedeemMsg(null), 5000); return; }
    redeemMutation.mutate({ businessId, points: reward.pointsCost || reward.cost || 100, rewardTitle: reward.title });
  }, [redeemMutation, loyaltyData]);

  const { data: promosData } = useQuery({
    queryKey: ['client-available-promotions'],
    queryFn: async () => {
      const res = await apiClient.getAvailablePromotions();
      return res.data.data;
    },
  });

  const loyalty = (loyaltyData || {}) as any;
  const promotions = useMemo(() => {
    const p = Array.isArray(promosData) ? promosData : (promosData?.promotions || promosData?.items || []);
    return p as any[];
  }, [promosData]);

  const points = loyalty.points || 0;
  const lifetimePoints = loyalty.lifetimePoints || points;
  const tier = loyalty.tier || 'BRONZE';
  const nextTierPoints = loyalty.nextTierPoints || 0;
  const progress = nextTierPoints > 0 ? Math.min((points / nextTierPoints) * 100, 100) : 100;
  const rewards = loyalty.rewards || [];
  const history = loyalty.history || [];

  const TIER_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
    BRONZE: { label: 'Bronze', color: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400', icon: Award },
    SILVER: { label: 'Argent', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-300', icon: Award },
    GOLD: { label: 'Or', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Star },
    PLATINUM: { label: 'Platine', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Sparkles },
    DIAMOND: { label: 'Diamant', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Zap },
  };

  const currentTier = TIER_CONFIG[tier] || TIER_CONFIG.BRONZE;
  const TierIcon = currentTier.icon;

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Fidélité"
        description="Gagnez des points et débloquez des récompenses à chaque achat"
        breadcrumbs={[{ label: 'Fidélité' }]}
      />

      {redeemMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle className="h-5 w-5 shrink-0" />
          {redeemMsg}
        </div>
      )}

      {/* Tier Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-950 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-300/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('p-2 rounded-lg', currentTier.color)}>
                  <TierIcon className="h-5 w-5" />
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider', currentTier.color)}>
                  {currentTier.label}
                </span>
              </div>
              <p className="text-4xl font-bold text-white mt-2">
                {points.toLocaleString()}
                <span className="text-lg font-medium text-emerald-200/80 ml-2">points</span>
              </p>
              <p className="text-emerald-100/70 text-sm mt-1">
                Points de fidélité cumulés
              </p>
            </div>

            {nextTierPoints > 0 && (
              <div className="text-right">
                <p className="text-emerald-100/60 text-xs mb-1">
                  Prochain palier
                </p>
                <p className="text-white font-bold text-lg">
                  {TIER_CONFIG[Object.keys(TIER_CONFIG)[Object.keys(TIER_CONFIG).indexOf(tier) + 1]]?.label || 'Maximum'}
                </p>
                <p className="text-emerald-100/60 text-xs mt-1">
                  {Math.max(0, nextTierPoints - points).toLocaleString()} points restants
                </p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {nextTierPoints > 0 && (
            <div>
              <div className="flex justify-between text-xs text-emerald-100/60 mb-1.5">
                <span>{points.toLocaleString()} pts</span>
                <span>{nextTierPoints.toLocaleString()} pts</span>
              </div>
              <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Points à vie</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{lifetimePoints.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Récompenses</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{rewards.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Promotions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{promotions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Coupons</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {loyalty.couponCount || loyalty.activeCoupons || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Rewards */}
        <Card title="Récompenses disponibles" padding="lg">
          {rewards.length === 0 ? (
            <EmptyState
              icon={<Gift className="h-8 w-8" />}
              title="Aucune récompense"
              description="Continuez à cumuler des points pour débloquer des récompenses."
            />
          ) : (
            <div className="space-y-3">
              {rewards.map((reward: any, i: number) => {
                const Icon = REWARD_ICONS[reward.type] || Gift;
                return (
                  <div
                    key={reward.id || i}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', REWARD_COLORS[reward.type] || 'bg-gray-100 text-gray-600')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{reward.title}</p>
                        <p className="text-xs text-gray-500">{reward.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-brand">{reward.pointsCost || reward.cost} pts</p>
                      <Button
                        variant={reward.claimed ? 'ghost' : 'outline'}
                        size="xs"
                        className="mt-1"
                        disabled={reward.claimed || redeemMutation.isPending}
                        onClick={() => handleRedeem(reward)}
                      >
                        {redeemMutation.isPending ? '...' : reward.claimed ? 'Utilisé' : 'Échanger'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Active Promotions */}
        <Card title="Promotions & Coupons" padding="lg">
          {promotions.length === 0 ? (
            <EmptyState
              icon={<Percent className="h-8 w-8" />}
              title="Aucune promotion"
              description="Les offres spéciales et coupons apparaîtront ici."
            />
          ) : (
            <div className="space-y-3">
              {promotions.slice(0, 10).map((promo: any, i: number) => {
                const isExpiring = promo.endDate && new Date(promo.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <div
                    key={promo.id || i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-amber-200/50 dark:border-amber-800/30"
                  >
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 shrink-0">
                      <Percent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{promo.title}</p>
                        {isExpiring && (
                          <span className="text-[10px] font-medium text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full shrink-0">
            Bientôt expiré
          </span>
                        )}
                      </div>
                      {promo.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{promo.description}</p>
                      )}
                      {promo.code && (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600">
                          <span className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">{promo.code}</span>
                        </div>
                      )}
                      {promo.endDate && (
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Valable jusqu&apos;au {new Date(promo.endDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Points History */}
      {history.length > 0 && (
        <Card title="Historique des points" padding="lg">
          <div className="space-y-2">
            {history.map((entry: any, i: number) => (
              <div
                key={entry.id || i}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-1.5 rounded-lg',
                    entry.type === 'EARNED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  )}>
                    {entry.type === 'EARNED' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.label || entry.description}</p>
                    <p className="text-xs text-gray-500">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : ''}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  entry.type === 'EARNED' ? 'text-emerald-600' : 'text-red-600'
                )}>
                  {entry.type === 'EARNED' ? '+' : '-'}{entry.points || entry.amount} pts
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Comment gagner des points ?
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-400">
              <li>• 1 point pour chaque 100 FCFA dépensé sur la plateforme</li>
              <li>• Points bonus lors des événements promotionnels</li>
              <li>• Points de parrainage pour chaque ami invité</li>
              <li>• Points de fidélité supplémentaires pour les avis laissés</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
