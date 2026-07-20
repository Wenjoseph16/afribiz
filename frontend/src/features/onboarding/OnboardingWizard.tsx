'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Globe,
} from 'lucide-react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/ToastProvider';
import type {
  OnboardingData,
  BusinessModule,
  BusinessType,
  OnboardingPaymentMethod,
} from '@/types/business';
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
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    name: '',
    type: '',
    shortDescription: '',
    phone: '',
    whatsapp: '',
    address: '',
    region: '',
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
    setData((prev) => ({ ...prev, ...partial }));
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
        setCreatedSlug(res.data.data?.slug || null);
      } else {
        setError(res.data.error || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!createdSlug) return;
    navigator.clipboard.writeText(`${window.location.origin}/business/${createdSlug}`);
    addToast({ title: 'Lien copié !', variant: 'success' });
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  if (createdSlug) {
    const publicUrl = `${window.location.origin}/business/${createdSlug}`;
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Félicitations !</h2>
            <p className="text-emerald-100 text-sm mt-1">Votre page publique est prête</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <QRCode value={publicUrl} size={160} level="L" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Votre lien public</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-brand truncate max-w-[260px]">
                  {publicUrl}
                </span>
                <button
                  onClick={copyLink}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Prochaines étapes
              </p>
              <div className="space-y-2">
                {[
                  {
                    icon: Globe,
                    label: 'Compléter votre profil public',
                    href: '/dashboard/public-page',
                  },
                  {
                    icon: ShieldCheck,
                    label: 'Passer en niveau Or ou Platine',
                    href: '/dashboard/business/verification',
                  },
                  {
                    icon: Smartphone,
                    label: 'Configurer vos moyens de paiement',
                    href: '/dashboard/settings',
                  },
                ].map((step) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-brand/10 text-brand">
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {step.label}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={publicUrl} className="flex-1">
                <Button variant="outline" fullWidth>
                  <ExternalLink className="w-4 h-4" />
                  Voir ma page
                </Button>
              </Link>
              <Link href="/dashboard/business" className="flex-1">
                <Button variant="primary" fullWidth>
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  currentStep === step.id && 'bg-brand text-white ring-4 ring-brand/20',
                  currentStep > step.id && 'bg-brand text-white',
                  currentStep < step.id && 'bg-gray-100 text-gray-400'
                )}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'text-sm font-medium hidden sm:inline',
                  currentStep === step.id && 'text-brand',
                  currentStep > step.id && 'text-gray-900',
                  currentStep < step.id && 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-12 sm:w-20 h-0.5 mx-2 sm:mx-3',
                  currentStep > step.id ? 'bg-brand' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
        {currentStep === 1 && <StepIdentity data={data} onChange={updateData} />}
        {currentStep === 2 && (
          <StepModules
            selected={data.modules as BusinessModule[]}
            onChange={(modules) => updateData({ modules: modules as string[] })}
          />
        )}
        {currentStep === 3 && (
          <StepPayment
            paymentMethods={data.paymentMethods || []}
            onChange={(methods: OnboardingPaymentMethod[]) =>
              updateData({ paymentMethods: methods })
            }
          />
        )}
        {currentStep === 4 && <StepSummary data={data} onChange={updateData} />}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {currentStep < 4 ? (
          <Button onClick={nextStep}>
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={submitting} disabled={submitting}>
            {submitting ? 'Création en cours...' : 'Créer mon business'}
            {!submitting && <Check className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
