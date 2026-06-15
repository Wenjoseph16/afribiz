'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Rocket, User, Shield, Check, Building2, Code2, Star, Upload,
  ArrowRight, ChevronLeft, AlertCircle, Camera, FileText, X,
  Globe, MapPin, Phone, Mail, Briefcase, Link as LinkIcon,
  ExternalLink, Package, Users, Save,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useDeveloperActivation, useUpdateDeveloperProfile, useSubmitDeveloperVerification } from '@/features/developerHooks';

const STEPS = [
  { id: 1, label: 'Bienvenue', icon: Rocket },
  { id: 2, label: 'Profil', icon: User },
  { id: 3, label: 'Vérification', icon: Shield },
  { id: 4, label: 'Terminé', icon: Check },
];

const BENEFITS = [
  { icon: Code2, title: 'Publiez vos modules', desc: 'Créez et distribuez vos solutions sur la marketplace AfriBiz' },
  { icon: Star, title: 'Gagnez de l\'argent', desc: 'Monétisez vos créations via ventes et abonnements' },
  { icon: Shield, title: 'Support prioritaire', desc: 'Accédez à une assistance technique dédiée' },
  { icon: Rocket, title: 'Visibilité africaine', desc: 'Touchez des milliers d\'entreprises sur tout le continent' },
];

interface UploadedDoc {
  name: string;
  data: string; // base64 data URL
  file?: File;
}

