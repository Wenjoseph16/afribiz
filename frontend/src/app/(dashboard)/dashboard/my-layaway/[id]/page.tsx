'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PiggyBank,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader,
  MessageCircle,
  Share2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import { formatPrice } from '@/utils/helpers';
import { TransactionProgress } from '@/components/transactions';

const STATUS_CONFIG: Record<string, { label: string; color: string; banner: string; icon: any }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700',
    banner:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  ACTIVE: {
    label: 'En cours',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: PiggyBank,
  },
  COMPLETED: {
    label: 'Terminé',
    color: 'bg-violet-100 text-violet-700',
    banner:
      'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-violet-800 dark:text-violet-300',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'Plan en attente',
    description: "Votre plan d'épargne est en cours de validation",
  },
  ACTIVE: { title: 'Épargne en cours', description: 'Continuez à constituer votre épargne !' },
  COMPLETED: {
    title: 'Épargne atteinte !',
    description: 'Félicitations, vous avez atteint votre objectif',
  },
  CANCELLED: { title: 'Plan annulé', description: "Ce plan d'épargne a été annulé" },
};

const CANCELLABLE_STATUSES = ['PENDING', 'ACTIVE'];

export default function LayawayDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributeModal, setContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeMethod, setContributeMethod] = useState('MOBILE_MONEY');
  const [contributing, setContributing] = useState(false);

  const { data: transaction } = useTransactionDetail('LAYAWAY', id);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/layaway/plans/${id}`);
      setPlan(res.data.data);
    } catch (e: any) {
      setError(e.message || 'Plan non trouvé');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSocketUpdate = useCallback(() => {
    fetchData();
  }, [fetchData]);
  useTransactionSocket('LAYAWAY', id, handleSocketUpdate);

  const handleContribute = async () => {
    if (!contributeAmount || Number(contributeAmount) <= 0) return;
    setContributing(true);
    try {
      await apiClient.post(`/layaway/plans/${id}/contribute`, {
        amount: Number(contributeAmount),
        method: contributeMethod,
      });
      fetchData();
      setContributeModal(false);
      setContributeAmount('');
    } catch (e) {
      console.error(e);
    }
    setContributing(false);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (error || !plan)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{error || 'Plan non trouvé'}</p>
      </div>
    );

  const pl: any = plan;
  const status = STATUS_CONFIG[pl.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const statusMsg = STATUS_MESSAGES[pl.status] || STATUS_MESSAGES.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(pl.status);
  const canContribute = ['PENDING', 'ACTIVE'].includes(pl.status);
  const savedAmount = Number(pl.savedAmount || 0);
  const targetAmount = Number(pl.targetAmount || 0);
  const progress =
    targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0;
  const remaining = Math.max(0, targetAmount - savedAmount);
  const contributions = pl.contributions || [];

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl', status.color)}>
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {pl.title || pl.product?.name || `Plan #${id.slice(0, 8)}`}
                    </h1>
                    <span
                      className={cn('text-xs font-medium px-2 py-1 rounded-full', status.color)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Objectif: {formatPrice(targetAmount)} FCFA
                    {pl.targetDate && (
                      <> · Avant le {new Date(pl.targetDate).toLocaleDateString('fr-FR')}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {transaction && (
            <TransactionProgress
              type="LAYAWAY"
              progress={transaction.progress || progress}
              label="Épargne"
              size="lg"
            />
          )}
        </div>

        <div className={cn('flex items-center gap-3 p-4 border', status.banner)}>
          <StatusIcon className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{statusMsg.title}</p>
            <p className="text-xs opacity-80">{statusMsg.description}</p>
          </div>
        </div>
      </div>

      {/* Savings progress card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Progression de l&apos;épargne
          </h3>
          <span className="text-2xl font-bold text-brand">{progress}%</span>
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              progress === 100 ? 'bg-emerald-500' : 'bg-brand'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Épargné</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatPrice(savedAmount)} <span className="text-xs font-normal">FCFA</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Restant</p>
            <p className="text-lg font-bold text-amber-600">
              {formatPrice(remaining)} <span className="text-xs font-normal">FCFA</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Objectif</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(targetAmount)} <span className="text-xs font-normal">FCFA</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canContribute && (
          <Button variant="primary" size="sm" onClick={() => setContributeModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Contribuer
          </Button>
        )}
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1.5" />
          Contacter
        </Button>
        {canCancel && (
          <Button variant="danger" size="sm">
            <XCircle className="h-4 w-4 mr-1.5" />
            Annuler le plan
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contributions list */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Historique des versements ({contributions.length})
            </h3>
            {contributions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                Aucun versement pour l&apos;instant
              </p>
            ) : (
              <div className="space-y-2">
                {contributions.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {c.method || 'Versement'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">
                      +{formatPrice(Number(c.amount))} FCFA
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              Détails du plan
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {pl.createdAt ? new Date(pl.createdAt).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              {pl.targetDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Échéance</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(pl.targetDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Versements</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {contributions.length}
                </span>
              </div>
            </div>
          </Card>

          {pl.product && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                Produit visé
              </h3>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{pl.product.name}</p>
              {pl.product.price && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatPrice(Number(pl.product.price))} FCFA
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Contribute modal */}
      {contributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Nouvelle contribution
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
                <input
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                  placeholder="Ex: 5000"
                  min="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mode de paiement</label>
                <select
                  value={contributeMethod}
                  onChange={(e) => setContributeMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                >
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CARD">Carte bancaire</option>
                  <option value="BANK_TRANSFER">Virement bancaire</option>
                  <option value="CASH">Espèces</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setContributeModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleContribute} isLoading={contributing}>
                Contribuer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
