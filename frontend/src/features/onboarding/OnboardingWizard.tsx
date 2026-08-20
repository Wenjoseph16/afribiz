'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Rocket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useToast } from '@/components/ui/ToastProvider';
import { OnboardingStepper, type OnboardingStepDef } from '@/components/onboarding/OnboardingStepper';
import { OnboardingLivePreview } from '@/components/onboarding/OnboardingLivePreview';
import { OnboardingSuccess } from '@/components/onboarding/OnboardingSuccess';
import type { OnboardingData } from '@/types/business';
import StepIdentity from './steps/StepIdentity';
import StepExpertise from './steps/StepExpertise';
import StepPortfolio from './steps/StepPortfolio';
import StepLocation from './steps/StepLocation';
import StepModules from './steps/StepModules';

const STEPS: OnboardingStepDef[] = [
  { id: 1, label: 'Identité', caption: 'Nom & marque' },
  { id: 2, label: 'Compétences', caption: 'Expérience' },
  { id: 3, label: 'Portfolio', caption: 'Réalisations' },
  { id: 4, label: 'Localisation', caption: 'Adresse & horaires' },
  { id: 5, label: 'Modules', caption: 'Vos outils' },
];

const initialData: OnboardingData = {
  name: '',
  typeId: '',
  description: '',
  logo: null,
  banner: null,
  competencies: [],
  experienceDescription: '',
  experienceYears: '',
  certificates: [],
  portfolio: [],
  country: 'Togo',
  region: '',
  city: '',
  quarter: '',
  address: '',
  latitude: null,
  longitude: null,
  phone: '',
  whatsapp: null,
  openingHours: {},
  modules: ['PRODUCTS', 'ORDERS', 'PROMOTIONS'],
};

export function OnboardingWizard() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { setBusiness } = useBusinessStore();
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [createdSlug, setCreatedSlug] = useState('');
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!data.name.trim()) return 'Donnez un nom à votre business pour continuer.';
        if (!data.typeId) return 'Sélectionnez le type de votre activité.';
        if (!data.description.trim()) return 'Ajoutez une description courte.';
        return null;
      case 2:
        if (data.competencies.length < 3) return 'Ajoutez au moins 3 compétences.';
        if (!data.experienceYears) return 'Sélectionnez vos années d\'expérience.';
        return null;
      case 4:
        if (!data.city.trim()) return 'Indiquez la ville de votre business.';
        if (!data.phone.trim()) return 'Ajoutez un numéro de téléphone.';
        return null;
      case 5:
        if (data.modules.length === 0) return 'Sélectionnez au moins un module.';
        return null;
      default:
        return null;
    }
  };

  const nextStep = () => {
    const err = validateStep(currentStep);
    if (err) { setError(err); return; }
    setError(null);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const err = validateStep(5);
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError(null);
    try {
      // Transformer les champs frontend → backend (onboardingSchema)
      const payload = {
        name: data.name,
        type: data.typeId,
        shortDescription: data.description,
        phone: data.phone,
        whatsapp: data.whatsapp || undefined,
        address: [data.quarter, data.address].filter(Boolean).join(', ') || data.city,
        region: data.region || undefined,
        city: data.city,
        country: data.country,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        logo: data.logo || undefined,
        coverImage: data.banner || undefined,
        managerBio: data.experienceDescription || undefined,
        experience: data.experienceYears ? parseInt(data.experienceYears) || undefined : undefined,
        skills: data.competencies,
        certifications: data.certificates.map((c) => c.name + (c.issuer ? ` — ${c.issuer}` : '')),
        modules: data.modules.filter((m) =>
          ['PRODUCTS','SERVICES','MENU','ROOMS','BOOKINGS','ORDERS','QUOTES_INVOICES',
           'DEBTS_PAYMENTS','PROMOTIONS','PLANNING','EMPLOYEES','PORTFOLIO',
           'SUBSCRIPTIONS','DELIVERIES','EVENTS','RENTALS','DOCUMENTS','PARTNERS',
           'DISPUTES','MODULE_MARKETPLACE','ADVANCED_TASKS','TRAINING'].includes(m)
        ),
        // Horaires d'ouverture (Step 4)
        openingHours: data.openingHours || {},
        // Portfolio (Step 3)
        portfolio: data.portfolio.map((item) => ({
          title: item.title,
          description: item.description || undefined,
          imageUrl: item.imageUrl || undefined,
          linkUrl: item.linkUrl || undefined,
        })),
      };
      const res = await apiClient.createBusiness(payload);
      if (res.data.success) {
        const slug = res.data.data?.slug || data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        setCreatedSlug(slug);
        if (user) {
          setUser({
            ...user,
            primaryRole: 'BUSINESS',
            roles: Array.from(new Set([...user.roles, 'BUSINESS'])),
          });
        }
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const rr = await apiClient.post('/auth/refresh', { refreshToken });
            if (rr.data?.success && rr.data?.data?.accessToken) {
              useAuthStore.getState().setTokens(rr.data.data.accessToken, rr.data.data.refreshToken);
            }
          }
        } catch { /* non-blocking */ }
        try {
          const myBiz = await apiClient.getMyBusiness();
          if (myBiz.data?.data) setBusiness(myBiz.data.data);
        } catch { /* non-blocking */ }
        setCompleted(true);
        return;
      }
      setError(res.data.error || 'Une erreur est survenue');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepIdentity data={data} onChange={updateData} />;
      case 2: return <StepExpertise data={data} onChange={updateData} />;
      case 3: return <StepPortfolio data={data} onChange={updateData} />;
      case 4: return <StepLocation data={data} onChange={updateData} />;
      case 5: return <StepModules data={data} onChange={updateData} />;
      default: return null;
    }
  };

  if (completed && createdSlug) {
    return <OnboardingSuccess businessSlug={createdSlug} businessName={data.name} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Lancez votre business
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
          Configurez votre page publique et vos outils en 5 étapes. La prévisualisation à droite
          se met à jour en temps réel.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-6">
        <OnboardingStepper steps={STEPS} current={currentStep} onStepClick={goToStep} />
      </div>

      {/* Split-screen 60/40 */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Formulaire */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            {/* Step badge */}
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {currentStep}
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-white/40">
                Étape {currentStep} sur {STEPS.length}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Erreur */}
            {error && (
              <div className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={nextStep}>
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
                  {submitting ? 'Création en cours...' : 'Lancer mon business'}
                  {!submitting && <Rocket className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="lg:sticky lg:top-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Prévisualisation en temps réel
            </div>
            <OnboardingLivePreview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
