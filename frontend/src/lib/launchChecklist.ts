export interface LaunchChecklistStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
}

export interface LaunchChecklistState {
  progressScore: number;
  primaryAction: { title: string; description: string };
  steps: LaunchChecklistStep[];
}

interface LaunchChecklistInput {
  hasPublicPage: boolean;
  hasProducts: boolean;
  hasPayments: boolean;
  hasBookings: boolean;
  hasPromotions: boolean;
  hasProfile: boolean;
}

export function buildLaunchChecklistState(input: LaunchChecklistInput): LaunchChecklistState {
  const steps: LaunchChecklistStep[] = [
    {
      id: 'profile',
      title: 'Compléter votre profil',
      description: 'Ajoutez vos coordonnées, vos horaires et votre identité de marque.',
      done: input.hasProfile,
    },
    {
      id: 'public-page',
      title: 'Présenter votre business',
      description: 'Publiez votre page publique avec une image forte et une offre claire.',
      done: input.hasPublicPage,
    },
    {
      id: 'products',
      title: 'Ajouter vos produits ou services',
      description: 'Mettez en avant ce que vous vendez pour générer des conversions.',
      done: input.hasProducts,
    },
    {
      id: 'payments',
      title: 'Activer les paiements',
      description: 'Recevez des paiements rapidement avec une expérience fiable.',
      done: input.hasPayments,
    },
    {
      id: 'bookings',
      title: 'Configurer les réservations',
      description: 'Permettez à vos clients de prendre rendez-vous sans friction.',
      done: input.hasBookings,
    },
    {
      id: 'offers',
      title: 'Publier une offre',
      description: 'Lancez une promotion ou une offre spéciale pour créer de l’élan.',
      done: input.hasPromotions,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const progressScore = Math.round((completedCount / steps.length) * 100);

  const primaryAction =
    progressScore < 40
      ? {
          title: 'Présentez votre business',
          description:
            'Commencez par votre profil et votre page publique pour apparaître crédible.',
        }
      : progressScore < 80
        ? {
            title: 'Publiez une première offre',
            description:
              'Ajoutez une promotion ou un produit pour déclencher la première conversion.',
          }
        : {
            title: 'Optimisez votre rythme',
            description: 'Affinez vos réservations, vos paiements et vos relances pour accélérer.',
          };

  return { progressScore, primaryAction, steps };
}
