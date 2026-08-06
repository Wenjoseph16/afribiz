'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/dashboard/PageHeader';

// Chargement différé du wizard (lourd : QR code, steps, framer-motion)
const OnboardingWizard = dynamic(
  () =>
    import('@/features/onboarding/OnboardingWizard').then((mod) => ({
      default: mod.OnboardingWizard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-96 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    ),
  }
);

export default function BusinessOnboardingPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Lancer votre business"
        description="Configurez votre page publique en 4 étapes — votre boutique en ligne est prête en quelques minutes."
        breadcrumbs={[{ label: 'Business' }, { label: 'Onboarding' }]}
      />
      <OnboardingWizard />
    </div>
  );
}
