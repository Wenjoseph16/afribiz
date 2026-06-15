'use client';

import { useState } from 'react';
import { Package, Plus, Search, Loader, DollarSign, Tag, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePromoBundles, useMyProducts } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

export default function BundlesPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', items: [] as { productId: string; name: string; quantity: number }[] });
  const { data: bundlesData, isLoading, refetch } = usePromoBundles({ limit: 100 });
  const { data: productsData } = useMyProducts({ limit: 200 });
  const allBundles: any[] = Array.isArray(bundlesData) ? bundlesData : (bundlesData?.bundles || bundlesData?.data || []);
  const products: any[] = Array.isArray(productsData) ? productsData : (productsData?.items || productsData?.data || []);

  const filtered = allBundles.filter((b: any) => {
    if (search) { const q = search.toLowerCase(); return (b.name || '').toLowerCase().includes(q); }
    return true;
  });

  const addItem = (productId: string) => {
    const p = products.find((x: any) => x.id === productId);
    if (!p || form.items.find(i => i.productId === productId)) return;
    setForm(f => ({ ...f, items: [...f.items, { productId, name: p.name, quantity: 1 }] }));
  };

  const removeItem = (productId: string) => setForm(f => ({ ...f, items: f.items.filter(i => i.productId !== productId) }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createPromoBundle({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        items: form.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      });
      setShowCreate(false);
      setForm({ name: '', description: '', price: '', items: [] });
      refetch();
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  const bundleTotal = form.items.reduce((sum, item) => {
    const p = products.find((x: any) => x.id === item.productId);
    return sum + (p ? Number(p.price || 0) * item.quantity : 0);
  }, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bundles & Packs</h1><p className="text-sm text-gray-500">Créez des offres groupées de produits</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />Nouveau bundle</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><Package className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total bundles</p><p className="text-sm font-bold">{allBundles.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><Tag className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Actifs</p><p className="text-sm font-bold">{allBundles.filter((b: any) => b.isActive !== false).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><DollarSign className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Prix moyen</p><p className="text-sm font-bold">{allBundles.length > 0 ? formatPrice(allBundles.reduce((s: number, b: any) => s + Number(b.price || 0), 0) / allBundles.length) : '—'}</p></div></div></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Rechercher un bundle..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><Package className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun bundle trouvé</p></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((bundle: any) => {
            const items = bundle.items || bundle.bundleItems || [];
            const totalOriginal = items.reduce((s: number, i: any) => s + Number(i.product?.price || i.unitPrice || 0) * (i.quantity || 1), 0);
            const savings = totalOriginal - Number(bundle.price || 0);
            return (
              <Card key={bundle.id} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-brand/10"><Package className="w-5 h-5 text-brand" /></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{bundle.name}</h3>
                    {bundle.description && <p className="text-[10px] text-gray-500 mt-0.5">{bundle.description}</p>}
                  </div>
                </div>
                {items.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {items.slice(0, 4).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{item.product?.name || item.name || 'Produit'}</span>
                        <span className="text-gray-500">x{item.quantity || 1}</span>
                      </div>
                    ))}
                    {items.length > 4 && <p className="text-[10px] text-gray-400">+{items.length - 4} autres</p>}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(bundle.price || 0))}</p>
                    {savings > 0 && <p className="text-[10px] text-emerald-600">Économisez {formatPrice(savings)}</p>}
                  </div>
                  <Badge variant={bundle.isActive !== false ? 'success' : 'warning'} size="xs">{bundle.isActive !== false ? 'Actif' : 'Inactif'}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Nouveau bundle</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix du pack *</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" />
              </div>

              {/* Items selector */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produits inclus</label>
                <select onChange={e => { if (e.target.value) { addItem(e.target.value); e.target.value = ''; } }}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 mb-2">
                  <option value="">Ajouter un produit...</option>
                  {products.filter((p: any) => !form.items.find(i => i.productId === p.id)).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} — {formatPrice(Number(p.price || 0))}</option>
                  ))}
                </select>
                {form.items.length > 0 && (
                  <div className="space-y-1">
                    {form.items.map((item, i) => (
                      <div key={item.productId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-700 dark:text-gray-300">{item.name}</span>
                          <input type="number" value={item.quantity} onChange={e => {
                            const newItems = [...form.items];
                            newItems[i] = { ...newItems[i], quantity: Math.max(1, parseInt(e.target.value) || 1) };
                            setForm(f => ({ ...f, items: newItems }));
                          }} className="w-14 p-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-transparent text-center" />
                        </div>
                        <button type="button" onClick={() => removeItem(item.productId)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {form.items.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-xs">
                  <p className="text-amber-700 dark:text-amber-400">Prix total des produits: <strong>{formatPrice(bundleTotal)}</strong></p>
                  {Number(form.price) < bundleTotal && <p className="text-emerald-600 mt-1">Économie client: {formatPrice(bundleTotal - Number(form.price))}</p>}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button type="submit" disabled={!form.name || !form.price || form.items.length === 0}
                  className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">Créer le bundle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
