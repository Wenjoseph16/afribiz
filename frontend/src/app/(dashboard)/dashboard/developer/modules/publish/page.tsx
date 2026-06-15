'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText, DollarSign, Tag, Save, Info,
  ImagePlus, Camera, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCreateDeveloperModule, useUploadModuleImage } from '@/features/developerHooks';
import { MODULE_CATEGORIES, PRICING_LABELS } from '@/types/developer';
import type { ModulePricingType } from '@/types/developer';

const PRICING_OPTIONS: ModulePricingType[] = ['FREE', 'ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTRIAL', 'YEARLY', 'CUSTOM'];

export default function PublishModulePage() {
  const router = useRouter();
  const createModule = useCreateDeveloperModule();
  const uploadImages = useUploadModuleImage();

  const logoInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);
  const [createdModuleId, setCreatedModuleId] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'images'>('form');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [uploadedScreenshots, setUploadedScreenshots] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    tags: '',
    pricingType: 'FREE' as ModulePricingType,
    price: '',
    currency: 'XAF',
    installationGuide: '',
    requirements: '',
  });

  const update = useCallback((field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async () => {
    try {
      const payload: any = {
        name: form.name,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription || undefined,
        category: form.category,
        pricingType: form.pricingType,
        currency: form.currency,
        installationGuide: form.installationGuide || undefined,
      };
      if (form.price) payload.price = Number(form.price);
      if (form.tags.trim()) payload.tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      if (form.requirements.trim()) payload.requires = form.requirements.split(',').map((t: string) => t.trim()).filter(Boolean);
      const res = await createModule.mutateAsync(payload);
      const newModuleId = (res?.data?.data as any)?.id;
      if (newModuleId) {
        setCreatedModuleId(newModuleId);
        setStep('images');
      } else {
        router.push('/dashboard/developer/modules');
      }
    } catch (e) { console.error(e); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !createdModuleId) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      await uploadImages.mutateAsync({ moduleId: createdModuleId, formData: fd });
      setUploadedLogo(file.name);
    } catch (err) { console.error(err); }
    setUploadingLogo(false);
  };

  const handleScreenshotsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !createdModuleId) return;
    setUploadingScreenshots(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('screenshots', f));
      await uploadImages.mutateAsync({ moduleId: createdModuleId, formData: fd });
      setUploadedScreenshots((prev) => [...prev, ...Array.from(files).map((f) => f.name)]);
    } catch (err) { console.error(err); }
    setUploadingScreenshots(false);
  };

  // After upload success, allow navigating to the module detail
  // ===== RENDER =====

  if (createModule.error) return <ErrorState message={createModule.error.message} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Publier un module"
        description="Remplissez les informations ci-dessous pour créer et publier votre module sur la marketplace"
        breadcrumbs={[
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Modules', href: '/dashboard/developer/modules' },
          { label: 'Publier' },
        ]}
      />

      {step === 'images' && createdModuleId ? (
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Module créé avec succès !</h2>
              <p className="text-xs text-gray-500">Ajoutez des images pour valoriser votre module sur la marketplace</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Logo */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo du module</p>
              <div className="flex items-center gap-4">
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-brand transition-colors"
                >
                  {uploadingLogo ? (
                    <Loader variant="spinner" size="sm" />
                  ) : (
                    <Camera className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                {uploadedLogo && <p className="text-sm text-gray-500">✓ {uploadedLogo}</p>}
                {!uploadedLogo && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ajoutez un logo pour votre module</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WebP — 200x200px recommandé</p>
                  </div>
                )}
              </div>
            </div>

            {/* Screenshots */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Captures d'écran ({uploadedScreenshots.length})</p>
              <input type="file" ref={screenshotsInputRef} onChange={handleScreenshotsUpload} accept="image/*" multiple className="hidden" />
              <div
                onClick={() => screenshotsInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-brand transition-colors"
              >
                {uploadingScreenshots ? (
                  <Loader variant="spinner" size="sm" />
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour ajouter des captures d'écran</p>
                    <p className="text-xs text-gray-400 mt-1">Jusqu'à 10 fichiers — PNG, JPG, WebP</p>
                  </>
                )}
              </div>
              {uploadedScreenshots.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {uploadedScreenshots.map((name, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                      ✓ {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button variant="secondary" onClick={() => router.push('/dashboard/developer/modules')}>
              Voir mes modules
            </Button>
            <Link href={`/dashboard/developer/modules/${createdModuleId}`}>
              <Button variant="gradient">
                <ArrowRight className="h-4 w-4" />
                Voir le détail
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
      <div className="max-w-3xl space-y-6">
        {/* Informations générales */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Informations générales</h2>
              <p className="text-xs text-gray-500">Les informations de base de votre module</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nom du module *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Mon module"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description courte *</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => update('shortDescription', e.target.value)}
                placeholder="Brève description du module"
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
              />
              <p className="text-xs text-gray-400 mt-1">{form.shortDescription.length}/200</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Catégorie *</label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {MODULE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags (optionnel)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="commerce, paiement, mobile"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
                />
                <p className="text-xs text-gray-400 mt-1">Séparés par des virgules</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Pricing</h2>
              <p className="text-xs text-gray-500">Définissez le modèle de tarification</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de tarification *</label>
                <select
                  value={form.pricingType}
                  onChange={(e) => update('pricingType', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
                >
                  {PRICING_OPTIONS.map((pt) => (
                    <option key={pt} value={pt}>{PRICING_LABELS[pt]}</option>
                  ))}
                </select>
              </div>
              {form.pricingType !== 'FREE' && form.pricingType !== 'CUSTOM' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prix</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => update('price', e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Devise</label>
                <select
                  value={form.currency}
                  onChange={(e) => update('currency', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
                >
                  <option value="XAF">FCFA (XAF)</option>
                  <option value="XOF">FCFA (XOF)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">Dollar (USD)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Description */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Description</h2>
              <p className="text-xs text-gray-500">Description détaillée de votre module</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description complète</label>
              <textarea
                value={form.fullDescription}
                onChange={(e) => update('fullDescription', e.target.value)}
                rows={8}
                placeholder="Description détaillée du module, fonctionnalités, avantages pour les utilisateurs..."
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Configuration */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Configuration</h2>
              <p className="text-xs text-gray-500">Instructions et prérequis techniques</p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Guide d'installation</label>
              <textarea
                value={form.installationGuide}
                onChange={(e) => update('installationGuide', e.target.value)}
                rows={5}
                placeholder="Instructions d'installation détaillées pour les utilisateurs..."
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prérequis / Dépendances</label>
              <input
                type="text"
                value={form.requirements}
                onChange={(e) => update('requirements', e.target.value)}
                placeholder="Module A, Module B"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
              />
              <p className="text-xs text-gray-400 mt-1">Séparés par des virgules</p>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
          <Button
            variant="gradient"
            size="lg"
            onClick={handleSubmit}
            isLoading={createModule.isPending}
            disabled={!form.name || !form.shortDescription || !form.category}
          >
            <Save className="h-4 w-4" />
            Publier le module
          </Button>
        </div>
      </div>
    )}
  </div>
  );
}
