'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  XCircle,
  PauseCircle,
  Ban,
  Eye,
  Snowflake,
  Star,
  FileCheck,
  FileX,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Drawer } from '@/components/ui/Drawer';
import { ErrorState } from '@/components/ui/ErrorState';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useAdminConfirmation } from '@/hooks/useAdminConfirmation';
import { AlertTriangle } from 'lucide-react';

const VERIF_LABELS: Record<string, string> = {
  PENDING: 'En attente KYC',
  VERIFIED: 'Vérifié',
  REJECTED: 'Rejeté',
};

const VERIF_BADGE: Record<string, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  VERIFIED: 'success',
  REJECTED: 'danger',
};

function useAdminBusinesses(params?: any) {
  return useQuery({
    queryKey: ['admin', 'businesses', params],
    queryFn: async () => {
      const res = await apiClient.adminGetBusinesses(params);
      return res.data.data;
    },
    retry: false,
  });
}

function useBusinessDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'business', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.adminGetBusinessById(id!);
      return res.data.data;
    },
  });
}

function InfoStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

export default function AdminBusinessesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const qc = useQueryClient();
  const { notify } = useToast();
  const { requestConfirmation, modal } = useAdminConfirmation();

  const [search, setSearch] = useState('');
  const [verifFilter, setVerifFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freezeReq, setFreezeReq] = useState<{
    id: string;
    name: string;
    durationHours: number;
  } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const limit = 20;

  const params: any = { page, limit };
  if (search) params.search = search;
  if (verifFilter === 'VERIFIED') params.verified = 'true';
  else if (verifFilter === 'REJECTED') params.verified = 'false';
  if (statusFilter === 'active') params.status = 'active';
  else if (statusFilter === 'inactive') params.status = 'inactive';

  const { data: dataRaw, isLoading, isError, refetch } = useAdminBusinesses(params);
  const detailQuery = useBusinessDetail(selectedId);
  const detailBusiness = detailQuery.data;

  const businesses = Array.isArray(dataRaw) ? dataRaw : (dataRaw?.items ?? []);
  const total = dataRaw?.total ?? 0;
  const totalPages = dataRaw?.totalPages ?? 1;

  const stats = useMemo(
    () => ({
      pending: businesses.filter((b: any) => b.verificationStatus === 'PENDING').length,
      verified: businesses.filter((b: any) => b.verificationStatus === 'VERIFIED').length,
      top: businesses.filter((b: any) => b.isTopSeller || b.isTopProvider).length,
      rated: businesses.filter((b: any) => b.rating > 0).length,
    }),
    [businesses]
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.adminUpdateBusinessStatus(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'business', selectedId!] });
      notify({ title: 'Statut mis à jour', description: 'Business notifié.', variant: 'success' });
    },
    onError: () => notify({ title: 'Erreur', description: 'Échec de l’action.', variant: 'error' }),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiClient.put(`/admin/businesses/${id}/verification`, { action: 'verify' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'business', selectedId!] });
      notify({
        title: 'Business approuvé',
        description:
          'Statut marketplace PUBLIC · limites Mobile Money débloquées · livre comptable créé.',
        variant: 'success',
      });
    },
    onError: () =>
      notify({ title: 'Erreur', description: 'Échec de la vérification.', variant: 'error' }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.put(`/admin/businesses/${id}/verification`, {
        action: 'reject',
        rejectionReason: reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'business', selectedId!] });
      setRejectTarget(null);
      setRejectReason('');
      notify({
        title: 'Business refusé',
        description: 'Propriétaire notifié du motif.',
        variant: 'success',
      });
    },
    onError: () => notify({ title: 'Erreur', description: 'Échec du rejet.', variant: 'error' }),
  });

  const freezeMutation = useMutation({
    mutationFn: ({
      id,
      durationHours,
      reason,
    }: {
      id: string;
      durationHours: number;
      reason?: string;
    }) => apiClient.post(`/admin/businesses/${id}/freeze`, { durationHours, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'businesses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'business', selectedId!] });
      notify({
        title: 'Business gelé',
        description: 'Retraits et transactions suspendus.',
        variant: 'success',
      });
    },
    onError: () => notify({ title: 'Erreur', description: 'Échec du gel.', variant: 'error' }),
  });

  const handleFreeze = async () => {
    if (!freezeReq) return;
    const ok = await requestConfirmation({
      title: `Geler ${freezeReq.name} ?`,
      description: `Pendant ${freezeReq.durationHours}h : retraits suspendus, marketplace masquée. Action sensible.`,
      confirmLabel: 'Geler',
      danger: true,
      action: async () => {
        await apiClient.post(`/admin/businesses/${freezeReq.id}/freeze`, {
          durationHours: freezeReq.durationHours,
          reason: 'Gel administrateur',
        });
      },
    });
    if (ok) {
      setFreezeReq(null);
      qc.invalidateQueries({ queryKey: ['admin', 'businesses'] });
      qc.invalidateQueries({ queryKey: ['admin', 'business', selectedId!] });
      notify({
        title: 'Business gelé',
        description: `${freezeReq.durationHours}h.`,
        variant: 'success',
      });
    }
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des businesses
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pipeline de validation des entreprises"
        description="Vérification KYC, santé et visibilité marketplace en temps réel"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Entreprises' },
        ]}
      />

      {isLoading ? (
        <Loader className="py-20" />
      ) : isError ? (
        <Card padding="none">
          <ErrorState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Impossible de charger les entreprises"
            message="Le service marketplace est injoignable. Réessayez."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<Building2 className="h-5 w-5" />}
              label="Entreprises totales"
              value={total.toLocaleString('fr-FR')}
            />
            <StatsCard
              icon={<FileCheck className="h-5 w-5" />}
              iconBg="bg-emerald-50 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              label="Vérifiées (page)"
              value={stats.verified}
            />
            <StatsCard
              icon={<FileX className="h-5 w-5" />}
              iconBg="bg-amber-50 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
              label="KYC en attente"
              value={stats.pending}
            />
            <StatsCard
              icon={<Star className="h-5 w-5" />}
              iconBg="bg-purple-50 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
              label="Top vendeurs"
              value={stats.top}
            />
          </div>

          {/* Filters */}
          <Card padding="md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nom, email, téléphone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <Select
                value={verifFilter}
                onChange={(e) => {
                  setVerifFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Toutes les vérifications' },
                  { value: 'VERIFIED', label: 'Vérifiées' },
                  { value: 'REJECTED', label: 'Rejetées' },
                ]}
              />
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Tous les statuts' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'inactive', label: 'Inactifs' },
                ]}
              />
              {(search || verifFilter || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setVerifFilter('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                >
                  Effacer
                </Button>
              )}
            </div>
          </Card>

          {/* Table dense */}
          <Card padding="none">
            {businesses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Entreprise</th>
                      <th className="p-4 font-medium">Activité</th>
                      <th className="p-4 font-medium">Réputation</th>
                      <th className="p-4 font-medium">KYC</th>
                      <th className="p-4 font-medium">Statut</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b: any) => (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedId(b.id)}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <Avatar src={b.logo} initials={b.name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                {b.name}
                                {(b.isTopSeller || b.isTopProvider) && (
                                  <Badge variant="purple" size="xs">
                                    Top
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {b.owner?.email || b.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                            {b.type}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[b.country, b.city].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            {Number(b.rating).toFixed(1)}
                            <span className="text-xs font-normal text-gray-400">
                              ({b.reviewCount ?? 0})
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={VERIF_BADGE[b.verificationStatus] || 'default'}
                            size="xs"
                            dot
                          >
                            {VERIF_LABELS[b.verificationStatus] || b.verificationStatus || '—'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {b.isActive !== false ? (
                            <LiveBadge tone="success" label="Actif" />
                          ) : (
                            <LiveBadge tone="danger" label="Inactif" />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/admin/businesses/${b.id}`}
                              onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            >
                              <Button variant="ghost" size="xs">
                                <Eye className="h-3.5 w-3.5" />
                                Profil
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<Building2 className="h-8 w-8" />}
                title="Aucun business"
                description={
                  search || verifFilter || statusFilter
                    ? 'Aucun business ne correspond aux filtres.'
                    : 'Aucun business trouvé.'
                }
              />
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} sur {totalPages} · {total.toLocaleString('fr-FR')} entreprises
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drawer détail + décisions */}
      <Drawer
        isOpen={!!selectedId}
        onClose={() => {
          setSelectedId(null);
          setFreezeReq(null);
        }}
        icon={<Building2 className="h-5 w-5" />}
        title={detailBusiness?.name}
        subtitle={detailBusiness?.type}
        footer={
          selectedId && detailBusiness ? (
            <div className="flex flex-wrap gap-2">
              {detailBusiness.verificationStatus !== 'VERIFIED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => verifyMutation.mutate({ id: selectedId })}
                  isLoading={verifyMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approuver
                </Button>
              )}
              {detailBusiness.verificationStatus !== 'REJECTED' && (
                <Button variant="outline" size="sm" onClick={() => setRejectTarget(detailBusiness)}>
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setFreezeReq({ id: selectedId, name: detailBusiness.name, durationHours: 48 })
                }
              >
                <Snowflake className="h-4 w-4" />
                Geler 48h
              </Button>
              {detailBusiness.isActive === false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => statusMutation.mutate({ id: selectedId, action: 'validate' })}
                  isLoading={statusMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4" />
                  Réactiver
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {detailBusiness && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar src={detailBusiness.logo} initials={detailBusiness.name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {detailBusiness.owner?.email || detailBusiness.email}
                </p>
                <p className="text-xs text-gray-500">
                  {detailBusiness.owner
                    ? `${detailBusiness.owner.firstName || ''} ${detailBusiness.owner.lastName || ''}`.trim()
                    : 'Propriétaire'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoStat
                icon={Star}
                label="Note / avis"
                value={`${Number(detailBusiness.rating).toFixed(1)} / ${detailBusiness.reviewCount ?? 0}`}
              />
              <InfoStat
                icon={Building2}
                label="Produits · services"
                value={`${detailBusiness._count?.products ?? 0} · ${detailBusiness._count?.services ?? 0}`}
              />
              <InfoStat
                icon={MapPin}
                label="Localisation"
                value={
                  [detailBusiness.country, detailBusiness.city].filter(Boolean).join(' · ') || '—'
                }
              />
              <InfoStat
                icon={Snowflake}
                label="Gel actif"
                value={
                  detailBusiness.frozenUntil
                    ? new Date(detailBusiness.frozenUntil).toLocaleString('fr-FR')
                    : 'Non'
                }
              />
            </div>

            {freezeReq && selectedId === freezeReq.id && (
              <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 p-3 space-y-2">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Confirmer le gel pendant {freezeReq.durationHours}h
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleFreeze}
                    isLoading={freezeMutation.isPending}
                  >
                    <Snowflake className="h-4 w-4" />
                    Geler {freezeReq.durationHours}h
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setFreezeReq(null)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* KYC documents */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Pièces justificatives
              </p>
              <div className="space-y-1.5">
                {[
                  { key: 'identityDocument', label: 'Identité (CNI)' },
                  { key: 'companyDocument', label: 'Registre du commerce' },
                  { key: 'taxDocument', label: 'Document fiscal' },
                  { key: 'responsiblePhoto', label: 'Photo du responsable' },
                ].map((d) => {
                  const url = (detailBusiness as any)[d.key];
                  return (
                    <button
                      key={d.key}
                      disabled={!url}
                      onClick={() => window.open(url, '_blank')}
                      className="w-full flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/30 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                      {url ? (
                        <span className="text-xs font-medium text-brand flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Voir
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">absent</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {detailBusiness.rejectionReason && (
              <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 p-3">
                <p className="text-xs font-medium text-red-600 dark:text-red-300 mb-1">
                  Motif de refus
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {detailBusiness.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title="Rejeter la vérification"
        description={`Refuser la vérification de « ${rejectTarget?.name || ''} »`}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Motif du refus
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Motif communiqué au propriétaire..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="h-4 w-4" />
              Refuser
            </Button>
          </div>
        </div>
      </Modal>

      {modal}
    </div>
  );
}
