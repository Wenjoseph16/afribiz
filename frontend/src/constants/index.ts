export const APP_NAME = 'AfriBiz';
export const APP_VERSION = '1.0.0';
export const BRAND_COLOR = '#2D8A5B';

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  roles?: string[];
  module?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
  roles?: string[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Général',
    items: [{ label: 'Tableau de bord', href: '/dashboard', icon: 'LayoutDashboard' }],
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
      { label: 'Portefeuille', href: '/dashboard/wallet', icon: 'Wallet' },
      { label: 'Paiements', href: '/dashboard/payments', icon: 'CreditCard' },
      { label: 'Factures & Devis', href: '/dashboard/invoices', icon: 'FileText' },
      { label: 'Escrow', href: '/dashboard/escrow', icon: 'Shield' },
    ],
  },
  {
    label: 'Découverte',
    items: [
      { label: 'Marketplace', href: '/dashboard/explore', icon: 'Store' },
      { label: 'Recherche intelligente', href: '/dashboard/smart-search', icon: 'Search' },
      { label: 'Matching', href: '/dashboard/matching', icon: 'Layers' },
      { label: 'Favoris', href: '/dashboard/favorites', icon: 'Heart' },
      { label: 'Mes avis', href: '/dashboard/reviews', icon: 'Star' },
      { label: 'Stories', href: '/dashboard/stories', icon: 'Sparkles' },
      { label: 'Shorts', href: '/dashboard/shorts', icon: 'Film' },
      { label: 'Lives', href: '/dashboard/lives', icon: 'Radio' },
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
];
