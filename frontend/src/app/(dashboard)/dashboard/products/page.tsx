'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Package, Plus, Search, Grid3X3, List,
  Eye, Pencil, Trash2, Copy, Upload, BarChart3, Tag,
  ArrowUpDown, Loader, AlertTriangle, Download,
  CheckSquare, Square, TrendingUp,
  Zap, Lightbulb,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useMyProducts, useProductStats, useDeleteProduct, useToggleProductActive } from '@/features/hooks';

type TabType = 'all' | 'active' | 'inactive' | 'low-stock' | 'out-of-stock' | 'promotional';

interface ProductItem {
  id: string;
  name: string;
  image?: string;
  category?: string;
  categoryId?: string;
  price: number;
  stock: number;
  lowStockThreshold?: number;
  isActive: boolean;
  isPromotional: boolean;
  soldCount: number;
  rating: number;
  createdAt: string;
  sku?: string;
  barcode?: string;
  unit?: string;
}

export default function ProductsPage() {
  const { data: productsData, isLoading, refetch } = useMyProducts();
  const { data: statsData } = useProductStats();
  const deleteProduct = useDeleteProduct();
  const toggleActive = useToggleProductActive();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const allProducts: ProductItem[] = Array.isArray(productsData)
    ? productsData
    : (productsData?.products || productsData?.data || []);

  const stats = statsData || {
    totalProducts: allProducts.length,
    activeProducts: allProducts.filter(p => p.isActive).length,
    inactiveProducts: allProducts.filter(p => !p.isActive).length,
    totalSold: allProducts.reduce((a, p) => a + (p.soldCount || 0), 0),
    categoryCount: [...new Set(allProducts.map(p => p.category).filter(Boolean))].length,
  };

  const isPopular = (p: ProductItem) => (p.soldCount || 0) >= 10;
  const isTopSelling = (p: ProductItem) => (p.soldCount || 0) >= 20;
  const isNew = (p: ProductItem) => {
    if (!p.createdAt) return false;
    const daysSinceCreation = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 30;
  };

  const TABS = [
    { id: 'all' as TabType, label: 'Tous', count: allProducts.length },
    { id: 'active' as TabType, label: 'Actifs', count: allProducts.filter(p => p.isActive).length },
    { id: 'inactive' as TabType, label: 'Inactifs', count: allProducts.filter(p => !p.isActive).length },
    { id: 'low-stock' as TabType, label: 'Stock faible', count: allProducts.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)).length },
    { id: 'out-of-stock' as TabType, label: 'Rupture', count: allProducts.filter(p => p.stock === 0).length },
    { id: 'promotional' as TabType, label: 'Promotions', count: allProducts.filter(p => p.isPromotional).length },
  ];

  // Suggestions intelligentes
  const suggestions = useMemo(() => {
    const items: { type: 'low_stock' | 'no_sales' | 'popular' | 'promo' | 'new'; title: string; description: string; icon: any; products: ProductItem[] }[] = [];
    
    const lowStockItems = allProducts.filter(p => p.isActive && p.stock > 0 && p.stock <= (p.lowStockThreshold || 5));
    if (lowStockItems.length > 0) {
      items.push({
        type: 'low_stock',
        title: 'Réapprovisionnement recommandé',
        description: `${lowStockItems.length} produit(s) ont un stock faible. Pensez à réapprovisionner.`,
        icon: AlertTriangle,
        products: lowStockItems.slice(0, 3),
      });
    }

    const noSalesItems = allProducts.filter(p => p.isActive && (p.soldCount || 0) === 0);
    if (noSalesItems.length > 0) {
      items.push({
        type: 'no_sales',
        title: 'Produits sans vente',
        description: `${noSalesItems.length} produit(s) n'ont jamais été vendus. Essayez une promotion.`,
        icon: Lightbulb,
        products: noSalesItems.slice(0, 3),
      });
    }

    const popularItems = allProducts.filter(p => p.isActive && isPopular(p));
    if (popularItems.length > 0) {
      items.push({
        type: 'popular',
        title: 'Produits populaires',
        description: `${popularItems.length} produit(s) très vendus. Mettez-les en avant !`,
        icon: TrendingUp,
        products: popularItems.slice(0, 3),
      });
    }

    const promoItems = allProducts.filter(p => p.isActive && p.isPromotional);
    if (promoItems.length > 0) {
      items.push({
        type: 'promo',
        title: 'Promotions actives',
        description: `${promoItems.length} produit(s) en promotion. Surveillez leurs performances.`,
        icon: Zap,
        products: promoItems.slice(0, 3),
      });
    }

    return items;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];
    switch (activeTab) {
      case 'active': filtered = filtered.filter(p => p.isActive); break;
      case 'inactive': filtered = filtered.filter(p => !p.isActive); break;
      case 'low-stock': filtered = filtered.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)); break;
      case 'out-of-stock': filtered = filtered.filter(p => p.stock === 0); break;
      case 'promotional': filtered = filtered.filter(p => p.isPromotional); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'price') return (a.price - b.price) * dir;
      if (sortBy === 'stock') return (a.stock - b.stock) * dir;
      if (sortBy === 'sold') return (a.soldCount - b.soldCount) * dir;
      return a.name.localeCompare(b.name) * dir;
    });
    return filtered;
  }, [allProducts, activeTab, searchQuery, sortBy, sortOrder]);

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBatchDelete = async () => {
    for (const id of selectedProducts) {
      await deleteProduct.mutateAsync(id);
    }
    setSelectedProducts([]);
    refetch();
  };

  const handleBatchExport = () => {
    const selected = allProducts.filter(p => selectedProducts.includes(p.id));
    const header = 'name,price,stock,sku,category';
    const rows = selected.map(p =>
      `"${p.name}",${p.price},${p.stock},"${p.sku || ''}","${p.category || ''}"`
    );
    const csv = header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produits-selectionnes.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Produits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez votre catalogue de produits</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/products/stock-alerts">
            <Button variant="outline" size="sm">
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Alertes
            </Button>
          </Link>
          <Link href="/dashboard/products/categories">
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-1.5" />
              Catégories
            </Button>
          </Link>
          <Link href="/dashboard/products/import">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1.5" />
              Import/Export
            </Button>
          </Link>
          <Link href="/dashboard/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Ajouter
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Package className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Total" value={stats.totalProducts} />
        <StatsCard icon={<BarChart3 className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" label="Actifs" value={stats.activeProducts} />
        <StatsCard icon={<Tag className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Catégories" value={stats.categoryCount} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Vendus" value={stats.totalSold} />
      </div>

      {/* Suggestions intelligentes */}
      {suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.map((s) => {
            const Icon = s.icon;
            const colorMap = {
              low_stock: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10',
              no_sales: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',
              popular: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10',
              promo: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10',
              new: 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/10',
            };
            const iconColorMap = {
              low_stock: 'text-amber-600',
              no_sales: 'text-blue-600',
              popular: 'text-emerald-600',
              promo: 'text-purple-600',
              new: 'text-indigo-600',
            };
            return (
              <div key={s.type} className={`rounded-2xl border p-4 ${colorMap[s.type]}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 ${iconColorMap[s.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.description}</p>
                    {s.products.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {s.products.map(p => (
                          <Link key={p.id} href={`/dashboard/products/${p.id}`}
                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                            {s.type === 'low_stock' && (
                              <span className="text-amber-600 font-semibold shrink-0 ml-2">{p.stock} en stock</span>
                            )}
                            {s.type === 'no_sales' && (
                              <span className="text-blue-600 shrink-0 ml-2">0 vente</span>
                            )}
                            {s.type === 'popular' && (
                              <span className="text-emerald-600 shrink-0 ml-2">{p.soldCount} vendus</span>
                            )}
                            {s.type === 'promo' && (
                              <span className="text-purple-600 shrink-0 ml-2">{(p.price ?? 0).toLocaleString()} FCFA</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedProducts([]); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit (nom, SKU, catégorie)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
            >
              <option value="name">Nom</option>
              <option value="price">Prix</option>
              <option value="stock">Stock</option>
              <option value="sold">Popularité</option>
            </select>
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowUpDown className={cn('h-4 w-4 text-gray-500', sortOrder === 'desc' && 'rotate-180')} />
            </button>
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-brand text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Batch Actions */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-3 px-3 py-2 bg-brand/5 rounded-xl border border-brand/10">
            <span className="text-sm font-medium text-brand">{selectedProducts.length} sélectionné(s)</span>
            <div className="h-4 w-px bg-gray-200" />
            <Button variant="ghost" size="xs" onClick={handleBatchExport}>
              <Download className="h-3.5 w-3.5 mr-1" />Exporter
            </Button>
            <Button variant="ghost" size="xs" onClick={() => setSelectedProducts([])}>
              <Square className="h-3.5 w-3.5 mr-1" />Désélectionner
            </Button>
          </div>
        )}
      </div>

      {/* Products */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun produit trouvé</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier produit'}
          </p>
          <Link href="/dashboard/products/new">
            <Button><Plus className="h-4 w-4 mr-1.5" />Ajouter un produit</Button>
          </Link>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-gray-400 hover:text-brand transition-colors">
                    {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
                      ? <CheckSquare className="h-4 w-4 text-brand" />
                      : <Square className="h-4 w-4" />
                    }
                  </button>
                </th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendus</th>
                <th className="p-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts.includes(product.id)}
                  onToggleSelect={() => toggleSelect(product.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getBadges(product: ProductItem) {
  const badges: { label: string; className: string }[] = [];
  if (product.isPromotional) badges.push({ label: 'PROMO', className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' });
  if ((product.soldCount || 0) >= 20) badges.push({ label: '🏆 Top vente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' });
  else if ((product.soldCount || 0) >= 10) badges.push({ label: '🔥 Populaire', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' });
  if (product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 30) {
    badges.push({ label: '🆕 Nouveau', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' });
  }
  return badges;
}

function ProductCard({ product }: { product: ProductItem }) {
  const stockStatus = product.stock === 0 ? 'out' : product.stock <= (product.lowStockThreshold || 5) ? 'low' : 'ok';
  const badges = getBadges(product);
  return (
    <Link
      href={`/dashboard/products/${product.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 dark:hover:border-brand/40 hover:shadow-sm transition-all duration-200"
    >
      <div className="aspect-square bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center relative">
        <Package className="h-12 w-12 text-gray-200 dark:text-gray-600" />
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.slice(0, 2).map((b, i) => (
              <span key={i} className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${b.className}`}>{b.label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">{product.name}</h3>
        </div>
        {product.category && <p className="text-xs text-gray-500 dark:text-gray-400">{product.category}</p>}
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{(product.price ?? 0).toLocaleString()} FCFA</p>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', {
            'text-red-600 bg-red-50 dark:bg-red-900/20': stockStatus === 'out',
            'text-amber-600 bg-amber-50 dark:bg-amber-900/20': stockStatus === 'low',
            'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20': stockStatus === 'ok',
          })}>
            {stockStatus === 'out' ? 'Rupture' : stockStatus === 'low' ? `${product.stock} en stock` : 'En stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductRow({ product, isSelected, onToggleSelect }: { product: ProductItem; isSelected: boolean; onToggleSelect: () => void }) {
  const stockStatus = product.stock === 0 ? 'out' : product.stock <= (product.lowStockThreshold || 5) ? 'low' : 'ok';
  const badges = getBadges(product);
  return (
    <tr className={cn('hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group', isSelected && 'bg-brand/5')}>
      <td className="p-4">
        <button onClick={onToggleSelect} className="text-gray-400 hover:text-brand transition-colors">
          {isSelected ? <CheckSquare className="h-4 w-4 text-brand" /> : <Square className="h-4 w-4" />}
        </button>
      </td>
      <td className="p-4">
        <Link href={`/dashboard/products/${product.id}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
            <p className="text-xs text-gray-500">{(product.rating ?? 0).toFixed(1)} ★ · {product.soldCount ?? 0} vendus</p>
            {badges.length > 0 && (
              <div className="flex gap-1 mt-0.5">
                {badges.map((b, i) => (
                  <span key={i} className={`text-[10px] font-bold px-1 py-0.5 rounded ${b.className}`}>{b.label}</span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-500">{product.sku || '-'}</span>
      </td>
      <td className="p-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">{product.category || '-'}</span>
      </td>
      <td className="p-4 text-right">
        <div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{(product.price ?? 0).toLocaleString()} FCFA</span>
          {product.isPromotional && <span className="ml-1 text-xs text-red-500">Promo</span>}
        </div>
      </td>
      <td className="p-4 text-right">
        <span className={cn('text-sm font-medium', {
          'text-red-600': stockStatus === 'out',
          'text-amber-600': stockStatus === 'low',
          'text-gray-900 dark:text-gray-100': stockStatus === 'ok',
        })}>{product.stock}</span>
      </td>
      <td className="p-4 text-right">
        <span className="text-sm text-gray-600 dark:text-gray-300">{product.soldCount}</span>
      </td>
      <td className="p-4 text-right">
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', {
          'text-emerald-600': product.isActive,
          'text-gray-400': !product.isActive,
        })}>
          <span className={cn('w-2 h-2 rounded-full', product.isActive ? 'bg-emerald-500' : 'bg-gray-300')} />
          {product.isActive ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/products/${product.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/dashboard/products/${product.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
