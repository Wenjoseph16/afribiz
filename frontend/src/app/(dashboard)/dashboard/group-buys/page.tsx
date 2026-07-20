'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { apiClient } from '@/services/apiClient';

export default function GroupBuysPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showParticipants, setShowParticipants] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newGb, setNewGb] = useState({
    title: '',
    description: '',
    targetPrice: '0',
    minParticipants: '5',
    maxParticipants: '50',
    discountPercent: '10',
    endAt: '',
    whatsappGroup: '',
  });
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    phone: '',
    quantity: '1',
    amount: '0',
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
        ...newGb,
        targetPrice: Number(newGb.targetPrice),
        minParticipants: Number(newGb.minParticipants),
        maxParticipants: Number(newGb.maxParticipants),
        discountPercent: Number(newGb.discountPercent),
      });
      setShowNew(false);
      setNewGb({
        title: '',
        description: '',
        targetPrice: '0',
        minParticipants: '5',
        maxParticipants: '50',
        discountPercent: '10',
        endAt: '',
        whatsappGroup: '',
      });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

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
        ...newParticipant,
        quantity: Number(newParticipant.quantity),
        amount: Number(newParticipant.amount),
      });
      setNewParticipant({ name: '', phone: '', quantity: '1', amount: '0' });
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
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
  const activeCount = groups.filter(
    (g: any) => g.status === 'ACTIVE' || (!g.status && new Date(g.endAt) > new Date())
  ).length;
  const avgDiscount =
    groups.length > 0
      ? Math.round(
          groups.reduce((s: number, g: any) => s + (g.discountPercent || 0), 0) / groups.length
        )
      : 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Achat Groupé</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organisez des achats groupés avec vos clients
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nouvel achat groupé
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={loadData} className="ml-auto underline">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Achats groupés',
            value: String(groups.length),
            icon: ShoppingCart,
            color: 'text-blue-500',
          },
          {
            label: 'Participants',
            value: String(totalParticipants),
            icon: Users,
            color: 'text-green-500',
          },
          {
            label: 'Réduction moy.',
            value: `${avgDiscount}%`,
            icon: Percent,
            color: 'text-purple-500',
          },
          { label: 'Actifs', value: String(activeCount), icon: Clock, color: 'text-amber-500' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon className={`w-8 h-8 ${s.color}`} />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g: any) => {
          const progress =
            g.minParticipants > 0
              ? Math.min(100, Math.round(((g._count?.participants || 0) / g.minParticipants) * 100))
              : 0;
          const isActive = g.status === 'ACTIVE' || (!g.status && new Date(g.endAt) > new Date());
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{g.title}</h3>
                  {g.description && <p className="text-xs text-gray-500 mt-1">{g.description}</p>}
                </div>
                <Badge variant={isActive ? 'success' : 'default'}>
                  {isActive ? 'Actif' : 'Terminé'}
                </Badge>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    Participants: {g._count?.participants || 0}/{g.minParticipants}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-brand-500' : 'bg-amber-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-gray-400 text-xs">Objectif</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {Number(g.targetPrice).toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-gray-400 text-xs">Remise</p>
                  <p className="font-semibold text-green-600">{g.discountPercent}%</p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-gray-400 text-xs">Max</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {g.maxParticipants || '∞'}
                  </p>
                </div>
              </div>

              {g.endAt && (
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" /> Clôture: {new Date(g.endAt).toLocaleDateString()}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {isActive && (
                  <button
                    onClick={() => {
                      setShowParticipants(g);
                      setNewParticipant({ name: '', phone: '', quantity: '1', amount: '0' });
                    }}
                    className="flex-1 py-1.5 text-sm bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
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
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
        {groups.length === 0 && (
          <Card className="p-8 text-center col-span-full">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Aucun achat groupé
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Lancez votre premier achat groupé pour mobiliser votre communauté.
            </p>
          </Card>
        )}
      </div>

      {/* Modal: Nouvel achat groupé */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nouvel achat groupé">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre
            </label>
            <input
              value={newGb.title}
              onChange={(e) => setNewGb({ ...newGb, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              placeholder="Achat groupé de riz"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix cible (FCFA)
              </label>
              <input
                value={newGb.targetPrice}
                onChange={(e) => setNewGb({ ...newGb, targetPrice: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remise (%)
              </label>
              <input
                value={newGb.discountPercent}
                onChange={(e) => setNewGb({ ...newGb, discountPercent: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
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
          <button
            onClick={handleCreate}
            disabled={!newGb.title || !newGb.targetPrice}
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Créer
          </button>
        </div>
      </Modal>

      {/* Modal: Ajouter participant */}
      <Modal
        open={!!showParticipants}
        onClose={() => setShowParticipants(null)}
        title={`Participants - ${showParticipants?.title || ''}`}
      >
        <div className="space-y-4">
          {showParticipants?.participants?.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {showParticipants.participants.map((p: any) => (
                <div
                  key={p.id}
                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                  <span className="text-gray-500">
                    {p.quantity}x · {Number(p.amount).toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Ajouter un participant
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
                  onChange={(e) =>
                    setNewParticipant({ ...newParticipant, quantity: e.target.value })
                  }
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Montant</label>
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
              className="w-full mt-3 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              Ajouter
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
