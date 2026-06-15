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
import { useDelivery, useUpdateDelivery, useDeliveryZones } from '@/features/hooks';

export default function EditDeliveryPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: delivery, isLoading, error, refetch } = useDelivery(id);
  const updateDelivery = useUpdateDelivery();
  const { data: zonesData } = useDeliveryZones();
  const zones = Array.isArray(zonesData) ? zonesData : (zonesData?.zones || zonesData?.data || []);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (delivery) {
      const d: any = delivery;
      setForm({
        recipientName: d.recipientName || '',
        recipientAddress: d.recipientAddress || '',
        recipientPhone: d.recipientPhone || '',
        zoneId: d.zone?.id || '',
        items: d.items || '',
        notes: d.notes || '',
      });
    }
  }, [delivery]);

  if (!params?.id) return null;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!delivery) return <p className="text-center py-12 text-gray-500">Livraison introuvable</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await updateDelivery.mutateAsync({ id, data: form });
      router.push('/dashboard/deliveries');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Modifier la livraison" description="Mettez à jour les informations de la livraison"
        breadcrumbs={[{ label: 'Livraisons', href: '/dashboard/deliveries' }, { label: 'Modifier' }]}
        actions={<Link href={`/dashboard/deliveries/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du destinataire *</label>
            <input type="text" value={form.recipientName || ''} onChange={e => update('recipientName', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse *</label>
            <input type="text" value={form.recipientAddress || ''} onChange={e => update('recipientAddress', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
              <input type="tel" value={form.recipientPhone || ''} onChange={e => update('recipientPhone', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone de livraison</label>
              <select value={form.zoneId || ''} onChange={e => update('zoneId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                <option value="">Sélectionnez une zone</option>
                {zones.map((zone: any) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description des articles *</label>
            <textarea rows={3} value={form.items || ''} onChange={e => update('items', e.target.value)} required
              placeholder="Décrivez les articles à livrer"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea rows={2} value={form.notes || ''} onChange={e => update('notes', e.target.value)}
              placeholder="Instructions supplémentaires"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href={`/dashboard/deliveries/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updateDelivery.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{updateDelivery.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
