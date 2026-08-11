'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  ExternalLink,
  Star,
  Clock,
  Shield,
  Trash2,
  AlertTriangle,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { apiClient } from '@/services/apiClient';
import {
  useBusinessInstalledModules,
  useReinstallModule,
} from '@/features/developerHooks';

export default function BusinessModuleRuntimePage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const installationId = String(params?.installationId || '');
  const { data: installations, isLoading } = useBusinessInstalledModules();
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const installation = Array.isArray(installations)
    ? (installations as any[]).find((i: any) => i.id === installationId)
    : null;
  const module = installation?.module || null;

  const uninstallMutation = useMutation({
    mutationFn: () => apiClient.uninstallCoreModule(installationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-installed-modules'] });
      setConfirmUninstall(false);
      router.push('/dashboard/business/modules');
    },
  });

  const reinstallMutation = useReinstallModule();
  const handleReinstall = async () => {
    if (!module?.id) return;
    try {
      await reinstallMutation.mutateAsync(module.id);
      qc.invalidateQueries({ queryKey: ['business-installed-modules'] });
      router.push('/dashboard/business/modules');
    } catch {
      // erreur gérée par la mutation
    }
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (!installation || !module) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Module introuvable"
          breadcrumbs={[{ label: 'Business', href: '/dashboard/business' }, { label: 'Modules', href: '/dashboard/business/modules' }]}
        />
        <EmptyState
          icon={<Package className="w-12 h-12 text-gray-400" />}
          title="Cette installation n'existe pas"
          description="Le module a peut-être été désinstallé ou supprimé."
        />
      </div>
    );
  }

  const statusBadge = () => {
    if (installation.status === 'UNINSTALLED')
      return { label: 'Désinstallé', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
    if (installation.trialExpired)
      return { label: 'Essai expiré', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
    if (installation.isTrial)
      return {
        label: installation.trialDaysLeft > 0 ? `Essai J-${installation.trialDaysLeft}` : 'Essai',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
      };
    return { label: 'Actif', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' };
  };

  // Sécurité : on ne rend l'iframe que pour une URL https CROSS-ORIGINE.
  // Une URL qui pointerait vers l'origine AfriBiz elle-même serait exclue (le combo
  // sandbox allow-scripts + allow-same-origin deviendrait dangereux sur la même origine).
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const safeDashboardUrl =
    module.dashboardUrl && /^https:\/\//.test(module.dashboardUrl)
      ? new URL(module.dashboardUrl).origin !== appOrigin
        ? module.dashboardUrl
        : null
      : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={module.sidebarLabel || module.name}
        badge={statusBadge()}
        breadcrumbs={[
          { label: 'Business', href: '/dashboard/business' },
          { label: 'Modules', href: '/dashboard/business/modules' },
          { label: module.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {safeDashboardUrl && (
              <a href={safeDashboardUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Ouvrir dans un onglet
                </Button>
              </a>
            )}
            {installation.status === 'UNINSTALLED' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReinstall}
                isLoading={reinstallMutation.isPending}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Réinstaller
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setConfirmUninstall(true)}>
                <Trash2 className="w-4 h-4 mr-1.5" />
                Désinstaller
              </Button>
            )}
          </div>
        }
      />

      {/* ── Infos module ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-400/20 flex items-center justify-center shrink-0">
                {module.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={module.logo} alt={module.name} className="w-10 h-10 object-contain" />
                ) : (
                  <Package className="w-6 h-6 text-indigo-400" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {module.name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{module.category}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Développeur
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200 truncate ml-3">
                  {module.developer?.companyName || 'Indépendant'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Version
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  v{module.version || '1.0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  Note
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {module.rating ? `${module.rating.toFixed(1)} / 5` : '—'}
                  {module.reviewCount ? ` (${module.reviewCount})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Prix
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {module.isFree ? 'Gratuit' : `${module.price?.toLocaleString('fr-FR')} ${module.currency || 'FCFA'}`}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {module.description}
            </p>

            <div className="pt-2">
              <Link href="/dashboard/business/modules">
                <Button variant="ghost" size="sm" className="w-full">
                  ← Retour à mes modules
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* ── Zone runtime : iframe sandbox du module ── */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Interface du module
            </div>
            {safeDashboardUrl && (
              <a
                href={safeDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
              >
                Plein écran
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {safeDashboardUrl ? (
            <div className="relative">
              <iframe
                src={safeDashboardUrl}
                title={`${module.name} - interface intégrée`}
                className="w-full h-[560px] border-0 bg-white dark:bg-gray-900"
                sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50/80 dark:bg-amber-900/10 border-t border-amber-200/60 dark:border-amber-400/10 text-xs text-amber-700 dark:text-amber-400">
                <Shield className="w-3.5 h-3.5 shrink-0" />
                Interface intégrée dans un bac à sable sécurisé. Vos données AfriBiz ne sont
                jamais partagées avec le module.
              </div>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Package className="w-12 h-12 text-gray-400" />}
                title="Pas d'interface intégrée"
                description="Ce module ne fournit pas de dashboard intégré. Ouvrez-le dans un nouvel onglet ou consultez sa documentation développeur."
              />
            </div>
          )}
        </Card>
      </div>

      <ConfirmationModal
        open={confirmUninstall}
        onClose={() => setConfirmUninstall(false)}
        onConfirm={() => uninstallMutation.mutate()}
        title="Désinstaller ce module ?"
        description={`Vous perdrez l'accès à « ${module.name} » et ses données associées sur votre business. Cette action peut être annulée en réinstallant le module.`}
        confirmLabel={uninstallMutation.isPending ? 'Désinstallation…' : 'Désinstaller'}
        variant="danger"
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </div>
  );
}
