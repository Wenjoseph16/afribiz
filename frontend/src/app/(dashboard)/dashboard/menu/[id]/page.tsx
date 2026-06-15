'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Edit2, Utensils, Clock, DollarSign, Star, TrendingUp, AlertTriangle, BadgePercent, ChefHat, Eye, ShoppingBag, Package, Loader, History, Activity, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useMyMenuItem } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

export default function MenuItemDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: item, isLoading } = useMyMenuItem(id);
  const statusLabels: Record<string, string> = {
    AVAILABLE: 'Disponible', OUT_OF_STOCK: 'Rupture', PROMO: 'Promo', DISABLED: 'Désactivé',
  };

  const isNewMenuItem = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24) < 30 : false;
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  if (!item) {
    return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-500">Plat non trouvé</p></div>;
  }

  const statusStyle = item.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
    item.status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
    item.status === 'PROMO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusStyle)}>{statusLabels[item.status] || item.status}</span>
            {item.isPromotional && <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 rounded-full">PROMO</span>}
            {item.isPopular && <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">🔥 Populaire</span>}
            {item.isStar && <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">⭐ Plat star</span>}
            {isNewMenuItem && <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">🆕 Nouveau</span>}
            {item.featured && <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">À la une</span>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.shortDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/menu/${item.id}/edit`}>
            <Button variant="secondary" size="sm"><Edit2 className="w-4 h-4 mr-1.5" />Modifier</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-brand/10"><DollarSign className="w-4 h-4 text-brand" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Prix</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(item.price)}{item.isPromotional && <span className="text-sm text-rose-500 ml-1">-{item.discountPercent}%</span>}</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Clock className="w-4 h-4 text-blue-600" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Préparation</p><p className="text-lg font-bold text-gray-900 dark:text-white">{item.prepTime} min</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Star className="w-4 h-4 text-amber-600" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Note</p><p className="text-lg font-bold text-gray-900 dark:text-white">{item.rating} <span className="text-sm font-normal text-gray-400">({item.reviewCount})</span></p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><ShoppingBag className="w-4 h-4 text-purple-600" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Vendus</p><p className="text-lg font-bold text-gray-900 dark:text-white">{item.soldCount}</p></div></div></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'overview', label: 'Aperçu' }, { key: 'variants', label: 'Variantes' }, { key: 'nutrition', label: 'Infos nutrition' }, { key: 'stats', label: 'Statistiques' }, { key: 'history', label: 'Historique' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              <Card className="p-6"><h3 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h3><p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p></Card>
              <Card className="p-6"><h3 className="font-semibold text-gray-900 dark:text-white mb-3">Informations</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Type</span><p className="font-medium text-gray-900 dark:text-white">{item.type}</p></div>
                  <div><span className="text-gray-500">Catégorie</span><p className="font-medium text-gray-900 dark:text-white">{item.category?.name || '—'}</p></div>
                  <div><span className="text-gray-500">Temps total</span><p className="font-medium text-gray-900 dark:text-white">{item.prepTime + item.cookTime} min</p></div>
                  <div><span className="text-gray-500">Allergènes</span><p className="font-medium text-gray-900 dark:text-white">{(item.allergens?.length > 0 ? item.allergens.join(', ') : 'Aucun')}</p></div>
                </div>
              </Card>
              {item.isPromotional && (
                <Card className="p-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-3"><BadgePercent className="w-4 h-4" />Promotion active</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-amber-600 dark:text-amber-400">Prix promo</span><p className="font-bold text-amber-800 dark:text-amber-200">{formatPrice(item.promotionalPrice!)}</p></div>
                    <div><span className="text-amber-600 dark:text-amber-400">Réduction</span><p className="font-bold text-amber-800 dark:text-amber-200">-{item.discountPercent}%</p></div>
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'variants' && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Variantes</h3>
              {(item.variants?.length > 0) ? (
                <div className="space-y-3">
                  {item.variants.map((v: any) => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div><p className="font-medium text-sm text-gray-900 dark:text-white">{v.name}</p><p className="text-xs text-gray-400">{v.type}</p></div>
                      <div className="flex items-center gap-3"><span className="font-semibold text-brand">{formatPrice(v.price)}</span><span className={cn('text-xs px-1.5 py-0.5 rounded', v.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>{v.isAvailable ? 'Dispo' : 'Indispo'}</span></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 italic">Aucune variante</p>}
            </Card>
          )}

          {activeTab === 'nutrition' && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Valeurs nutritionnelles</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[{ label: 'Calories', value: `${item.calories || '—'} kcal` }, { label: 'Protéines', value: `${item.proteins || '—'}g` }, { label: 'Glucides', value: `${item.carbs || '—'}g` }, { label: 'Lipides', value: `${item.fats || '—'}g` }].map((n) => (
                  <div key={n.label} className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"><p className="text-2xl font-bold text-gray-900 dark:text-white">{n.value}</p><p className="text-xs text-gray-500 mt-1">{n.label}</p></div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'stats' && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h3>
              <div className="space-y-3">
                {[{ label: 'Total vendus', value: item.soldCount }, { label: 'Note moyenne', value: `${item.rating}/5` }, { label: 'Avis', value: item.reviewCount }].map((s) => (
                  <div key={s.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span><span className="font-semibold text-gray-900 dark:text-white">{s.value}</span></div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'history' && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Historique</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Date de création</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <Activity className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.soldCount || 0}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total vendus</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <Star className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.rating || '-'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Note moyenne</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <Clock className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(item.prepTime || 0) + (item.cookTime || 0)} min</p>
                  <p className="text-xs text-gray-500 mt-0.5">Temps total</p>
                </div>
              </div>
              {item.createdAt && (
                <div className="p-4 bg-brand/5 rounded-xl border border-brand/10">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Âge du plat</h4>
                  <p className="text-sm text-gray-600">Publié depuis {Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jours</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6"><h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Visibilité</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {[{ label: 'Populaire', active: item.isPopular }, { label: 'Plat star', active: item.isStar }, { label: 'À la une', active: item.featured }].map((f) => (
                <div key={f.label} className="flex items-center justify-between"><span>{f.label}</span>{f.active ? <span className="text-emerald-600 font-medium">✓</span> : <span className="text-gray-300">—</span>}</div>
              ))}
            </div>
          </Card>
          <Card className="p-6"><h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">{(item.tags || []).map((t: string) => <span key={t} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">{t}</span>)}</div>
          </Card>
          <Card className="p-6"><h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Créé le</h3><p className="text-sm text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '—'}</p></Card>
        </div>
      </div>
    </div>
  );
}
