'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  CreditCard, Repeat, Calendar, Users, Package, AlertCircle,
  CheckCircle, XCircle, DollarSign, Eye, Ban,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useDeveloperSubscriptions } from '@/features/developerHooks';
import type { DeveloperModuleInstallation } from '@/types/developer';

const PRICING_LABELS: Record<string, string> = {
  FREE: 'Gratuit',
  ONE_TIME: 'Paiement unique',
  MONTHLY: 'Mois',
  QUARTERLY: 'Trimestre',
  SEMESTRIAL: 'Semestre',
  YEARLY: 'An',
  CUSTOM: 'Personnalisé',
};

export default function DeveloperSubscriptionsPage() {
  const { data: subscriptions, isLoading, error } = useDeveloperSubscriptions();

  const subscriptionList = useMemo(() => {
    if (!subscriptions) return [];
    const list = Array.isArray(subscriptions) ? subscriptions : (subscriptions.subscriptions || subscriptions.data || []);
    return (list as DeveloperModuleInstallation[]).filter(
      (s) => s.autoUpdate === true && s.status === 'ACTIVE'
    );
  }, [subscriptions]);

  const summary = useMemo(() => {
    const activeCount = subscriptionList.length;
    let monthlyEstimate = 0;
    for (const s of subscriptionList) {
      const mod = s.module;
      if (!mod || !mod.price) continue;
      if (mod.pricingType === 'MONTHLY') monthlyEstimate += mod.price;
      else if (mod.pricingType === 'QUARTERLY') monthlyEstimate += mod.price / 3;
      else if (mod.pricingType === 'SEMESTRIAL') monthlyEstimate += mod.price / 6;
      else if (mod.pricingType === 'YEARLY') monthlyEstimate += mod.price / 12;
      else if (mod.pricingType === 'ONE_TIME') monthlyEstimate += mod.price / 12;
    }
    return {
      activeCount,
      monthlyEstimate: Math.round(monthlyEstimate),
      annualEstimate: Math.round(monthlyEstimate * 12),
    };
  }, [subscriptionList]);

  if (isLoading) return <Loader size="lg" label="Chargement des abonnements..." />;

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Abonnements" description="Suivez les abonnements actifs à vos modules" />
        <Card className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Erreur</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Impossible de charger les abonnements.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Abonnements"
        description="Suivez les abonnements actifs à vos modules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Abonnements' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 w-fit mb-3">
            <Repeat className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{summary.activeCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Abonnements actifs</p>
        </Card>
        <Card className="p-5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 w-fit mb-3">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {summary.monthlyEstimate.toLocaleString()} FCFA
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenu mensuel estimé</p>
        </Card>
        <Card className="p-5">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 w-fit mb-3">
            <CreditCard className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {summary.annualEstimate.toLocaleString()} FCFA
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revenu annuel estimé</p>
        </Card>
      </div>

      {subscriptionList.length === 0 ? (
        <EmptyState
          icon={<Repeat className="h-10 w-10" />}
          title="Aucun abonnement actif"
          description="Les abonnements actifs à vos modules apparaîtront ici une fois que des entreprises auront souscrit."
        />
      ) : (
        <div className="space-y-3">
          {subscriptionList.map((sub) => {
            const mod = sub.module;
            const pricingLabel = mod?.pricingType ? PRICING_LABELS[mod.pricingType] || mod.pricingType : '—';
            const pricingValue = mod?.price ? `${mod.price.toLocaleString()} FCFA / ${pricingLabel}` : pricingLabel;
            return (
              <Card key={sub.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                      {mod?.logo ? (
                        <Image src={mod?.logo ?? ''} alt={mod?.name ?? ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                      ) : (
                        <Package className="h-6 w-6 text-brand" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {mod?.name || 'Module'}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {sub.business?.name || 'Entreprise'}
                      </p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                        {pricingValue}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Installé le {sub.installedAt ? new Date(sub.installedAt).toLocaleDateString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}>
                      <CheckCircle className="h-3 w-3" />
                      ACTIF
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4" />
                    Voir détails
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Ban className="h-4 w-4" />
                    Désactiver
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
