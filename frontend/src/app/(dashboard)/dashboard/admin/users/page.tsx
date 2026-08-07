'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  Snowflake,
  Play,
  Clock,
  Smartphone,
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
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useAdminConfirmation } from '@/hooks/useAdminConfirmation';
import { AlertTriangle } from 'lucide-react';

const ROLES = ['CLIENT', 'BUSINESS', 'DEVELOPER', 'ADMIN'];
const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  BUSINESS: 'Business',
  DEVELOPER: 'Développeur',
  ADMIN: 'Admin',
};

type Risk = 'faible' | 'attention' | 'critique';

function fullName(u: any) {
  return `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || 'N/A';
}

function riskOf(u: any, frozenIds: Set<string>): { level: Risk; label: string } {
  if (frozenIds.has(u.id) || u.isFrozen || u.isActive === false)
    return { level: 'critique', label: 'Critique' };
  if (!(u.emailVerified && u.phoneVerified)) return { level: 'attention', label: 'À vérifier' };
  return { level: 'faible', label: 'Faible' };
}

const riskStyle: Record<Risk, { badge: 'success' | 'warning' | 'danger' }> = {
  faible: { badge: 'success' },
  attention: { badge: 'warning' },
  critique: { badge: 'danger' },
};

function useAdminUsers(params?: any) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await apiClient.adminGetUsers(params);
      return res.data.data;
    },
    retry: false,
  });
}

function usePresence() {
  return useQuery({
    queryKey: ['admin', 'presence'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/presence');
      return res.data.data as { count: number; byRole: Record<string, number>; updatedAt: string };
    },
    refetchInterval: 10_000,
  });
}

function useFrozen() {
  return useQuery({
    queryKey: ['admin', 'freezes'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/freezes');
      return res.data.data;
    },
    retry: false,
  });
}

function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.adminGetUserDetail(id!);
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
  value?: string;
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

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const qc = useQueryClient();
  const { notify } = useToast();
  const { requestConfirmation, modal } = useAdminConfirmation();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freezeReq, setFreezeReq] = useState<{
    id: string;
    name: string;
    durationHours: number;
  } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;
  if (statusFilter) params.status = statusFilter;

  const { data: usersData, isLoading, isError, refetch } = useAdminUsers(params);
  const { data: presence } = usePresence();
  const { data: frozenData } = useFrozen();

  const frozenIds = useMemo(() => {
    const s = new Set<string>();
    const arr = Array.isArray(frozenData) ? frozenData : (frozenData as any)?.users;
    if (Array.isArray(arr)) for (const f of arr) if (f?.userId) s.add(f.userId);
    return s;
  }, [frozenData]);

  const users = Array.isArray(usersData) ? usersData : (usersData?.users ?? []);
  const total = usersData?.total ?? 0;
  const totalPages = usersData?.totalPages ?? 1;

  const connected = presence?.count ?? 0;
  const activeOnPage = users.filter((u: any) => u.isActive).length;
  const kycOnPage = useMemo(
    () => users.filter((u: any) => u.emailVerified && u.phoneVerified).length,
    [users]
  );

  const detailQuery = useUserDetail(selectedId);
  const detailUser = detailQuery.data;

  const mutateStatus = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/users/${id}/status`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'user', selectedId!] });
      notify({ title: 'Statut mis à jour', description: 'Compte réactivé.', variant: 'success' });
    },
    onError: () =>
      notify({ title: 'Erreur', description: 'Échec du changement de statut.', variant: 'error' }),
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
    }) => apiClient.post(`/admin/users/${id}/freeze`, { durationHours, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'freezes'] });
      qc.invalidateQueries({ queryKey: ['admin', 'user', selectedId!] });
      notify({
        title: 'Compte gelé',
        description: 'Session révoquée et retraits suspendus.',
        variant: 'success',
      });
    },
    onError: () =>
      notify({ title: 'Erreur', description: 'Échec du gel du compte.', variant: 'error' }),
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/impersonate/${id}`),
    onSuccess: () => {
      notify({
        title: 'Mode Voir-comme',
        description: 'Bascule sur l’environnement de l’utilisateur.',
        variant: 'success',
      });
      window.location.href = '/dashboard';
    },
    onError: () =>
      notify({ title: 'Erreur', description: 'Échec de l’impersonation.', variant: 'error' }),
  });

  const handleStatus = async (id: string, action: string, name: string) => {
    const label =
      action === 'activate' ? 'réactiver' : action === 'suspend' ? 'suspendre' : 'bloquer';
    const ok = await requestConfirmation({
      title: `Changer le statut de ${name} ?`,
      description: `Cette action va ${label} le compte « ${name} ».`,
      confirmLabel: label,
      danger: action !== 'activate',
      action: async () => {
        await apiClient.put(`/admin/users/${id}/status`, { action });
      },
    });
    if (ok) {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'user', id] });
      notify({
        title: `Utilisateur ${label}`,
        description: 'Statut mis à jour.',
        variant: 'success',
      });
    }
  };

  const handleFreeze = async () => {
    if (!freezeReq) return;
    const ok = await requestConfirmation({
      title: `Geler ${freezeReq.name} ?`,
      description: `Le compte sera gelé pendant ${freezeReq.durationHours}h : session révoquée, retraits suspendus. Action sensible.`,
      confirmLabel: 'Geler',
      danger: true,
      action: async () => {
        await apiClient.post(`/admin/users/${freezeReq.id}/freeze`, {
          durationHours: freezeReq.durationHours,
          reason: 'Gel administrateur',
        });
      },
    });
    if (ok) {
      setFreezeReq(null);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'freezes'] });
      qc.invalidateQueries({ queryKey: ['admin', 'user', selectedId!] });
      notify({
        title: 'Compte gelé',
        description: `${freezeReq.durationHours}h · sessions révoquées.`,
        variant: 'success',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des utilisateurs
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
        title="Centre de contrôle des utilisateurs"
        description="Identités, accès, risque et vérification en temps réel"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Utilisateurs' },
        ]}
      />

      {isLoading ? (
        <Loader className="py-20" />
      ) : isError ? (
        <Card padding="none">
          <ErrorState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Impossible de charger les utilisateurs"
            message="Le service identités est injoignable. Réessayez."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <>
          {/* KPIs temps réel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<Users className="h-5 w-5" />}
              label="Comptes totaux"
              value={total.toLocaleString('fr-FR')}
            />
            <StatsCard
              icon={<Play className="h-5 w-5" />}
              iconBg="bg-emerald-50 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              label="Connectés en direct"
              value={connected.toLocaleString('fr-FR')}
            />
            <StatsCard
              icon={<Clock className="h-5 w-5" />}
              iconBg="bg-amber-50 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
              label="Actifs (cette page)"
              value={`${activeOnPage}/${users.length}`}
            />
            <StatsCard
              icon={<Shield className="h-5 w-5" />}
              iconBg="bg-brand-50 dark:bg-brand-900/30"
              iconColor="text-brand"
              label="KYC complet (page)"
              value={kycOnPage}
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
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'Tous les rôles' },
                  ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
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
              {(search || roleFilter || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                >
                  Effacer
                </Button>
              )}
            </div>
          </Card>

          {/* Users table dense */}
          <Card padding="none">
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Utilisateur</th>
                      <th className="p-4 font-medium">Rôle</th>
                      <th className="p-4 font-medium">Vérification</th>
                      <th className="p-4 font-medium">Risque</th>
                      <th className="p-4 font-medium">Activité</th>
                      <th className="p-4 font-medium">Statut</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => {
                      const risk = riskOf(u, frozenIds);
                      const name = fullName(u);
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedId(u.id)}
                          className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3 min-w-[190px]">
                              <Avatar initials={name} src={u.avatar} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="default" size="xs">
                              {ROLE_LABELS[u.primaryRole] || u.primaryRole || 'Client'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              <Badge
                                variant={u.emailVerified ? 'success' : 'default'}
                                size="xs"
                                dot
                              >
                                Email
                              </Badge>
                              <Badge
                                variant={u.phoneVerified ? 'success' : 'default'}
                                size="xs"
                                dot
                              >
                                Tel
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={riskStyle[risk.level].badge} size="xs" dot>
                              {risk.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : '—'}
                            {u._count?.sessions ? ` · ${u._count.sessions} sessions` : ''}
                          </td>
                          <td className="p-4">
                            {u.isActive !== false ? (
                              <LiveBadge tone="success" label="Actif" />
                            ) : (
                              <LiveBadge tone="danger" label="Inactif" />
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/dashboard/admin/users/${u.id}`}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Aucun utilisateur"
                description={
                  search || roleFilter || statusFilter
                    ? 'Aucun utilisateur ne correspond aux filtres.'
                    : 'Aucun utilisateur trouvé.'
                }
              />
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} sur {totalPages} · {total.toLocaleString('fr-FR')} comptes
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

      {/* Drawer profil 360° + actions */}
      <Drawer
        isOpen={!!selectedId}
        onClose={() => {
          setSelectedId(null);
          setFreezeReq(null);
        }}
        icon={<Users className="h-5 w-5" />}
        title={fullName(detailUser)}
        subtitle={detailUser?.email}
        footer={
          selectedId ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatus(selectedId, 'activate', fullName(detailUser))}
                isLoading={mutateStatus.isPending}
                disabled={detailUser?.isActive !== false}
              >
                Réactiver
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setFreezeReq({ id: selectedId, name: fullName(detailUser), durationHours: 48 })
                }
              >
                <Snowflake className="h-4 w-4" />
                Geler 48h
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => impersonateMutation.mutate(selectedId)}
                isLoading={impersonateMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Voir comme
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar initials={fullName(detailUser)} src={detailUser.avatar} size="lg" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {detailUser.email}
                </p>
                <p className="text-xs text-gray-500">{detailUser.phone || 'aucun téléphone'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoStat
                icon={Play}
                label="Dernière connexion"
                value={
                  detailUser.lastLoginAt
                    ? new Date(detailUser.lastLoginAt).toLocaleString('fr-FR')
                    : undefined
                }
              />
              <InfoStat
                icon={Clock}
                label="Créé le"
                value={
                  detailUser.createdAt
                    ? new Date(detailUser.createdAt).toLocaleDateString('fr-FR')
                    : undefined
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
                <p className="text-xs text-gray-400">
                  Session révoquée + retraits suspendus. Socket mis à jour en temps réel.
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Sessions actives
              </p>
              {detailUser.sessions?.length ? (
                <div className="space-y-1.5">
                  {detailUser.sessions.slice(0, 4).map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm rounded-lg bg-gray-50 dark:bg-gray-700/30 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Smartphone className="h-3.5 w-3.5 text-gray-400" />
                        {s.ip || s.device || s.userAgent?.slice(0, 30) || 'Appareil'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {s.lastActiveAt || s.createdAt
                          ? new Date(s.lastActiveAt || s.createdAt).toLocaleString('fr-FR')
                          : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucune session affichée</p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {modal}
    </div>
  );
}
