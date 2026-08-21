'use client';

import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/dashboard/PageHeader';

const OnboardingDevWizard = dynamic(() => import('@/features/onboarding-dev/OnboardingDevWizard'), {
  ssr: false,
  loading: () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Devenir Développeur" />
      <div className="h-96 rounded-2xl bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
    </div>
  ),
});

export default function DeveloperOnboardingPage() {
  return <OnboardingDevWizard />;
}
