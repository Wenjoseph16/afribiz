'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Store,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useBooking } from '@/features/hooks';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import { apiClient } from '@/services/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/utils/helpers';
import { TransactionProgress } from '@/components/transactions';
import { downloadICS } from '@/lib/calendarSync';

const STATUS_CONFIG: Record<string, { label: string; color: string; banner: string; icon: any }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-amber-100 text-amber-700',
    banner:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmée',
    color: 'bg-blue-100 text-blue-700',
    banner:
      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
    icon: CheckCircle,
  },
  ARRIVED: {
    label: 'Arrivé',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'En cours',
    color: 'bg-purple-100 text-purple-700',
    banner:
      'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300',
    icon: Clock,
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
  NO_SHOW: {
    label: 'No-show',
    color: 'bg-rose-100 text-rose-700',
    banner:
      'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300',
    icon: XCircle,
  },
  RESCHEDULED: {
    label: 'Reportée',
    color: 'bg-indigo-100 text-indigo-700',
    banner:
      'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300',
    icon: Calendar,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'En attente de confirmation',
    description: "L'établissement va confirmer votre réservation",
  },
  CONFIRMED: {
    title: 'Réservation confirmée',
    description: 'Votre réservation est confirmée, à bientôt !',
  },
  ARRIVED: { title: 'Arrivé sur place', description: 'Votre réservation est en cours' },
  IN_PROGRESS: { title: 'Service en cours', description: 'Vous profitez de votre réservation' },
  COMPLETED: { title: 'Réservation terminée', description: 'Merci de votre visite !' },
  CANCELLED: { title: 'Réservation annulée', description: 'Cette réservation a été annulée' },
  NO_SHOW: { title: 'Non présenté', description: 'Vous ne vous êtes pas présenté(e)' },
  RESCHEDULED: { title: 'Réservation reportée', description: 'Votre réservation a été reportée' },
};

export default function BookingDetailPage() {
  const params = useParams();
  const qc = useQueryClient();
  const id = params?.id as string;
  const { data: bookingData, isLoading, refetch } = useBooking(id);
  const { data: transaction } = useTransactionDetail('BOOKING', id);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const b: any = bookingData?.booking || bookingData || {};

  const handleSocketUpdate = useCallback(() => {
    refetch();
  }, [refetch]);
  useTransactionSocket('BOOKING', id, handleSocketUpdate);

  const handleCancel = async () => {
    if (!b.id) return;
    setActionLoading(true);
    try {
      await apiClient.post(`/bookings/${b.id}/cancel`, { reason: cancelReason });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setCancelModalOpen(false);
    } catch (e) {
      console.error(e);
    }
    setActionLoading(false);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (!b || !b.id)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Réservation non trouvée</p>
      </div>
    );

  const status = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;
  const startDate = new Date(b.startDate || b.date);
  const endDate = b.endDate ? new Date(b.endDate) : null;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(b.status);
  const businessName = b.business?.name || b.businessName || '—';
  const statusMsg = STATUS_MESSAGES[b.status] || STATUS_MESSAGES.PENDING;

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className={cn('p-2.5 rounded-xl', status.color)}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {b.title || b.bookingNumber || `#${id.slice(0, 8)}`}
                    </h1>
                    <span
                      className={cn('text-xs font-medium px-2 py-1 rounded-full', status.color)}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {startDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {endDate && (
                      <>
                        {' '}
                        ·{' '}
                        {startDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {endDate.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
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
              type="BOOKING"
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
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            downloadICS(
              {
                title: b.title || b.bookingNumber || 'Réservation',
                description: b.specialRequests || undefined,
                location: b.business?.address || undefined,
                startDate: startDate,
                endDate: endDate || undefined,
                businessName: businessName !== '—' ? businessName : undefined,
              },
              `booking_${id}.ics`
            )
          }
        >
          <Calendar className="h-4 w-4 mr-1.5" />
          Calendrier
        </Button>
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1.5" />
          Contacter
        </Button>
        {canCancel && (
          <Button variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>
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
                    {formatPrice(Number(b.price || 0))}
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
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {startDate.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
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
                  <p className="text-xs text-gray-500">Horaire</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {endDate &&
                      ` - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Store className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Entreprise</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {businessName}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type</span>
                <p className="font-medium text-gray-900 dark:text-white">{b.type || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Début</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {startDate.toLocaleString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Fin</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {endDate ? endDate.toLocaleString('fr-FR') : '—'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Personnes</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {b.guests || b.adults || 1}
                  {b.children ? ` (dont ${b.children} enfants)` : ''}
                </p>
              </div>
            </div>
            {b.specialRequests && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Demande spéciale
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">
                  {b.specialRequests}
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Paiement</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Montant total</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(Number(b.price || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">Acompte</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(Number(b.depositAmount || 0))}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Acompte payé</span>
                {b.depositPaid ? (
                  <span className="text-emerald-600 font-medium">✓ Oui</span>
                ) : (
                  <span className="text-amber-600">Non</span>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Historique</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-brand shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Réservation créée</p>
                  <p className="text-xs text-gray-400">
                    {b.createdAt ? new Date(b.createdAt).toLocaleString('fr-FR') : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-2 h-2 mt-1.5 rounded-full shrink-0',
                    b.status === 'CANCELLED' ? 'bg-red-500' : 'bg-emerald-500'
                  )}
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Statut: {status.label}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.updatedAt ? new Date(b.updatedAt).toLocaleString('fr-FR') : '—'}
                  </p>
                </div>
              </div>
              {b.checkedInAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-medium text-emerald-600">Arrivé(e)</p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.checkedInAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
              {b.checkedOutAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-600">Terminée</p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.checkedOutAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
              {b.cancelledAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                  <div>
                    <p className="font-medium text-red-600">
                      Annulée{b.cancelReason ? `: ${b.cancelReason}` : ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.cancelledAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Entreprise</h3>
            <div className="flex items-center gap-2 text-sm">
              <Store className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-white">{businessName}</span>
            </div>
          </Card>

          {b.service && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                Service associé
              </h3>
              <p className="text-sm font-medium">{b.service.name}</p>
              {b.service.price && (
                <p className="text-xs text-gray-500 mt-1">{formatPrice(Number(b.service.price))}</p>
              )}
              {b.service.duration && (
                <p className="text-xs text-gray-500">{b.service.duration} min</p>
              )}
            </Card>
          )}

          {b.resource && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                Ressource
              </h3>
              <p className="text-sm font-medium">{b.resource.name}</p>
              <p className="text-xs text-gray-500 mt-1">{b.resource.type}</p>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Annuler la réservation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Voulez-vous vraiment annuler cette réservation ?
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Motif d&apos;annulation</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl resize-none bg-transparent dark:text-gray-100"
              rows={3}
              placeholder="Optionnel..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Retour
            </Button>
            <Button
              onClick={handleCancel}
              isLoading={actionLoading}
              className="bg-red-500 hover:bg-red-600"
            >
              Confirmer l&apos;annulation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
