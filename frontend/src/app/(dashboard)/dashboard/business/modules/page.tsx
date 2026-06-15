'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package, ExternalLink, Settings, Star, AlertCircle,
  CheckCircle2, Clock, Ban, Loader2, Trash2, Sparkles,
  ShoppingCart, Calendar, Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useBusinessInstalledModules } from '@/features/developerHooks';

export default function BusinessModulesPage() {
  const { data: installations, isLoading } = useBusinessInstalledModules();
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all');

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const modules = Array.isArray(installations) ? installations : [];
  const filteredModules = modules.filter((inst: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return inst.status === 'ACTIVE' && !inst.isTrial;
    if (filter === 'trial') return inst.isTrial && !inst.trialExpired;
    if (filter === 'expired') return inst.trialExpired || inst.status === 'UNINSTALLED';
    return true;
  });

  const getStatusBadge = (inst: any) => {
    if (inst.status === 'UNINSTALLED') return <Badge variant="danger" size="sm">Désinstallé</Badge>;
    if (inst.trialExpired) return <Badge variant="danger" size="sm">Essai expiré</Badge>;
    if (inst.isTrial) return <Badge variant="warning" size="sm">{inst.trialDaysLeft}j restants</Badge>;
    if (inst.status === 'ACTIVE') return <Badge variant="success" size="sm">Actif</Badge>;
    return <Badge variant="default" size="sm">{inst.status}</Badge>;
  };

  const getStatusIcon = (inst: any) => {
    if (inst.status === 'UNINSTALLED') return <Ban className="h-5 w-5 text-red-400" />;
    if (inst.trialExpired) return <AlertCircle className="h-5 w-5 text-red-400" />;
    if (inst.isTrial) return <Sparkles className="h-5 w-5 text-amber-400" />;
    if (inst.status === 'ACTIVE') return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    return <Package className="h-5 w-5 text-gray-400" />;
  };

  const filters = [
    { key: 'all' as const, label: 'Tous', count: modules.length },
    { key: 'active' as const, label: 'Actifs', count: modules.filter((i: any) => i.status === 'ACTIVE' && !i.isTrial).length },
    { key: 'trial' as const, label: 'Essai', count: modules.filter((i: any) => i.isTrial && !i.trialExpired).length },
    { key: 'expired' as const, label: 'Expirés', count: modules.filter((i: any) => i.trialExpired || i.status === 'UNINSTALLED').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mes modules installés</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les modules que vous avez installés depuis le marketplace
          </p>
        </div>
        <Link href="/dashboard/marketplace">
          <Button>
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Marketplace
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              filter === f.key
                ? 'bg-brand text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {filteredModules.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Aucun module installé"
          description="Parcourez le marketplace pour découvrir des modules qui peuvent améliorer votre business."
          action={
            <Link href="/dashboard/marketplace">
              <Button><ShoppingCart className="h-4 w-4 mr-1.5" />Découvrir le marketplace</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredModules.map((inst: any) => {
            const mod = inst.module;
            const devName = mod?.developer?.companyName ||
              (mod?.developer?.user ? `${mod.developer.user.firstName} ${mod.developer.user.lastName}` : 'Développeur');
            const isPaid = !mod?.isFree && Number(mod?.price || 0) > 0;

            return (
              <Card key={inst.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 relative',
                      inst.isTrial ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                      inst.status === 'ACTIVE' ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                      'bg-gradient-to-br from-gray-400 to-gray-600'
                    )}>
                      {mod?.logo ? (
                        <Image src={mod.logo} alt="" fill className="object-cover rounded-xl" sizes="48px" unoptimized />
                      ) : (
                        getStatusIcon(inst)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {mod?.name || 'Module'}
                        </h3>
                        {getStatusBadge(inst)}
                      </div>

                      {mod?.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                          {mod.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                        <span>v{mod?.version || '1.0.0'}</span>
                        <span>{mod?.category || '-'}</span>
                        <span>Par {devName}</span>
                        {mod?.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            {mod.rating.toFixed(1)}
                          </span>
                        )}
                        <span>Installé le {new Date(inst.installedAt).toLocaleDateString('fr-FR')}</span>
                      </div>

                      {inst.isTrial && inst.trialEndsAt && (
                        <div className={cn(
                          'mt-3 flex items-center gap-2 text-xs p-2 rounded-lg',
                          inst.trialDaysLeft <= 2
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                        )}>
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {inst.trialDaysLeft > 0
                              ? `Essai gratuit : ${inst.trialDaysLeft} jour${inst.trialDaysLeft > 1 ? 's' : ''} restant${inst.trialDaysLeft > 1 ? 's' : ''}`
                              : 'Essai expiré'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/dashboard/marketplace/${mod?.slug || ''}`}>
                          <Button variant="ghost" size="xs">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Détails
                          </Button>
                        </Link>
                        {isPaid && inst.isTrial && !inst.trialExpired && (
                          <Link href={`/dashboard/marketplace/${mod?.slug || ''}/checkout`}>
                            <Button size="xs">
                              <ShoppingCart className="h-3.5 w-3.5 mr-1" />Acheter maintenant
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
