'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, CreditCard, Clock, CheckCircle2, XCircle, Loader, Wallet, FileText, ShoppingBag, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePayment } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Complété', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: 'Échoué', variant: 'danger', color: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Remboursé', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  PARTIALLY_REFUNDED: { label: 'Remb. partiel', variant: 'info', color: 'bg-indigo-100 text-indigo-700' },
};

const METHOD_LABELS: Record<string, string> = {
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement bancaire',
  CREDIT_CARD: 'Carte bancaire',
  ESCROW: 'Escrow AfriBiz',
  CASH: 'Espèces',
};

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: paymentData, isLoading, refetch } = usePayment(id);

  const payment = paymentData?.payment || paymentData?.data || paymentData;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!payment) return (
    <div className="text-center py-12">
      <DollarSign className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Paiement introuvable</h2>
      <p className="text-sm text-gray-500 mb-6">Ce paiement n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
      <Link href="/dashboard/payments"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour aux paiements</Button></Link>
    </div>
  );

  const s = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING;
  const proofs = payment.proofs || [];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/payments" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paiement {formatPrice(Number(payment.amount || 0))}
            </h1>
            <Badge variant={s.variant} size="sm">{s.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">
            {payment.reference ? `Réf: ${payment.reference}` : `ID: ${id.slice(0, 8)}...`} &middot;
            Créé le {new Date(payment.createdAt || payment.date).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Montant */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand" />Montant
              </h3>
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(Number(payment.amount || 0))}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                <CreditCard className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-500">Méthode</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                  {METHOD_LABELS[payment.method] || payment.method || payment.paymentMethod || '—'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-500">Statut</p>
                <Badge variant={s.variant} size="xs" className="mt-1">{s.label}</Badge>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                <FileText className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-500">Devise</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">{payment.currency || 'FCFA'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                <CalendarDays className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-500">Payé le</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                  {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
            </div>
          </Card>

          {/* Description */}
          {payment.description && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{payment.description}</p>
            </Card>
          )}

          {/* Preuves de paiement */}
          {proofs.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />Preuves de paiement ({proofs.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {proofs.map((proof: any, i: number) => (
                  <div key={proof.id || i} className="relative aspect-square rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden group">
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      📄
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {proof.imageUrl && (
                        <a href={proof.imageUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-medium">
                          Voir
                        </a>
                      )}
                    </div>
                    {proof.notes && (
                      <p className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent text-white text-[10px]">
                        {proof.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Liens vers commande/réservation */}
          {payment.description && (
            <Card className="p-4">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />Transaction associée
              </h3>
              <p className="text-sm text-gray-500">{payment.description}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Résumé */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />Résumé
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Montant</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatPrice(Number(payment.amount || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Méthode</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {METHOD_LABELS[payment.method] || payment.method || payment.paymentMethod || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <Badge variant={s.variant} size="xs">{s.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Devise</span>
                <span className="font-medium">{payment.currency || 'FCFA'}</span>
              </div>
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payé le</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(payment.paidAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Info */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Informations</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Référence</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{payment.reference || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>ID transaction</span>
                <span className="font-mono text-[10px] text-gray-700 dark:text-gray-300">{payment.id.slice(0, 12)}...</span>
              </div>
              {payment.isManual && (
                <div className="flex justify-between text-amber-600">
                  <span>Saisie manuelle</span>
                  <span className="font-medium">Oui</span>
                </div>
              )}
              {payment.verifiedBy && (
                <div className="flex justify-between">
                  <span>Vérifié par</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{payment.verifiedBy}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
