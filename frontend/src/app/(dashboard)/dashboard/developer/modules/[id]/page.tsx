'use client';

import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Package, Download, DollarSign, Star, Clock, Edit3,
  Calendar, Shield, Activity, Layers,
  ImagePlus, Trash2, Upload, X, Camera,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useDeveloperModule, useGetModuleVersions, useUploadModuleImage, useUpdateDeveloperModule } from '@/features/developerHooks';
import { useModulePermissions, useModuleActivity } from '@/features/developerModulesHooks';
import type { DeveloperModule, DeveloperModuleVersion, DeveloperModuleReview, ModuleStatus, ModulePricingType } from '@/types/developer';
import { MODULE_STATUS_LABELS, PRICING_LABELS } from '@/types/developer';
import Link from 'next/link';

const STATUS_VARIANT: Record<string, 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'purple'> = {
  DRAFT: 'default',
  PENDING_REVIEW: 'warning',
  PUBLISHED: 'success',
  REJECTED: 'danger',
  ARCHIVED: 'default',
};

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params?.id as string;

  const { data: mod, isLoading, error, refetch } = useDeveloperModule(moduleId);
  const { data: versions } = useGetModuleVersions(moduleId);
  const { data: permissions } = useModulePermissions(moduleId);
  const { data: recentActivity } = useModuleActivity(moduleId, 5);
  const uploadImages = useUploadModuleImage();
  const updateModule = useUpdateDeveloperModule();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!mod) return null;

  const versionList = Array.isArray(versions) ? versions : (versions?.data || versions?.versions || []);
  const permissionList = Array.isArray(permissions) ? permissions : [];
  const activityList = Array.isArray(recentActivity) ? recentActivity : [];

  const moduleLogo = (mod as any).logo;
  const moduleImages = (mod as any).images || [];

  const formatCurrency = (v: number | null) =>
    v ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA' : 'Gratuit';

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const renderStars = (rating: number) => (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn('h-3 w-3', star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600')} />
      ))}
    </span>
  );

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      await uploadImages.mutateAsync({ moduleId, formData: fd });
    } catch (err) { console.error(err); }
    setUploadingLogo(false);
  };

  const handleScreenshotsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingScreenshots(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('screenshots', f));
      await uploadImages.mutateAsync({ moduleId, formData: fd });
    } catch (err) { console.error(err); }
    setUploadingScreenshots(false);
  };

  const handleRemoveImage = async (index: number) => {
    const updated = [...moduleImages];
    updated.splice(index, 1);
    try {
      await updateModule.mutateAsync({ id: moduleId, data: { images: updated } });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header info */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand"><Package className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Version</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">v{mod.version || '1.0.0'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><Download className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Installations</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{mod.totalInstalls || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prix</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(mod.price)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600"><Star className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Note</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{(mod.rating || 0).toFixed(1)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600"><Activity className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ventes</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{mod.totalSales || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"><Calendar className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Statut</p>
              <Badge variant={STATUS_VARIANT[mod.status] || 'default'} size="sm">
                {MODULE_STATUS_LABELS[mod.status as ModuleStatus] || mod.status}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Image Gallery Section */}
      <Card padding="lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Images du module</h2>
              <p className="text-xs text-gray-500">Logo et captures d'écran</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
            <input type="file" ref={screenshotsInputRef} onChange={handleScreenshotsUpload} accept="image/*" multiple className="hidden" />
            <Button variant="secondary" size="sm" onClick={() => logoInputRef.current?.click()} isLoading={uploadingLogo}>
              <Camera className="h-4 w-4" /> Logo
            </Button>
            <Button variant="secondary" size="sm" onClick={() => screenshotsInputRef.current?.click()} isLoading={uploadingScreenshots}>
              <Upload className="h-4 w-4" /> Captures
            </Button>
          </div>
        </div>

        {/* Logo */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Logo</p>
          {moduleLogo ? (
            <div className="relative inline-block group">
              <Image
                src={moduleLogo ?? ''}
                alt="Logo du module"
                width={80}
                height={80}
                className="rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                unoptimized
              />
              <button
                onClick={async () => {
                  try {
                    await updateModule.mutateAsync({ id: moduleId, data: { logo: null } });
                  } catch {}
                }}
                className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => logoInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-brand transition-colors"
            >
              <Camera className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Screenshots */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Captures d'écran ({moduleImages.length})
          </p>
          {moduleImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {moduleImages.map((img: string, idx: number) => (
                <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <Image src={img} alt={`Capture ${idx + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              <div
                onClick={() => screenshotsInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-brand transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">Ajouter</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => screenshotsInputRef.current?.click()}
              className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-brand transition-colors"
            >
              <ImagePlus className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ajouter des captures d'écran</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP — jusqu'à 10 fichiers</p>
            </div>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Module Info */}
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Catégorie</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{mod.category || 'Non catégorisé'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Type de tarification</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{PRICING_LABELS[mod.pricingType as ModulePricingType] || mod.pricingType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Crée le</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(mod.createdAt)}</span>
            </div>
            {mod.publishedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Publié le</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(mod.publishedAt)}</span>
              </div>
            )}
            {mod.updatedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Dernière mise à jour</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(mod.updatedAt)}</span>
              </div>
            )}
          </div>

          {mod.shortDescription && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{mod.shortDescription}</p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link href={`/dashboard/developer/modules/publish?id=${mod.id}`}>
              <Button variant="secondary" size="sm">
                <Edit3 className="h-4 w-4" /> Modifier
              </Button>
            </Link>
          </div>
        </Card>

        {/* Permissions Summary */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Permissions</h3>
            <Link href={`/dashboard/developer/modules/${moduleId}/permissions`}>
              <Button variant="ghost" size="xs">Gérer →</Button>
            </Link>
          </div>
          {permissionList.length === 0 ? (
            <EmptyState icon={<Shield className="h-8 w-8" />} title="Aucune permission" description="Ce module ne déclare pas encore de permissions." />
          ) : (
            <div className="space-y-2">
              {permissionList.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-brand" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{p.resource}</span>
                  </div>
                  <Badge variant={p.accessLevel === 'ADMIN' ? 'danger' : p.accessLevel === 'WRITE' ? 'warning' : 'success'} size="xs">
                    {p.accessLevel}
                  </Badge>
                </div>
              ))}
              {permissionList.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+{permissionList.length - 5} autres</p>
              )}
            </div>
          )}
        </Card>

        {/* Recent Versions */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Versions</h3>
            <Link href={`/dashboard/developer/versions`}>
              <Button variant="ghost" size="xs">Gérer →</Button>
            </Link>
          </div>
          {versionList.length === 0 ? (
            <EmptyState icon={<Layers className="h-8 w-8" />} title="Aucune version" description="Aucune version publiée pour ce module." />
          ) : (
            <div className="space-y-2">
              {versionList.slice(0, 5).map((ver: DeveloperModuleVersion) => (
                <div key={ver.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-brand" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">v{ver.version}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {ver.publishedAt ? formatDate(ver.publishedAt) : 'Non publiée'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activité récente</h3>
            <Link href={`/dashboard/developer/modules/${moduleId}/activity`}>
              <Button variant="ghost" size="xs">Voir tout →</Button>
            </Link>
          </div>
          {activityList.length === 0 ? (
            <EmptyState icon={<Activity className="h-8 w-8" />} title="Aucune activité" description="Aucune activité récente pour ce module." />
          ) : (
            <div className="space-y-2">
              {activityList.slice(0, 5).map((a: any) => (
                <div key={a.id || Math.random()} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{a.description || a.activityType}</p>
                    <p className="text-xs text-gray-400">{a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
