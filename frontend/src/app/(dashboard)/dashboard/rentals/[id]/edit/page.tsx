'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyRental, useUpdateRental } from '@/features/hooks';

const PRICE_UNITS = ['day', 'hour', 'week', 'month', 'piece'] as const;

export default function EditRentalPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: rental, isLoading, error, refetch } = useMyRental(id);
  const updateRental = useUpdateRental();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (rental) {
      const r: any = rental;
      setForm({
        name: r.name || '',
        description: r.description || '',
        price: r.price?.toString() || '',
        unit: r.unit || '',
        deposit: r.deposit?.toString() || '',
        priceUnit: r.priceUnit || 'day',
        currency: r.currency || 'FCFA',
        quantity: r.quantity?.toString() || '1',
      });
    }
  }, [rental]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!rental) return <p className="text-center py-12 text-gray-500">Article introuvable</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await updateRental.mutateAsync({
        id,
        data: {
          ...form,
          price: parseFloat(form.price),
          deposit: form.deposit ? parseFloat(form.deposit) : undefined,
          quantity: parseInt(form.quantity),
        },
      });
      router.push('/dashboard/rentals');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Modifier l'article" description="Mettez à jour les informations de votre article en location"
        breadcrumbs={[{ label: 'Locations', href: '/dashboard/rentals' }, { label: 'Modifier' }]}
        actions={<Link href={`/dashboard/rentals/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'article *</label>
            <input type="text" value={form.name || ''} onChange={e => update('name', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={3} value={form.description || ''} onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix * ({form.currency || 'FCFA'})</label>
              <input type="number" step="0.01" value={form.price || ''} onChange={e => update('price', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité de prix</label>
              <select value={form.priceUnit || 'day'} onChange={e => update('priceUnit', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                {PRICE_UNITS.map(u => <option key={u} value={u}>{u === 'day' ? 'Jour' : u === 'hour' ? 'Heure' : u === 'week' ? 'Semaine' : u === 'month' ? 'Mois' : 'Pièce'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caution (optionnelle)</label>
              <input type="number" step="0.01" value={form.deposit || ''} onChange={e => update('deposit', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité</label>
              <input type="number" min="1" value={form.quantity || '1'} onChange={e => update('quantity', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unité (ex: chaise, vélo, tente)</label>
            <input type="text" value={form.unit || ''} onChange={e => update('unit', e.target.value)}
              placeholder="ex: chaise, vélo, tente, appareil"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href={`/dashboard/rentals/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updateRental.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{updateRental.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
