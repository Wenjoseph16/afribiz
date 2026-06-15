'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Key, Plus, Search, CheckCircle2, XCircle,
  RotateCcw, Ban, DollarSign, CalendarDays, FileKey,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules } from '@/features/developerHooks';
import {
  useModuleLicenses, useLicenseStats, useCreateLicense,
  useActivateLicense, useRevokeLicense, useRenewLicense,
} from '@/features/developerModulesHooks';
import type { ModuleLicense } from '@/types/developer';

const LICENSE_STATUS_VARIANT: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  EXPIRED: 'danger',
  REVOKED: 'default',
  SUSPENDED: 'warning',
};

const LICENSE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING: 'En attente',
  EXPIRED: 'Expirée',
  REVOKED: 'Révoquée',
  SUSPENDED: 'Suspendue',
};

const LICENSE_TYPE_LABELS: Record<string, string> = {
  FREE: 'Gratuite',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Entreprise',
  TRIAL: 'Essai',
};

export default function DeveloperLicensesPage() {
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: modules, isLoading: modulesLoading, error: modulesError } = useDeveloperModules();
  const { data: licenses, isLoading: licensesLoading, error: licensesError } = useModuleLicenses(selectedModuleId);
  const { data: stats, isLoading: statsLoading } = useLicenseStats();

  const createLicense = useCreateLicense();
  const activateLicense = useActivateLicense();
  const revokeLicense = useRevokeLicense();
  const renewLicense = useRenewLicense();

  const moduleList = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const filteredLicenses = useMemo(() => {
    if (!licenses) return [];
    let list = Array.isArray(licenses) ? licenses : [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l: ModuleLicense) =>
        l.business?.name?.toLowerCase().includes(q) ||
        l.licenseKey.toLowerCase().includes(q) ||
        l.licenseType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [licenses, search]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateLicense = async () => {
    if (!selectedModuleId) return;
    try {
      await createLicense.mutateAsync({
        moduleId: selectedModuleId,
        businessId: '',
        licenseType: 'STANDARD',
        autoRenew: false,
      });
      showToast('Licence créée avec succès', 'success');
    } catch {
      showToast('Erreur lors de la création', 'error');
    }
  };

  const handleActivateLicense = async (licenseKey: string) => {
    try {
      await activateLicense.mutateAsync(licenseKey);
      showToast('Licence activée', 'success');
    } catch {
      showToast("Erreur d'activation", 'error');
    }
  };

  const handleRevokeLicense = async (id: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir révoquer cette licence ?');
    if (!confirmed) return;
    try {
      await revokeLicense.mutateAsync({ id });
      showToast('Licence révoquée', 'success');
    } catch {
      showToast('Erreur lors de la révocation', 'error');
    }
  };

  const handleRenewLicense = async (id: string) => {
    try {
      await renewLicense.mutateAsync({ id });
      showToast('Licence renouvelée', 'success');
    } catch {
      showToast('Erreur lors du renouvellement', 'error');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value) + ' FCFA';
  };

  if (modulesError) return <ErrorState message={modulesError.message} onRetry={() => {}} />;
  if (modulesLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (!selectedModuleId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Licences"
          description="Gérez les licences de vos modules"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Développeur', href: '/dashboard/developer' },
            { label: 'Licences' },
          ]}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Key className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.total ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Actives</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.active ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600"><XCircle className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Expirées</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.expired ?? 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><DollarSign className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Revenu mensuel</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats?.monthlyRevenue ?? null)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Module selector */}
        <Card padding="lg">
          <div className="flex flex-col items-center text-center py-8">
            <FileKey className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Sélectionnez un module
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Choisissez un module ci-dessous pour voir et gérer ses licences.
            </p>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all"
            >
              <option value="">Sélectionner un module</option>
              {moduleList.map((mod: any) => (
                <option key={mod.id} value={mod.id}>{mod.name}</option>
              ))}
            </select>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div className={cn(
          'p-3 rounded-xl text-sm font-medium',
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        )}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      <PageHeader
        title="Licences"
        description={`Gestion des licences - ${moduleList.find((m: any) => m.id === selectedModuleId)?.name || ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Licences', href: '/dashboard/developer/licenses' },
          { label: moduleList.find((m: any) => m.id === selectedModuleId)?.name || 'Module' },
        ]}
        actions={
          <Button variant="gradient" size="sm" onClick={handleCreateLicense} isLoading={createLicense.isPending}>
            <Plus className="h-4 w-4" />
            Nouvelle licence
          </Button>
        }
      />

      {/* Module switcher */}
      <div className="flex items-center gap-3">
        <select
          value={selectedModuleId}
          onChange={(e) => setSelectedModuleId(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
        >
          {moduleList.map((mod: any) => (
            <option key={mod.id} value={mod.id}>{mod.name}</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une licence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      {/* Licenses table */}
      <Card padding="none">
        {licensesLoading ? (
          <Loader className="py-20" />
        ) : filteredLicenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Business</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Clé de licence</th>
                  <th className="p-4 font-medium">Période</th>
                  <th className="p-4 font-medium">Prix</th>
                  <th className="p-4 font-medium">Installations</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((lic: ModuleLicense) => (
                  <tr key={lic.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {lic.business?.logo ? (
                          <Image src={lic.business.logo ?? ''} alt="" width={28} height={28} className="rounded-lg object-cover" unoptimized />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 flex items-center justify-center text-[10px] font-bold text-brand">
                            {(lic.business?.name || '?')[0]}
                          </div>
                        )}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {lic.business?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="brand" size="xs">
                        {LICENSE_TYPE_LABELS[lic.licenseType] || lic.licenseType}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <code className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {lic.licenseKey.substring(0, 12)}...
                      </code>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3" />
                        <span className="text-xs">{formatDate(lic.startsAt)}</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-xs">{formatDate(lic.expiresAt)}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(lic.price)}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {lic.currentInstallations}/{lic.maxInstallations}
                    </td>
                    <td className="p-4">
                      <Badge variant={LICENSE_STATUS_VARIANT[lic.status] || 'default'} size="xs">
                        {LICENSE_STATUS_LABELS[lic.status] || lic.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        {lic.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleActivateLicense(lic.licenseKey)}
                            title="Activer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                        )}
                        {lic.status === 'ACTIVE' && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleRenewLicense(lic.id)}
                              title="Renouveler"
                              isLoading={renewLicense.isPending}
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleRevokeLicense(lic.id)}
                              title="Révoquer"
                              isLoading={revokeLicense.isPending}
                            >
                              <Ban className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {(lic.status === 'EXPIRED') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRenewLicense(lic.id)}
                            title="Renouveler"
                            isLoading={renewLicense.isPending}
                          >
                            <RotateCcw className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Key className="h-8 w-8" />}
            title="Aucune licence"
            description={search ? 'Aucune licence ne correspond à la recherche.' : 'Ce module n\'a pas encore de licences.'}
          />
        )}
      </Card>
    </div>
  );
}
