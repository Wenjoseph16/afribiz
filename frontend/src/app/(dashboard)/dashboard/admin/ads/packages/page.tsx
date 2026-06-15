'use client';

import { useState } from 'react';
import { useAdminAdPackages, useAdminCreateAdPackage } from '@/features/adsHooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import {
  Package, Plus, DollarSign, Clock, CheckCircle, X, Tag, Layers,
} from 'lucide-react';

export default function AdminPackagesPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', advertiserType: 'BUSINESS',
    price: '', durationHours: '', currency: 'FCFA', isActive: true,
    placementsInput: '',
  });

  const { data: packages, isLoading } = useAdminAdPackages();
  const createMutation = useAdminCreateAdPackage();

  const pkgList = Array.isArray(packages) ? packages : (packages as any)?.packages ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const placements = form.placementsInput.split(',').map((p) => p.trim()).filter(Boolean);
    createMutation.mutate(
      {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        advertiserType: form.advertiserType as 'BUSINESS' | 'DEVELOPER' | 'EXTERNAL',
        price: parseFloat(form.price),
        durationHours: parseInt(form.durationHours, 10),
        currency: form.currency,
        isActive: form.isActive,
        placements,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ name: '', slug: '', description: '', advertiserType: 'BUSINESS', price: '', durationHours: '', currency: 'FCFA', isActive: true, placementsInput: '' });
        },
      }
    );
  };

  if (!user?.roles?.includes('ADMIN')) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Packages publicitaires
        </h1>
        <EmptyState icon={<Package className="h-8 w-8" />} title="Accès réservé" description="Vous devez être administrateur pour accéder à cette page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Packages publicitaires"
        description="Créez et gérez les offres de packages publicitaires"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Gestion publicitaire', href: '/dashboard/admin/ads' },
          { label: 'Packages' },
        ]}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nouveau package
          </Button>
        }
      />

      {/* Create form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Créer un package publicitaire
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="Ex: Premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                <input type="text" required value={form.slug} onChange={e => setForm(p => ({...p, slug: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="Ex: premium" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none resize-none"
                  placeholder="Description du package..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type d'annonceur</label>
                <select value={form.advertiserType} onChange={e => setForm(p => ({...p, advertiserType: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  <option value="BUSINESS">Business</option>
                  <option value="DEVELOPER">Développeur</option>
                  <option value="EXTERNAL">Externe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
                <select value={form.currency} onChange={e => setForm(p => ({...p, currency: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix</label>
                <input type="number" required value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durée (heures)</label>
                <input type="number" required value={form.durationHours} onChange={e => setForm(p => ({...p, durationHours: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="720" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placements (séparés par des virgules)</label>
                <input type="text" value={form.placementsInput} onChange={e => setForm(p => ({...p, placementsInput: e.target.value}))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  placeholder="HERO_BANNER, TOP_BANNER, SIDEBAR" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))}
                  className="rounded border-gray-300 text-brand focus:ring-brand" />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Actif</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" isLoading={createMutation.isPending}>Créer le package</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Packages grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg" className="animate-pulse">
              <div className="space-y-3">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : pkgList.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Aucun package"
          description="Créez votre premier package publicitaire"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Créer un package
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pkgList.map((pkg: any) => (
            <Card key={pkg.id} padding="lg" hoverable>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
                  <Package className="h-5 w-5" />
                </div>
                <Badge variant={pkg.isActive ? 'success' : 'default'} size="xs">
                  {pkg.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{pkg.name}</h3>
              <p className="text-2xl font-bold text-brand mt-1">
                {Number(pkg.price).toLocaleString()} <span className="text-sm font-normal text-gray-500">{pkg.currency}</span>
              </p>
              {pkg.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{pkg.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {pkg.durationHours}h
                <Tag className="h-3.5 w-3.5 ml-2" />
                {pkg.advertiserType}
              </div>
              {pkg.placements && pkg.placements.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Placements
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {pkg.placements.map((pl: string) => (
                      <Badge key={pl} variant="brand" size="xs">{pl}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
