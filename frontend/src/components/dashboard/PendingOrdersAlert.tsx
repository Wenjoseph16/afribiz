'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { AlertTriangle, Bell, Clock, Package } from 'lucide-react';
import Link from 'next/link';

interface PendingOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  buyer: { name: string; phone?: string };
  total: number;
  currency: string;
}

interface OrdersResponse {
  orders: PendingOrder[];
  pagination?: { total: number };
}

export default function PendingOrdersAlert() {
  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['pending-orders-alert'],
    queryFn: async () => {
      const res = await apiClient.get('/business/orders?status=PENDING&limit=5');
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  const orders = data?.orders || [];
  const count = orders.length;

  if (isLoading || count === 0) return null;

  const isUrgent = count >= 5;

  return (
    <Link
      href="/dashboard/orders"
      className={`block rounded-xl border p-4 transition-all duration-300 hover:shadow-lg ${
        isUrgent
          ? 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:hover:bg-red-950/60'
          : 'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-950/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 rounded-lg p-2 ${
          isUrgent
            ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
        }`}>
          {isUrgent ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {count} commande{count > 1 ? 's' : ''} en attente
            </h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isUrgent
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
            }`}>
              <Clock className="h-3 w-3" />
              {isUrgent ? 'Urgent' : 'En attente'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {isUrgent
              ? 'Vous avez des commandes en attente depuis plus de 15 min. Veuillez les traiter rapidement.'
              : 'Des clients attendent votre confirmation. Répondez rapidement pour les rassurer.'}
          </p>
          <div className="mt-3">
            <div className="flex -space-x-2">
              {orders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  title={`#${order.orderNumber} - ${order.buyer?.name || 'Client'}`}
                >
                  {order.buyer?.name?.charAt(0) || 'C'}
                </div>
              ))}
              {count > 4 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-400">
                  +{count - 4}
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <Package className="h-3 w-3" />
            <span>Cliquez pour voir et traiter les commandes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
