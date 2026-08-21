'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  User,
  Layers,
  FolderOpen,
  Award,
  ShieldCheck,
  Check,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import {
  useDeveloperActivation,
  useDeveloperProfile,
  useUpdateDeveloperProfile,
  useSubmitDeveloperVerification,
} from '@/features/developerHooks';
import { emptyDevOnboardingData, type DevOnboardingData } from '@/types/developer';
import { computeStrength } from './upload';
import StepWelcome from './steps/StepWelcome';
import StepIdentity from './steps/StepIdentity';
import StepExpertise from './steps/StepExpertise';
import StepPortfolio from './steps/StepPortfolio';
import StepCertifications from './steps/StepCertifications';
import StepVerify from './steps/StepVerify';

const STEPS = [
  { id: 1, label: 'Bienvenue', icon: Rocket },
  { id: 2, label: 'Identité', icon: User },
  { id: 3, label: 'Expertise', icon: Layers },
  { id: 4, label: 'Portfolio', icon: FolderOpen },
  { id: 5, label: 'Certifications', icon: Award },
  { id: 6, label: 'Vérification', icon: ShieldCheck },
];

export default function OnboardingDevWizard() {
  const router = useRouter();
  const activate = useDeveloperActivation();
  const updateProfile = useUpdateDeveloperProfile();
  const submitVerification = useSubmitDeveloperVerification();
  const { user } = useAuthStore();
  const { data: existingProfile, isLoading: profileLoading } = useDeveloperProfile();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<DevOnboardingData>(emptyDevOnboardingData());
  const [hasIdentityDoc, setHasIdentityDoc] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Pré-remplissage : profil existant > compte utilisateur
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setData((prev) => {
      const next = { ...prev };
      if (user) {
        const extended = user as typeof user & { country?: string; city?: string };
        next.companyName = next.companyName || `${user.firstName} ${user.lastName}`.trim();
        next.professionalEmail = next.professionalEmail || user.email || '';
        next.phone = next.phone || user.phone || '';
        next.country = next.country || extended.country || '';
        next.city = next.city || extended.city || '';
      }
      return next;
    });
  }, [hydrated, user]);

  // Reprise : si un profil existe déjà (activation faite), pré-remplir et sauter l'étape 1
  useEffect(() => {
    if (!existingProfile) return;
    setActivated(true);
    setHasIdentityDoc(!!existingProfile.identityDocument);
    setData((prev) => ({
      ...prev,
      photo: prev.photo || existingProfile.photo || '',
      companyLogo: prev.companyLogo || existingProfile.companyLogo || '',
      companyName: prev.companyName || existingProfile.companyName || '',
      bio: prev.bio || existingProfile.publicDescription || '',
      phone: prev.phone || existingProfile.phone || '',
      professionalEmail: prev.professionalEmail || existingProfile.professionalEmail || '',
      country: prev.country || existingProfile.country || '',
      city: prev.city || existingProfile.city || '',
      yearsOfExperience: prev.yearsOfExperience ?? existingProfile.yearsOfExperience ?? null,
      expertise:
        prev.expertise.coreStack.length === 0 && existingProfile.expertise
          ? {
              coreStack: existingProfile.expertise.coreStack ?? [],
              domains: existingProfile.expertise.domains ?? [],
            }
          : prev.expertise,
      github: prev.github || existingProfile.github || '',
      gitlab: prev.gitlab || existingProfile.gitlab || '',
      linkedin: prev.linkedin || existingProfile.linkedin || '',
      website: prev.website || existingProfile.website || '',
      portfolioUrl: prev.portfolioUrl || existingProfile.portfolio || '',
      portfolioItems:
        prev.portfolioItems.length === 0
          ? (existingProfile.portfolioItems ?? [])
          : prev.portfolioItems,
      certifications:
        prev.certifications.length === 0
          ? (existingProfile.certifications ?? [])
          : prev.certifications,
    }));
    if (existingProfile.verificationStatus !== 'VERIFIED') {
      setStep((s) => (s === 1 ? 2 : s));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProfile]);

  const update = (partial: Partial<DevOnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const strength = useMemo(() => computeStrength(data, hasIdentityDoc), [data, hasIdentityDoc]);

  const isPending = activate.isPending || updateProfile.isPending || submitVerification.isPending;

  const handleStart = async () => {
    setError('');
    try {
      await activate.mutateAsync();
      setActivated(true);
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Échec de l'activation du compte développeur");
    }
  };

  const handleNext = async () => {
    setError('');
    try {
      if (step === 2) {
        if (!data.companyName.trim()) throw new Error("Le nom d'affichage est requis");
        await updateProfile.mutateAsync({
          companyName: data.companyName.trim(),
          publicDescription: data.bio.trim() || null,
          phone: data.phone.trim() || null,
          professionalEmail: data.professionalEmail.trim() || null,
          country: data.country.trim() || null,
          city: data.city.trim() || null,
          photo: data.photo || '',
          companyLogo: data.companyLogo || '',
        });
      }
      if (step === 3) {
        if (data.expertise.coreStack.length === 0)
          throw new Error('Ajoutez au moins une technologie à votre stack principale');
        await updateProfile.mutateAsync({
          expertise: data.expertise,
          yearsOfExperience: data.yearsOfExperience ?? null,
          github: data.github.trim() || null,
          gitlab: data.gitlab.trim() || null,
          linkedin: data.linkedin.trim() || null,
          website: data.website.trim() || null,
          portfolio: data.portfolioUrl.trim() || null,
        });
      }
      if (step === 4) {
        await updateProfile.mutateAsync({ portfolioItems: data.portfolioItems });
      }
      if (step === 5) {
        await updateProfile.mutateAsync({ certifications: data.certifications });
      }
      if (step === 6) {
        // La soumission des documents est gérée dans StepVerify ; ici on finalise.
        router.push('/dashboard/developer');
        return;
      }
      setStep((s) => Math.min(s + 1, 6));
    } catch (e: any) {
      setError(e?.message || e?.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, activated ? 2 : 1));

  const stepProps = { data, update, disabled: isPending };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Devenir Développeur"
        description="Construisez un profil de confiance et publiez vos modules"
      />

      {/* Stepper */}
      <div className="flex items-start justify-center px-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center w-16 sm:w-auto">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300',
                  step > s.id
                    ? 'bg-emerald-500 text-white shadow-md'
                    : step === s.id
                      ? 'bg-brand text-white shadow-lg shadow-brand/20 ring-2 ring-brand/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                )}
              >
                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium mt-1.5 text-center whitespace-nowrap',
                  step >= s.id
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500'
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-8 sm:w-14 mx-1.5 mt-5 rounded-full transition-colors duration-500',
                  step > s.id ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card padding="lg">
        {profileLoading && !activated ? (
          <div className="py-16 text-center text-sm text-gray-400">Chargement du profil…</div>
        ) : (
          <>
            {step === 1 && <StepWelcome onStart={handleStart} isLoading={isPending} />}
            {step === 2 && <StepIdentity {...stepProps} />}
            {step === 3 && <StepExpertise {...stepProps} />}
            {step === 4 && <StepPortfolio {...stepProps} />}
            {step === 5 && <StepCertifications {...stepProps} />}
            {step === 6 && (
              <StepVerify
                data={data}
                onIdentityDocChange={setHasIdentityDoc}
                strength={strength}
                verificationStatus={existingProfile?.verificationStatus}
                rejectionReason={existingProfile?.rejectionReason}
                disabled={isPending}
              />
            )}
          </>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2.5">
            {error}
          </p>
        )}
      </Card>

      {/* Navigation */}
      {step > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={handleBack} disabled={isPending}>
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              Profil complété à {strength}%
            </span>
            <Button variant="gradient" onClick={handleNext} isLoading={isPending}>
              {step === 6 ? 'Accéder à mon espace' : 'Continuer'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
