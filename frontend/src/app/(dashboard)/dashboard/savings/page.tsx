'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Plus,
  Users,
  PiggyBank,
  TrendingUp,
  RefreshCw,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Edit,
  Ban,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/services/apiClient';

interface SavingsGroup {
  id: string;
  name: string;
  description?: string;
  type: string;
  currency: string;
  contributionAmount: number;
  frequency: string;
  status: string;
  createdAt: string;
  _count: { members: number; cycles: number };
}

interface Stats {
  totalGroups: number;
  totalMembers: number;
  totalSaved: number;
  totalLoaned: number;
  activeCycles: number;
  pendingEscrows: number;
  activeLoans: number;
  participationRate: number;
  avgReliability: number;
  healthScore: number;
}

export default function SavingsPage() {
  const [groups, setGroups] = useState<SavingsGroup[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    groupId: string;
    groupName: string;
  }>({ open: false, groupId: '', groupName: '' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [groupsRes, statsRes] = await Promise.all([
        apiClient.getSavingsGroups(),
        apiClient.getSavingsStats(),
      ]);
      setGroups(groupsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async () => {
    try {
      await apiClient.deleteSavingsGroup(deleteModal.groupId);
      setDeleteModal({ open: false, groupId: '', groupName: '' });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (filterStatus !== 'all' && g.status !== filterStatus) return false;
    if (searchTerm && !g.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      ROTATING: 'Tontine rotative',
      FIXED_CONTRIBUTION: 'Cotisation fixe',
      FREE: 'Libre',
      INVESTMENT: 'Investissement',
    };
    return map[type] || type;
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const healthColor = (score: number) =>
    score >= 70 ? 'text-green-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-500" />
            Tontine & Épargne Collective
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos groupes d&apos;épargne avec des transactions sécurisées via escrow
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <Link
            href="/dashboard/savings/new"
            className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouveau groupe
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
            <button onClick={fetchData} className="text-sm underline ml-auto">
              Réessayer
            </button>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="elevated" className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                {stats.totalGroups}
              </p>
              <p className="text-sm text-gray-500">Groupes actifs · {stats.totalMembers} membres</p>
            </Card>
            <Card variant="elevated" className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                {stats.totalSaved.toLocaleString()} FCFA
              </p>
              <p className="text-sm text-gray-500">
                Épargne totale · {stats.activeCycles} cycles actifs
              </p>
            </Card>
            <Card variant="elevated" className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                {stats.totalLoaned.toLocaleString()} FCFA
              </p>
              <p className="text-sm text-gray-500">Prêts en cours · {stats.activeLoans} actifs</p>
            </Card>
            <Card variant="elevated" className="p-5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                {stats.pendingEscrows}
              </p>
              <p className="text-sm text-gray-500">
                Escrows actifs · Santé:{' '}
                <span className={`font-semibold ${healthColor(stats.healthScore)}`}>
                  {stats.healthScore}%
                </span>
              </p>
            </Card>
          </div>

          {/* Health & Reliability Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className={`w-5 h-5 ${healthColor(stats.healthScore)}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.healthScore}%
                </p>
                <p className="text-xs text-gray-500">Score de santé global</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.participationRate}%
                </p>
                <p className="text-xs text-gray-500">Taux de participation</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.avgReliability}/100
                </p>
                <p className="text-xs text-gray-500">Fiabilité moyenne des membres</p>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Security Banner */}
      <Card className="p-4 bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/10 dark:to-blue-900/10 border-brand-200 dark:border-brand-800">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Transactions sécurisées
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Chaque cycle de cotisation est protégé par un escrow AfriBiz. Les fonds sont bloqués
              jusqu&apos;à la validation complète du cycle, avec un délai de rétractation de 24 à
              48h selon votre niveau de vérification. La double validation est requise pour les
              montants élevés.
            </p>
          </div>
        </div>
      </Card>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un groupe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterStatus === s ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {s === 'all'
                ? 'Tous'
                : s === 'ACTIVE'
                  ? 'Actifs'
                  : s === 'COMPLETED'
                    ? 'Terminés'
                    : 'Annulés'}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filteredGroups.length} groupe(s)</span>
      </div>

      {/* Groups List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="text-center py-12">
          <Wallet className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {searchTerm ? 'Aucun groupe trouvé' : 'Créez votre premier groupe'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            Lancez une tontine rotative, un groupe d&apos;épargne à cotisation fixe ou libre. Toutes
            les transactions sont sécurisées par escrow.
          </p>
          <Link
            href="/dashboard/savings/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Créer un groupe
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <Link key={group.id} href={`/dashboard/savings/${group.id}`} className="block">
              <Card hoverable className="p-4 sm:p-5 flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-brand-600 transition-colors">
                        {group.name}
                      </h3>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusColor(group.status)}`}
                      >
                        {group.status === 'ACTIVE'
                          ? 'Actif'
                          : group.status === 'COMPLETED'
                            ? 'Terminé'
                            : 'Annulé'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{typeLabel(group.type)}</span>
                      <span>·</span>
                      <span>{group._count.members} membres</span>
                      <span>·</span>
                      <span>{group._count.cycles} cycles</span>
                      {group.contributionAmount > 0 && (
                        <>
                          <span>·</span>
                          <span>
                            {group.contributionAmount.toLocaleString()} {group.currency}/
                            {group.frequency === 'weekly' ? 'sem' : 'mois'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, groupId: '', groupName: '' })}
        title="Supprimer le groupe"
        description={`Êtes-vous sûr de vouloir supprimer « ${deleteModal.groupName} » ? Cette action est irréversible si aucun fonds n'est séquestré.`}
        size="sm"
      >
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteModal({ open: false, groupId: '', groupName: '' })}
            className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </Modal>
    </div>
  );
}
