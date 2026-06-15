'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyPromotion, useUpdatePromotion } from '@/features/hooks';

const PROMO_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING', 'BUY_X_GET_Y'];

export default function EditPromotionPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: promotion, isLoading, error, refetch } = useMyPromotion(id);
  const updatePromotion = useUpdatePromotion();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (promotion) {
      const p: any = promotion;
      setForm({
        title: p.title || '',
        description: p.description || '',
        type: p.discountType || 'PERCENTAGE',
        discountValue: p.discountValue?.toString() || '',
        minPurchase: p.minPurchase?.toString() || '',
        maxDiscount: p.maxDiscount?.toString() || '',
        startDate: p.startsAt ? new Date(p.startsAt).toISOString().split('T')[0] : '',
        endDate: p.endsAt ? new Date(p.endsAt).toISOString().split('T')[0] : '',
        usageLimit: p.usageLimit?.toString() || '',
        couponCode: p.code || '',
      });
    }
  }, [promotion]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!promotion) return <p className="text-center py-12 text-gray-500">Promotion introuvable</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await updatePromotion.mutateAsync({
        id,
        data: {
          title: form.title,
          description: form.description || undefined,
          discountType: form.type,
          discountValue: form.discountValue ? parseFloat(form.discountValue) : 0,
          minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : undefined,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
          startsAt: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          endsAt: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
          code: form.couponCode || undefined,
        },
      });
      router.push('/dashboard/promotions');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Modifier la promotion" description="Mettez à jour les informations de votre offre"
        breadcrumbs={[{ label: 'Promotions', href: '/dashboard/promotions' }, { label: 'Modifier' }]}
        actions={<Link href={`/dashboard/promotions/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
            <input type="text" value={form.title || ''} onChange={e => update('title', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={3} value={form.description || ''} onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
              <select value={form.type || 'PERCENTAGE'} onChange={e => update('type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                <option value="PERCENTAGE">Pourcentage</option>
                <option value="FIXED">Montant fixe</option>
                <option value="FREE_SHIPPING">Livraison offerte</option>
                <option value="BUY_X_GET_Y">Acheté 1 offert</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valeur *</label>
              <input type="number" value={form.discountValue || ''} onChange={e => update('discountValue', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Achat minimum (FCFA)</label>
              <input type="number" value={form.minPurchase || ''} onChange={e => update('minPurchase', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Réduction max (FCFA)</label>
              <input type="number" value={form.maxDiscount || ''} onChange={e => update('maxDiscount', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date début</label>
              <input type="date" value={form.startDate || ''} onChange={e => update('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date fin</label>
              <input type="date" value={form.endDate || ''} onChange={e => update('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code promo</label>
              <input type="text" value={form.couponCode || ''} onChange={e => update('couponCode', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100 uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Limite d'utilisation</label>
              <input type="number" value={form.usageLimit || ''} onChange={e => update('usageLimit', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href={`/dashboard/promotions/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updatePromotion.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{updatePromotion.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
