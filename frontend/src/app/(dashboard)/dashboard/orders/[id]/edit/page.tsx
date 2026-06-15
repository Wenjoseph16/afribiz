'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useOrder, useUpdateOrder } from '@/features/hooks';

const STATUS_OPTIONS = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export default function OrderEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: orderData, isLoading: loadingOrder } = useOrder(id);
  const updateOrderMutation = useUpdateOrder();

  const order = orderData?.order || orderData?.data || orderData;

  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');

  useEffect(() => {
    if (order) {
      setClientName(order.clientName || '');
      setStatus(order.status || 'PENDING');
      setTotalAmount(order.totalAmount != null ? String(order.totalAmount) : '');
      setPaidAmount(order.paidAmount != null ? String(order.paidAmount) : '');
      setCurrency(order.currency || 'EUR');
      setDeliveryAddress(order.deliveryAddress || '');
      setDeliveryStatus(order.deliveryStatus || '');
    }
  }, [order]);

  if (loadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Commande introuvable
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderMutation.mutate(
      {
        id,
        data: {
          clientName,
          status,
          totalAmount: totalAmount ? Number(totalAmount) : undefined,
          paidAmount: paidAmount ? Number(paidAmount) : undefined,
          currency,
          deliveryAddress,
          deliveryStatus,
        },
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/orders/${id}`);
        },
      }
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Modifier la commande"
        description={`#${order.orderNumber || id.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Commandes', href: '/dashboard/orders' },
          { label: `#${order.orderNumber || id.slice(0, 8)}`, href: `/dashboard/orders/${id}` },
          { label: 'Modifier' },
        ]}
        actions={
          <Link
            href={`/dashboard/orders/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du client
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Numéro de commande
              </label>
              <input
                type="text"
                value={order.orderNumber || `#${id.slice(0, 8)}`}
                readOnly
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Montant
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total
              </label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Montant payé
              </label>
              <input
                type="number"
                step="0.01"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Devise
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="EUR"
              />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Livraison
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Adresse de livraison
              </label>
              <textarea
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
                placeholder="Adresse de livraison"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut de livraison
              </label>
              <input
                type="text"
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/40"
                placeholder="Statut de livraison"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" isLoading={updateOrderMutation.isPending}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
          <Link
            href={`/dashboard/orders/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
