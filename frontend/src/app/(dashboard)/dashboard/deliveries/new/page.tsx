'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateDelivery, useDeliveryZones } from '@/features/hooks';

export default function NewDeliveryPage() {
  const router = useRouter();
  const createDelivery = useCreateDelivery();
  const { data: zonesData } = useDeliveryZones();
  const zones = Array.isArray(zonesData) ? zonesData : (zonesData?.zones || zonesData?.data || []);

  const [form, setForm] = useState({
    recipientName: '', recipientAddress: '', recipientPhone: '',
    zoneId: '', items: '', notes: '',
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createDelivery.mutateAsync(form);
      router.push('/dashboard/deliveries');
    } catch (err) { console.error(err); }
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Nouvelle livraison" description="Créez une nouvelle livraison"
        breadcrumbs={[{ label: 'Livraisons', href: '/dashboard/deliveries' }, { label: 'Nouvelle' }]}
        actions={<Link href="/dashboard/deliveries"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du destinataire *</label>
            <input type="text" value={form.recipientName} onChange={e => update('recipientName', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse *</label>
            <input type="text" value={form.recipientAddress} onChange={e => update('recipientAddress', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
              <input type="tel" value={form.recipientPhone} onChange={e => update('recipientPhone', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone de livraison</label>
              <select value={form.zoneId} onChange={e => update('zoneId', e.target.value)}
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
            <textarea rows={3} value={form.items} onChange={e => update('items', e.target.value)} required
              placeholder="Décrivez les articles à livrer"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)}
              placeholder="Instructions supplémentaires"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/deliveries"><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={createDelivery.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{createDelivery.isPending ? 'Création...' : 'Créer la livraison'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
