'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import type { OnboardingData, BusinessModule, BusinessType, OnboardingPaymentMethod } from '@/types/business';
import { StepIdentity } from './steps/StepIdentity';
import { StepModules } from './steps/StepModules';
import { StepPayment } from './steps/StepPayment';
import { StepSummary } from './steps/StepSummary';

const STEPS = [
  { id: 1, label: 'Identité' },
  { id: 2, label: 'Modules' },
  { id: 3, label: 'Paiement' },
  { id: 4, label: 'Récapitulatif' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    name: '',
    type: '',
    shortDescription: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    country: 'Togo',
    latitude: 6.1319,
    longitude: 1.2228,
    logo: '',
    coverImage: '',
    managerName: '',
    managerBio: '',
    experience: undefined,
    skills: [],
    certifications: [],
    website: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    linkedin: '',
    modules: [],
    paymentMethods: [],
  });

  const updateData = (partial: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...partial }));
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createBusiness(data);
      if (res.data.success) {
        if (user) {
          setUser({
            ...user,
            primaryRole: 'BUSINESS',
            roles: Array.from(new Set([...user.roles, 'BUSINESS'])),
          });
        }
        router.push('/dashboard/business');
      } else {
        setError(res.data.error || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(s => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                currentStep === step.id && 'bg-brand text-white ring-4 ring-brand/20',
                currentStep > step.id && 'bg-brand text-white',
                currentStep < step.id && 'bg-gray-100 text-gray-400',
              )}>
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className={cn(
                'text-sm font-medium hidden sm:inline',
                currentStep === step.id && 'text-brand',
                currentStep > step.id && 'text-gray-900',
                currentStep < step.id && 'text-gray-400',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-12 sm:w-20 h-0.5 mx-2 sm:mx-3',
                currentStep > step.id ? 'bg-brand' : 'bg-gray-200',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        {currentStep === 1 && (
          <StepIdentity data={data} onChange={updateData} />
        )}
        {currentStep === 2 && (
          <StepModules selected={data.modules as BusinessModule[]} onChange={(modules) => updateData({ modules: modules as string[] })} />
        )}
        {currentStep === 3 && (
          <StepPayment
            paymentMethods={data.paymentMethods || []}
            onChange={(methods: OnboardingPaymentMethod[]) => updateData({ paymentMethods: methods })}
          />
        )}
        {currentStep === 4 && (
          <StepSummary data={data} onChange={updateData} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {currentStep < 4 ? (
          <Button onClick={nextStep}>
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            isLoading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Création en cours...' : 'Créer mon business'}
            {!submitting && <Check className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
