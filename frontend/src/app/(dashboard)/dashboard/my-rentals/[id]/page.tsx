'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Home,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader,
  MessageCircle,
  Share2,
  Calendar,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
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
    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Terminée',
    color: 'bg-gray-100 text-gray-600',
    banner:
      'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Annulée',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
  RETURNED: {
    label: 'Retournée',
    color: 'bg-blue-100 text-blue-700',
    banner:
      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
    icon: Home,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'En attente de validation',
    description: 'Le propriétaire va confirmer votre location',
  },
  ACTIVE: { title: 'Location en cours', description: 'Profitez bien de votre location' },
  COMPLETED: { title: 'Location terminée', description: 'Merci pour cette location' },
  CANCELLED: { title: 'Location annulée', description: 'Cette location a été annulée' },
  RETURNED: { title: 'Équipement retourné', description: 'Le retour a été enregistré' },
};

const CANCELLABLE_STATUSES = ['PENDING'];

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [prolongModal, setProlongModal] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');

  // Fetch rental data - we'll use the API directly
  const [rental, setRental] = useState<any>(null);
  const [rentalLoading, setRentalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRental = useCallback(async () => {
    try {
      setRentalLoading(true);
      const res = await apiClient.get(`/rentals/my/${id}`);
      setRental(res.data.data);
    } catch (e: any) {
      setError(e.message || 'Location non trouvée');
    } finally {
      setRentalLoading(false);
    }
  }, [id]);

  // Fetch on mount
  useState(() => {
    fetchRental();
  });

  const { data: transaction } = useTransactionDetail('RENTAL', id);
  const handleSocketUpdate = useCallback(() => {
    fetchRental();
  }, [fetchRental]);
  useTransactionSocket('RENTAL', id, handleSocketUpdate);

  const handleProlong = async () => {
    if (!newEndDate) return;
    setLoading(true);
    try {
      await apiClient.post(`/rentals/my/${id}/prolong`, { newEndDate });
      fetchRental();
      setProlongModal(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (rentalLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (error || !rental)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">{error || 'Location non trouvée'}</p>
      </div>
    );

  const r: any = rental;
  const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const startDate = r.startDate ? new Date(r.startDate) : null;
  const endDate = r.endDate ? new Date(r.endDate) : null;
  const businessName = r.business?.name || r.businessName || '—';
  const statusMsg = STATUS_MESSAGES[r.status] || STATUS_MESSAGES.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(r.status);
  const canProlong = ['ACTIVE'].includes(r.status) && endDate && endDate > new Date();

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
                  <Home className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {r.title || r.equipment?.name || `#${id.slice(0, 8)}`}
                    </h1>
                    <span
                      className={cn('text-xs font-medium px-2 py-1 rounded-full', status.color)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {startDate &&
                      startDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    {endDate && (
                      <>
                        {' '}
                        →{' '}
                        {endDate.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </>
                    )}
                    {businessName !== '—' && <> · {businessName}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {transaction && (
            <TransactionProgress
              type="RENTAL"
              progress={transaction.progress || 0}
              label="Progression"
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

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1.5" />
          Contacter
        </Button>
        {canProlong && (
          <Button variant="secondary" size="sm" onClick={() => setProlongModal(true)}>
            <Calendar className="h-4 w-4 mr-1.5" />
            Prolonger
          </Button>
        )}
        {canCancel && (
          <Button variant="danger" size="sm">
            <XCircle className="h-4 w-4 mr-1.5" />
            Annuler
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand/10">
                  <DollarSign className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Montant</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(Number(r.price || r.totalAmount || 0))}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Début</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {startDate
                      ? startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fin</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {endDate
                      ? endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lieu</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {r.location || '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {r.equipment && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Équipement
              </h3>
              <div className="flex items-center gap-4">
                {r.equipment.image && (
                  <img
                    src={r.equipment.image}
                    alt={r.equipment.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{r.equipment.name}</p>
                  {r.equipment.description && (
                    <p className="text-sm text-gray-500 mt-1">{r.equipment.description}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type</span>
                <p className="font-medium text-gray-900 dark:text-white">{r.type || '—'}</p>
              </div>
              {r.deposit && (
                <div>
                  <span className="text-gray-500">Caution</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(Number(r.deposit))}
                  </p>
                </div>
              )}
              {r.duration && (
                <div>
                  <span className="text-gray-500">Durée</span>
                  <p className="font-medium text-gray-900 dark:text-white">{r.duration}</p>
                </div>
              )}
            </div>
          </Card>

          {r.payments && r.payments.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Historique des paiements
              </h3>
              <div className="space-y-2">
                {r.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {p.method || 'Paiement'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-emerald-600">
                      {formatPrice(Number(p.amount))}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Entreprise</h3>
            <div className="flex items-center gap-2 text-sm">
              <Home className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-white">{businessName}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              Récapitulatif
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Location</span>
                <span className="font-medium">
                  {formatPrice(Number(r.price || r.totalAmount || 0))}
                </span>
              </div>
              {r.deposit && Number(r.deposit) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Caution</span>
                  <span className="font-medium">{formatPrice(Number(r.deposit))}</span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>
                  {formatPrice(Number(r.price || r.totalAmount || 0) + Number(r.deposit || 0))}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {prolongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Prolonger la location
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Nouvelle date de fin</label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100"
                min={endDate?.toISOString().split('T')[0]}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setProlongModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleProlong} isLoading={loading}>
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
