'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useSubscriptionPlan, useUpdateSubscriptionPlan } from '@/features/hooks';

const DURATIONS = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'] as const;

export default function EditSubscriptionPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: plan, isLoading, error, refetch } = useSubscriptionPlan(id);
  const updatePlan = useUpdateSubscriptionPlan();
  const [form, setForm] = useState<any>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    if (plan) {
      const p: any = plan;
      setForm({
        name: p.name || '',
        description: p.description || '',
        price: p.price?.toString() || '',
        duration: p.duration || 'MONTHLY',
        maxEmployees: p.maxEmployees?.toString() || '',
        maxStorage: p.maxStorage?.toString() || '',
        status: p.status || 'ACTIVE',
      });
      setFeatures(p.features || []);
    }
  }, [plan]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!plan) return <p className="text-center py-12 text-gray-500">Plan introuvable</p>;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await updatePlan.mutateAsync({
        id,
        data: {
          ...form,
          price: form.price ? parseFloat(form.price) : 0,
          maxEmployees: form.maxEmployees ? parseInt(form.maxEmployees) : undefined,
          maxStorage: form.maxStorage ? parseInt(form.maxStorage) : undefined,
          features,
        },
      });
      router.push('/dashboard/subscriptions');
    } catch (e) { console.error('Failed to update plan', e); }
  };

  const update = (field: string, value: string) => setForm((f: any) => ({ ...f, [field]: value }));

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
      <PageHeader title="Modifier le plan" description="Mettez à jour les informations du plan d'abonnement"
        breadcrumbs={[{ label: 'Abonnements', href: '/dashboard/subscriptions' }, { label: 'Modifier' }]}
        actions={<Link href={`/dashboard/subscriptions/${id}`}><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1.5" />Retour</Button></Link>}
      />
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input type="text" value={form.name || ''} onChange={e => update('name', e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={4} value={form.description || ''} onChange={e => update('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix (FCFA)</label>
              <input type="number" value={form.price || ''} onChange={e => update('price', e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durée *</label>
              <select value={form.duration || 'MONTHLY'} onChange={e => update('duration', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100">
                {DURATIONS.map((d: string) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max employés</label>
              <input type="number" value={form.maxEmployees || ''} onChange={e => update('maxEmployees', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stockage max (GB)</label>
              <input type="number" value={form.maxStorage || ''} onChange={e => update('maxStorage', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none dark:bg-gray-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
            <select value={form.status || 'ACTIVE'} onChange={e => update('status', e.target.value)}
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
            <Link href={`/dashboard/subscriptions/${id}`}><Button variant="outline" type="button">Annuler</Button></Link>
            <Button type="submit" disabled={updatePlan.isPending}>
              <Save className="h-4 w-4 mr-1.5" />{updatePlan.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
