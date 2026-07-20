'use client';

import { useState } from 'react';
import {
  Package,
  ExternalLink,
  Star,
  Clock,
  Loader2,
  Sparkles,
  Calendar,
  RefreshCw,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { CopilotTips } from '@/components/copilot/CopilotTips';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {
  useBusinessInstalledModules,
  useConfirmModuleUpdate,
  useReinstallModule,
} from '@/features/developerHooks';

interface UpdateModalData {
  installationId: string;
  moduleName: string;
  latestVersion: string;
  hasUpdate: boolean;
}

export default function BusinessModulesPage() {
  const { data: installations, isLoading } = useBusinessInstalledModules();
  const confirmUpdate = useConfirmModuleUpdate();
  const reinstallModule = useReinstallModule();
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'expired'>('all');
  const [updateModal, setUpdateModal] = useState<UpdateModalData | null>(null);

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const modules = Array.isArray(installations) ? installations : [];
  const filteredModules = modules.filter((inst: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return inst.status === 'ACTIVE' && !inst.isTrial;
    if (filter === 'trial') return inst.isTrial && !inst.trialExpired;
    if (filter === 'expired') return inst.trialExpired || inst.status === 'UNINSTALLED';
    return true;
  });

  const getStatusBadge = (inst: any) => {
    if (inst.status === 'UNINSTALLED')
      return (
        <Badge variant="danger" size="sm">
          Désinstallé
        </Badge>
      );
    if (inst.trialExpired)
      return (
        <Badge variant="danger" size="sm">
          Essai expiré
        </Badge>
      );
    if (inst.isTrial)
      return (
        <Badge variant="warning" size="sm">
          {inst.trialDaysLeft > 0 ? `Essai J-${inst.trialDaysLeft}` : 'Essai'}
        </Badge>
      );
    if (inst.status === 'ACTIVE')
      return (
        <Badge variant="success" size="sm">
          Actif
        </Badge>
      );
    return <Badge size="sm">{inst.status}</Badge>;
  };

  const handleConfirmUpdate = async () => {
    if (!updateModal) return;
    try {
      await confirmUpdate.mutateAsync(updateModal.installationId);
      setUpdateModal(null);
    } catch (e) {
      // error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes modules installés"
        description="Gérez les modules que vous avez installés sur votre business"
        breadcrumbs={[{ label: 'Business', href: '/dashboard/business' }, { label: 'Modules' }]}
        actions={
          <Link href="/dashboard/business/modules/demands">
            <Button variant="secondary" size="sm">
              <Package className="w-4 h-4 mr-1.5" />
              Demander un module
            </Button>
          </Link>
        }
      />

      <CopilotTips moduleKey="MODULES" />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: 'all', label: 'Tous' },
          { value: 'active', label: 'Actifs' },
          { value: 'trial', label: 'Essais' },
          { value: 'expired', label: 'Expirés' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === tab.value
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredModules.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-gray-400" />}
          title={
            modules.length === 0 ? 'Aucun module installé' : 'Aucun module dans cette catégorie'
          }
          description="Explorez le marketplace pour trouver des modules adaptés à votre business."
          action={
            <Link href="/marketplace/modules">
              <Button>
                <Sparkles className="w-4 h-4 mr-2" />
                Explorer le marketplace
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredModules.map((inst: any) => (
            <Card key={inst.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {inst.module?.logo ? (
                      <Image
                        src={inst.module.logo}
                        alt={inst.module.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg truncate">
                        {inst.module?.name || 'Module'}
                      </h3>
                      {inst.hasUpdate && (
                        <Badge variant="info" size="sm" className="animate-pulse">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Nouvelle version dispo
                        </Badge>
                      )}
                      {getStatusBadge(inst)}
                    </div>

                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {inst.module?.description || 'Aucune description'}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {inst.module?.developer && (
                        <span>Par {inst.module.developer.companyName || 'Développeur'}</span>
                      )}
                      {inst.module?.rating != null && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {Number(inst.module.rating).toFixed(1)}
                        </span>
                      )}
                      {inst.module?.version && <span>v{inst.module.version}</span>}
                      {inst.latestVersion && inst.latestVersion !== inst.module?.version && (
                        <span className="text-purple-600 font-medium">→ v{inst.latestVersion}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Installé le {new Date(inst.installedAt).toLocaleDateString()}
                      </span>
                      {inst.subscription && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          Échéance le{' '}
                          {new Date(inst.subscription.currentPeriodEnd).toLocaleDateString()}
                          {inst.subscription.autoRenew && ' (auto)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {inst.status === 'UNINSTALLED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => reinstallModule.mutate(inst.moduleId)}
                      isLoading={reinstallModule.isPending}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Réinstaller
                    </Button>
                  )}
                  {inst.hasUpdate && inst.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setUpdateModal({
                          installationId: inst.id,
                          moduleName: inst.module?.name || 'Module',
                          latestVersion: inst.latestVersion || inst.module?.version,
                          hasUpdate: inst.hasUpdate,
                        })
                      }
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Mettre à jour
                    </Button>
                  )}
                  <Link href={`/marketplace/${inst.module?.slug}`}>
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Mise à jour disponible</h2>
              <button
                onClick={() => setUpdateModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <RefreshCw className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">{updateModal.moduleName}</p>
                  <p className="text-xs text-gray-500">
                    Nouvelle version : v{updateModal.latestVersion}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Une nouvelle version de ce module est disponible. Confirmez la mise à jour pour
                appliquer les dernières améliorations et correctifs.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setUpdateModal(null)}>
                Annuler
              </Button>
              <Button onClick={handleConfirmUpdate} disabled={confirmUpdate.isPending}>
                {confirmUpdate.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Confirmer la mise à jour
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