export default function DeveloperOnboardingPage() {
  const router = useRouter();
  const activate = useDeveloperActivation();
  const updateProfile = useUpdateDeveloperProfile();
  const submitVerification = useSubmitDeveloperVerification();

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: '',
    bio: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    website: '',
    portfolio: '',
    github: '',
    linkedin: '',
    experience: '',
    specialties: [] as string[],
    technologies: [] as string[],
    specInput: '',
    techInput: '',
  });

  const [docs, setDocs] = useState<Record<string, UploadedDoc | null>>({
    identityDoc: null,
    companyDoc: null,
    responsiblePhoto: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const updateField = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = (key: 'specialties' | 'technologies', inputKey: 'specInput' | 'techInput') => {
    const v = form[inputKey].trim();
    if (v && !form[key].includes(v)) {
      updateField(key, [...form[key], v]);
      updateField(inputKey, '');
    }
  };

  const removeTag = (key: 'specialties' | 'technologies', value: string) => {
    updateField(key, form[key].filter((x) => x !== value));
  };

  const handleFileUpload = (docKey: string, file: File) => {
    setUploadingDoc(docKey);
    const reader = new FileReader();
    reader.onload = () => {
      setDocs((prev) => ({
        ...prev,
        [docKey]: {
          name: file.name,
          data: reader.result as string,
          file,
        },
      }));
      setUploadingDoc(null);
    };
    reader.onerror = () => {
      setUploadingDoc(null);
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (docKey: string) => {
    setDocs((prev) => ({ ...prev, [docKey]: null }));
  };

  const handleStart = async () => {
    try {
      await activate.mutateAsync();
      setStep(2);
    } catch (e) { console.error(e); }
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      if (step === 2) {
        // Save profile with all fields
        await updateProfile.mutateAsync({
          companyName: form.companyName || null,
          publicDescription: form.bio || null,
          professionalEmail: form.email || null,
          phone: form.phone || null,
          country: form.country || null,
          city: form.city || null,
          website: form.website || null,
          portfolio: form.portfolio || null,
          github: form.github || null,
          linkedin: form.linkedin || null,
          yearsOfExperience: form.experience ? Number(form.experience) : null,
          specialties: form.specialties,
          technologies: form.technologies,
        });
      }
      if (step === 3) {
        // Submit verification documents if any uploaded
        const hasDocs = docs.identityDoc || docs.companyDoc || docs.responsiblePhoto;
        if (hasDocs) {
          await submitVerification.mutateAsync({
            identityDoc: docs.identityDoc?.data || '',
            companyDoc: docs.companyDoc?.data || '',
            responsiblePhoto: docs.responsiblePhoto?.data || '',
          });
        }
      }
      setStep((s) => Math.min(s + 1, 4));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard/developer');
  };

  const isPending = activate.isPending || updateProfile.isPending || submitVerification.isPending || isSaving;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Devenir Développeur"
        description="Activez votre compte développeur et commencez à créer"
      />

      {/* Step progress bar */}
      <div className="flex items-center justify-center px-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300',
                step > s.id ? 'bg-emerald-500 text-white shadow-md' :
                step === s.id ? 'bg-brand text-white shadow-lg shadow-brand/20 ring-2 ring-brand/30' :
                'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
              )}>
                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                'text-[11px] font-medium mt-1.5 text-center whitespace-nowrap',
                step >= s.id ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500',
              )}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 w-16 sm:w-28 mx-2 rounded-full transition-colors duration-500',
                step > s.id ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700',
              )} />
            )}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {/* ===== STEP 1: BIENVENUE ===== */}
        {step === 1 && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/20 animate-float">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Bienvenue dans l&apos;espace développeur AfriBiz
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Rejoignez notre plateforme et créez des modules qui aideront des milliers d&apos;entreprises africaines à se développer.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors">
                  <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand shrink-0">
                    <b.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="gradient"
              size="lg"
              onClick={handleStart}
              isLoading={isPending}
              className="shadow-lg shadow-brand/20"
            >
              Commencer l&apos;aventure
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* ===== STEP 2: PROFIL ===== */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30">
                <User className="h-5 w-5 text-brand" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Informations du profil</h3>
                <p className="text-xs text-gray-500">Ces informations seront visibles sur votre profil public</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Input
                  label="Nom de l'entreprise *"
                  value={form.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  icon={<Building2 className="h-4 w-4" />}
                  placeholder="Ma société de développement"
                />
              </div>

              <div>
                <Input
                  label="Email professionnel"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="contact@masociete.com"
                />
              </div>
              <div>
                <Input
                  label="Téléphone"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="+228 90 00 00 00"
                />
              </div>

              <div>
                <Input
                  label="Pays"
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  icon={<MapPin className="h-4 w-4" />}
                  placeholder="Togo"
                />
              </div>
              <div>
                <Input
                  label="Ville"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  icon={<MapPin className="h-4 w-4" />}
                  placeholder="Lomé"
                />
              </div>

              <div>
                <Input
                  label="Années d'expérience"
                  value={form.experience}
                  onChange={(e) => updateField('experience', e.target.value)}
                  icon={<Briefcase className="h-4 w-4" />}
                  type="number"
                  min={0}
                  max={100}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Bio / Présentation
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring resize-none"
                placeholder="Présentez-vous en quelques lignes..."
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
            </div>

            {/* Skills: Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Spécialités</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.specialties.length === 0 && (
                  <span className="text-xs text-gray-400 italic px-1">Ajoutez vos domaines d&apos;expertise</span>
                )}
                {form.specialties.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand text-sm font-medium">
                    {s}
                    <button onClick={() => removeTag('specialties', s)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.specInput}
                  onChange={(e) => updateField('specInput', e.target.value)}
                  placeholder="Ex: E-commerce, Paiement, CRM..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('specialties', 'specInput'); } }}
                />
                <Button variant="secondary" onClick={() => addTag('specialties', 'specInput')} type="button" size="sm">Ajouter</Button>
              </div>
            </div>

            {/* Skills: Technologies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Technologies</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.technologies.length === 0 && (
                  <span className="text-xs text-gray-400 italic px-1">Ajoutez vos technologies préférées</span>
                )}
                {form.technologies.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 text-sm font-medium">
                    {t}
                    <button onClick={() => removeTag('technologies', t)} className="hover:text-red-500 transition-colors"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.techInput}
                  onChange={(e) => setForm((prev) => ({ ...prev, techInput: e.target.value }))}
                  placeholder="Ex: React, Node.js, Python..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('technologies', 'techInput'); } }}
                />
                <Button variant="secondary" onClick={() => addTag('technologies', 'techInput')} type="button" size="sm">Ajouter</Button>
              </div>
            </div>

            {/* Links */}
            <div>
              <div className="flex items-center gap-2 pb-2">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Liens</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  value={form.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="Site web"
                  icon={<Globe className="h-4 w-4" />}
                />
                <Input
                  value={form.portfolio}
                  onChange={(e) => updateField('portfolio', e.target.value)}
                  placeholder="Portfolio"
                  icon={<Briefcase className="h-4 w-4" />}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  value={form.github}
                  onChange={(e) => updateField('github', e.target.value)}
                  placeholder="GitHub (URL)"
                  icon={<Code2 className="h-4 w-4" />}
                />
                <Input
                  value={form.linkedin}
                  onChange={(e) => updateField('linkedin', e.target.value)}
                  placeholder="LinkedIn (URL)"
                  icon={<ExternalLink className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 3: VÉRIFICATION ===== */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Vérification du compte</h3>
                <p className="text-xs text-gray-500">Fournissez les documents requis pour valider votre identité</p>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                { key: 'identityDoc', label: "Pièce d'identité", icon: Camera, desc: 'Passeport, CNI ou permis de conduire', accept: 'image/*,.pdf' },
                { key: 'companyDoc', label: "Document d'entreprise", icon: FileText, desc: 'Registre de commerce, patente, ou RC', accept: 'image/*,.pdf' },
                { key: 'responsiblePhoto', label: 'Photo du responsable', icon: User, desc: 'Selfie avec votre pièce d\'identité', accept: 'image/*' },
              ].map((doc) => (
                <div key={doc.key} className={cn(
                  'relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                  docs[doc.key]
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-brand/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                )}>
                  <div className={cn(
                    'p-3 rounded-lg shrink-0',
                    docs[doc.key] ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-50 dark:bg-gray-800/50'
                  )}>
                    <doc.icon className={cn(
                      'h-6 w-6',
                      docs[doc.key] ? 'text-emerald-600' : 'text-gray-400'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.label}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.desc}</p>
                    {docs[doc.key] && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          {docs[doc.key]!.name} ({formatFileSize(docs[doc.key]!.data.length)})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {docs[doc.key] ? (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => removeDoc(doc.key)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept={doc.accept}
                          className="hidden"
                          id={`upload-${doc.key}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(doc.key, file);
                          }}
                        />
                        <label
                          htmlFor={`upload-${doc.key}`}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all',
                            'bg-brand text-white hover:bg-brand-700 shadow-sm'
                          )}
                        >
                          {uploadingDoc === doc.key ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                              Chargement...
                            </span>
                          ) : (
                            <><Upload className="h-3.5 w-3.5" /> Upload</>
                          )}
                        </label>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">Pourquoi ces documents ?</p>
                <p className="mt-1 text-xs">Ils permettent à AfriBiz de vérifier votre identité et d&apos;assurer la confiance sur la marketplace. Les documents sont stockés de manière sécurisée et ne sont pas partagés publiquement.</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 4: TERMINÉ ===== */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="relative mx-auto mb-6 w-24 h-24">
              <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl animate-ping-soft opacity-30" />
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-200/50 dark:shadow-emerald-900/30">
                <Check className="h-12 w-12 text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Félicitations ! 🎉
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Votre compte développeur est activé. Vous avez désormais accès à l&apos;espace développeur AfriBiz pour créer et publier vos modules.
            </p>

            {/* Summary cards */}
            <div className="grid sm:grid-cols-3 gap-3 mb-8 text-left">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <div className="text-brand mb-2"><Package className="h-5 w-5" /></div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Publier un module</h4>
                <p className="text-xs text-gray-500 mt-1">Créez votre premier module et publiez-le sur la marketplace</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <div className="text-brand mb-2"><Users className="h-5 w-5" /></div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Compléter le profil</h4>
                <p className="text-xs text-gray-500 mt-1">Ajoutez votre photo et vos réseaux sociaux depuis les paramètres</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                <div className="text-brand mb-2"><Shield className="h-5 w-5" /></div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Restez vérifié</h4>
                <p className="text-xs text-gray-500 mt-1">Soumettez vos documents de vérification dans votre profil</p>
              </div>
            </div>

            <Button
              variant="gradient"
              size="lg"
              onClick={handleFinish}
              className="shadow-lg shadow-brand/20"
            >
              Accéder à mon espace développeur
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      {step > 1 && step < 4 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(s - 1, 1))}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <span className="text-xs text-gray-400">
                Étape 2 sur 3 — Complétez votre profil
              </span>
            )}
            <Button
              variant="gradient"
              onClick={handleNext}
              isLoading={isPending}
            >
              {step === 2 ? 'Continuer' : step === 3 ? 'Terminer' : 'Suivant'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

