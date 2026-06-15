'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, User, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUpdateBusinessOrderStatus } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

interface OrderActionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  order: {
    id: string;
    orderNumber?: string;
    totalAmount?: number | string;
    contactName?: string;
    contactPhone?: string;
    createdAt?: string;
    items?: Array<{ name?: string; quantity?: number }>;
  };
}

export default function OrderActionModal({ open, onClose, onSuccess, order }: OrderActionModalProps) {
  const [action, setAction] = useState<'accept' | 'refuse' | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBusinessOrderStatus();

  const handleAccept = () => {
    updateStatus(
      { id: order.id, status: 'ACCEPTED' },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
          setAction(null);
        },
      }
    );
  };

  const handleRefuse = () => {
    updateStatus(
      { id: order.id, status: 'REFUSED', reason: refuseReason || undefined },
      {
        onSuccess: () => {
          onSuccess?.();
          onClose();
          setAction(null);
          setRefuseReason('');
        },
      }
    );
  };

  const itemCount = order.items?.length || 0;
  const elapsed = order.createdAt
    ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
    : 0;

  const statusLabel = order.contactName
    ? `${order.contactName}${order.contactPhone ? ` — ${order.contactPhone}` : ''}`
    : 'Client anonyme';

  if (action === 'accept') {
    return (
      <Modal open={open} onClose={onClose} title="Confirmer la prise en charge" size="sm">
        <div className="text-center py-4">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
            Vous allez accepter cette commande
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Le client sera notifié immédiatement que sa commande est prise en charge.
          </p>

          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <ShoppingBag className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {order.orderNumber || `#${order.id.slice(0, 8)}`}
                </p>
                <p className="text-xs text-gray-500">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
              </div>
              <span className="ml-auto text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatPrice(Number(order.totalAmount || 0))}
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100">{statusLabel}</p>
              </div>
            </div>
            {elapsed > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                <p className="text-sm text-gray-500">
                  En attente depuis {elapsed >= 60
                    ? `${Math.floor(elapsed / 60)}h${elapsed % 60 > 0 ? ` ${elapsed % 60}min` : ''}`
                    : `${elapsed} min`}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAction(null)} disabled={isUpdating}>
              Retour
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleAccept}
              isLoading={isUpdating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Accepter
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  if (action === 'refuse') {
    return (
      <Modal open={open} onClose={onClose} title="Refuser la commande" size="sm">
        <div className="py-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <p className="text-center text-gray-500 text-sm mb-6">
            Le client sera notifié que sa commande est refusée.
            Veuillez indiquer un motif pour l&apos;informer.
          </p>

          <div className="space-y-1 mb-6">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Motif du refus <span className="text-red-500">*</span>
            </label>
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              placeholder="Ex: Produit indisponible, horaire non compatible, zone de livraison non desservie..."
              rows={4}
              className="w-full p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none bg-transparent dark:text-gray-100 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setAction(null)} disabled={isUpdating}>
              Retour
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleRefuse}
              isLoading={isUpdating}
              disabled={!refuseReason.trim()}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Refuser
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Default: show action choice
  return (
    <Modal open={open} onClose={onClose} title="Traiter la commande" size="sm">
      <div className="space-y-6">
        {/* Order summary */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-6 w-6 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {order.orderNumber || `#${order.id.slice(0, 8)}`}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <span>{itemCount} article{itemCount > 1 ? 's' : ''}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{formatPrice(Number(order.totalAmount || 0))}</span>
            </div>
          </div>
        </div>

        {/* Client info */}
        <div className="flex items-center gap-3 text-sm">
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{order.contactName || 'Client'}</p>
            {order.contactPhone && (
              <p className="text-xs text-gray-500">{order.contactPhone}</p>
            )}
          </div>
          {elapsed > 15 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 font-medium">
              <AlertTriangle className="h-3 w-3" />
              {elapsed >= 60
                ? `> 1h d'attente`
                : `${elapsed} min d'attente`}
            </span>
          )}
        </div>

        {/* Items preview */}
        {order.items && order.items.length > 0 && (
          <div className="max-h-24 overflow-y-auto space-y-1">
            {order.items.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                <span className="truncate">{item.quantity || 1}× {item.name}</span>
              </div>
            ))}
            {order.items.length > 5 && (
              <p className="text-xs text-gray-400 italic">+{order.items.length - 5} autres articles</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => setAction('accept')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Accepter — Notifier le client
          </Button>

          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => setAction('refuse')}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
          >
            <XCircle className="h-5 w-5 mr-2" />
            Refuser — Motif requis
          </Button>
        </div>
      </div>
    </Modal>
  );
}
