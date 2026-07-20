'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Tag,
  Filter,
  ArrowUpDown,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
  Trash2,
  UserCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Select } from '@/components/ui/Select';
import {
  useCrmClients,
  useCrmDashboardStats,
  useCrmTags,
  useCrmSegments,
  useCrmCreateTag,
  useCrmDeleteTag,
  useCrmAddClientNote,
} from '@/features/crm/hooks';

// ─── Types ─────────────────────────────────────────────────
interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderAt?: string;
  createdAt?: string;
  tags?: { id: string; name: string; color?: string }[];
  segment?: { id: string; name: string; color?: string };
  isActive?: boolean;
}

// ─── Animation variants ────────────────────────────────────
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Stat card ─────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div
          className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

// ─── Tag badge ─────────────────────────────────────────────
function TagBadge({ name, color }: { name: string; color?: string }) {
  const bgColor = color ? `${color}20` : 'bg-brand/10';
  const textColor = color || 'text-brand';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium`}
      style={{ backgroundColor: color ? `${color}20` : undefined, color: color || undefined }}
    >
      <Tag className="h-3 w-3" />
      {name}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function CrmPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#059669');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [sortField, setSortField] = useState<'lastOrderAt' | 'totalSpent' | 'totalOrders'>(
    'lastOrderAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: stats, isLoading: statsLoading } = useCrmDashboardStats();
  const {
    data: clients,
    isLoading: clientsLoading,
    isError: clientsError,
  } = useCrmClients({
    search: searchQuery || undefined,
    tagId: selectedTag || undefined,
    sortBy: sortField,
    sortOrder,
  });
  const { data: tagsData } = useCrmTags();
  const { data: segmentsData } = useCrmSegments();
  const createTag = useCrmCreateTag();
  const deleteTag = useCrmDeleteTag();
  const addNote = useCrmAddClientNote();

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
    setNewTagName('');
    setShowAddTag(false);
  };

  const handleAddNote = async () => {
    if (!selectedClient || !noteContent.trim()) return;
    try {
      await addNote.mutateAsync({ clientId: selectedClient, content: noteContent.trim() });
      setNoteContent('');
    } catch {
      // L'erreur est gérée par React Query
    }
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <motion.div
        {...fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="h-7 w-7 text-brand" />
            CRM
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos clients, suivez leurs activités et fidélisez-les
          </p>
        </div>
      </motion.div>

      {/* ═══ STATS ═══ */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Users}
          label="Total clients"
          value={stats?.totalClients ?? (statsLoading ? '-' : '0')}
          sublabel="Inscrits"
          color="bg-emerald-500"
        />
        <StatCard
          icon={UserCheck}
          label="Clients actifs"
          value={stats?.activeClients ?? (statsLoading ? '-' : '0')}
          sublabel="Ce mois"
          color="bg-blue-500"
        />
        <StatCard
          icon={ShoppingBag}
          label="Achats"
          value={stats?.totalOrders ?? (statsLoading ? '-' : '0')}
          sublabel="Total"
          color="bg-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Nouveaux"
          value={stats?.newClientsThisMonth ?? (statsLoading ? '-' : '0')}
          sublabel="Ce mois"
          color="bg-amber-500"
        />
      </motion.div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Client list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/30 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedTag || ''}
                  onChange={(e) => setSelectedTag(e.target.value || null)}
                  options={[
                    { value: '', label: 'Tous les tags' },
                    ...(tagsData?.map((tag: any) => ({ value: tag.id, label: tag.name })) || []),
                  ]}
                  className="min-w-[160px]"
                />
                <button
                  onClick={() => toggleSort('lastOrderAt')}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortField === 'lastOrderAt'
                    ? 'Date'
                    : sortField === 'totalSpent'
                      ? 'Montant'
                      : 'Commandes'}
                </button>
              </div>
            </div>{' '}
            {/* Tags filter bar */}
            {tagsData && tagsData.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                {tagsData.map((tag: any) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedTag === tag.id
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Client list */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {clientsLoading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : clientsError ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-red-300 dark:text-red-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Erreur de chargement</p>
                <p className="text-sm text-gray-400 mt-1">
                  Impossible de charger la liste des clients. Veuillez réessayer.
                </p>
              </div>
            ) : !clients?.items || clients.items.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun client trouvé</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery
                    ? 'Essayez un autre terme de recherche.'
                    : 'Les clients apparaîtront ici après leurs premiers achats.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {(clients?.items ?? []).map((client: Client) => (
                  <div
                    key={client.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${
                      selectedClient === client.id ? 'bg-brand/5 dark:bg-brand-900/10' : ''
                    }`}
                    onClick={() => {
                      setSelectedClient(selectedClient === client.id ? null : client.id);
                      setNoteContent('');
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {client.firstName?.[0]}
                        {client.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {client.firstName} {client.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        {client.tags?.slice(0, 2).map((tag) => (
                          <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                        ))}
                        {(client.tags?.length ?? 0) > 2 && (
                          <span className="text-xs text-gray-400">+{client.tags!.length - 2}</span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {client.totalOrders || 0}
                        </p>
                        <p className="text-xs text-gray-400">Commandes</p>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selectedClient === client.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {[
                            {
                              label: 'Total dépensé',
                              value: client.totalSpent
                                ? `${(client.totalSpent / 1000).toFixed(0)}k FCFA`
                                : '0 FCFA',
                            },
                            {
                              label: 'Dernier achat',
                              value: client.lastOrderAt
                                ? new Date(client.lastOrderAt).toLocaleDateString('fr-FR')
                                : 'Jamais',
                            },
                            {
                              label: 'Inscrit le',
                              value: client.createdAt
                                ? new Date(client.createdAt).toLocaleDateString('fr-FR')
                                : '-',
                            },
                            { label: 'Statut', value: client.isActive ? 'Actif' : 'Inactif' },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3"
                            >
                              <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Tag className="h-3.5 w-3.5 text-gray-400" />
                          {client.tags?.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : undefined,
                                color: tag.color || undefined,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {(!client.tags || client.tags.length === 0) && (
                            <span className="text-xs text-gray-400">Aucun tag</span>
                          )}
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/messages?userId=${client.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand/5 text-brand rounded-lg text-xs font-medium hover:bg-brand/10 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Message
                          </Link>
                          <Link
                            href={`/dashboard/orders?clientId=${client.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Commandes
                          </Link>
                        </div>

                        {/* Add note */}
                        <div className="mt-4">
                          <textarea
                            placeholder="Ajouter une note..."
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
                          />
                          <button
                            onClick={handleAddNote}
                            disabled={!noteContent.trim() || addNote.isPending}
                            className="mt-2 px-4 py-1.5 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                          >
                            {addNote.isPending ? 'Ajout...' : 'Ajouter une note'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Tags & Segments */}
        <div className="space-y-4">
          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand" />
                Tags
              </h2>
              <button
                onClick={() => setShowAddTag(!showAddTag)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showAddTag && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Nom du tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                />
                <div className="flex items-center gap-2">
                  {['#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'].map(
                    (color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          newTagColor === color
                            ? 'border-gray-900 dark:border-white scale-110'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                  className="w-full px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {createTag.isPending ? 'Création...' : 'Créer le tag'}
                </button>
              </div>
            )}

            <div className="space-y-1">
              {!tagsData || tagsData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun tag. Créez-en un !</p>
              ) : (
                tagsData?.map((tag: any) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tag.color || '#059669' }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
                      <span className="text-xs text-gray-400">({tag._count?.clients || 0})</span>
                    </div>
                    <button
                      onClick={() => deleteTag.mutate(tag.id)}
                      className="p-1 rounded-lg text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Segments */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand" />
              Segments
            </h2>
            <div className="space-y-2">
              {!segmentsData || segmentsData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun segment</p>
              ) : (
                segmentsData?.map((segment: any) => (
                  <div
                    key={segment.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: segment.color || '#059669' }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {segment.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {segment._count?.clients || 0} clients
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-gradient-to-br from-brand to-brand-700 rounded-2xl p-5 text-white">
            <Sparkles className="h-5 w-5 text-emerald-200 mb-2" />
            <p className="text-sm font-semibold mb-1">Customer 360</p>
            <p className="text-xs text-emerald-100/80 mb-3">
              Consultez l&apos;historique complet de vos clients : achats, navigation, interactions.
            </p>
            <Link
              href="/dashboard/crm/360"
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              Voir le tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
