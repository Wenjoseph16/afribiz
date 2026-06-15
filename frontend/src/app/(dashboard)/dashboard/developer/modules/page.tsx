'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package, Search, Star, Download, DollarSign, Plus,
  Eye, Edit3, Send, Archive, XCircle, Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules, usePublishDeveloperModule, useUpdateDeveloperModule } from '@/features/developerHooks';
import type { DeveloperModule } from '@/types/developer';
import { MODULE_STATUS_LABELS, PRICING_LABELS } from '@/types/developer';

const STATUS_VARIANT: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  DRAFT: 'default',
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  ARCHIVED: 'default',
};

const FILTER_TABS = [
  { key: undefined, label: 'Tous' },
  { key: 'PUBLISHED', label: 'Publiés' },
  { key: 'PENDING_REVIEW', label: 'En révision' },
  { key: 'DRAFT', label: 'Brouillons' },
  { key: 'ARCHIVED', label: 'Archivés' },
];

export default function DeveloperModulesPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const { data: modules, isLoading, error, refetch } = useDeveloperModules(statusFilter);
  const publishModule = usePublishDeveloperModule();
  const updateModule = useUpdateDeveloperModule();

  const moduleList = useMemo(() => {
    if (!modules) return [];
    let list = Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m: DeveloperModule) =>
        m.name.toLowerCase().includes(q) ||
        (m.category || '').toLowerCase().includes(q) ||
        (m.shortDescription || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [modules, search]);

  const stats = useMemo(() => ({
    total: moduleList.length,
    published: moduleList.filter((m: DeveloperModule) => m.status === 'PUBLISHED').length,
    pending: moduleList.filter((m: DeveloperModule) => m.status === 'PENDING_REVIEW' || m.status === 'DRAFT').length,
    totalInstalls: moduleList.reduce((sum: number, m: DeveloperModule) => sum + (m.totalInstalls || 0), 0),
  }), [moduleList]);

  const handlePublish = async (id: string) => {
    try {
      await publishModule.mutateAsync(id);
    } catch (e) { console.error(e); }
  };

  const handleArchiveToggle = async (mod: DeveloperModule) => {
    try {
      const newStatus = mod.status === 'ARCHIVED' ? 'DRAFT' : 'ARCHIVED';
      await updateModule.mutateAsync({ id: mod.id, data: { status: newStatus } });
    } catch (e) { console.error(e); }
  };

  const renderStars = (rating: number) => {
    return (
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3 w-3',
              star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </span>
    );
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes Modules"
        description="Créez, gérez et publiez vos modules sur la marketplace"
        breadcrumbs={[{ label: 'Développeur', href: '/dashboard/developer' }, { label: 'Modules' }]}
        actions={
          <Link href="/dashboard/developer/modules/publish">
            <Button variant="gradient">
              <Plus className="h-4 w-4" />
              Publier un module
            </Button>
          </Link>
        }
      />

      {/* Filter tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === tab.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Package className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><Package className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Publiés</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.published}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><Clock className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><Download className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Installations totales</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalInstalls}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modules grid */}
      {moduleList.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Aucun module trouvé"
          description={search ? 'Essayez une autre recherche.' : "Vous n'avez pas encore créé de module."}
          action={
            !search ? (
              <Link href="/dashboard/developer/modules/publish">
                <Button variant="gradient">
                  <Plus className="h-4 w-4" />
                  Publier un module
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleList.map((mod: DeveloperModule) => (
            <Card key={mod.id} padding="md" hoverable>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {mod.logo ? (
                    <Image src={mod.logo ?? ''} alt={mod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  ) : (
                    <Package className="h-6 w-6 text-brand" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{mod.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{mod.category || 'Non catégorisé'}</span>
                    <Badge variant={STATUS_VARIANT[mod.status] || 'default'} size="xs">
                      {MODULE_STATUS_LABELS[mod.status] || mod.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1"><Download className="h-3 w-3" />{mod.totalInstalls || 0}</span>
                <span className="flex items-center gap-1">{renderStars(mod.rating || 0)}</span>
                <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                  <DollarSign className="h-3 w-3" />
                  {mod.price ? `${mod.price.toLocaleString()} FCFA` : PRICING_LABELS[mod.pricingType] || 'Gratuit'}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-3">
                Créé le {new Date(mod.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Link href={`/dashboard/developer/modules/${mod.id}`}>
                  <Button variant="secondary" size="xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                </Link>
                <Link href={`/dashboard/developer/modules/publish?id=${mod.id}`}>
                  <Button variant="secondary" size="xs">
                    <Edit3 className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                </Link>
                {mod.status === 'DRAFT' || mod.status === 'REJECTED' ? (
                  <Button
                    variant="primary"
                    size="xs"
                    isLoading={publishModule.isPending}
                    onClick={() => handlePublish(mod.id)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Publier
                  </Button>
                ) : mod.status === 'PUBLISHED' || mod.status === 'PENDING_REVIEW' ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-gray-500"
                    onClick={() => handleArchiveToggle(mod)}
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Archiver
                  </Button>
                ) : mod.status === 'ARCHIVED' ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleArchiveToggle(mod)}
                  >
                    <Package className="h-3 w-3 mr-1" />
                    Restaurer
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
