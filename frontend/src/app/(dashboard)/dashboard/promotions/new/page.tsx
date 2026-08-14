'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Percent } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreatePromotion } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { ScopePicker, type ScopeValue } from '@/components/formkit/ScopePicker';

const PROMO_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING', 'BUY_X_GET_Y'];

export default function NewPromotionPage() {
  const router = useRouter();
  const createPromotion = useCreatePromotion();
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PERCENTAGE',
    discountValue: '',
    minPurchase: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    couponCode: '',
  });
  const [scope, setScope] = useState<ScopeValue>({ scope: 'ALL', categoryIds: [], itemIds: [] });

  // Catalogue du business pour le ScopePicker (catégories + articles précis).
  const { data: productsData } = useQuery({
    queryKey: ['promo-products'],
    queryFn: async () => {
      const res = await apiClient.getMyProducts({ limit: 500 });
      return res.data.data?.products || res.data.data?.items || [];
    },
  });
  const { data: servicesData } = useQuery({
    queryKey: ['promo-services'],
    queryFn: async () => {
      const res = await apiClient.getMyServices({ limit: 500 });
      return res.data.data?.services || res.data.data?.items || [];
    },
  });
  const { data: productCatsData } = useQuery({
    queryKey: ['promo-product-cats'],
    queryFn: async () => {
      const res = await apiClient.getProductCategories();
      return res.data.data?.categories || res.data.data?.items || res.data.data || [];
    },
  });
  const { data: serviceCatsData } = useQuery({
    queryKey: ['promo-service-cats'],
    queryFn: async () => {
      const res = await apiClient.getServiceCategories();
      return res.data.data?.categories || res.data.data?.items || res.data.data || [];
    },
  });

  const scopeCategories = useMemo(() => {
    const cats: { id: string; name: string }[] = [];
    const push = (list: any[]) =>
      list?.forEach((c) => {
        if (c?.id && c?.name && !cats.some((x) => x.id === c.id)) {
          cats.push({ id: c.id, name: c.name });
        }
      });
    push(productCatsData);
    push(serviceCatsData);
    return cats;
  }, [productCatsData, serviceCatsData]);

  const scopeItems = useMemo(() => {
    const items: { id: string; name: string; price?: number; type?: string }[] = [];
    (productsData || []).forEach((p: any) =>
      items.push({ id: p.id, name: p.name, price: Number(p.price || 0), type: 'Produit' })
    );
    (servicesData || []).forEach((s: any) =>
      items.push({ id: s.id, name: s.name, price: Number(s.price || 0), type: 'Service' })
    );
    return items;
  }, [productsData, servicesData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ScopePicker → ciblage du moteur de prix (Socle de rattachement).
      let targetType = 'ALL';
      let targetIds: string[] = [];
      if (scope.scope === 'CATEGORY') {
        targetType = 'CATEGORY';
        targetIds = scope.categoryIds;
      } else if (scope.scope === 'ITEMS') {
        targetType = 'ITEMS';
        targetIds = scope.itemIds;
      }

      const payload = {
        title: form.title,
        description: form.description || undefined,
        promotionType: form.type,
        discountValue: form.discountValue ? parseFloat(form.discountValue) : 0,
        minOrderAmount: form.minPurchase ? parseFloat(form.minPurchase) : undefined,
        startsAt: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endsAt: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        maxUsageCount: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        code: form.couponCode || undefined,
        targetType,
        targetIds,
        autoApply: true,
      };
      await createPromotion.mutateAsync(payload);
      router.push('/dashboard/promotions');
    } catch (err) {
      console.error(err);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader
        title="Nouvelle promotion"
        description="Créez une offre promotionnelle ou un code de réduction"
        breadcrumbs={[{ label: 'Promotions', href: '/dashboard/promotions' }, { label: 'Nouveau' }]}
        actions={
          <Link href="/dashboard/promotions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour
            </Button>
          </Link>
        }
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
              placeholder="Ex: Soldes d'été"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Description de l'offre..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="PERCENTAGE">Pourcentage</option>
                <option value="FIXED">Montant fixe</option>
                <option value="FREE_SHIPPING">Livraison offerte</option>
                <option value="BUY_X_GET_Y">Acheté 1 offert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valeur *
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => update('discountValue', e.target.value)}
                required
                placeholder={form.type === 'PERCENTAGE' ? 'Ex: 20' : 'Ex: 5000'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Achat minimum (FCFA)
              </label>
              <input
                type="number"
                value={form.minPurchase}
                onChange={(e) => update('minPurchase', e.target.value)}
                placeholder="Ex: 10000"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limite d'utilisation
              </label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => update('usageLimit', e.target.value)}
                placeholder="Ex: 100"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date début
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date fin
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Code promo
            </label>
            <input
              type="text"
              value={form.couponCode}
              onChange={(e) => update('couponCode', e.target.value)}
              placeholder="Ex: ETE2025"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100 uppercase"
            />
          </div>

          {/* Socle de rattachement : où la promo s'applique (Tout / catégorie / articles précis) */}
          <ScopePicker
            value={scope}
            onChange={setScope}
            label="Où appliquer cette promotion ?"
            help="Toute l'entreprise, une catégorie ou des articles précis — le choix vous appartient."
            categories={scopeCategories}
            items={scopeItems}
            itemTypeLabel="produits & services"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/promotions">
              <Button variant="outline" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" disabled={createPromotion.isPending}>
              <Save className="h-4 w-4 mr-1.5" />
              {createPromotion.isPending ? 'Création...' : 'Créer la promotion'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
