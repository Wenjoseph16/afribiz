'use client';

import { useState } from 'react';
import {
  Percent, Plus, Search, Tag, Gift, TrendingUp,
  CheckCircle, XCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

type PromosTab = 'coupons' | 'promotions';

export default function AdminPromosPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [activeTab, setActiveTab] = useState<PromosTab>('coupons');
  const [search, setSearch] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'promos', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/promos/stats');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['admin', 'promos', 'coupons'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/promos/coupons');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const { data: promotions } = useQuery({
    queryKey: ['admin', 'promos', 'promotions'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/promos/promotions');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/promos/coupons/${id}/disable`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'promos'] });
    },
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold">Codes promo</h1>
        <EmptyState icon={<Percent className="h-8 w-8" />} title="Accès réservé" description="Administrateurs uniquement." />
      </div>
    );
  }

  const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    ACTIVE: 'success',
    USED: 'info',
    EXPIRED: 'warning',
    DISABLED: 'danger',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Codes promo & Réductions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gérez les coupons et promotions de la plateforme
        </p>
      </div>

      {/* Stats cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Coupons total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalCoupons}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Actifs</p>
            <p className="text-xl font-bold text-emerald-600">{stats.activeCoupons}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Utilisés</p>
            <p className="text-xl font-bold text-blue-600">{stats.usedCoupons}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Expirés</p>
            <p className="text-xl font-bold text-amber-600">{stats.expiredCoupons}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Promotions</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPromotions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-gray-500">Promotions actives</p>
            <p className="text-xl font-bold text-emerald-600">{stats.activePromotions}</p>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'coupons'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Tag className="h-4 w-4" />
          Coupons
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'promotions'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Gift className="h-4 w-4" />
          Promotions
        </button>
      </div>

      {/* TAB: Coupons */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un code promo..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 focus:outline-none"
              />
            </div>
          </div>

          {couponsLoading ? <Loader className="py-12" /> : !coupons?.length ? (
            <EmptyState icon={<Tag className="h-8 w-8" />} title="Aucun coupon" description="Aucun code promo sur la plateforme pour le moment." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Code</th>
                    <th className="p-3 font-medium">Business</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Valeur</th>
                    <th className="p-3 font-medium">Client</th>
                    <th className="p-3 font-medium">Statut</th>
                    <th className="p-3 font-medium">Utilisations</th>
                    <th className="p-3 font-medium">Expire le</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons
                    .filter((c: any) => !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.business?.name?.toLowerCase().includes(search.toLowerCase()))
                    .map((coupon: any) => (
                      <tr key={coupon.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="p-3">
                          <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{coupon.code}</span>
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">{coupon.business?.name || '-'}</td>
                        <td className="p-3">
                          <Badge variant={coupon.discountType === 'PERCENTAGE' ? 'info' : 'default'} size="xs">
                            {coupon.discountType === 'PERCENTAGE' ? '%' : 'Fixe'}
                          </Badge>
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-gray-100">
                          {coupon.discountType === 'PERCENTAGE' ? `${Number(coupon.discountValue)}%` : formatCFA(Number(coupon.discountValue))}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">
                          {coupon.client ? `${coupon.client.firstName} ${coupon.client.lastName}` : 'Tous'}
                        </td>
                        <td className="p-3">
                          <Badge variant={statusBadge[coupon.status] || 'default'} size="xs">{coupon.status}</Badge>
                        </td>
                        <td className="p-3 text-gray-900 dark:text-gray-100">
                          {coupon.useCount}/{coupon.maxUses || '∞'}
                        </td>
                        <td className="p-3 text-gray-500">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="p-3">
                          {coupon.status === 'ACTIVE' && (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => disableMutation.mutate(coupon.id)}
                              isLoading={disableMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Promotions */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          {!promotions?.length ? (
            <EmptyState icon={<Gift className="h-8 w-8" />} title="Aucune promotion" description="Aucune promotion active sur la plateforme." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map((promo: any) => (
                <Card key={promo.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                      {promo.promotionType === 'PERCENTAGE' ? <Percent className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                    </div>
                    <Badge variant={promo.isActive ? 'success' : 'default'} size="xs">
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{promo.title}</h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{promo.description || '-'}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{promo.business?.name || 'Plateforme'}</span>
                    {promo.code && <span className="font-mono text-brand">· {promo.code}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {promo.discountValue}% de réduc
                    </span>
                    <span className="text-xs text-gray-400">
                      {promo.usageCount}/{promo.maxUsageCount || '∞'} utilisations
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
