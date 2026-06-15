'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Pencil, Trash2, Copy, Eye, Package, Loader,
  ShoppingCart, Star, Clock, DollarSign, Box, Truck, Tag, BarChart3,
  History, TrendingUp,
  Activity, Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useMyProduct, useDeleteProduct, useToggleProductActive, useDuplicateProduct } from '@/features/hooks';

type DetailTab = 'overview' | 'variants' | 'orders' | 'reviews' | 'stats' | 'history';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data: product, isLoading } = useMyProduct(id);
  const deleteProduct = useDeleteProduct();
  const toggleActive = useToggleProductActive();
  const duplicate = useDuplicateProduct();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Package className="h-16 w-16 text-gray-200" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Produit introuvable</h2>
          <p className="text-sm text-gray-500 mt-1">Ce produit a été supprimé ou n'existe pas</p>
        </div>
        <Link href="/dashboard/products"><Button>Retour aux produits</Button></Link>
      </div>
    );
  }

  const stockStatus = product.stock === 0 ? 'out' : product.stock <= (product.lowStockThreshold || 5) ? 'low' : 'ok';

  const isPopular = (product.soldCount || 0) >= 10;
  const isTopSelling = (product.soldCount || 0) >= 20;
  const isNewProduct = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30;

  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Aperçu' },
    { id: 'variants', label: 'Variantes', count: product.variants?.length || 0 },
    { id: 'orders', label: 'Commandes', count: product.orderCount || 0 },
    { id: 'reviews', label: 'Avis', count: product.reviewCount || 0 },
    { id: 'stats', label: 'Statistiques' },
    { id: 'history', label: 'Historique' },
  ];

  const handleDelete = async () => {
    await deleteProduct.mutateAsync(id);
    router.push('/dashboard/products');
  };

  const handleDuplicate = async () => {
    await duplicate.mutateAsync(id);
    router.push('/dashboard/products');
  };

  const handleToggleActive = async () => {
    await toggleActive.mutateAsync(id);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
              <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full',
                product.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400')}>
                {product.isActive ? 'Actif' : 'Inactif'}
              </span>
              {product.isPromotional && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">PROMO</span>
              )}
              {isTopSelling && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">🏆 Top vente</span>
              )}
              {isPopular && !isTopSelling && (
                <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">🔥 Populaire</span>
              )}
              {isNewProduct && (
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full">🆕 Nouveau</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              SKU: {product.sku || '-'} · Catégorie: {product.category?.name || '-'} · Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link href={`/dashboard/products/${id}/edit`}>
            <Button size="sm" variant="secondary"><Pencil className="h-4 w-4 mr-1.5" />Modifier</Button>
          </Link>
          <Button size="sm" variant="secondary" onClick={handleToggleActive} isLoading={toggleActive.isPending}>
            <Eye className="h-4 w-4 mr-1.5" />{product.isActive ? 'Désactiver' : 'Activer'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDuplicate} isLoading={duplicate.isPending}>
            <Copy className="h-4 w-4 mr-1.5" />Dupliquer
          </Button>
          <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)} isLoading={deleteProduct.isPending}>
            <Trash2 className="h-4 w-4 mr-1.5" />Supprimer
          </Button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Confirmer la suppression</h2>
            <p className="text-sm text-gray-500 mb-6">Êtes-vous sûr de vouloir supprimer <strong>{product.name}</strong> ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
              <Button variant="danger" onClick={handleDelete} isLoading={deleteProduct.isPending}>Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card padding="sm" className="text-center">
          <DollarSign className="h-4 w-4 text-brand mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(product.price || 0).toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">{product.currency || 'FCFA'}</p>
          {product.isPromotional && (
            <p className="text-[10px] text-red-500 font-medium">Promo: {(product.promotionalPrice || 0).toLocaleString()}</p>
          )}
        </Card>
        <Card padding="sm" className="text-center">
          <Box className={cn('h-4 w-4 mx-auto mb-1', stockStatus === 'out' ? 'text-red-500' : stockStatus === 'low' ? 'text-amber-500' : 'text-emerald-500')} />
          <p className={cn('text-lg font-bold', stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-amber-600' : 'text-gray-900 dark:text-gray-100')}>{product.stock}</p>
          <p className="text-[10px] text-gray-500">
            {stockStatus === 'out' ? 'Rupture' : stockStatus === 'low' ? `Stock faible (min: ${product.lowStockThreshold || 5})` : 'En stock'}
          </p>
        </Card>
        <Card padding="sm" className="text-center">
          <ShoppingCart className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{product.orderCount || 0}</p>
          <p className="text-[10px] text-gray-500">Vendus</p>
        </Card>
        <Card padding="sm" className="text-center">
          <Star className="h-4 w-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-amber-500">{product.rating || '-'}</p>
          <p className="text-[10px] text-gray-500">{product.reviewCount || 0} avis</p>
        </Card>
        <Card padding="sm" className="text-center">
          <Tag className="h-4 w-4 text-purple-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{product.category?.name || '-'}</p>
          <p className="text-[10px] text-gray-500">Catégorie</p>
        </Card>
        <Card padding="sm" className="text-center">
          <BarChart3 className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{product.featured ? '⭐' : '-'}</p>
          <p className="text-[10px] text-gray-500">Mis en avant</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300')}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn('ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id ? 'bg-brand/10 text-brand' : 'bg-gray-100 dark:bg-gray-700 text-gray-500')}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
                {product.shortDescription && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 italic">{product.shortDescription}</p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {product.description || 'Aucune description fournie'}
                </p>
              </div>

              {/* Tags */}
              {product.tags?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag: string) => (
                      <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              {product.images?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Images ({product.images.length})</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {product.images.map((img: string, i: number) => (
                      <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
                        🖼️
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {product.brand && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-xs text-gray-500">Marque</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.brand}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <p className="text-xs text-gray-500">SKU</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.sku || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <p className="text-xs text-gray-500">Code-barres</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.barcode || '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <p className="text-xs text-gray-500">Poids</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.weight ? `${product.weight} ${product.weightUnit || 'kg'}` : '-'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.isPhysical ? 'Physique' : 'Numérique'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <p className="text-xs text-gray-500">Devise</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.currency || 'FCFA'}</p>
                </div>
              </div>

              {/* Visibility */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Visibilité</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className={cn('flex items-center gap-1.5', product.isVisibleOnPublicPage !== false ? 'text-emerald-600' : 'text-gray-400')}>
                    <span className={cn('w-2 h-2 rounded-full', product.isVisibleOnPublicPage !== false ? 'bg-emerald-500' : 'bg-gray-300')} />
                    Page publique
                  </span>
                  <span className={cn('flex items-center gap-1.5', product.isVisibleOnMarketplace !== false ? 'text-emerald-600' : 'text-gray-400')}>
                    <span className={cn('w-2 h-2 rounded-full', product.isVisibleOnMarketplace !== false ? 'bg-emerald-500' : 'bg-gray-300')} />
                    Marketplace
                  </span>
                  <span className={cn('flex items-center gap-1.5', product.isActive ? 'text-emerald-600' : 'text-gray-400')}>
                    <span className={cn('w-2 h-2 rounded-full', product.isActive ? 'bg-emerald-500' : 'bg-gray-300')} />
                    Actif
                  </span>
                </div>
              </div>

              {/* SEO */}
              {(product.seoTitle || product.seoDescription) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">SEO</h3>
                  {product.seoTitle && <p className="text-sm text-gray-900 dark:text-gray-100"><span className="text-gray-500">Titre :</span> {product.seoTitle}</p>}
                  {product.seoDescription && <p className="text-sm text-gray-500 mt-1">{product.seoDescription}</p>}
                </div>
              )}
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div>
              {(product.variants || []).length === 0 ? (
                <div className="text-center py-8">
                  <Tag className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucune variante pour ce produit</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-3 text-xs font-semibold text-gray-500 uppercase px-3 mb-2">
                    <div className="col-span-2">Variante</div>
                    <div className="text-right">Prix</div>
                    <div className="text-right">Stock</div>
                    <div className="text-right">SKU</div>
                  </div>
                  {(product.variants || []).map((v: any, i: number) => (
                    <div key={v.id || i} className="grid grid-cols-5 gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl items-center">
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{v.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{(v.price || 0).toLocaleString()} FCFA</p>
                      </div>
                      <div className="text-right">
                        <span className={cn('text-sm font-medium', v.stock === 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100')}>{v.stock}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{v.sku || '-'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="text-center py-8">
              <ShoppingCart className="h-10 w-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-1">{product.orderCount || 0} commande(s) pour ce produit</p>
              <Link href="/dashboard/orders">
                <Button variant="outline" size="sm" className="mt-2">Voir les commandes</Button>
              </Link>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {(product.reviews || []).length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Aucun avis pour ce produit</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(product.reviews || []).map((review: any, i: number) => (
                    <div key={review.id || i} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500">
                            {review.user?.firstName?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {review.user?.firstName} {review.user?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={cn('h-3.5 w-3.5', j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-600">{product.orderCount || 0}</p>
                  <p className="text-xs text-blue-500 mt-1">Commandes</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-amber-600">{product.rating || '-'}</p>
                  <p className="text-xs text-amber-500 mt-1">Note moyenne</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-600">{product.stock}</p>
                  <p className="text-xs text-emerald-500 mt-1">Stock actuel</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl text-center">
                  <p className="text-2xl font-bold text-purple-600">{((product.price || 0) * (product.orderCount || 0)).toLocaleString()}</p>
                  <p className="text-xs text-purple-500 mt-1">Revenu estimé ({product.currency || 'FCFA'})</p>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Produit créé</p>
                    <p className="text-xs text-gray-500">Le {new Date(product.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
                {product.updatedAt && product.updatedAt !== product.createdAt && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dernière modification</p>
                      <p className="text-xs text-gray-500">Le {new Date(product.updatedAt).toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Écart : {Math.round((new Date(product.updatedAt).getTime() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jours</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Performance commerciale</p>
                    <p className="text-xs text-gray-500">{product.orderCount || 0} commande(s) · {product.reviewCount || 0} avis · Note: {product.rating || '-'}/5</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Âge du produit</p>
                    <p className="text-xs text-gray-500">
                      {product.createdAt
                        ? `${Math.round((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24))} jours en catalogue`
                        : 'Date inconnue'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
