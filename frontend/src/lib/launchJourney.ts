export interface LaunchJourneyStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
}

export interface LaunchJourneyState {
  progressScore: number;
  currentStep: LaunchJourneyStep;
  steps: LaunchJourneyStep[];
}

interface LaunchJourneyInput {
  hasProfile: boolean;
  hasPublicPage: boolean;
  hasProducts: boolean;
  hasPayments: boolean;
  hasPromotions: boolean;
}

export function buildLaunchJourneyState(input: LaunchJourneyInput): LaunchJourneyState {
  const steps: LaunchJourneyStep[] = [
    {
      id: 'profile',
      title: 'Finaliser votre profil',
      description: 'Renseignez votre identité, vos coordonnées et vos préférences.',
      done: input.hasProfile,
      href: '/dashboard/profile',
    },
    {
      id: 'public-page',
      title: 'Créer votre page publique',
      description: 'Présentez votre business avec une page claire et attractive.',
      done: input.hasPublicPage,
      href: '/dashboard/public-page',
    },
    {
      id: 'products',
      title: 'Publier vos premiers produits',
      description: 'Mettez en ligne vos services ou produits pour générer du trafic.',
      done: input.hasProducts,
      href: '/dashboard/products/new',
    },
    {
      id: 'payments',
      title: 'Activer les paiements',
      description: 'Recevez des paiements avec une expérience fiable et rapide.',
      done: input.hasPayments,
      href: '/dashboard/settings',
    },
    {
      id: 'offers',
      title: 'Lancer votre première offre',
      description: 'Créez une promotion pour convertir votre visibilité en ventes.',
      done: input.hasPromotions,
      href: '/dashboard/promotions/new',
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  const progressScore = Math.round((completed / steps.length) * 100);
  const currentStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];

  return { progressScore, currentStep, steps };
}
