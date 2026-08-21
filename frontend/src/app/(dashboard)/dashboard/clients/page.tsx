'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Star,
  ThumbsUp,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Award,
  TrendingUp,
  DollarSign,
  Tag,
  PiggyBank,
  Layers,
  Plus,
  X,
  ExternalLink,
  MessageCircle,
  AlertTriangle,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Drawer } from '@/components/ui/Drawer';
import { CopilotTips } from '@/components/copilot/CopilotTips';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import {
  useCrmDashboardStats,
  useCrmClients,
  useCrmTags,
  useCrmSegments,
  useCrmCreateTag,
  useCrmAssignTag,
  useCrmRemoveTag,
} from '@/features/crm/hooks';

// Formateur de date sécurisé
function formatDate(value?: string, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', opts);
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

function clientInitials(c: any): string {
  const initials = `${c.firstName?.charAt(0) || ''}${c.lastName?.charAt(0) || ''}`.toUpperCase();
  return initials || '?';
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [savings, setSavings] = useState<'' | 'active' | 'ready' | 'completed' | 'none'>('');
  const [sortBy, setSortBy] = useState('spent');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');

  const { data: stats, isLoading: statsLoading } = useCrmDashboardStats();
  const {
    data: clientsData,
    isLoading,
    error,
    refetch,
  } = useCrmClients({
    search: search || undefined,
    tagId: selectedTagId || undefined,
    segmentId: selectedSegmentId || undefined,
    savings: savings || undefined,
    sortBy: sortBy === 'spent' ? 'totalSpent' : sortBy === 'orders' ? 'totalOrders' : 'lastOrderAt',
    sortOrder: 'desc',
    limit: 50,
  });
  const { data: tags } = useCrmTags();
  const { data: segments } = useCrmSegments();
  const createTag = useCrmCreateTag();
  const assignTag = useCrmAssignTag();
  const removeTag = useCrmRemoveTag();

  const clients = clientsData?.clients || [];
  const total = clientsData?.total || 0;
  const selectedClient = clients.find((c: any) => c.id === selectedId) || null;

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
    setNewTagName('');
    setNewTagColor('#6366f1');
    setShowNewTag(false);
  };

  const handleAssignTag = async (clientId: string, tagId: string) => {
    await assignTag.mutateAsync({ clientId, tagId });
  };

  const handleRemoveTag = async (clientId: string, tagId: string) => {
    await removeTag.mutateAsync({ clientId, tagId });
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const isTopClient = (c: any) =>
    stats?.topClients?.some((tc: any) => tc.clientId === c.clientId) || false;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Centre de relation client"
        description="Segmentez, fidélisez et suivez l'activité de chaque client en temps réel"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clients & CRM' }]}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/clients/segments">
              <Button variant="outline" size="sm">
                <Layers className="h-4 w-4" />
                Segments
              </Button>
            </Link>
            <Link href="/dashboard/clients/analytics">
              <Button size="sm">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
          </div>
        }
      />

      <CopilotTips moduleKey="CRM" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          label="Total clients"
          value={stats?.totalClients ?? 0}
        />
        <StatsCard
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          label="Nouveaux (30j)"
          value={stats?.newClients30d ?? 0}
        />
        <StatsCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="Actifs (30j)"
          value={stats?.activeClients ?? 0}
        />
        <StatsCard
          icon={<ThumbsUp className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="Rétention"
          value={`${stats?.retentionRate ?? 0}%`}
        />
      </div>

      {/* Alertes */}
      {statsLoading ? null : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.clientsWithDebt > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-900/10">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 truncate">
                  {stats.clientsWithDebt} client(s) à risque
                </p>
                <p className="text-[11px] text-red-500/80">Impayés ou en retard</p>
              </div>
            </div>
          )}
          {stats.topClients && stats.topClients.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                  {stats.topClients.length} top client(s)
                </p>
                <p className="text-[11px] text-amber-500/80">
                  {stats.totalSegments} segments • {stats.totalTags} tags
                </p>
              </div>
            </div>
          )}
          {stats.activeClients > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                  {stats.activeClients} client(s) actif(s)
                </p>
                <p className="text-[11px] text-emerald-500/80">Ont commandé dans les 30 jours</p>
              </div>
            </div>
          )}
          {stats.newClients30d > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10">
              <Star className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">
                  +{stats.newClients30d} nouveau(x) (30j)
                </p>
                <p className="text-[11px] text-blue-500/80">{stats.clientsToday} aujourd'hui</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Filtres */}
      <Card padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <LiveBadge tone="success" label="Temps réel" value={`${total} client(s)`} />
          <p className="text-xs text-gray-400 hidden sm:block">
            Chaque commande met à jour l'activité du client instantanément
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client par nom, email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              options={[
                { value: '', label: 'Tous les tags' },
                ...(tags?.map((t: any) => ({
                  value: t.id,
                  label: `${t.name} (${t._count?.clients ?? 0})`,
                })) || []),
              ]}
              className="min-w-[150px]"
            />
            <Select
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
              options={[
                { value: '', label: 'Tous les segments' },
                ...(segments?.map((s: any) => ({
                  value: s.id,
                  label: `${s.name} (${s._count?.clients ?? 0})`,
                })) || []),
              ]}
              className="min-w-[150px]"
            />
            <Select
              value={savings}
              onChange={(e) =>
                setSavings(e.target.value as '' | 'active' | 'ready' | 'completed' | 'none')
              }
              options={[
                { value: '', label: 'Toute épargne' },
                { value: 'active', label: '💚 En épargne' },
                { value: 'ready', label: '✅ Prêts à convertir' },
                { value: 'completed', label: '🎉 A acheté via épargne' },
                { value: 'none', label: '— Sans épargne' },
              ]}
              className="min-w-[170px]"
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'spent', label: 'Plus dépensé' },
                { value: 'orders', label: 'Plus de commandes' },
                { value: 'recent', label: 'Plus récents' },
              ]}
              className="min-w-[140px]"
            />
          </div>
        </div>
      </Card>

      {/* Table dense */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader variant="spinner" size="lg" />
        </div>
      ) : clients.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Aucun client"
            description="Les clients apparaîtront ici après leurs premières commandes. Ajoutez des tags et segments depuis la fiche client."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Tags</th>
                  <th className="p-4 font-medium">Épargne</th>
                  <th className="p-4 font-medium">Dernière commande</th>
                  <th className="p-4 font-medium text-right">Commandes</th>
                  <th className="p-4 font-medium text-right">Total dépensé</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client: any) => (
                  <tr
                    key={client.id}
                    onClick={() => setSelectedId(client.id)}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {clientInitials(client)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                            {client.firstName} {client.lastName}
                            {isTopClient(client) && (
                              <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            )}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {client.email || client.phone || 'Pas de contact'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {client.tags?.length > 0 ? (
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {client.tags.slice(0, 2).map((t: any) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                              style={{ backgroundColor: t.color + '20', color: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                          {client.tags.length > 2 && (
                            <span className="text-[10px] text-gray-400 self-center">
                              +{client.tags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {client.savings?.hasLayaway ? (
                        <div className="flex flex-col items-start gap-1">
                          {client.savings.active + client.savings.ready > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              <PiggyBank className="h-3 w-3" />
                              {client.savings.active + client.savings.ready} plan(s) ·{' '}
                              {Number(client.savings.totalSaved || 0).toLocaleString('fr-FR')} F
                            </span>
                          )}
                          {client.savings.completed > 0 &&
                            client.savings.active + client.savings.ready === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 whitespace-nowrap">
                                🎉 Acheté via épargne
                              </span>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(client.lastOrderAt, { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {client.totalOrders || 0}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {Number(client.totalSpent || 0).toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="xs" onClick={() => setSelectedId(client.id)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                        Fiche
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Drawer 360° client */}
      <Drawer
        isOpen={!!selectedClient}
        onClose={() => setSelectedId(null)}
        icon={<Users className="h-5 w-5" />}
        title={selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Client'}
        subtitle={selectedClient?.email}
        footer={
          selectedClient ? (
            <div className="flex gap-2">
              <Link href={`/dashboard/clients/${selectedClient.clientId}`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  <ExternalLink className="h-4 w-4" />
                  Profil complet
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="flex-1">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedClient && (
          <div className="space-y-5">
            {/* En-tête */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                {clientInitials(selectedClient)}
              </div>
              <div>
                {isTopClient(selectedClient) && <LiveBadge tone="warning" label="Top client" />}
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  Client depuis {formatDate(selectedClient.createdAt)}
                </p>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="grid grid-cols-2 gap-3">
              <InfoStat icon={Phone} label="Téléphone" value={selectedClient.phone || '—'} />
              <InfoStat icon={MapPin} label="Ville" value={selectedClient.city || '—'} />
            </div>

            {/* Tags */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Tags</span>
                <button
                  onClick={() => setShowNewTag(!showNewTag)}
                  className="inline-flex items-center gap-1 text-brand text-[11px] font-medium hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Nouveau
                </button>
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedClient.tags?.length > 0 ? (
                  selectedClient.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: t.color + '20', color: t.color }}
                    >
                      {t.name}
                      <button
                        onClick={() => handleRemoveTag(selectedClient.clientId, t.id)}
                        className="hover:opacity-70"
                        title="Retirer le tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">Aucun tag</p>
                )}
              </div>
              {showNewTag ? (
                <div className="flex gap-2 items-center p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Nouveau tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1.5 text-xs focus:outline-none dark:text-gray-100"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  />
                  <input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <button
                    onClick={handleCreateTag}
                    className="px-2.5 py-1 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <Select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignTag(selectedClient.clientId, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  value=""
                  options={[
                    { value: '', label: '+ Ajouter un tag' },
                    ...(tags
                      ?.filter((t: any) => !selectedClient.tags?.some((ct: any) => ct.id === t.id))
                      .map((t: any) => ({ value: t.id, label: t.name })) || []),
                  ]}
                />
              )}
            </div>

            {/* Segments */}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Segments
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedClient.segments?.length > 0 ? (
                  selectedClient.segments.map((s: any) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: s.color + '20', color: s.color }}
                    >
                      {s.name}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-400">Aucun segment</p>
                )}
              </div>
            </div>

            {/* Épargne Achat */}
            {selectedClient.savings?.hasLayaway && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10 p-4 space-y-2">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <PiggyBank className="h-3.5 w-3.5" />
                  Épargne Achat
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedClient.savings.active + selectedClient.savings.ready}
                    </p>
                    <p className="text-[10px] text-emerald-600/70">En cours</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                      {selectedClient.savings.completed}
                    </p>
                    <p className="text-[10px] text-violet-600/70">Terminés</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {Number(selectedClient.savings.totalSaved || 0).toLocaleString('fr-FR')} F
                    </p>
                    <p className="text-[10px] text-gray-500">Séquestrés</p>
                  </div>
                </div>
              </div>
            )}

            {/* Satisfaction client */}
            {selectedClient.satisfaction?.count > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10 p-4 space-y-2">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" />
                  Satisfaction
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedClient.satisfaction.average ?? '—'}
                    <span className="text-sm text-gray-400 font-medium">/5</span>
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= Math.round(selectedClient.satisfaction.average || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-amber-600/80">
                    {selectedClient.satisfaction.count} réponse(s)
                  </span>
                </div>
              </div>
            )}

            {/* Statistiques */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total commandes</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedClient.totalOrders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total dépensé</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {Number(selectedClient.totalSpent || 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Dernière commande</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(selectedClient.lastOrderAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
