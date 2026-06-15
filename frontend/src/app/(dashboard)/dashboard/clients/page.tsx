'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users, Search, Star, ThumbsUp, Filter,
  ChevronRight, Phone, MapPin, Calendar,
  ShoppingBag, Award, TrendingUp, Sparkles, DollarSign,
  Tag, Layers, Plus, X, MoreHorizontal, ExternalLink, MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
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
  useCrmDeleteTag,
  useCrmAssignTag,
  useCrmRemoveTag,
} from '@/features/crm/hooks';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [sortBy, setSortBy] = useState('spent');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');

  const { data: stats, isLoading: statsLoading } = useCrmDashboardStats();
  const { data: clientsData, isLoading, error, refetch } = useCrmClients({
    search: search || undefined,
    tagId: selectedTagId || undefined,
    segmentId: selectedSegmentId || undefined,
    sortBy: sortBy === 'spent' ? 'totalSpent' : sortBy === 'orders' ? 'totalOrders' : 'lastOrderAt',
    sortOrder: 'desc',
    limit: 50,
  });
  const { data: tags } = useCrmTags();
  const { data: segments } = useCrmSegments();
  const createTag = useCrmCreateTag();
  const deleteTag = useCrmDeleteTag();
  const assignTag = useCrmAssignTag();
  const removeTag = useCrmRemoveTag();

  const clients = clientsData?.clients || [];
  const total = clientsData?.total || 0;

  const statCards = [
    { icon: <Users className="h-5 w-5" />, iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600', label: 'Total clients', value: stats?.totalClients ?? 0 },
    { icon: <Star className="h-5 w-5" />, iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600', label: 'Nouveaux (30j)', value: stats?.newClients30d ?? 0 },
    { icon: <ShoppingBag className="h-5 w-5" />, iconBg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600', label: 'Actifs (30j)', value: stats?.activeClients ?? 0 },
    { icon: <ThumbsUp className="h-5 w-5" />, iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600', label: 'Rétention', value: `${stats?.retentionRate ?? 0}%` },
  ];

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
    setNewTagName('');
    setShowNewTag(false);
  };

  const handleAssignTag = async (clientId: string, tagId: string) => {
    await assignTag.mutateAsync({ clientId, tagId });
  };

  const handleRemoveTag = async (clientId: string, tagId: string) => {
    await removeTag.mutateAsync({ clientId, tagId });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="CRM — Clients"
        description="Gérez votre relation client, segmentation et suivi d'activité"
        gradient
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/clients/segments">
              <Button variant="outline" size="sm">
                <Layers className="h-4 w-4" />
                Segments
              </Button>
            </Link>
            <Link href="/dashboard/clients/segments">
              <Button size="sm">
                <Tag className="h-4 w-4" />
                Gérer les tags
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Suggestions */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.activeClients > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                <Award className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.activeClients} clients actifs</p>
                <p className="text-xs text-gray-500 mt-0.5">Ont commandé dans les 30 derniers jours</p>
              </div>
            </div>
          )}
          {stats.newClients30d > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10 border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">+{stats.newClients30d} nouveaux (30j)</p>
                <p className="text-xs text-gray-500 mt-0.5">{stats.clientsToday} aujourd'hui</p>
              </div>
            </div>
          )}
          {stats.topClients && stats.topClients.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10 border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.topClients.length} top clients</p>
                <p className="text-xs text-gray-500 mt-0.5">{stats.totalSegments} segments • {stats.totalTags} tags</p>
              </div>
            </div>
          )}
          {stats.clientsWithDebt > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10 border border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                <DollarSign className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stats.clientsWithDebt} clients à risque</p>
                <p className="text-xs text-gray-500 mt-0.5">Impayés ou en retard</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client par nom, email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Tous les tags</option>
              {tags?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t._count.clients})</option>
              ))}
            </select>
            <select
              value={selectedSegmentId}
              onChange={(e) => setSelectedSegmentId(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Tous les segments</option>
              {segments?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name} ({s._count.clients})</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="spent">Plus dépensé</option>
              <option value="orders">Plus de commandes</option>
              <option value="recent">Plus récents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Loader variant="spinner" size="lg" />
          ) : clients.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Aucun client"
              description="Les clients apparaîtront ici après leurs premières commandes. Ajoutez des tags et segments depuis le panneau de détail."
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-2">{total} client{total > 1 ? 's' : ''}</p>
              {clients.map((client: any) => (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl transition-all border cursor-pointer',
                    selectedClient?.id === client.id
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700'
                      : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {`${client.firstName?.charAt(0) || ''}${client.lastName?.charAt(0) || ''}`.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {client.firstName} {client.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {client.email || client.phone || 'Pas de contact'}
                    </p>
                    {client.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {client.tags.slice(0, 3).map((t: any) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ backgroundColor: t.color + '20', color: t.color }}
                          >
                            {t.name}
                          </span>
                        ))}
                        {client.tags.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{client.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {Number(client.totalSpent || 0).toLocaleString()} FCFA
                    </p>
                    <p className="text-[11px] text-gray-400">{client.totalOrders || 0} commandes</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-1">
          {selectedClient ? (
            <div className="space-y-4 sticky top-24">
              <Card>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                    {`${selectedClient.firstName?.charAt(0) || ''}${selectedClient.lastName?.charAt(0) || ''}`.toUpperCase() || '?'}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                </div>
                <div className="space-y-2">
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-3.5 w-3.5" /> {selectedClient.phone}
                    </div>
                  )}
                  {selectedClient.city && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5" /> {selectedClient.city}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3.5 w-3.5" /> Client depuis {new Date(selectedClient.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </Card>

              {/* Tags */}
              <Card title="Tags">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedClient.tags?.length > 0 ? selectedClient.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: t.color + '20', color: t.color }}
                    >
                      {t.name}
                      <button
                        onClick={() => handleRemoveTag(selectedClient.clientId, t.id)}
                        className="hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )) : (
                    <p className="text-xs text-gray-400">Aucun tag</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignTag(selectedClient.clientId, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    value=""
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="">+ Ajouter un tag</option>
                    {tags?.filter((t: any) => !selectedClient.tags?.some((ct: any) => ct.id === t.id)).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewTag(!showNewTag)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {showNewTag && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Nouveau tag..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs focus:outline-none"
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
                      className="px-2 py-1 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand/90"
                    >
                      OK
                    </button>
                  </div>
                )}
              </Card>

              {/* Segments */}
              <Card title="Segments">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedClient.segments?.length > 0 ? selectedClient.segments.map((s: any) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: s.color + '20', color: s.color }}
                    >
                      {s.name}
                    </span>
                  )) : (
                    <p className="text-xs text-gray-400">Aucun segment</p>
                  )}
                </div>
              </Card>

              {/* Stats */}
              <Card title="Statistiques">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total commandes</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedClient.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total dépensé</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{Number(selectedClient.totalSpent || 0).toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Dernière commande</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {selectedClient.lastOrderAt ? new Date(selectedClient.lastOrderAt).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/dashboard/clients/${selectedClient.clientId}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                      Profil complet
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              </Card>

              {/* Top client badge */}
              {stats?.topClients?.some((tc: any) => tc.clientId === selectedClient.clientId) && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/30">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Top client</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                Sélectionnez un client pour voir ses détails
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
