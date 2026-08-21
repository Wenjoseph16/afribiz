'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Users, BadgePercent, ArrowRight, Package, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

const ITEM_TYPES = [
  { value: 'PRODUCT', label: 'Produit', icon: '📦' },
  { value: 'SERVICE', label: 'Service', icon: '💇🏾' },
  { value: 'MENU_ITEM', label: 'Plat / Menu', icon: '🍲' },
  { value: 'ROOM', label: 'Chambre', icon: '🛏️' },
  { value: 'RENTAL', label: 'Location', icon: '🚗' },
  { value: 'EVENT', label: 'Événement', icon: '🎉' },
  { value: 'TRAINING', label: 'Formation', icon: '🎓' },
] as const;

type ItemType = (typeof ITEM_TYPES)[number]['value'] | '';

async function loadItems(type: string): Promise<any[]> {
  let res: any;
  switch (type) {
    case 'PRODUCT':
      res = await apiClient.getMyProducts({ limit: 500 });
      break;
    case 'SERVICE':
      res = await apiClient.getMyServices({ limit: 500 });
      break;
    case 'MENU_ITEM':
      res = await apiClient.getMyMenuItems({ limit: 500 });
      break;
    case 'ROOM':
      res = await apiClient.getMyRooms({ limit: 500 });
      break;
    case 'RENTAL':
      res = await apiClient.getMyRentals({ limit: 500 });
      break;
    case 'EVENT':
      res = await apiClient.getMyEvents({ limit: 500 });
      break;
    case 'TRAINING':
      res = await apiClient.getMyTrainings();
      break;
    default:
      return [];
  }
  const list = res?.data?.data ?? res?.data ?? [];
  return Array.isArray(list) ? list : (list?.items ?? list?.results ?? []);
}

function itemPrice(item: any): number {
  return Number(item?.price ?? item?.unitPrice ?? item?.basePrice ?? 0) || 0;
}

function itemName(item: any): string {
  return item?.name ?? item?.title ?? 'Article';
}

export default function NewGroupBuyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    groupPrice: '',
    minParticipants: '5',
    maxParticipants: '50',
    discountPercent: '10',
    endAt: '',
    whatsappGroup: '',
  });

  // Article lié (optionnel — l'achat groupé peut être autonome)
  const [itemType, setItemType] = useState<ItemType>('');
  const [itemId, setItemId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const price = Number(form.price) || 0;
  const groupPrice = Number(form.groupPrice) || 0;
  const savings = price > groupPrice ? price - groupPrice : 0;
  const pct = price > 0 ? Math.round((savings / price) * 100) : 0;
  const valid = form.title && price > 0 && groupPrice > 0 && groupPrice < price;

  const selectedItem = items.find((i) => i.id === itemId);

  const loadList = useCallback(async (type: string) => {
    setLoadingItems(true);
    try {
      const list = await loadItems(type);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (itemType) {
      setItemId('');
      setItems([]);
      loadList(itemType);
    } else {
      setItems([]);
      setItemId('');
    }
  }, [itemType, loadList]);

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await apiClient.createGroupBuy({
        title: form.title,
        description: form.description || undefined,
        productId: undefined,
        itemType: itemType || undefined,
        itemId: itemId || undefined,
        price,
        groupPrice,
        minParticipants: Number(form.minParticipants),
        maxParticipants: Number(form.maxParticipants) || undefined,
        discountPercent: Number(form.discountPercent) || pct,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        whatsappGroup: form.whatsappGroup || undefined,
      });
      router.push('/dashboard/group-buys');
      router.refresh();
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-8 max-w-3xl">
      <PageHeader
        title="Nouvel achat groupé"
        description="Le prix baisse quand le groupe grossit — au seuil atteint, chaque participant valide sa commande au prix groupe."
        breadcrumbs={[
          { label: 'Marketing', href: '/dashboard/business/marketing' },
          { label: 'Achat Groupé', href: '/dashboard/group-buys' },
          { label: 'Nouveau' },
        ]}
        gradient
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              placeholder="Achat groupé du riz parfumé"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              placeholder="5 amis, un prix imbattable..."
            />
          </div>

          {/* Article lié (optionnel) */}
          <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Lier à un article (optionnel)
              </h3>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto">
                Laissez vide pour un achat groupé autonome
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Type d'article
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as ItemType)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
                >
                  <option value="">Aucun</option>
                  {ITEM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Article
                </label>
                {loadingItems ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                    <Loader className="w-4 h-4 animate-spin" /> Chargement...
                  </div>
                ) : (
                  <select
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    disabled={!itemType}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none disabled:opacity-50 dark:text-gray-100"
                  >
                    <option value="">
                      {itemType ? '— Choisir un article —' : "Sélectionnez d'abord un type"}
                    </option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {itemName(i)} {itemPrice(i) > 0 ? `· ${formatPrice(itemPrice(i))}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            {selectedItem && (
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ Lié à « {itemName(selectedItem)} »
                {itemPrice(selectedItem) > 0 &&
                  ` — prix catalogue ${formatPrice(itemPrice(selectedItem))}`}
              </p>
            )}
          </div>

          {/* Prix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix normal (FCFA) *
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                type="number"
                placeholder="5000"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix groupe (FCFA) *
              </label>
              <input
                value={form.groupPrice}
                onChange={(e) => setForm({ ...form, groupPrice: e.target.value })}
                type="number"
                placeholder="4000"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              />
            </div>
          </div>

          {/* Live preview économie */}
          {price > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/30">
              <BadgePercent className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800 dark:text-emerald-300">
                {groupPrice > 0 && groupPrice < price ? (
                  <>
                    Chaque participant économise{' '}
                    <strong>
                      {formatPrice(savings)} ({pct}%)
                    </strong>{' '}
                    par rapport au prix normal.
                  </>
                ) : (
                  <>Le prix groupe doit être inférieur au prix normal.</>
                )}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min participants *
              </label>
              <input
                value={form.minParticipants}
                onChange={(e) => setForm({ ...form, minParticipants: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max participants
              </label>
              <input
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                type="number"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de clôture
              </label>
              <input
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                type="date"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lien groupe WhatsApp (optionnel)
              </label>
              <input
                value={form.whatsappGroup}
                onChange={(e) => setForm({ ...form, whatsappGroup: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/group-buys')}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving || !valid}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              {saving ? 'Création...' : "Créer l'achat groupé"}
            </Button>
          </div>

          {!valid && price > 0 && groupPrice >= price && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Le prix groupe doit être inférieur au prix normal pour que l'offre soit valable.
            </p>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-brand-900/10 dark:to-emerald-900/10 border-brand-100 dark:border-brand-900/20">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-brand" />
          Comment ça marche
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          1. Vous publiez l'offre (liée à un article ou autonome) avec un prix groupe · 2. Les
          clients rejoignent via la page publique ou le lien WhatsApp · 3. Au seuil atteint, le prix
          groupe est débloqué pour tous · 4. Chaque participant confirme et sa commande est créée
          automatiquement.
        </p>
      </Card>
    </div>
  );
}
