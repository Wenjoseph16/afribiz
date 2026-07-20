'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Users,
  Percent,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Plus,
  Clock,
  Target,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { apiClient } from '@/services/apiClient';

export default function GroupBuyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [removeParticipantTarget, setRemoveParticipantTarget] = useState<string | null>(null);
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
      const res = await apiClient.getGroupBuy(params.id as string);
      setGroup(res.data?.data);
    } catch (e: any) {
      setError(e?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await apiClient.deleteGroupBuy(params.id as string);
      router.push('/dashboard/group-buys');
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleAddParticipant = async () => {
    if (!newParticipant.name) return;
    try {
      await apiClient.addGroupBuyParticipant({
        groupBuyId: params.id as string,
        ...newParticipant,
        quantity: Number(newParticipant.quantity),
        amount: Number(newParticipant.amount),
      });
      setNewParticipant({ name: '', phone: '', quantity: '1', amount: '0' });
      setShowAddParticipant(false);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    setRemoveParticipantTarget(participantId);
  };

  const confirmRemoveParticipant = async () => {
    if (!removeParticipantTarget) return;
    try {
      await apiClient.removeGroupBuyParticipant(removeParticipantTarget);
      loadData();
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
    setRemoveParticipantTarget(null);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  if (!group) return null;

  const participantCount = group.participants?.length || 0;
  const progress =
    group.minParticipants > 0
      ? Math.min(100, Math.round((participantCount / group.minParticipants) * 100))
      : 0;
  const isActive =
    group.status === 'ACTIVE' ||
    (!group.status && group.endAt && new Date(group.endAt) > new Date());

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/dashboard/group-buys"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.title}</h1>
              <Badge variant={isActive ? 'success' : 'default'}>
                {isActive ? 'Actif' : 'Terminé'}
              </Badge>
            </div>
            {group.description && <p className="text-sm text-gray-500 mt-1">{group.description}</p>}
          </div>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              Participants: {participantCount}/{group.minParticipants}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-brand-500' : 'bg-amber-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Target className="w-5 h-5 mx-auto text-brand-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {Number(group.targetPrice).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Prix cible</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Percent className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {group.discountPercent}%
            </p>
            <p className="text-xs text-gray-500">Remise</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Users className="w-5 h-5 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {group.maxParticipants || '∞'}
            </p>
            <p className="text-xs text-gray-500">Max</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
            <Users className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{participantCount}</p>
            <p className="text-xs text-gray-500">Participants</p>
          </div>
        </div>

        {group.endAt && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" /> Clôture: {new Date(group.endAt).toLocaleDateString()}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Participants ({participantCount})
          </h3>
          {isActive && (
            <button
              onClick={() => setShowAddParticipant(true)}
              className="px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          )}
        </div>
        {group.participants?.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {group.participants.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                    {p.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    {p.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.quantity}x
                    </p>
                    <p className="text-xs text-gray-500">
                      {Number(p.amount).toLocaleString()} FCFA
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveParticipant(p.id)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">
            Aucun participant pour le moment.
          </div>
        )}
      </Card>

      <Modal
        open={showAddParticipant}
        onClose={() => setShowAddParticipant(false)}
        title="Ajouter un participant"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom
            </label>
            <input
              value={newParticipant.name}
              onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Téléphone
            </label>
            <input
              value={newParticipant.phone}
              onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantité
              </label>
              <input
                value={newParticipant.quantity}
                onChange={(e) => setNewParticipant({ ...newParticipant, quantity: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant
              </label>
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
            className="w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Ajouter
          </button>
        </div>
      </Modal>

      <ConfirmationModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Supprimer cet achat groupé ?"
        description="Cette action est irréversible. L'achat groupé sera définitivement supprimé."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
      <ConfirmationModal
        open={!!removeParticipantTarget}
        onClose={() => setRemoveParticipantTarget(null)}
        onConfirm={confirmRemoveParticipant}
        title="Retirer ce participant ?"
        description="Le participant sera retiré de cet achat groupé."
        confirmLabel="Retirer"
        cancelLabel="Annuler"
        variant="warning"
        icon={<AlertTriangle className="h-7 w-7" />}
      />
    </div>
  );
}
