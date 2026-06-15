export const APP_NAME = 'AfriBiz';
export const APP_VERSION = '1.0.0';
export const BRAND_COLOR = '#2D8A5B';

export const USER_ROLES = {
  CLIENT: 'client',
  BUSINESS: 'business',
  DEVELOPER: 'developer',
  ADMIN: 'admin',
} as const;

export const NAV_GROUPS = [
  {
    label: 'Général',
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Activités',
    items: [
      { label: 'Panier', href: '/dashboard/cart', icon: 'ShoppingCart' },
      { label: 'Commandes', href: '/dashboard/orders', icon: 'ShoppingBag' },
      { label: 'Réservations', href: '/dashboard/bookings', icon: 'Calendar' },
      { label: 'Locations', href: '/dashboard/my-rentals', icon: 'Car' },
      { label: 'Événements', href: '/dashboard/my-events', icon: 'CalendarDays' },
      { label: 'Formations', href: '/dashboard/my-trainings', icon: 'GraduationCap' },
    ],
  },
  {
    label: 'Finances',
    items: [
      { label: 'Paiements', href: '/dashboard/payments', icon: 'Wallet' },
      { label: 'Escrow', href: '/dashboard/escrow', icon: 'Shield' },
    ],
  },
  {
    label: 'Découverte',
    items: [
      { label: 'Marketplace', href: '/dashboard/explore', icon: 'Store' },
      { label: 'Favoris', href: '/dashboard/favorites', icon: 'Heart' },
      { label: 'Mes avis', href: '/dashboard/reviews', icon: 'Star' },
    ],
  },
  {
    label: 'Fidélité',
    items: [
      { label: 'Mes points', href: '/dashboard/loyalty', icon: 'Award' },
      { label: 'Parrainage', href: '/dashboard/referrals', icon: 'UserPlus' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Messages', href: '/dashboard/messages', icon: 'MessageCircle' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: 'Bell' },
    ],
  },
  {
    label: 'Compte',
    items: [
      { label: 'Mon profil', href: '/dashboard/profile', icon: 'User' },
      { label: 'Sécurité', href: '/dashboard/security', icon: 'Shield' },
      { label: 'Paramètres', href: '/dashboard/settings', icon: 'Settings' },
    ],
  },
  {
    label: 'Évoluer',
    items: [
      { label: 'Devenir Business', href: '/dashboard/become-business', icon: 'Briefcase' },
      { label: 'Devenir Développeur', href: '/dashboard/become-developer', icon: 'Code' },
    ],
  },
] as const;
