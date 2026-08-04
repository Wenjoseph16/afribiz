'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Search,
  Loader,
  Save,
  Tag,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { formatPrice } from '@/utils/helpers';

export default function NewBundlePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [image, setImage] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<
    { itemType: string; itemId: string; name: string; quantity: number; unitPrice: number }[]
  >([]);
  const [created, setCreated] = useState(false);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['my-products', 'bundle-picker'],
    queryFn: async () => {
      const res = await apiClient.getMyProducts({ limit: 200 });
      return res.data.data;
    },
    enabled: !!user,
  });

  const products = useMemo(() => {
    const list = Array.isArray(productsData)
      ? productsData
      : productsData?.items || productsData?.data || [];
    return (list || []).filter((p: any) => p.isActive !== false);
  }, [productsData]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return q ? products.filter((p: any) => (p.name || '').toLowerCase().includes(q)) : products;
  }, [products, search]);

  const addItem = (product: any) => {
    setItems((prev) => {
      if (prev.some((i) => i.itemId === product.id)) return prev;
      return [
        ...prev,
        {
          itemType: 'PRODUCT',
          itemId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: Number(product.price || product.salePrice || 0),
        },
      ];
    });
  };

  const updateItem = (idx: number, patch: Partial<(typeof items)[number]>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const itemsTotal = items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);

  const createBundle = useMutation({
    mutationFn: async () =>
      apiClient.createPromoBundle({
        name,
        description: description || undefined,
        bundlePrice: Number(bundlePrice),
        image: image || undefined,
        items: items.map((i) => ({
          itemType: i.itemType,
          itemId: i.itemId,
          quantity: i.quantity,
        })),
      }),
    onSuccess: () => {
      setCreated(true);
      qc.invalidateQueries({ queryKey: ['promoBundles'] });
      setTimeout(() => router.push('/dashboard/bundles'), 1400);
    },
  });

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
          <Package className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Pack créé !</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Redirection vers vos packs & bundles...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/bundles"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </Link>
        <PageHeader
          title="Nouveau pack"
          description="Groupez plusieurs articles pour augmenter le panier moyen"
          breadcrumbs={[
            { label: 'Packs & Bundles', href: '/dashboard/bundles' },
            { label: 'Nouveau' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Tag className="h-4 w-4 text-brand" /> Informations du pack
            </h3>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom du pack *</label>
              <Input
                placeholder="Ex: Pack Rentrée scolaire, Menu duo..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Décrivez l'offre groupée..."
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Prix du pack (FCFA) *
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Ex: 15000"
                  value={bundlePrice}
                  onChange={(e) => setBundlePrice(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Image (URL)</label>
                <Input
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Articles du pack
              </h3>
              <span className="text-xs text-gray-500">{items.length} article(s)</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
              />
            </div>
            {productsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">Aucun produit trouvé.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredProducts.map((p: any) => {
                  const alreadyIn = items.some((i) => i.itemId === p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-brand/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatPrice(Number(p.price || 0))}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyIn ? 'primary' : 'outline'}
                        disabled={alreadyIn}
                        onClick={() => addItem(p)}
                      >
                        {alreadyIn ? 'Ajouté' : 'Ajouter'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} / unité</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-16 text-center text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-1 bg-transparent dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Récapitulatif
            </h3>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between text-gray-500">
                <span>Valeur articles</span>
                <span>{formatPrice(itemsTotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Prix du pack</span>
                <span className="font-semibold text-brand">
                  {bundlePrice ? formatPrice(Number(bundlePrice)) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium pt-1 border-t border-gray-100 dark:border-gray-800">
                <span>Économie client</span>
                <span>
                  {bundlePrice && itemsTotal > 0
                    ? formatPrice(Math.max(0, itemsTotal - Number(bundlePrice)))
                    : '—'}
                </span>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={
                !name.trim() || !bundlePrice || items.length === 0 || createBundle.isPending
              }
              onClick={() => createBundle.mutate()}
            >
              {createBundle.isPending ? (
                <Loader className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Créer le pack
            </Button>
            {createBundle.isError && (
              <p className="text-xs text-red-500 text-center">
                Erreur : {(createBundle.error as any)?.message}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
