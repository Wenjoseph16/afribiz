export interface DashboardWorkflowState {
  progressScore: number;
  healthMessage: string;
  focusAreas: Array<{ title: string; description: string }>;
  nextActions: Array<{ title: string; description: string }>;
}

interface DashboardWorkflowInput {
  orders: Array<{ status?: string }>;
  bookings: Array<{ status?: string }>;
  payments: Array<{ status?: string }>;
  promotions: Array<unknown>;
  notifications: Array<{ read?: boolean }>;
  loyaltyPoints: number;
}

export function buildDashboardWorkflowState(input: DashboardWorkflowInput): DashboardWorkflowState {
  const pendingOrders = input.orders.filter(
    (order) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(order.status ?? '')
  ).length;
  const upcomingBookings = input.bookings.filter(
    (booking) => booking.status === 'CONFIRMED' || booking.status === 'PENDING'
  ).length;
  const pendingPayments = input.payments.filter((payment) => payment.status === 'pending').length;
  const unreadNotifications = input.notifications.filter(
    (notification) => !notification.read
  ).length;

  const progressScore = Math.min(
    100,
    35 +
      pendingOrders * 8 +
      upcomingBookings * 10 +
      pendingPayments * 12 +
      (input.loyaltyPoints > 0 ? 10 : 0) +
      (input.promotions.length > 0 ? 8 : 0) +
      (unreadNotifications > 0 ? 3 : 0)
  );

  const focusAreas = [
    {
      title: pendingOrders > 0 ? 'Commandes en cours' : 'Prochaine action',
      description:
        pendingOrders > 0
          ? `${pendingOrders} commande(s) demandent de l’attention.`
          : 'Publiez votre première offre pour démarrer votre activité.',
    },
    {
      title: upcomingBookings > 0 ? 'Réservations' : 'Cadence de travail',
      description:
        upcomingBookings > 0
          ? `${upcomingBookings} réservation(s) à venir.`
          : 'Ajoutez un service ou une disponibilité pour générer des rendez-vous.',
    },
    {
      title: pendingPayments > 0 ? 'Paiements' : 'Monnaie disponible',
      description:
        pendingPayments > 0
          ? `${pendingPayments} paiement(s) nécessitent une validation.`
          : 'Vos paiements apparaîtront ici dès qu’une transaction sera initiée.',
    },
  ];

  const nextActions = [
    {
      title:
        input.promotions.length > 0 ? 'Renforcer l’offre du moment' : 'Créer la première offre',
      description:
        input.promotions.length > 0
          ? 'Mettez en avant votre meilleure promotion pour accélérer les conversions.'
          : 'Ajoutez une campagne attractive pour donner un premier élan à votre activité.',
    },
    {
      title: pendingPayments > 0 ? 'Finaliser les paiements' : 'Préparer vos prochains rendez-vous',
      description:
        pendingPayments > 0
          ? 'Validez les paiements en attente pour garder un flux fluide.'
          : 'Planifiez vos disponibilités pour transformer votre visibilité en réservations.',
    },
    {
      title: unreadNotifications > 0 ? 'Répondre aux messages' : 'Activer la rétention',
      description:
        unreadNotifications > 0
          ? 'Consultez les messages non lus pour garder une relation proactive.'
          : 'Envoyez une relance ou une offre ciblée pour maintenir l’engagement.',
    },
  ];

  return {
    progressScore,
    healthMessage:
      progressScore >= 70
        ? 'Votre activité est bien engagée, il reste à convertir cette dynamique en répétition.'
        : 'Votre espace commence à prendre vie. Quelques actions simples suffisent pour démarrer.',
    focusAreas,
    nextActions,
  };
}
