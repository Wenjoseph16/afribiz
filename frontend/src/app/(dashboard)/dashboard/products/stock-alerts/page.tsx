'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, AlertTriangle, Package, Loader, Eye, RefreshCw,
  CheckCircle2, Bell, Truck, Box,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useStockAlerts } from '@/features/hooks';

export default function StockAlertsPage() {
  const { data: alertsData, isLoading, refetch } = useStockAlerts();
  const [activeTab, setActiveTab] = useState<'low' | 'out'>('low');

  const alerts = alertsData || { lowStock: [], outOfStock: [], totalAlerts: 0 };
  const lowStockItems = alerts.lowStock || [];
  const outOfStockItems = alerts.outOfStock || [];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Alertes Stock</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Surveillez vos niveaux de stock</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="sm" className="text-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{alerts.totalAlerts || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Alertes totales</p>
        </Card>
        <Card padding="sm" className="text-center">
          <Box className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-600">{lowStockItems.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Stock faible</p>
        </Card>
        <Card padding="sm" className="text-center">
          <Package className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{outOfStockItems.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">En rupture</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 flex">
        <button onClick={() => setActiveTab('low')}
          className={cn('flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2',
            activeTab === 'low' ? 'bg-amber-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>
          <AlertTriangle className="h-4 w-4" />
          Stock faible ({lowStockItems.length})
        </button>
        <button onClick={() => setActiveTab('out')}
          className={cn('flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2',
            activeTab === 'out' ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>
          <Package className="h-4 w-4" />
          Rupture ({outOfStockItems.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {activeTab === 'low' && (
          lowStockItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tout va bien</h3>
              <p className="text-sm text-gray-500">Aucun produit en stock faible</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {lowStockItems.map((product: any) => (
                <AlertRow key={product.id} product={product} type="low" />
              ))}
            </div>
          )
        )}
        {activeTab === 'out' && (
          outOfStockItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tout est en stock</h3>
              <p className="text-sm text-gray-500">Aucun produit en rupture</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {outOfStockItems.map((product: any) => (
                <AlertRow key={product.id} product={product} type="out" />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function AlertRow({ product, type }: { product: any; type: 'low' | 'out' }) {
  return (
    <div className="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          type === 'low' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>
          {type === 'low' ? <AlertTriangle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
          <p className="text-xs text-gray-500">
            SKU: {product.sku || '-'} · Stock: <span className={cn('font-medium', type === 'low' ? 'text-amber-600' : 'text-red-600')}>{product.stock}</span>
            {type === 'low' && ` · Seuil: ${product.lowStockThreshold || 5}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
          type === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
          {type === 'low' ? 'Stock faible' : 'Rupture'}
        </span>
        <Link href={`/dashboard/products/${product.id}`}>
          <Button variant="ghost" size="xs"><Eye className="h-3.5 w-3.5" /></Button>
        </Link>
      </div>
    </div>
  );
}
