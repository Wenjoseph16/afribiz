'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ShoppingBag, Clock, Package, Truck, CheckCircle2, XCircle,
  User, Phone, MapPin, CreditCard, FileText, AlertTriangle, Loader,
  ChevronDown, ChevronUp, MessageSquare, Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useMyBusinessOrder, useMyBusiness } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';
import OrderActionModal from '@/components/orders/OrderActionModal';
import WhatsAppShare from '@/components/orders/WhatsAppShare';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CONFIRMED: { label: 'Confirmée', variant: 'info', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  ACCEPTED: { label: 'Acceptée', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PREPARING: { label: 'En préparation', variant: 'info', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  READY: { label: 'Prête', variant: 'success', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
  DELIVERING: { label: 'En livraison', variant: 'info', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  DELIVERED: { label: 'Livrée', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  COMPLETED: { label: 'Terminée', variant: 'default', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  REFUSED: { label: 'Refusée', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Annulée', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  DISPUTE: { label: 'Litige', variant: 'danger', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const STATUS_FLOW = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED'];

function StatusTimeline({ status, createdAt, paidAt, deliveredAt }: { status: string; createdAt?: string; paidAt?: string; deliveredAt?: string }) {
  const currentIdx = STATUS_FLOW.indexOf(status);
  const terminalStatuses = ['REFUSED', 'CANCELLED', 'DISPUTE'];
  const isTerminal = terminalStatuses.includes(status);

  const steps = STATUS_FLOW.map((s, i) => ({
    status: s,
    label: STATUS_CONFIG[s]?.label || s,
    date: s === 'PENDING' ? createdAt : s === 'DELIVERED' ? deliveredAt : null,
    isActive: currentIdx >= i,
    isCurrent: currentIdx === i,
  }));

  return (
    <div className="space-y-0">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Suivi de commande</h3>
        {isTerminal && (
          <Badge variant={STATUS_CONFIG[status]?.variant || 'danger'} size="sm">
            {STATUS_CONFIG[status]?.label || status}
          </Badge>
        )}
      </div>
      <div className="relative">
        {steps.map((step, i) => {
          const Icon = i === 0 ? ShoppingBag : i === 1 ? CheckCircle2 : i === 2 ? Package : i === 3 ? Clock : i === 4 ? Truck : CheckCircle2;
          return (
            <div key={step.status} className="flex items-start gap-3 pb-6 last:pb-0 relative">
              {i < steps.length - 1 && (
                <div className={cn(
                  'absolute left-[11px] top-6 w-0.5 h-full -z-10',
                  step.isActive ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'
                )} />
              )}
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 z-10',
                step.isActive
                  ? step.isCurrent
                    ? 'bg-brand border-brand text-white'
                    : 'bg-brand/10 border-brand text-brand'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600'
              )}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={cn(
                  'text-xs font-medium',
                  step.isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                )}>
                  {step.label}
                  {step.isCurrent && !isTerminal && <span className="ml-1.5 text-brand animate-pulse">●</span>}
                </p>
                {step.date && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(step.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {isTerminal && (
          <div className="flex items-start gap-3 relative">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 z-10',
              status === 'REFUSED' ? 'bg-red-100 border-red-400 text-red-600' : 'bg-gray-100 border-gray-400 text-gray-600'
            )}>
              {status === 'REFUSED' ? <XCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {status === 'REFUSED' ? 'Refusée' : status === 'CANCELLED' ? 'Annulée' : status}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Processus terminé</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading, error, refetch } = useMyBusinessOrder(orderId);
  const { data: business } = useMyBusiness();
  const [showActionModal, setShowActionModal] = useState(false);
  const [showItems, setShowItems] = useState(true);
  const [showPayment, setShowPayment] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const s = STATUS_CONFIG[order?.status] || STATUS_CONFIG.PENDING;
  const itemCount = order?.items?.length || 0;
  const buyerName = order?.contactName
    || (order?.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}`.trim() : null)
    || 'Client';
  const buyerPhone = order?.contactPhone || order?.buyer?.phone;

  // WhatsApp share data
  const whatsAppData = useMemo(() => {
    if (!order || !business) return null;
    const publicUrl = business.slug ? `${origin}/marketplace/${business.slug}` : undefined;
    const items = order.items?.map((i: any) => ({ name: i.name || '', quantity: i.quantity || 1 })) || [];
    return {
      phone: business.whatsapp || order.business?.phone || '',
      businessName: business.name || order.business?.name || '',
      orderNumber: order.orderNumber,
      totalAmount: formatPrice(Number(order.totalAmount || 0)),
      customerName: buyerName,
      items,
      reason: order.refuseReason || order.cancelReason || undefined,
      publicUrl,
    };
  }, [order, business, buyerName]);

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/business/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Commande introuvable</h1>
        </div>
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-300 mx-auto mb-3" />
          <p className="text-gray-500">Cette commande n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Link href="/dashboard/business/orders">
            <Button variant="outline" size="sm" className="mt-4">Retour aux commandes</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/business/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {order.orderNumber || `#${order.id.slice(0, 8)}`}
              </h1>
              <Badge variant={s.variant} size="sm">{s.label}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* WhatsApp share button */}
          {whatsAppData && (
            <WhatsAppShare
              phone={whatsAppData.phone}
              messageType={order.status === 'ACCEPTED' || order.status === 'CONFIRMED' ? 'ORDER_CONFIRMED' : order.status === 'REFUSED' ? 'ORDER_REFUSED' : 'ORDER_CONFIRMED'}
              params={whatsAppData}
              variant="icon"
            />
          )}
          {/* Action button for PENDING orders */}
          {(order.status === 'PENDING') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowActionModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Traiter la commande
            </Button>
          )}
          {order.status === 'ACCEPTED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(`https://wa.me/${buyerPhone?.replace(/[+\s\-()]/g, '')}`, '_blank')}
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Contacter le client
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline card */}
          <Card className="p-5">
            <StatusTimeline
              status={order.status}
              createdAt={order.createdAt}
              paidAt={order.paidAt}
              deliveredAt={order.deliveredAt}
            />
          </Card>

          {/* Items card */}
          <Card className="p-5">
            <button
              onClick={() => setShowItems(!showItems)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-gray-400" />
                Articles ({itemCount})
              </h3>
              {showItems ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {showItems && (
              <div className="mt-4 space-y-3">
                {order.items?.map((item: any, i: number) => (
                  <div key={item.id || i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                        {item.variantName && (
                          <p className="text-[10px] text-gray-400">{item.variantName}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(Number(item.total || item.unitPrice * item.quantity))}
                      </p>
                      <p className="text-[10px] text-gray-400">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
                {/* Totals */}
                <div className="pt-3 space-y-1.5 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Sous-total</span>
                    <span>{formatPrice(Number(order.subtotal || 0))}</span>
                  </div>
                  {Number(order.deliveryFee || 0) > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Livraison</span>
                      <span>{formatPrice(Number(order.deliveryFee))}</span>
                    </div>
                  )}
                  {Number(order.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>Réduction</span>
                      <span>-{formatPrice(Number(order.discountAmount))}</span>
                    </div>
                  )}
                  {Number(order.taxAmount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Taxes</span>
                      <span>{formatPrice(Number(order.taxAmount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-gray-100 pt-1.5 border-t border-gray-100 dark:border-gray-700">
                    <span>Total</span>
                    <span>{formatPrice(Number(order.totalAmount || 0))}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Notes card */}
          {(order.notes || order.internalNotes || order.refuseReason || order.cancelReason) && (
            <Card className="p-5">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Notes
                </h3>
                {showNotes ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showNotes && (
                <div className="mt-4 space-y-3">
                  {order.notes && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Note du client</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">{order.notes}</p>
                    </div>
                  )}
                  {order.internalNotes && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Note interne</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">{order.internalNotes}</p>
                    </div>
                  )}
                  {order.refuseReason && (
                    <div>
                      <p className="text-xs text-red-500 mb-1">Motif de refus</p>
                      <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">{order.refuseReason}</p>
                    </div>
                  )}
                  {order.cancelReason && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Motif d&apos;annulation</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">{order.cancelReason}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right column: Client & Payment info */}
        <div className="space-y-6">
          {/* Client info card */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-gray-400" />
              Client
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{buyerName}</p>
                  {order.buyer?.email && (
                    <p className="text-xs text-gray-500">{order.buyer.email}</p>
                  )}
                </div>
              </div>
              {buyerPhone && (
                <a
                  href={`tel:${buyerPhone}`}
                  className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-brand transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {buyerPhone}
                </a>
              )}
              {order.deliveryAddress && (
                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Payment card */}
          <Card className="p-5">
            <button
              onClick={() => setShowPayment(!showPayment)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-400" />
                Paiement
              </h3>
              {showPayment ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>
            {showPayment && (
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Statut</span>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'} size="xs">
                    {order.paymentStatus === 'PAID' ? 'Payé' : order.paymentStatus === 'PENDING' ? 'En attente' : order.paymentStatus || 'Non défini'}
                  </Badge>
                </div>
                {order.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mode</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{order.paymentMethod}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Montant</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(Number(order.totalAmount || 0))}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Payé le</span>
                    <span>{new Date(order.paidAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Order meta card */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="text-gray-900 dark:text-gray-100">{order.type || 'N/D'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Source</span>
                <span className="text-gray-900 dark:text-gray-100">{order.source || 'N/D'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Statut livraison</span>
                <span className="text-gray-900 dark:text-gray-100">{order.deliveryStatus || 'N/D'}</span>
              </div>
            </div>
          </Card>

          {/* WhatsApp Share Card */}
          {whatsAppData && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                <Share2 className="h-4 w-4 text-gray-400" />
                Partager
              </h3>
              <div className="space-y-2">
                <WhatsAppShare
                  phone={whatsAppData.phone}
                  messageType={order.status === 'ACCEPTED' || order.status === 'CONFIRMED' ? 'ORDER_CONFIRMED' : order.status === 'REFUSED' ? 'ORDER_REFUSED' : 'ORDER_CONFIRMED'}
                  params={whatsAppData}
                  variant="button"
                  fullWidth
                />
                <WhatsAppShare
                  phone={whatsAppData.phone}
                  messageType="BUSINESS_SHARE"
                  params={{ ...whatsAppData, businessName: whatsAppData.businessName, publicUrl: whatsAppData.publicUrl }}
                  variant="button"
                  fullWidth
                />
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Order Action Modal */}
      <OrderActionModal
        open={showActionModal}
        onClose={() => setShowActionModal(false)}
        onSuccess={() => {
          refetch();
          setShowActionModal(false);
        }}
        order={{
          id: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          contactName: buyerName,
          contactPhone: buyerPhone,
          createdAt: order.createdAt,
          items: order.items,
        }}
      />
    </div>
  );
}
