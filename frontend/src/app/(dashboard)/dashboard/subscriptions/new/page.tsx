'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useCreateSubscriptionPlan } from '@/features/hooks';

const DURATIONS = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'] as const;

export default function NewSubscriptionPage() {
  const router = useRouter();
  const createPlan = useCreateSubscriptionPlan();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: 'MONTHLY' as string,
    maxEmployees: '',
    maxStorage: '',
    status: 'ACTIVE' as string,
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: form.price ? parseFloat(form.price) : 0,
        maxEmployees: form.maxEmployees ? parseInt(form.maxEmployees) : undefined,
        maxStorage: form.maxStorage ? parseInt(form.maxStorage) : undefined,
        features,
      };
      await createPlan.mutateAsync(payload);
      router.push('/dashboard/subscriptions');
    } catch (e) { console.error('Failed to create plan', e); }
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Nouveau plan d'abonnement" description="Créez un plan d'abonnement pour vos clients"
        breadcrumbs={[{ label: 'Abonnements', href: '/dashboard/subscriptions' }, { label: 'Nouveau' }]}
        actions={<Link href="/dashboard/subscriptions"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix (FCFA)</label>
              <input type="number" value={form.price} onChange={e => update('price', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durée *</label>
              <select value={form.duration} onChange={e => update('duration', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max employés</label>
              <input type="number" value={form.maxEmployees} onChange={e => update('maxEmployees', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stockage max (GB)</label>
              <input type="number" value={form.maxStorage} onChange={e => update('maxStorage', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select value={form.status} onChange={e => update('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
              <option value="ACTIVE">Actif</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fonctionnalités</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                placeholder="Ajouter une fonctionnalité..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
              <Button type="button" size="sm" onClick={addFeature}><Plus className="h-4 w-4" /></Button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-brand-50 text-brand rounded-full">
                    {f}
                    <button type="button" onClick={() => removeFeature(i)} className="hover:text-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/dashboard/subscriptions"><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={createPlan.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{createPlan.isPending ? 'Création...' : 'Créer le plan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
