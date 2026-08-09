'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Users,
  Percent,
  Clock,
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Zap,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';

const STATUS_META: Record<string, { label: string; tone: 'success' | 'warning' | 'default' | 'danger' | 'info' }> = {
  ACTIVE: { label: 'En cours', tone: 'success' },
  REACHED: { label: 'Seuil atteint 🎉', tone: 'warning' },
  COMPLETED: { label: 'Terminé', tone: 'default' },
  CANCELLED: { label: 'Annulé', tone: 'danger' },
  DRAFT: { label: 'Brouillon', tone: 'info' },
};

function fmt(n?: number): string {
  if (n === undefined || n === null) return '—';
  return Number(n).toLocaleString('fr-FR');
}

export default function GroupBuysPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showParticipants, setShowParticipants] = useState<any>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedMsg, setConfirmedMsg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newGb, setNewGb] = useState({
    title: '',
    description: '',
    productId: '',
    price: '',
    groupPrice: '',
    minParticipants: '5',
    maxParticipants: '',
    endAt: '',
    whatsappGroup: '',
  });
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    phone: '',
    quantity: '1',
    amount: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.getGroupBuys().catch(() => ({ data: { data: [] } }));
      setGroups(res.data?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    try {
      await apiClient.createGroupBuy({
        title: newGb.title,
        description: newGb.description || undefined,
        productId: newGb.productId || undefined,
        price: Number(newGb.price),
        groupPrice: Number(newGb.groupPrice),
        minParticipants: Number(newGb.minParticipants),
        maxParticipants: newGb.maxParticipants ? Number(newGb.maxParticipants) : undefined,
        endAt: newGb.endAt || undefined,
        whatsappGroup: newGb.whatsappGroup || undefined,
      });
      setShowNew(false);
      setNewGb({
        title: '',
        description: '',
        productId: '',
        price: '',
        groupPrice: '',
        minParticipants: '5',
        maxParticipants: '',
        endAt: '',
        whatsappGroup: '',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = (id: string) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.deleteGroupBuy(deleteTarget);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
    setDeleteTarget(null);
  };

  const handleAddParticipant = async () => {
    if (!showParticipants || !newParticipant.name) return;
    try {
      await apiClient.addGroupBuyParticipant({
        groupBuyId: showParticipants.id,
        name: newParticipant.name,
        phone: newParticipant.phone || undefined,
        quantity: Number(newParticipant.quantity) || 1,
        amount: Number(newParticipant.amount) || 0,
      });
      setNewParticipant({ name: '', phone: '', quantity: '1', amount: '' });
      setShowParticipants(await reloadDetail(showParticipants.id));
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const reloadDetail = async (id: string) => {
    try {
      const res = await apiClient.getGroupBuy(id);
      return res.data?.data;
    } catch {
      return null;
    }
  };

  const handleConfirmParticipant = async (participantId: string) => {
    setConfirmingId(participantId);
    setConfirmedMsg('');
    try {
      const res = await apiClient.confirmGroupBuyParticipant(participantId);
      const msg = res.data?.data?.message || 'Commande créée !';
      setConfirmedMsg(msg);
      setShowParticipants(await reloadDetail(showParticipants.id));
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );

  const totalParticipants = groups.reduce(
    (sum: number, g: any) => sum + (g._count?.participants || 0),
    0
  );
  const activeCount = groups.filter((g: any) => ['ACTIVE', 'REACHED'].includes(g.status)).length;
  const reachedCount = groups.filter((g: any) => g.status === 'REACHED').length;
  const totalSavings = groups.reduce((s: number, g: any) => s + Number(g.savings || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Achat Groupé"
        description="Fédérez vos clients : le prix baisse quand le groupe grandit — chaque participant valide ensuite sa commande"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Marketing', href: '/dashboard/marketing' },
          { label: 'Achat Groupé' },
        ]}
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nouvel achat groupé
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<ShoppingCart className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          label="Achats groupés"
          value={groups.length}
        />
        <StatsCard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="Participants"
          value={totalParticipants}
        />
        <StatsCard
          icon={<PartyPopper className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          label="Seuil atteint"
          value={reachedCount}
        />
        <StatsCard
          icon={<Percent className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="Économies possibles"
          value={`${fmt(totalSavings)} F`}
        />
      </div>

      {confirmedMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-900/10 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{confirmedMsg}</p>
          <Link href="/dashboard/orders" className="ml-auto inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
            Voir les commandes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Liste */}
      {groups.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="Aucun achat groupé"
            description="Lancez votre premier achat groupé : vos clients se regroupent, le prix groupe se débloque au seuil, et chaque participant valide sa commande."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g: any) => {
            const progress =
              g.minParticipants > 0
                ? Math.min(100, Math.round((g.currentCount || g._count?.participants || 0) / g.minParticipants) * 100)
                : 0;
            const meta = STATUS_META[g.status] || { label: g.status, tone: 'default' as const };
            const isReached = g.status === 'REACHED';
            const pendingCount = g.participants?.filter((p: any) => p.status === 'PENDING').length || 0;
            return (
              <Card key={g.id} className="p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{g.title}</h3>
                      {isReached && <Zap className="h-4 w-4 text-amber-500 shrink-0" />}
                    </div>
                    {g.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{g.description}</p>
                    )}
                  </div>
                  <Badge variant={meta.tone}>{meta.label}</Badge>
                </div>

                {/* Progression vers le seuil */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {g.currentCount || g._count?.participants || 0}/{g.minParticipants} participants
                    </span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isReached
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                          : progress >= 50
                            ? 'bg-brand-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(4, progress)}%` }}
                    />
                  </div>
                  {isReached && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1.5 inline-flex items-center gap-1">
                      <PartyPopper className="h-3 w-3" /> Prix groupe débloqué — les participants connectés peuvent valider leur commande
                    </p>
                  )}
                </div>

                {/* Prix */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Prix normal</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 line-through decoration-gray-300">
                      {fmt(g.price)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-[10px] text-emerald-500 uppercase tracking-wider">Prix groupe</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(g.groupPrice)}</p>
                  </div>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-[10px] text-purple-500 uppercase tracking-wider">Économie</p>
                    <p className="font-bold text-purple-600 dark:text-purple-400">
                      {g.discountPercent ? `${g.discountPercent}%` : `${fmt(g.savings)} F`}
                    </p>
                  </div>
                </div>

                {pendingCount > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40">
                    <span className="text-xs text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {pendingCount} commande(s) en attente de validation
                    </span>
                    <button
                      onClick={() => setShowParticipants(g)}
                      className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      Valider <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {g.endAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" /> Clôture : {new Date(g.endAt).toLocaleDateString('fr-FR')}
                  </div>
                )}

                <div className="mt-auto flex gap-2">
                  {['ACTIVE', 'REACHED'].includes(g.status) && (
                    <button
                      onClick={() => {
                        setShowParticipants(g);
                        setNewParticipant({ name: '', phone: '', quantity: '1', amount: '' });
                      }}
                      className="flex-1 py-1.5 text-sm bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 inline mr-1" /> + Participant
                    </button>
                  )}
                  <Link
                    href={`/dashboard/group-buys/${g.id}`}
                    className="flex-1 py-1.5 text-center text-sm bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 inline mr-1" /> Détails
                  </Link>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="py-1.5 px-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Nouvel achat groupé */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvel achat groupé">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
            <input
              value={newGb.title}
              onChange={(e) => setNewGb({ ...newGb, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Ex. Smartphone TechX Pro — prix groupe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newGb.description}
              onChange={(e) => setNewGb({ ...newGb, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Ce qui motive le regroupement…"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix normal (FCFA)
              </label>
              <input
                value={newGb.price}
                onChange={(e) => setNewGb({ ...newGb, price: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="150000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix groupe (FCFA)
              </label>
              <input
                value={newGb.groupPrice}
                onChange={(e) => setNewGb({ ...newGb, groupPrice: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="135000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min participants
              </label>
              <input
                value={newGb.minParticipants}
                onChange={(e) => setNewGb({ ...newGb, minParticipants: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max participants
              </label>
              <input
                value={newGb.maxParticipants}
                onChange={(e) => setNewGb({ ...newGb, maxParticipants: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de clôture
              </label>
              <input
                value={newGb.endAt}
                onChange={(e) => setNewGb({ ...newGb, endAt: e.target.value })}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lien groupe WhatsApp (optionnel)
              </label>
              <input
                value={newGb.whatsappGroup}
                onChange={(e) => setNewGb({ ...newGb, whatsappGroup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="https://chat.whatsapp.com/…"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newGb.title || !newGb.price || !newGb.groupPrice}
            className="w-full py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Créer l'achat groupé
          </button>
        </div>
      </Modal>

      {/* Modal: Participants + conversion en commande */}
      <Modal
        open={!!showParticipants}
        onClose={() => {
          setShowParticipants(null);
          setConfirmedMsg('');
        }}
        title={`Participants — ${showParticipants?.title || ''}`}
        description={
          showParticipants?.status === 'REACHED'
            ? 'Seuil atteint : chaque participant connecté peut valider sa commande au prix groupe'
            : `Seuil : ${showParticipants?.currentCount || 0}/${showParticipants?.minParticipants || 0} participants`
        }
      >
        <div className="space-y-4">
          <LiveBadge
            tone={showParticipants?.status === 'REACHED' ? 'warning' : 'brand'}
            label={STATUS_META[showParticipants?.status]?.label || '—'}
            value={`${showParticipants?.currentCount || 0}/${showParticipants?.minParticipants || 0}`}
          />
          {showParticipants?.participants?.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {showParticipants.participants.map((p: any) => (
                <div
                  key={p.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.quantity}x · {fmt(p.amount)} FCFA
                      {p.userId ? ' · connecté' : ' · invité'}
                    </p>
                  </div>
                  {p.status === 'PENDING' && p.userId ? (
                    <button
                      onClick={() => handleConfirmParticipant(p.id)}
                      disabled={confirmingId === p.id}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {confirmingId === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Créer la commande
                    </button>
                  ) : p.status === 'PAID' ? (
                    <Badge variant="success">Commande créée</Badge>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">Invité — non confirmable</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 inline-flex items-center gap-1.5">
              <Target className="w-4 h-4 text-brand-500" /> Ajouter un participant
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                <input
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                <input
                  value={newParticipant.phone}
                  onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Quantité</label>
                <input
                  value={newParticipant.quantity}
                  onChange={(e) => setNewParticipant({ ...newParticipant, quantity: e.target.value })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Montant (FCFA)</label>
                <input
                  value={newParticipant.amount}
                  onChange={(e) => setNewParticipant({ ...newParticipant, amount: e.target.value })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleAddParticipant}
              disabled={!newParticipant.name}
              className="w-full mt-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors text-sm font-medium inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Supprimer cet achat groupé ?"
        description="Cette action est irréversible. L'achat groupé sera définitivement supprimé."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  );
}
