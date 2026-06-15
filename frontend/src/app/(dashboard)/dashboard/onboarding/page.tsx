import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard';
import { PageHeader } from '@/components/dashboard/PageHeader';

export default function OnboardingPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Configuration de votre business"
        description="Créez votre espace professionnel en quelques étapes"
      />
      <OnboardingWizard />
    </div>
  );
}
