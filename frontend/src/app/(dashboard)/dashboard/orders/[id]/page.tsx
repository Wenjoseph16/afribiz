'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Store, Loader, Clock, Package, Truck, CheckCircle2, XCircle, History, TrendingUp, Activity, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useOrder } from '@/features/hooks';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';
import { HybridPaymentSectionDynamic as HybridPaymentSection } from '@/components/payments/HybridPaymentSectionDynamic';
import OrderActionModal from '@/components/orders/OrderActionModal';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmée', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Acceptée', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  PREPARING: { label: 'En préparation', variant: 'info', color: 'bg-purple-100 text-purple-700' },
  READY: { label: 'Prête', variant: 'success', color: 'bg-teal-100 text-teal-700' },
  DELIVERING: { label: 'En livraison', variant: 'info', color: 'bg-indigo-100 text-indigo-700' },
  DELIVERED: { label: 'Livrée', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Terminée', variant: 'default', color: 'bg-gray-100 text-gray-600' },
  REFUSED: { label: 'Refusée', variant: 'danger', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Annulée', variant: 'danger', color: 'bg-red-100 text-red-700' },
};

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'ACCEPTED', 'PREPARING'];

const TYPE_LABELS: Record<string, string> = {
  DELIVERY: 'Livraison', ON_SITE: 'Sur place', CLICK_COLLECT: 'Click & Collect',
  PREORDER: 'Précommande', QUICK: 'Rapide', CUSTOM: 'Personnalisée',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: orderData, isLoading, refetch } = useOrder(id);

  const { user } = useAuthStore();
  const isBusiness = user?.roles?.includes('BUSINESS') || user?.primaryRole === 'BUSINESS';

  const [showOrderAction, setShowOrderAction] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const order = orderData?.order || orderData?.data || orderData;

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await apiClient.post(`/orders/${id}/cancel`, { reason: cancelReason });
      refetch();
      setShowCancel(false);
      setCancelReason('');
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Commande introuvable</div>;

  const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);
  const businessName = order.business?.name || order.businessName || '—';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber || `#${id.slice(0, 8)}`}</h1>
            <Badge variant={s.variant} size="sm">{s.label}</Badge>
          </div>
          <p className="text-sm text-gray-500">Créée le {new Date(order.createdAt || order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Actions pour le business */}
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

      {/* Order Action Modal */}
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

      {/* Cancel Action */}
      {canCancel && !showCancel && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowCancel(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-800">
              Annuler la commande
            </button>
          </div>
        </Card>
      )}
      {showCancel && (
        <Card className="p-4">
          <div className="flex items-center gap-2 w-full">
            <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motif d'annulation (optionnel)" className="flex-1 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100" />
            <button onClick={handleCancel} disabled={updating}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {updating ? <Loader className="h-4 w-4 animate-spin" /> : 'Confirmer'}
            </button>
            <button onClick={() => { setShowCancel(false); setCancelReason(''); }} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">Retour</button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Package className="w-4 h-4" />Articles ({order.items?.length || 0})</h3>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                    {item.variantName && <p className="text-[10px] text-gray-400">{item.variantName}</p>}
                    {item.notes && <p className="text-[10px] text-gray-400 mt-0.5">Note: {item.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(Number(item.total || item.unitPrice * item.quantity))}</p>
                    <p className="text-[10px] text-gray-400">{item.quantity} × {formatPrice(Number(item.unitPrice))}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>           {/* Timeline & Historique */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><History className="w-4 h-4" />Historique</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <History className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Créée le</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Activity className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Dernière act.</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <TrendingUp className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Source</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{order.source || '—'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <ShoppingBag className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Articles</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{order.items?.length || 0}</p>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Chronologie</h4>
            <div className="space-y-3">
              {[
                { label: 'Commande créée', date: order.createdAt, icon: ShoppingBag },
                { label: 'Acceptée', date: order.acceptedAt, icon: CheckCircle2 },
                { label: 'En préparation', date: order.preparingAt, icon: Package },
                { label: 'Prête', date: order.readyAt, icon: CheckCircle2 },
                { label: 'En livraison', date: order.deliveringAt, icon: Truck },
                { label: 'Livrée', date: order.deliveredAt, icon: Truck },
                { label: 'Terminée', date: order.completedAt, icon: CheckCircle2 },
              ].filter(e => e.date).map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <event.icon className="w-3.5 h-3.5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">{event.label}</p>
                    <p className="text-[10px] text-gray-400">{new Date(event.date).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
              {order.cancelledAt && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600">Annulée</p>
                    <p className="text-[10px] text-gray-400">{order.cancelReason && `Motif: ${order.cancelReason}`} • {new Date(order.cancelledAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Business */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Store className="w-4 h-4" />Entreprise</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Store className="w-4 h-4 shrink-0" />{businessName}</div>
            </div>
          </Card>

          {/* Payment - Hybrid Section */}
          <HybridPaymentSection orderId={id} orderTotal={Number(order.totalAmount || 0)} />

          {/* Order Total Recap */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Wallet className="w-4 h-4" />Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sous-total</span><span className="font-medium">{formatPrice(Number(order.subtotal || 0))}</span></div>
              {Number(order.deliveryFee || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Livraison</span><span className="font-medium">{formatPrice(Number(order.deliveryFee))}</span></div>}
              {Number(order.discountAmount || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Remise</span><span className="font-medium text-red-500">-{formatPrice(Number(order.discountAmount))}</span></div>}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span><span>{formatPrice(Number(order.totalAmount || 0))}</span>
              </div>
            </div>
          </Card>

          {/* Info */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Détails</h3>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between"><span>Type</span><span className="font-medium text-gray-700 dark:text-gray-300">{TYPE_LABELS[order.type] || order.type}</span></div>
              <div className="flex justify-between"><span>Canal</span><span className="font-medium text-gray-700 dark:text-gray-300">{order.source || '—'}</span></div>
              <div className="flex justify-between"><span>Articles</span><span className="font-medium text-gray-700 dark:text-gray-300">{order.items?.length || 0}</span></div>
              {order.notes && <div className="pt-2 border-t border-gray-100 dark:border-gray-800"><span>Notes:</span><p className="text-gray-700 dark:text-gray-300 mt-1">{order.notes}</p></div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
