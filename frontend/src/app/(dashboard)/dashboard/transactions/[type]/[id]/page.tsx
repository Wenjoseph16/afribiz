'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageCircle,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  Loader,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import {
  TransactionHeader,
  TransactionTimeline,
  TransactionProgress,
} from '@/components/transactions';
import { apiClient } from '@/services/apiClient';
import type { TransactionSnapshot, TransactionType } from '@/types/transactions';

const VALID_TYPES: TransactionType[] = [
  'ORDER',
  'BOOKING',
  'RENTAL',
  'EVENT',
  'SUBSCRIPTION',
  'TRAINING',
  'LAYAWAY',
];

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-2">
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function ActionButtons({ transaction }: { transaction: TransactionSnapshot }) {
  const [loading, setLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const cancellableStatuses = [
    'PENDING',
    'CONFIRMED',
    'ACCEPTED',
    'IN_PROGRESS',
    'REGISTERED',
    'ACTIVE',
  ];
  const canCancel = cancellableStatuses.includes(transaction.status);

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      if (action === 'cancel') {
        const endpoint =
          transaction.type === 'ORDER'
            ? `/orders/${transaction.id}/cancel`
            : transaction.type === 'BOOKING'
              ? `/bookings/${transaction.id}/cancel`
              : transaction.type === 'SUBSCRIPTION'
                ? `/subscriptions/my/cancel`
                : transaction.type === 'LAYAWAY'
                  ? `/layaway/plans/${transaction.id}/cancel`
                  : null;

        if (endpoint) {
          await apiClient.post(endpoint, { reason: cancelReason });
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {transaction.type === 'EVENT' && (transaction.meta?.qrCode as string) && (
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Télécharger billet
          </Button>
        )}
        {transaction.type === 'TRAINING' && (transaction.meta?.certificateUrl as string) && (
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Certificat
          </Button>
        )}
        {canCancel && (
          <Button variant="danger" size="sm" onClick={() => setShowCancel(!showCancel)}>
            <XCircle className="h-4 w-4 mr-1.5" />
            Annuler
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {showCancel && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <textarea
            placeholder="Raison de l'annulation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction('cancel')}
              disabled={loading}
            >
              {loading ? <Loader className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmer l'annulation
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = (params?.type as string)?.toUpperCase() as TransactionType;
  const id = params?.id as string;

  if (!type || !VALID_TYPES.includes(type)) {
    return <ErrorState message="Type de transaction invalide" />;
  }

  const { data: transaction, isLoading, error, refetch } = useTransactionDetail(type, id);

  useTransactionSocket(
    type,
    id,
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader variant="spinner" size="md" />
      </div>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!transaction)
    return (
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="Transaction non trouvée"
        description="Cette transaction n'existe pas ou vous n'avez pas les droits d'accès."
      />
    );

  const meta = transaction.meta || {};

  return (
    <div className="animate-fade-in space-y-6 max-w-3xl mx-auto">
      <TransactionHeader transaction={transaction} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items (for orders) */}
          {transaction.items && transaction.items.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Articles
              </h3>
              <div className="space-y-3">
                {transaction.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.total.toLocaleString('fr-FR')} {transaction.currency}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Total
                </span>
                <span className="text-sm font-bold text-brand">
                  {transaction.amount.toLocaleString('fr-FR')} {transaction.currency}
                </span>
              </div>
            </Card>
          )}

          {/* Event ticket */}
          {transaction.type === 'EVENT' && !!meta.qrCode && (
            <Card className="p-4 text-center">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Mon billet
              </h3>
              <div className="bg-white p-4 rounded-xl inline-block">
                <img src={meta.qrCode as string} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Réf: {transaction.number}
              </p>
            </Card>
          )}

          {/* Training lessons */}
          {transaction.type === 'TRAINING' && !!meta.lessons && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Progression · {String(meta.lessons)} leçons
              </h3>
              <TransactionProgress
                type="TRAINING"
                progress={transaction.progress || 0}
                label="Progression"
                size="lg"
              />
            </Card>
          )}

          {/* Layaway contributions */}
          {transaction.type === 'LAYAWAY' && !!meta.contributions && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Versements
              </h3>
              <div className="space-y-2">
                {(meta.contributions as any[]).map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {c.method}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      +{c.amount.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Épargné</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {(meta.savedAmount as number)?.toLocaleString('fr-FR')} /{' '}
                    {(meta.targetAmount as number)?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Subscription benefits */}
          {transaction.type === 'SUBSCRIPTION' && !!meta.benefits && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Avantages du plan
              </h3>
              <ul className="space-y-2">
                {(meta.benefits as string[]).map((b, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Meta info */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Détails</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <InfoRow
                icon={Clock}
                label="Créé le"
                value={new Date(transaction.createdAt).toLocaleString('fr-FR')}
              />
              <InfoRow
                icon={Clock}
                label="Mis à jour"
                value={new Date(transaction.updatedAt).toLocaleString('fr-FR')}
              />
              {transaction.expiresAt && (
                <InfoRow
                  icon={Clock}
                  label="Expire le"
                  value={new Date(transaction.expiresAt).toLocaleString('fr-FR')}
                />
              )}
              {transaction.deliveredAt && (
                <InfoRow
                  icon={CheckCircle2}
                  label="Livré le"
                  value={new Date(transaction.deliveredAt).toLocaleString('fr-FR')}
                />
              )}
              {(meta.deliveryAddress as string) && (
                <InfoRow
                  icon={MapPin}
                  label="Adresse de livraison"
                  value={meta.deliveryAddress as string}
                />
              )}
              {(meta.paymentMethod as string) && (
                <InfoRow
                  icon={User}
                  label="Mode de paiement"
                  value={meta.paymentMethod as string}
                />
              )}
              {(meta.startDate as string) && (
                <InfoRow
                  icon={Clock}
                  label="Date de début"
                  value={new Date(meta.startDate as string).toLocaleString('fr-FR')}
                />
              )}
              {(meta.guests as number) && (
                <InfoRow icon={User} label="Invités" value={String(meta.guests)} />
              )}
              {(meta.billingCycle as string) && (
                <InfoRow
                  icon={RefreshCw}
                  label="Cycle de facturation"
                  value={meta.billingCycle as string}
                />
              )}
              {(meta.nextBillingDate as string) && (
                <InfoRow
                  icon={Clock}
                  label="Prochaine facturation"
                  value={new Date(meta.nextBillingDate as string).toLocaleDateString('fr-FR')}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          {transaction.timeline && transaction.timeline.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Historique
              </h3>
              <TransactionTimeline events={transaction.timeline} />
            </Card>
          )}

          {/* Actions */}
          <ActionButtons transaction={transaction} />
        </div>
      </div>
    </div>
  );
}
