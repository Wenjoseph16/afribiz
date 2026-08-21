'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag,
  Store,
  Loader,
  Clock,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  History,
  TrendingUp,
  Activity,
  Wallet,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useOrder } from '@/features/hooks';
import { useOrderTimeline } from '@/features/hooks/orders';
import { useTransactionDetail, useTransactionSocket } from '@/features/hooks/transactions';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';
import { useToast } from '@/components/ui/ToastProvider';
import {
  TransactionHeader,
  TransactionTimeline,
  TransactionProgress,
} from '@/components/transactions';
import { HybridPaymentSectionDynamic as HybridPaymentSection } from '@/components/payments/HybridPaymentSectionDynamic';
import OrderActionModal from '@/components/orders/OrderActionModal';
import ReviewForm from '@/components/reviews/ReviewForm';
import OrderTimeline from '@/components/order/OrderTimeline';

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'warning' | 'success' | 'danger' | 'info' | 'default';
    color: string;
    banner: string;
    icon: any;
  }
> = {
  PENDING: {
    label: 'En attente',
    variant: 'warning',
    color: 'bg-amber-100 text-amber-700',
    banner:
      'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmée',
    variant: 'info',
    color: 'bg-blue-100 text-blue-700',
    banner:
      'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
    icon: CheckCircle2,
  },
  ACCEPTED: {
    label: 'Acceptée',
    variant: 'success',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  PREPARING: {
    label: 'En préparation',
    variant: 'info',
    color: 'bg-purple-100 text-purple-700',
    banner:
      'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 text-purple-800 dark:text-purple-300',
    icon: Package,
  },
  READY: {
    label: 'Prête',
    variant: 'success',
    color: 'bg-teal-100 text-teal-700',
    banner:
      'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/50 text-teal-800 dark:text-teal-300',
    icon: CheckCircle2,
  },
  DELIVERING: {
    label: 'En livraison',
    variant: 'info',
    color: 'bg-indigo-100 text-indigo-700',
    banner:
      'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Livrée',
    variant: 'success',
    color: 'bg-emerald-100 text-emerald-700',
    banner:
      'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: 'Terminée',
    variant: 'default',
    color: 'bg-gray-100 text-gray-600',
    banner:
      'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
    icon: CheckCircle2,
  },
  REFUSED: {
    label: 'Refusée',
    variant: 'danger',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Annulée',
    variant: 'danger',
    color: 'bg-red-100 text-red-700',
    banner:
      'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300',
    icon: XCircle,
  },
};

const STATUS_MESSAGES: Record<string, { title: string; description: string }> = {
  PENDING: {
    title: 'En attente de confirmation',
    description: 'Le vendeur va bientôt prendre en charge votre commande',
  },
  CONFIRMED: { title: 'Commande confirmée', description: 'Le vendeur a confirmé votre commande' },
  ACCEPTED: {
    title: 'Commande prise en charge',
    description: "Le vendeur s'occupe de votre commande",
  },
  PREPARING: { title: 'En préparation', description: 'Votre commande est en cours de préparation' },
  READY: { title: 'Prête pour retrait', description: 'Votre commande est prête' },
  DELIVERING: { title: 'En livraison', description: 'Votre commande est en route' },
  DELIVERED: { title: 'Commande livrée', description: 'Votre commande a été livrée avec succès' },
  COMPLETED: { title: 'Commande terminée', description: 'Cette commande est terminée' },
  REFUSED: { title: 'Commande refusée', description: 'Le vendeur a refusé cette commande' },
  CANCELLED: { title: 'Commande annulée', description: 'Cette commande a été annulée' },
};

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PREPARING'];

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Livraison',
  ON_SITE: 'Sur place',
  CLICK_COLLECT: 'Click & Collect',
  PREORDER: 'Précommande',
  QUICK: 'Rapide',
  CUSTOM: 'Personnalisée',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: orderData, isLoading, refetch } = useOrder(id);
  const { data: timelineData } = useOrderTimeline(id);
  const { data: transaction } = useTransactionDetail('ORDER', id);

  const { user } = useAuthStore();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';

  const [showOrderAction, setShowOrderAction] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewTarget, setReviewTarget] = useState<{
    productId?: string;
    serviceId?: string;
    name: string;
  } | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const { notify } = useToast();

  const order = orderData?.order || orderData?.data || orderData;

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await apiClient.post(`/orders/${id}/cancel`, { reason: cancelReason });
      notify({
        title: 'Commande annulée',
        description: 'La commande a été annulée avec succès.',
        variant: 'info',
      });
      refetch();
      setShowCancel(false);
      setCancelReason('');
    } catch (err: any) {
      notify({
        title: 'Erreur',
        description: err?.message || "Impossible d'annuler la commande.",
        variant: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleSocketUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  useTransactionSocket('ORDER', id, handleSocketUpdate);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  if (!order) return <div className="text-center py-12 text-gray-500">Commande introuvable</div>;

  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = s.icon;
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const businessName = order.business?.name || order.businessName || '—';
  const canReview =
    !isBusiness &&
    (order.status === 'DELIVERED' || order.status === 'COMPLETED') &&
    (order.items || []).some((item: any) => item.productId || item.serviceId);

  const statusMsg = STATUS_MESSAGES[order.status] || STATUS_MESSAGES.PENDING;

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      {/* HERO: Suivi de commande */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header avec back + titre */}
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
                <div className={cn('p-2.5 rounded-xl', s.color)}>
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                      {order.orderNumber || `#${id.slice(0, 8)}`}
                    </h1>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Créée le{' '}
                    {new Date(order.createdAt || order.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {businessName !== '—' && <> · {businessName}</>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progression */}
          {transaction && (
            <TransactionProgress
              type="ORDER"
              progress={transaction.progress || 0}
              label="Progression de la commande"
              size="lg"
            />
          )}
        </div>

        {/* Banner status */}
        <div className={cn('flex items-center gap-3 p-4 border', s.banner)}>
          <StatusIcon className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{statusMsg.title}</p>
            <p className="text-xs opacity-80">{statusMsg.description}</p>
          </div>
        </div>

        {/* Auto-cancellation notice */}
        {order.status === 'PENDING' && (
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Le vendeur est informé après 15 minutes, puis relancé à 30 minutes. Sans réponse sous
              60 minutes, la commande sera automatiquement annulée.
            </p>
          </div>
        )}
      </div>

      {/* Actions client */}
      {!isBusiness && (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/messages?orderId=${id}`}>
            <Button variant="secondary" size="sm">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Contacter le vendeur
            </Button>
          </Link>
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
      )}

      {/* Cancel form */}
      {showCancel && (
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Raison de l&apos;annulation
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motif (optionnel)"
              className="flex-1 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100"
            />
            <button
              onClick={handleCancel}
              disabled={updating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {updating ? <Loader className="h-4 w-4 animate-spin" /> : 'Confirmer'}
            </button>
            <button
              onClick={() => {
                setShowCancel(false);
                setCancelReason('');
              }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Retour
            </button>
          </div>
        </Card>
      )}

      {/* Actions business */}
      {isBusiness && order.status === 'PENDING' && !showCancel && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowOrderAction(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5 inline-block" />
              Traiter la commande
            </button>
            <Link href={`/dashboard/messages?orderId=${id}`}>
              <button className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                Contacter le client
              </button>
            </Link>
          </div>
        </Card>
      )}

      <OrderActionModal
        open={showOrderAction}
        onClose={() => setShowOrderAction(false)}
        onSuccess={refetch}
        order={{
          id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          contactName: order.contactName,
          contactPhone: order.contactPhone,
          createdAt: order.createdAt,
          items: order.items,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Articles */}
          <Card className="p-5">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Articles ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    {item.variantName && (
                      <p className="text-[10px] text-gray-400">{item.variantName}</p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Note: {item.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(Number(item.total || item.unitPrice * item.quantity))}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {item.quantity} × {formatPrice(Number(item.unitPrice))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline détaillée */}
          <OrderTimeline
            timeline={timelineData?.timeline || []}
            currentStatus={timelineData?.status || order.status}
            orderNumber={order.orderNumber}
          />

          {/* Laisser un avis */}
          {canReview && (
            <Card className="p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                {reviewed ? 'Merci pour votre avis !' : 'Laisser un avis'}
              </h3>
              {reviewed ? (
                <p className="text-sm text-gray-500">
                  Votre retour a bien été enregistré. Il aide la communauté à faire les bons choix.
                </p>
              ) : (
                <div className="space-y-2">
                  {(order.items || [])
                    .filter((item: any) => item.productId || item.serviceId)
                    .map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                        </div>
                        <Button
                          size="xs"
                          onClick={() =>
                            setReviewTarget({
                              productId: item.productId,
                              serviceId: item.serviceId,
                              name: item.name,
                            })
                          }
                        >
                          Évaluer
                        </Button>
                      </div>
                    ))}
                  {reviewTarget && (
                    <div className="pt-1">
                      <p className="text-xs text-gray-500 mb-2">
                        Notez votre expérience : {reviewTarget.name}
                      </p>
                      <ReviewForm
                        productId={reviewTarget.productId}
                        serviceId={reviewTarget.serviceId}
                        onCancel={() => setReviewTarget(null)}
                        onSuccess={() => {
                          setReviewed(true);
                          setReviewTarget(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Business */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Store className="w-4 h-4" />
              Entreprise
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Store className="w-4 h-4 shrink-0" />
                {businessName}
              </div>
            </div>
          </Card>

          {/* Payment */}
          <HybridPaymentSection orderId={id} orderTotal={Number(order.totalAmount || 0)} />

          {/* Récapitulatif */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Récapitulatif
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-medium">{formatPrice(Number(order.subtotal || 0))}</span>
              </div>
              {Number(order.deliveryFee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Livraison</span>
                  <span className="font-medium">{formatPrice(Number(order.deliveryFee))}</span>
                </div>
              )}
              {Number(order.discountAmount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Remise</span>
                  <span className="font-medium text-red-500">
                    -{formatPrice(Number(order.discountAmount))}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{formatPrice(Number(order.totalAmount || 0))}</span>
              </div>
            </div>
          </Card>

          {/* Détails */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Type</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {TYPE_LABELS[order.type] || order.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Canal</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {order.source || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Articles</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {order.items?.length || 0}
                </span>
              </div>
              {order.notes && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Notes:</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
