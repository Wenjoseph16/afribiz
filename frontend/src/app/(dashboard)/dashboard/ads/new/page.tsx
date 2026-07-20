'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { apiClient } from '@/services/apiClient';
import { useCreateAdCampaign } from '@/features/adsHooks';

export default function NewAdPage() {
  const router = useRouter();
  const createCampaign = useCreateAdCampaign();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    objective: 'BRAND_AWARENESS',
    budget: '',
    startDate: '',
    endDate: '',
    companyName: '',
    phone: '',
    email: '',
    website: '',
    country: 'CI',
    city: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .getBusiness()
      .then((res) => {
        setBusinessId(res.data?.data?.id || null);
        setLoading(false);
      })
      .catch(() => {
        setError(
          'Impossible de récupérer votre business. Vérifiez que vous avez un compte business actif.'
        );
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader variant="spinner" size="md" fullScreen />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!businessId) {
      setError('Business non trouvé. Vous devez avoir un compte business actif.');
      return;
    }
    try {
      await createCampaign.mutateAsync({
        advertiserType: 'BUSINESS',
        businessId,
        ...form,
        budget: parseFloat(form.budget) || 0,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        creatives: [
          {
            placementPage: 'HOMEPAGE',
            placementPosition: 'TOP',
            format: 'BANNER_HORIZONTAL',
            adText: form.name,
            destinationUrl: form.website || '/',
            isActive: true,
          },
        ],
      });
      router.push('/dashboard/ads');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur lors de la création');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader
        title="Nouvelle campagne"
        description="Créez une campagne publicitaire"
        breadcrumbs={[{ label: 'Publicités', href: '/dashboard/ads' }, { label: 'Nouvelle' }]}
      />
      <Card>
        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de la campagne *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Objectif</label>
              <select
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
              >
                <option value="BRAND_AWARENESS">Notoriété</option>
                <option value="TRAFFIC">Trafic</option>
                <option value="LEADS">Leads</option>
                <option value="SALES">Ventes</option>
                <option value="PROMOTION">Promotion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Budget (FCFA)</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date début *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date fin *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
              />
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm font-medium mb-3">Informations annonceur</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site web</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:ring-2 focus:ring-brand/20 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? 'Création...' : 'Créer la campagne'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
