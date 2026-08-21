'use client';

import dynamic from 'next/dynamic';

// Chargement différé du wizard (lourd : carte, steps, framer-motion)
const OnboardingWizard = dynamic(
  () =>
    import('@/features/onboarding/OnboardingWizard').then((mod) => ({
      default: mod.OnboardingWizard,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="lg:grid lg:grid-cols-5 lg:gap-10">
        <div className="lg:col-span-3 space-y-6">
          <div className="h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
        <div className="hidden lg:block lg:col-span-2">
          <div className="h-[420px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    ),
  }
);

export default function BusinessOnboardingPage() {
  return <OnboardingWizard />;
}
