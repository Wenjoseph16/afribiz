'use client';

import { useQuery } from '@tanstack/react-query';
import { PackageOpen, Plus, Percent, Gift, Package, Loader, Edit3 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function BundlesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['promoBundles'],
    queryFn: async () => {
      try {
        const res = await apiClient.getPromoBundles();
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    retry: false,
  });

  const bundles = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data?.bundles ?? []);
  }, [data]);

  if (error) {
    const isForbidden = (error as any)?.response?.status === 403 || (error as any)?.status === 403;
    if (isForbidden) {
      return (
        <div className="space-y-6 animate-fade-in">
          <PageHeader
            title="Packs & Bundles"
            description="Créez des offres groupées pour augmenter le panier moyen"
            breadcrumbs={[{ label: 'Bundles' }]}
            actions={
              <Link href="/dashboard/bundles/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Nouveau pack
                </Button>
              </Link>
            }
          />
          <Card className="text-center py-12">
            <PackageOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Module Bundles non activé
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Activez le module Promotions/Bundles dans votre abonnement pour créer des offres
              groupées.
            </p>
          </Card>
        </div>
      );
    }
    return <ErrorState message={(error as any).message} onRetry={refetch} />;
  }

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
        title="Packs & Bundles"
        description="Créez des offres groupées pour augmenter le panier moyen"
        breadcrumbs={[{ label: 'Bundles' }]}
        actions={
          <Link href="/dashboard/bundles/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouveau pack
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/20">
              <PackageOpen className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bundles.length}
              </p>
              <p className="text-xs text-gray-500">Total bundles</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <Gift className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bundles.filter((b: any) => b.isActive !== false).length}
              </p>
              <p className="text-xs text-gray-500">Actifs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20">
              <Percent className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {bundles
                  .reduce(
                    (sum: number, b: any) =>
                      sum + (b.savings || Number(b.totalPrice) - Number(b.bundlePrice)),
                    0
                  )
                  .toLocaleString()}{' '}
                FCFA
              </p>
              <p className="text-xs text-gray-500">Économies totales</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Tous les bundles" titleIcon={<Package className="h-4 w-4" />}>
        {bundles.length === 0 ? (
          <EmptyState
            icon={<PackageOpen className="h-10 w-10" />}
            title="Aucun bundle"
            description="Créez votre premier pack d'offres groupées"
            action={
              <Link href="/dashboard/bundles/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Créer
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {bundles.map((bundle: any) => {
              const savings = bundle.savings || bundle.totalPrice - bundle.bundlePrice;
              const savingsPercent =
                bundle.totalPrice > 0 ? Math.round((savings / Number(bundle.totalPrice)) * 100) : 0;

              return (
                <div
                  key={bundle.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-brand/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-amber-50 dark:from-brand-900/20 dark:to-amber-900/20 flex items-center justify-center">
                      <PackageOpen className="h-6 w-6 text-brand/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {bundle.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {bundle.items?.length || 0} article(s)
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">
                          {Number(bundle.totalPrice).toLocaleString()} FCFA
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="text-xs font-semibold text-brand">
                          {Number(bundle.bundlePrice).toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {savings > 0 && (
                      <Badge variant="success" className="text-xs">
                        -{savingsPercent}%
                      </Badge>
                    )}
                    <Badge variant={bundle.isActive !== false ? 'success' : 'default'}>
                      {bundle.isActive !== false ? 'Actif' : 'Inactif'}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/bundles/${bundle.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
