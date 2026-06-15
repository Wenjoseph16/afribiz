'use client';

import { useState, useMemo } from 'react';
import {
  Tag, ArrowUpCircle, Clock, RotateCcw, AlertTriangle,
  FileText, Package, Plus, Code, CheckCircle, XCircle,
  Save, Link, Download, Upload, Hash, Repeat,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperModules, useGetModuleVersions, useCreateModuleVersion } from '@/features/developerHooks';
import type { DeveloperModule, DeveloperModuleVersion } from '@/types/developer';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DEPRECATED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function DeveloperVersionsPage() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [form, setForm] = useState({
    version: '',
    releaseNotes: '',
    changelog: '',
    isBreaking: false,
    documentationUrl: '',
    downloadUrl: '',
    fileSize: '',
    checksum: '',
    minAppVersion: '',
  });

  const { data: modules, isLoading: modLoading, error: modError } = useDeveloperModules('PUBLISHED');
  const { data: versions, isLoading: verLoading, error: verError, refetch: refetchVersions } = useGetModuleVersions(selectedModuleId);
  const createVersion = useCreateModuleVersion();

  const moduleList = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const selectedModule = useMemo(() => {
    return moduleList.find((m: DeveloperModule) => m.id === selectedModuleId);
  }, [moduleList, selectedModuleId]);

  const versionList = useMemo(() => {
    if (!versions) return [];
    return Array.isArray(versions) ? versions : (versions.versions || versions.data || []);
  }, [versions]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      version: '', releaseNotes: '', changelog: '', isBreaking: false,
      documentationUrl: '', downloadUrl: '', fileSize: '', checksum: '', minAppVersion: '',
    });
    setShowForm(false);
  };

  const handleCreateVersion = async () => {
    if (!selectedModuleId || !form.version.trim()) return;
    try {
      const payload: Record<string, any> = {
        version: form.version.trim(),
        releaseNotes: form.releaseNotes.trim() || undefined,
        changelog: form.changelog.trim() || undefined,
        isBreaking: form.isBreaking,
        documentationUrl: form.documentationUrl.trim() || undefined,
        downloadUrl: form.downloadUrl.trim() || undefined,
        fileSize: form.fileSize ? Number(form.fileSize) : undefined,
        checksum: form.checksum.trim() || undefined,
        minAppVersion: form.minAppVersion.trim() || undefined,
      };
      await createVersion.mutateAsync({ moduleId: selectedModuleId, data: payload });
      resetForm();
      refetchVersions();
    } catch (e) { console.error(e); }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  if (modError) return <ErrorState message={modError.message} />;
  if (modLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Versions & Mises à jour"
        description="Gérez les versions, releases et mises à jour de vos modules"
        breadcrumbs={[{ label: 'Développeur', href: '/dashboard/developer' }, { label: 'Versions' }]}
      />

      {/* Module selector + actions bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-80">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Sélectionner un module</label>
          <select
            value={selectedModuleId}
            onChange={(e) => { setSelectedModuleId(e.target.value); setShowForm(false); }}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
          >
            <option value="">Choisir un module publié</option>
            {moduleList.map((m: DeveloperModule) => (
              <option key={m.id} value={m.id}>{m.name} (v{m.version || '1.0.0'})</option>
            ))}
          </select>
        </div>

        {selectedModuleId && (
          <div className="flex items-center gap-2 mt-5 sm:mt-0">
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors',
                  viewMode === 'timeline'
                    ? 'bg-brand text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                Chronologie
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-2 text-xs font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-brand text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                Liste
              </button>
            </div>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4" />
              Nouvelle version
            </Button>
          </div>
        )}
      </div>

      {/* No module selected */}
      {!selectedModuleId && (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="Sélectionnez un module"
          description="Choisissez un module publié pour voir et gérer ses versions."
        />
      )}

      {/* Selected module content */}
      {selectedModuleId && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create version form */}
            {showForm && (
              <Card className="border-2 border-brand/30">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Nouvelle version — {selectedModule?.name}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Version (semver) *"
                      value={form.version}
                      onChange={(e) => updateField('version', e.target.value)}
                      icon={<Code className="h-4 w-4" />}
                      placeholder="2.0.0"
                    />
                    <Input
                      label="Version min. application"
                      value={form.minAppVersion}
                      onChange={(e) => updateField('minAppVersion', e.target.value)}
                      icon={<Hash className="h-4 w-4" />}
                      placeholder="1.5.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Notes de version
                    </label>
                    <textarea
                      value={form.releaseNotes}
                      onChange={(e) => updateField('releaseNotes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
                      placeholder="Principales nouveautés de cette version..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Changelog détaillé
                    </label>
                    <textarea
                      value={form.changelog}
                      onChange={(e) => updateField('changelog', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
                      placeholder="Liste détaillée des modifications, correctifs, nouvelles fonctionnalités..."
                    />
                  </div>

                  {/* Breaking change toggle */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => updateField('isBreaking', !form.isBreaking)}
                        className={cn(
                          'relative w-10 h-6 rounded-full transition-colors duration-200',
                          form.isBreaking ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                          form.isBreaking ? 'translate-x-[18px]' : 'translate-x-0.5'
                        )} />
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Breaking change</span>
                    </label>
                    {form.isBreaking && (
                      <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changements non rétrocompatibles
                      </span>
                    )}
                  </div>

                  {/* Additional metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="URL de documentation"
                      value={form.documentationUrl}
                      onChange={(e) => updateField('documentationUrl', e.target.value)}
                      icon={<FileText className="h-4 w-4" />}
                      placeholder="https://docs.example.com/v2"
                    />
                    <Input
                      label="URL de téléchargement"
                      value={form.downloadUrl}
                      onChange={(e) => updateField('downloadUrl', e.target.value)}
                      icon={<Download className="h-4 w-4" />}
                      placeholder="https://cdn.example.com/module-v2.zip"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Taille du fichier (octets)"
                      value={form.fileSize}
                      onChange={(e) => updateField('fileSize', e.target.value)}
                      icon={<Upload className="h-4 w-4" />}
                      type="number"
                      min={0}
                      placeholder="1048576"
                    />
                    <Input
                      label="Checksum (SHA-256)"
                      value={form.checksum}
                      onChange={(e) => updateField('checksum', e.target.value)}
                      icon={<Hash className="h-4 w-4" />}
                      placeholder="sha256..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={resetForm}>
                      Annuler
                    </Button>
                    <Button
                      variant="gradient"
                      onClick={handleCreateVersion}
                      isLoading={createVersion.isPending}
                      disabled={!form.version.trim()}
                    >
                      <Save className="h-4 w-4" />
                      Publier la version
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Version list */}
            {verLoading ? (
              <Loader variant="spinner" size="md" />
            ) : verError ? (
              <ErrorState message={verError.message} onRetry={refetchVersions} />
            ) : versionList.length === 0 ? (
              <Card padding="lg">
                <EmptyState
                  icon={<Package className="h-8 w-8" />}
                  title="Aucune version"
                  description="Ce module n'a pas encore de version publiée."
                  action={
                    <Button size="xs" variant="primary" onClick={() => setShowForm(true)}>
                      <Plus className="h-3 w-3" />
                      Créer la première version
                    </Button>
                  }
                />
              </Card>
            ) : viewMode === 'timeline' ? (
              /* Timeline view */
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Historique — {selectedModule?.name}
                  </h3>
                  <Badge variant="default" size="sm">{versionList.length} version{versionList.length > 1 ? 's' : ''}</Badge>
                </div>
                <div className="space-y-2">
                  {versionList.map((v: DeveloperModuleVersion, idx: number) => {
                    const isCurrent = idx === 0;
                    return (
                      <div key={v.id} className="relative pl-6 pb-3 border-l-2 border-gray-200 dark:border-gray-700 last:border-transparent group">
                        <div className={cn(
                          'absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900',
                          isCurrent ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        )} />
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                v{v.version}
                              </h4>
                              {isCurrent && (
                                <Badge variant="success" size="xs">Actuelle</Badge>
                              )}
                              {v.isBreaking && (
                                <Badge variant="danger" size="xs">Breaking</Badge>
                              )}
                            </div>
                            {v.releaseNotes && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{v.releaseNotes}</p>
                            )}
                            {v.changelog && (
                              <details className="mt-1">
                                <summary className="text-xs text-brand cursor-pointer hover:underline">Voir le changelog</summary>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap">{v.changelog}</p>
                              </details>
                            )}

                            {/* Version metadata */}
                            {(v.documentationUrl || v.downloadUrl || v.fileSize || v.checksum || v.minAppVersion) && (
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-400">
                                {v.documentationUrl && (
                                  <a href={v.documentationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
                                    <FileText className="h-3 w-3" /> Docs
                                  </a>
                                )}
                                {v.downloadUrl && (
                                  <a href={v.downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
                                    <Download className="h-3 w-3" /> Télécharger
                                  </a>
                                )}
                                {v.fileSize && (
                                  <span className="inline-flex items-center gap-1"><Upload className="h-3 w-3" />{formatFileSize(v.fileSize)}</span>
                                )}
                                {v.checksum && (
                                  <span className="inline-flex items-center gap-1" title={v.checksum}>
                                    <Hash className="h-3 w-3" />{v.checksum.substring(0, 12)}...
                                  </span>
                                )}
                                {v.minAppVersion && (
                                  <span className="inline-flex items-center gap-1"><Code className="h-3 w-3" />App ≥ v{v.minAppVersion}</span>
                                )}
                              </div>
                            )}

                            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {v.publishedAt ? formatDate(v.publishedAt) : formatDate(v.createdAt)}
                              {v.status && v.status !== 'ACTIVE' && (
                                <span className={cn(
                                  'ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                                  STATUS_BADGE[v.status] || 'bg-gray-100 text-gray-500'
                                )}>
                                  {v.status === 'DEPRECATED' ? 'Dépréciée' : v.status}
                                </span>
                              )}
                            </p>
                          </div>
                          {!isCurrent && (
                            <Button variant="ghost" size="xs" className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <RotateCcw className="h-3.5 w-3.5" />
                              Rollback
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              /* List view */
              <div className="space-y-3">
                {versionList.map((ver: DeveloperModuleVersion) => (
                  <Card key={ver.id} padding="lg" className="group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/30 dark:to-purple-900/30 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                          <Code className="h-5 w-5 text-brand" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              v{ver.version}
                            </h3>
                            <span className={cn(
                              'text-[11px] font-medium px-2 py-0.5 rounded-full',
                              STATUS_BADGE[ver.status] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            )}>
                              {ver.status === 'ACTIVE' ? 'Active' : ver.status === 'DEPRECATED' ? 'Dépréciée' : ver.status}
                            </span>
                            {ver.isBreaking && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Breaking
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {ver.publishedAt
                              ? new Date(ver.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Non publiée'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {ver.releaseNotes && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Notes de version
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ver.releaseNotes}</p>
                      </div>
                    )}

                    {ver.changelog && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Changelog
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{ver.changelog}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {ver.documentationUrl && (
                        <a href={ver.documentationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand transition-colors">
                          <Link className="h-3 w-3" /> Documentation
                        </a>
                      )}
                      {ver.downloadUrl && (
                        <a href={ver.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-brand transition-colors">
                          <Download className="h-3 w-3" /> Télécharger
                        </a>
                      )}
                      {ver.fileSize && (
                        <span className="flex items-center gap-1">
                          <Upload className="h-3 w-3" /> {formatFileSize(ver.fileSize)}
                        </span>
                      )}
                      {ver.checksum && (
                        <span className="flex items-center gap-1" title={ver.checksum}>
                          <Hash className="h-3 w-3" /> {ver.checksum.substring(0, 16)}...
                        </span>
                      )}
                      {ver.minAppVersion && (
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" /> App ≥ v{ver.minAppVersion}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Informations</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Module</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedModule?.name || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Version actuelle</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">v{selectedModule?.version || '1.0.0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total versions</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{versionList.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Installations</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedModule?.totalInstalls || 0}</span>
                </div>
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Actions rapides</h3>
              <div className="space-y-2">
                <Button fullWidth variant="secondary" size="sm" onClick={() => setShowForm(true)}>
                  <ArrowUpCircle className="h-4 w-4" />
                  Nouvelle version
                </Button>
                <Button fullWidth variant="secondary" size="sm" disabled title="Fonctionnalité à venir">
                  <RotateCcw className="h-4 w-4" />
                  Rollback
                </Button>
                <Button fullWidth variant="secondary" size="sm" onClick={() => setViewMode(viewMode === 'timeline' ? 'list' : 'timeline')}>
                  <Repeat className="h-4 w-4" />
                  Vue {viewMode === 'timeline' ? 'liste' : 'chronologie'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
