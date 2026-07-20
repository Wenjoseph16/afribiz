'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Target,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  Plus,
  X,
  Trash2,
  ChevronDown,
  Loader,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonStats } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
  useStages,
  useDeals,
  usePipelineStats,
  useSeedStages,
  useCreateDeal,
  useUpdateDeal,
  useMoveDeal,
  useDeleteDeal,
} from '@/features/pipelineHooks';

const DEFAULT_STAGE_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

const PROBABILITY_LABELS: Record<string, string> = {
  '0': 'Froid',
  '25': 'Contacté',
  '50': 'En cours',
  '75': 'Avancé',
  '100': 'Gagné',
};

function getProbabilityVariant(prob: number): 'danger' | 'warning' | 'info' | 'brand' | 'success' {
  if (prob <= 0) return 'danger';
  if (prob <= 25) return 'warning';
  if (prob <= 50) return 'info';
  if (prob <= 75) return 'brand';
  return 'success';
}

function formatCurrency(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return `${num.toLocaleString()} FCFA`;
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR');
}

export default function PipelinePage() {
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<any>(null);

  const { data: stages, isLoading: stagesLoading, error: stagesError } = useStages();
  const { data: dealsData, isLoading: dealsLoading, error: dealsError, refetch } = useDeals();
  const { data: stats, isLoading: statsLoading } = usePipelineStats();
  const seedStages = useSeedStages();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const moveDeal = useMoveDeal();
  const deleteDeal = useDeleteDeal();

  useEffect(() => {
    if (stages && Array.isArray(stages) && stages.length === 0 && !seedStages.isPending) {
      seedStages.mutate();
    }
  }, [stages]);

  const stagesList = useMemo(() => {
    if (!stages || !Array.isArray(stages)) return [];
    return stages.map((s: any, i: number) => ({
      ...s,
      color: s.color || DEFAULT_STAGE_COLORS[i % DEFAULT_STAGE_COLORS.length],
    }));
  }, [stages]);

  const deals = useMemo(() => {
    if (!dealsData) return [];
    if (Array.isArray(dealsData)) return dealsData;
    return (dealsData as any)?.deals ?? (dealsData as any)?.data ?? [];
  }, [dealsData]);

  const dealsByStage = useMemo(() => {
    const map: Record<string, any[]> = {};
    stagesList.forEach((s: any) => {
      map[s.id] = [];
    });
    (deals as any[]).forEach((d: any) => {
      const stageId = d.stageId || d.stage?.id;
      if (stageId && map[stageId]) {
        map[stageId].push(d);
      }
    });
    return map;
  }, [deals, stagesList]);

  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum: number, d: any) => sum + Number(d.value ?? 0), 0);
  const wonValue = deals
    .filter((d: any) => d.stage?.name?.toLowerCase() === 'gagné' || d.probability === 100)
    .reduce((sum: number, d: any) => sum + Number(d.value ?? 0), 0);

  const statCards = [
    {
      icon: <Target className="h-5 w-5" />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-blue-600',
      label: 'Total deals',
      value: stats?.totalDeals ?? totalDeals,
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600',
      label: 'Valeur totale',
      value: formatCurrency(stats?.totalValue ?? totalValue),
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-600',
      label: 'Valeur gagnée',
      value: formatCurrency(stats?.wonValue ?? wonValue),
    },
    {
      icon: <Target className="h-5 w-5" />,
      iconBg: 'bg-amber-50 dark:bg-amber-900/30',
      iconColor: 'text-amber-600',
      label: 'Taux de conversion',
      value:
        stats?.conversionRate != null
          ? `${stats.conversionRate}%`
          : totalDeals > 0
            ? `${Math.round((deals.filter((d: any) => d.probability === 100).length / totalDeals) * 100)}%`
            : '0%',
    },
  ];

  const handleOpenCreate = () => {
    setEditingDeal(null);
    setShowDealModal(true);
  };

  const handleOpenEdit = (deal: any) => {
    setEditingDeal(deal);
    setShowDealModal(true);
  };

  const handleCloseModal = () => {
    setShowDealModal(false);
    setEditingDeal(null);
  };

  const handleSubmitDeal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const payload: any = {
      title: data.title as string,
      clientName: data.clientName as string,
      clientEmail: (data.clientEmail as string) || undefined,
      clientPhone: (data.clientPhone as string) || undefined,
      value: parseFloat(data.value as string) || 0,
      stageId: data.stageId as string,
      source: (data.source as string) || undefined,
      probability: parseInt(data.probability as string, 10) || 0,
      expectedCloseDate: (data.expectedCloseDate as string) || undefined,
      description: (data.description as string) || undefined,
      notes: (data.notes as string) || undefined,
    };

    if (editingDeal) {
      await updateDeal.mutateAsync({ id: editingDeal.id, data: payload });
    } else {
      await createDeal.mutateAsync(payload);
    }
    handleCloseModal();
  };

  const handleMoveDeal = async (dealId: string, stageId: string) => {
    await moveDeal.mutateAsync({ id: dealId, data: { stageId } });
  };

  const handleDeleteDeal = async (dealId: string) => {
    await deleteDeal.mutateAsync(dealId);
    setDeleteConfirm(null);
    setShowDetailModal(null);
  };

  const isLoading = stagesLoading || dealsLoading;
  const error = stagesError || dealsError;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Pipeline"
          description="Gérez votre pipeline de ventes et suivez vos deals"
          gradient
        />
        <SkeletonStats />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[300px] w-[300px] shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
            >
              <div className="skeleton h-6 w-24 rounded-lg" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2"
                >
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Pipeline"
          description="Gérez votre pipeline de ventes et suivez vos deals"
          gradient
        />
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pipeline"
        description="Gérez votre pipeline de ventes et suivez vos deals"
        gradient
        actions={
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="h-4 w-4" />
            Nouveau deal
          </Button>
        }
      />

      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <StatsCard key={i} {...stat} />
          ))}
        </div>
      )}

      {deals.length === 0 ? (
        <Card className="py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/30 dark:to-emerald-900/20 border border-brand-100/50 dark:border-brand-800/30 flex items-center justify-center mb-5 text-brand/40 dark:text-brand-400/40">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
              Aucun deal
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6 leading-relaxed">
              Créez votre premier deal pour commencer à suivre votre pipeline de ventes.
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Nouveau deal
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {stagesList.map((stage: any) => {
            const stageDeals = dealsByStage[stage.id] || [];
            return (
              <div key={stage.id} className="min-w-[300px] w-[300px] shrink-0">
                <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-4 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {stage.name}
                      </h3>
                    </div>
                    <Badge size="xs" variant="default">
                      {stageDeals.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {stageDeals.map((deal: any) => (
                      <div
                        key={deal.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-brand/30 dark:hover:border-brand/40 hover:shadow-sm transition-all duration-200 group"
                        onClick={() => setShowDetailModal(deal)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
                            {deal.title}
                          </h4>
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(deal);
                              }}
                              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(deal.id);
                              }}
                              className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {deal.clientName && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <User className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {deal.clientName}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(deal.value)}
                          </span>
                          <Badge size="xs" variant={getProbabilityVariant(deal.probability ?? 0)}>
                            {deal.probability ?? 0}%
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="relative">
                            <select
                              value={deal.stageId || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.value) {
                                  handleMoveDeal(deal.id, e.target.value);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand/20 appearance-none pr-5 cursor-pointer"
                            >
                              {stagesList.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="h-3 w-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          {deal.expectedCloseDate && (
                            <span className="text-[11px] text-gray-400">
                              <Calendar className="h-3 w-3 inline mr-0.5" />
                              {formatDate(deal.expectedCloseDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleOpenCreate}
                      className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-brand hover:border-brand/40 hover:bg-brand/5 transition-all duration-200"
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      Ajouter un deal
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showDealModal}
        onClose={handleCloseModal}
        title={editingDeal ? 'Modifier le deal' : 'Nouveau deal'}
        description={
          editingDeal
            ? `Modifier "${editingDeal.title}"`
            : 'Créez un nouveau deal dans votre pipeline'
        }
        size="lg"
      >
        <form onSubmit={handleSubmitDeal} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Titre *
              </label>
              <input
                name="title"
                defaultValue={editingDeal?.title || ''}
                required
                placeholder="Ex: Devis site web"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <User className="h-3.5 w-3.5 inline mr-1" />
                Nom du client
              </label>
              <input
                name="clientName"
                defaultValue={editingDeal?.clientName || ''}
                placeholder="Ex: Jean Dupont"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <DollarSign className="h-3.5 w-3.5 inline mr-1" />
                Valeur *
              </label>
              <input
                name="value"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingDeal?.value || ''}
                required
                placeholder="0"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Mail className="h-3.5 w-3.5 inline mr-1" />
                Email client
              </label>
              <input
                name="clientEmail"
                type="email"
                defaultValue={editingDeal?.clientEmail || ''}
                placeholder="client@exemple.com"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Phone className="h-3.5 w-3.5 inline mr-1" />
                Téléphone client
              </label>
              <input
                name="clientPhone"
                defaultValue={editingDeal?.clientPhone || ''}
                placeholder="+221 77 123 45 67"
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Tag className="h-3.5 w-3.5 inline mr-1" />
                Source
              </label>
              <select
                name="source"
                defaultValue={editingDeal?.source || ''}
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              >
                <option value="">Sélectionner une source</option>
                <option value="WEBSITE">Site web</option>
                <option value="REFERRAL">Recommandation</option>
                <option value="SOCIAL">Réseaux sociaux</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Appel</option>
                <option value="WALK_IN">Visite</option>
                <option value="PARTNER">Partenaire</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <Calendar className="h-3.5 w-3.5 inline mr-1" />
                Date de clôture estimée
              </label>
              <input
                name="expectedCloseDate"
                type="date"
                defaultValue={
                  editingDeal?.expectedCloseDate
                    ? new Date(editingDeal.expectedCloseDate).toISOString().split('T')[0]
                    : ''
                }
                className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Étape *
            </label>
            <select
              name="stageId"
              defaultValue={
                editingDeal?.stageId || editingDeal?.stage?.id || stagesList[0]?.id || ''
              }
              required
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            >
              {stagesList.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Probabilité :{' '}
              <span className="text-brand font-bold">{editingDeal?.probability ?? 50}%</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-8">0%</span>
              <input
                name="probability"
                type="range"
                min="0"
                max="100"
                step="5"
                defaultValue={editingDeal?.probability ?? 50}
                onChange={(e) => {
                  const val = e.target.value;
                  const label = document.getElementById('prob-label');
                  if (label) label.textContent = `${val}%`;
                }}
                className="flex-1 h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-brand cursor-pointer"
              />
              <span className="text-xs text-gray-400 w-8">100%</span>
            </div>
            <div className="flex justify-between mt-1">
              <span id="prob-label" className="text-sm font-medium text-brand">
                {editingDeal?.probability ?? 50}%
              </span>
              <span className="text-xs text-gray-400">
                {PROBABILITY_LABELS[String(editingDeal?.probability ?? 50)] || '—'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={editingDeal?.description || ''}
              rows={3}
              placeholder="Description du deal..."
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              defaultValue={editingDeal?.notes || ''}
              rows={3}
              placeholder="Notes internes..."
              className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button type="submit" isLoading={createDeal.isPending || updateDeal.isPending}>
              {editingDeal ? 'Enregistrer' : 'Créer le deal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!showDetailModal}
        onClose={() => setShowDetailModal(null)}
        title={showDetailModal?.title || 'Détail du deal'}
        size="md"
      >
        {showDetailModal && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {showDetailModal.title}
                </h3>
                {showDetailModal.clientName && (
                  <p className="text-sm text-gray-500 mt-1">
                    <User className="h-3.5 w-3.5 inline mr-1" />
                    {showDetailModal.clientName}
                  </p>
                )}
              </div>
              <Badge variant={getProbabilityVariant(showDetailModal.probability ?? 0)} size="md">
                {showDetailModal.probability ?? 0}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 mb-0.5">Valeur</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(showDetailModal.value)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 mb-0.5">Étape</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        stagesList.find(
                          (s: any) =>
                            s.id === (showDetailModal.stageId || showDetailModal.stage?.id)
                        )?.color || '#6366f1',
                    }}
                  />
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {showDetailModal.stage?.name ||
                      stagesList.find((s: any) => s.id === showDetailModal.stageId)?.name ||
                      '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showDetailModal.clientEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {showDetailModal.clientEmail}
                </div>
              )}
              {showDetailModal.clientPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {showDetailModal.clientPhone}
                </div>
              )}
              {showDetailModal.source && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Tag className="h-4 w-4 text-gray-400" />
                  {showDetailModal.source}
                </div>
              )}
              {showDetailModal.expectedCloseDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(showDetailModal.expectedCloseDate)}
                </div>
              )}
            </div>

            {showDetailModal.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Description
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {showDetailModal.description}
                </p>
              </div>
            )}

            {showDetailModal.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Notes
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {showDetailModal.notes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteConfirm(showDetailModal.id)}
                isLoading={deleteConfirm === showDetailModal.id && deleteDeal.isPending}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowDetailModal(null)}>
                  Fermer
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const deal = showDetailModal;
                    setShowDetailModal(null);
                    handleOpenEdit(deal);
                  }}
                >
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer ce deal ? Cette action est irréversible."
        size="sm"
      >
        <div className="flex items-center gap-3 justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
            Annuler
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteDeal.isPending}
            onClick={() => deleteConfirm && handleDeleteDeal(deleteConfirm)}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
