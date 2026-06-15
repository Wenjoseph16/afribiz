'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Globe, Users, MessageCircle, Star, Bell, BarChart3, Settings, LifeBuoy,
  ShoppingBag, Hand, UtensilsCrossed, Hotel, CalendarCheck, Truck, Palette, Car, Calendar, CalendarDays,
  Megaphone, Clock, FileText, Wallet, Repeat, File, Scale, Briefcase, Wrench, Store,
  X, ChevronDown, ChevronLeft, Sparkles, Heart, Shield, Code, User, Compass, Search,
  Package, CreditCard, Award, Database, UserCheck, UserPlus, Building2, ShoppingCart,
  Flag, Lock, Key, HardDrive, Download, Upload, Activity, GraduationCap,
  MessageSquare, Folder, Image as ImageIcon, Beaker, Layers,
  Tag, TrendingUp, Gem, Percent, Bot, AlertTriangle, ShieldCheck, Zap,
  ClipboardList, Play, Film, Radio, Monitor, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/index';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useMyBusiness } from '@/features/hooks';
import { APP_NAME, NAV_GROUPS } from '@/constants/index';
import type { BusinessModule } from '@/types/business';

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Globe, Users, MessageCircle, Star, Bell, BarChart3, Settings, LifeBuoy,
  ShoppingBag, ShoppingCart, Hand, UtensilsCrossed, Hotel, CalendarCheck, Truck, Palette, Car, Calendar,
  Megaphone, Clock, FileText, Wallet, Repeat, File, Scale, Briefcase, Wrench, Store,
  Heart, Shield, Code, User, Compass, Search, Sparkles, Package, CreditCard,
  Award, Database, UserCheck, UserPlus, Building2, Flag, Lock, Key, HardDrive, Download, Upload, Activity,
  CalendarDays, GraduationCap, MessageSquare, Folder, Image: ImageIcon,
  Beaker, Layers, Tag, TrendingUp,
  Gem, Percent, Bot, AlertTriangle, ShieldCheck, Zap, ClipboardList,
  Play, Film, Radio, Monitor,
};

const MODULE_ICON_MAP: Record<string, string> = {
  PRODUCTS: 'ShoppingBag', SERVICES: 'Hand', MENU: 'UtensilsCrossed',
  ROOMS: 'Hotel', BOOKINGS: 'CalendarCheck', ORDERS: 'ShoppingBag',
  EVENTS: 'Calendar', RENTALS: 'Car', PROMOTIONS: 'Megaphone',
  PORTFOLIO: 'Palette',  TRAININGS: 'GraduationCap',
  DELIVERIES: 'Truck', EMPLOYEES: 'Briefcase',
  PLANNING: 'Clock', QUOTES_INVOICES: 'FileText', DEBTS_PAYMENTS: 'Wallet',
  SUBSCRIPTIONS: 'Repeat', DOCUMENTS: 'File', PARTNERS: 'Users',
  DISPUTES: 'Scale', MODULE_MARKETPLACE: 'Store', ADVANCED_TASKS: 'Wrench',
};

const MODULE_LABEL_MAP: Record<string, string> = {
  PRODUCTS: 'Produits', SERVICES: 'Services', MENU: 'Menu / Carte',
  ROOMS: 'Chambres', BOOKINGS: 'Réservations', ORDERS: 'Commandes',
  EVENTS: 'Événements', RENTALS: 'Locations', PROMOTIONS: 'Promotions',
  PORTFOLIO: 'Portfolio', DELIVERIES: 'Livraisons', EMPLOYEES: 'Employés',
  PLANNING: 'Planning', QUOTES_INVOICES: 'Devis & Factures',
  DEBTS_PAYMENTS: 'Créances', SUBSCRIPTIONS: 'Abonnements',
  TRAININGS: 'Formations',
  DOCUMENTS: 'Documents', PARTNERS: 'Partenaires', DISPUTES: 'Litiges',
  MODULE_MARKETPLACE: 'Marketplace', ADVANCED_TASKS: 'Tâches avancées',
};

const MODULE_HREF_MAP: Record<string, string> = {
  QUOTES_INVOICES: '/dashboard/quotes',
  DEBTS_PAYMENTS: '/dashboard/debts-payments',
  MODULE_MARKETPLACE: '/dashboard/marketplace',
  ADVANCED_TASKS: '/dashboard/tasks',
  DOCUMENTS: '/dashboard/documents',
  DISPUTES: '/dashboard/disputes',
  TRAININGS: '/dashboard/trainings/manage',
};

const DEVELOPER_NAV_GROUPS = [
  {
    label: 'Général',
    key: 'dev_general',
    items: [
      { label: 'Tableau de bord', href: '/dashboard/developer', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Media',
    key: 'dev_media',
    items: [
      { label: 'Media Hub', href: '/dashboard/developer/media', icon: 'Play' },
      { label: 'Stories', href: '/dashboard/developer/media/stories', icon: 'Sparkles' },
      { label: 'Shorts', href: '/dashboard/developer/media/shorts', icon: 'Film' },
      { label: 'Lives', href: '/dashboard/developer/media/lives', icon: 'Radio' },
    ],
  },
  {
    label: 'Modules',
    key: 'dev_modules',
    items: [
      { label: 'Tous les modules', href: '/dashboard/developer/modules', icon: 'Package' },
      { label: 'Créer un module', href: '/dashboard/developer/modules/publish', icon: 'Sparkles' },
      { label: 'Versions & Releases', href: '/dashboard/developer/versions', icon: 'Repeat' },
    ],
  },
  {
    label: 'Marketplace',
    key: 'dev_marketplace',
    items: [
      { label: 'Marketplace', href: '/dashboard/developer/marketplace', icon: 'Store' },
      { label: 'Validation AfriBiz', href: '/dashboard/developer/validation', icon: 'Shield' },
    ],
  },
  {
    label: 'Revenus',
    key: 'dev_revenues',
    items: [
      { label: 'Vue d\'ensemble', href: '/dashboard/developer/revenues', icon: 'Wallet' },
      { label: 'Ventes', href: '/dashboard/developer/revenues/sales', icon: 'ShoppingBag' },
      { label: 'Abonnements', href: '/dashboard/developer/revenues/subscriptions', icon: 'CreditCard' },
      { label: 'Retraits', href: '/dashboard/developer/revenues/payouts', icon: 'Download' },
      { label: 'Factures', href: '/dashboard/developer/revenues/invoices', icon: 'FileText' },
    ],
  },
  {
    label: 'Clients',
    key: 'dev_clients',
    items: [
      { label: 'Installations', href: '/dashboard/developer/installations', icon: 'Download' },
      { label: 'Clients', href: '/dashboard/developer/clients', icon: 'Users' },
    ],
  },
  {
    label: 'Support & Avis',
    key: 'dev_support',
    items: [
      { label: 'Support', href: '/dashboard/developer/support', icon: 'LifeBuoy' },
      { label: 'Avis & Notes', href: '/dashboard/developer/reviews', icon: 'Star' },
    ],
  },
  {
    label: 'Analyse',
    key: 'dev_analytics',
    items: [
      { label: 'Analytics', href: '/dashboard/developer/analytics', icon: 'BarChart3' },
      { label: 'Performance', href: '/dashboard/developer/performance', icon: 'Activity' },
    ],
  },
  {
    label: 'Marketing',
    key: 'dev_marketing',
    items: [
      { label: 'Marketing', href: '/dashboard/developer/marketing', icon: 'Megaphone' },
    ],
  },
  {
    label: 'Documentation',
    key: 'dev_docs',
    items: [
      { label: 'Documentation', href: '/dashboard/developer/documentation', icon: 'FileText' },
      { label: 'Communauté', href: '/dashboard/developer/community', icon: 'MessageCircle' },
    ],
  },
  {      label: 'Développeur',
      key: 'dev_developer',
      items: [
        { label: 'Mon abonnement', href: '/dashboard/developer/subscription', icon: 'CreditCard' },
        { label: 'API & Intégrations', href: '/dashboard/developer/api', icon: 'Key' },
        { label: 'Sécurité', href: '/dashboard/developer/security', icon: 'Lock' },
        { label: 'Profil', href: '/dashboard/developer/profile', icon: 'User' },
        { label: 'Paramètres', href: '/dashboard/developer/settings', icon: 'Settings' },
      ],
    },
    {
      label: 'Simulation',
    key: 'dev_simulation',
    items: [
      { label: 'Sandbox', href: '/dashboard/developer/simulation', icon: 'Beaker' },
    ],
  },
];

const BUSINESS_PRIMARY_NAV = [
  {
    label: 'Général',
    items: [
      { label: 'Tableau de bord', href: '/dashboard/business', icon: 'LayoutDashboard' },
      { label: 'Page publique', href: '/dashboard/public-page', icon: 'Globe' },
      { label: 'Commandes reçues', href: '/dashboard/business/orders', icon: 'ShoppingBag' },
      { label: 'Mes modules', href: '/dashboard/business/modules', icon: 'Package' },
    ],
  },
  {
    label: 'Social Commerce',
    items: [
      { label: 'Explorer', href: '/dashboard/explore', icon: 'Compass' },
      { label: 'Stories', href: '/dashboard/stories', icon: 'Sparkles' },
      { label: 'Shorts', href: '/dashboard/shorts', icon: 'Film' },
      { label: 'Lives', href: '/dashboard/lives', icon: 'Radio' },
      { label: 'Offres Flash', href: '/dashboard/offers', icon: 'Zap' },
    ],
  },
  {
    label: 'Relation client',
    items: [
      { label: 'Clients', href: '/dashboard/clients', icon: 'Users' },
      { label: 'Segments', href: '/dashboard/clients/segments', icon: 'Layers' },
      { label: 'Analytics CRM', href: '/dashboard/clients/analytics', icon: 'BarChart3' },
      { label: 'Messages', href: '/dashboard/messages', icon: 'MessageCircle' },
      { label: 'Avis', href: '/dashboard/reviews', icon: 'Star' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: 'Bell' },
    ],
  },
  {
    label: 'Logistique',
    items: [
      { label: 'Livraisons', href: '/dashboard/deliveries', icon: 'Truck' },
      { label: 'Zones de livraison', href: '/dashboard/deliveries/zones', icon: 'MapPin' },
      { label: 'Livreurs', href: '/dashboard/deliveries/drivers', icon: 'User' },
    ],
  },
  {
    label: 'Ressources Humaines',
    items: [
      { label: 'Employés', href: '/dashboard/employees', icon: 'Briefcase' },
      { label: 'Rôles & Permissions', href: '/dashboard/employees/roles', icon: 'Shield' },
      { label: 'Planning', href: '/dashboard/planning', icon: 'Clock' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { label: 'Publicités', href: '/dashboard/ads', icon: 'Megaphone' },
      { label: 'Promotions', href: '/dashboard/promotions', icon: 'Sparkles' },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { label: 'Statistiques', href: '/dashboard/statistics', icon: 'BarChart3' },
      { label: 'AfriScore', href: '/dashboard/afriscore', icon: 'Award' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Mon abonnement', href: '/dashboard/business/subscription', icon: 'CreditCard' },
      { label: 'Consentements', href: '/dashboard/consents', icon: 'Shield' },
      { label: 'Automatisations', href: '/dashboard/automations', icon: 'Activity' },
      { label: 'Notifications client', href: '/dashboard/business/notification-templates', icon: 'Bell' },
      { label: 'Paramètres', href: '/dashboard/business/settings', icon: 'Settings' },
      { label: 'Support', href: '/dashboard/support', icon: 'LifeBuoy' },
    ],
  },
  {
    label: 'Data Hub',
    items: [
      { label: 'Explorer', href: '/dashboard/datahub', icon: 'Database' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, closeSidebar, toggleSidebarCollapsed } = useUiStore();
  const { user, setPrimaryRole, selectedSpace, setSelectedSpace } = useAuthStore();
  const { business, setBusiness } = useBusinessStore();
  const { data: myBusiness } = useMyBusiness();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const currentPath = pathname || '';

  const switchSpace = useCallback((role: string, href: string) => {
    setPrimaryRole(role);
    setSelectedSpace(role);
    queryClient.invalidateQueries();
    closeSidebar();
    router.push(href);
  }, [setPrimaryRole, setSelectedSpace, queryClient, closeSidebar, router]);

  // Liste des pages partagées entre l'espace client et l'espace business
  // Ces pages existent à la racine /dashboard/* mais sont aussi accessibles depuis l'espace business
  const BUSINESS_SHARED_PATHS = [
    '/dashboard/explore', '/dashboard/stories', '/dashboard/shorts', '/dashboard/lives', '/dashboard/offers',
    '/dashboard/public-page', '/dashboard/clients', '/dashboard/messages', '/dashboard/reviews',
    '/dashboard/notifications', '/dashboard/ads', '/dashboard/promotions', '/dashboard/statistics',
    '/dashboard/afriscore', '/dashboard/consents', '/dashboard/automations', '/dashboard/support',
    '/dashboard/datahub', '/dashboard/marketplace',
  ];

  // ⭐ Espace VISITÉ :
  // - Les chemins explicites (/dashboard/business/*) → TOUJOURS espace business
  // - Les pages partagées (BUSINESS_SHARED_PATHS) → espace business UNIQUEMENT si primaryRole === BUSINESS
  // - Le reste → espace client
  // Utiliser selectedSpace (set via le switcher) sinon fallback sur primaryRole du serveur
  const activeSpace = selectedSpace || user?.primaryRole || 'CLIENT';

  const onExplicitBusinessPath = currentPath.startsWith('/dashboard/business');
  const onExplicitDeveloperPath = currentPath.startsWith('/dashboard/developer');
  const onExplicitAdminPath = currentPath.startsWith('/dashboard/admin');
  const onSharedBusinessPath = BUSINESS_SHARED_PATHS.some(p => currentPath === p || currentPath.startsWith(p + '/'));

  // ✅ Logique claire :
  // - Chemins explicites (/dashboard/business/*) → TOUJOURS espace business
  // - Pages partagées (BUSINESS_SHARED_PATHS) → espace business SI activeSpace === 'BUSINESS'
  // - /dashboard/developer/* → espace dev
  // - /dashboard/admin/* → espace admin
  // - Tout le reste → espace client
  const inBusinessSpace = onExplicitBusinessPath || (onSharedBusinessPath && activeSpace === 'BUSINESS');
  const inDeveloperSpace = onExplicitDeveloperPath;
  const inAdminSpace = onExplicitAdminPath;
  const inClientSpace = !inBusinessSpace && !inDeveloperSpace && !inAdminSpace;

  // ⭐ Rôles ACCESSIBLES (pour afficher/masquer les boutons dans 'Mes espaces')
  const canAccessDeveloper = user?.roles?.includes('DEVELOPER');
  const canAccessBusiness = user?.roles?.includes('BUSINESS') || !!business;
  const canAccessAdmin = user?.roles?.includes('ADMIN');

  useEffect(() => {
    if (myBusiness) setBusiness(myBusiness);
  }, [myBusiness, setBusiness]);

  useEffect(() => {
    if (business?.modules.length) {
      setExpandedGroups((prev) => ({
        ...prev,
        'modules': true,
      }));
    }
  }, [business?.modules.length]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const moduleNav = (business?.modules || []).map((mod) => ({
    label: MODULE_LABEL_MAP[mod] || mod,
    href: MODULE_HREF_MAP[mod] || `/dashboard/${mod.toLowerCase()}`,
    icon: MODULE_ICON_MAP[mod] || 'LayoutDashboard',
  }));

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNavItems = (items: { label: string; href: string; icon: string; badge?: number }[], collapsed: boolean) => (
    items.map((item) => {
      const Icon = iconMap[item.icon];
      const active = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={closeSidebar}
          title={collapsed ? item.label : undefined}
          className={cn(
            'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
            collapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5',
            active
              ? 'bg-emerald-500/15 text-white shadow-sm shadow-emerald-500/5 border border-emerald-400/10'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
        >
          {active && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full shadow-glow shadow-emerald-400/50" />
          )}
          {Icon && <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />}
          {!collapsed && <span className="truncate">{item.label}</span>}
          {item.badge !== undefined && !collapsed && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {item.badge}
            </span>
          )}
        </Link>
      );
    })
  );

  const activeNav = inAdminSpace ? [] : inDeveloperSpace ? [] : inBusinessSpace ? BUSINESS_PRIMARY_NAV : NAV_GROUPS as any;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-emerald-900 via-emerald-950 to-black text-white relative overflow-hidden">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyLjUiIGN5PSIyLjUiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60 pointer-events-none" />
      {/* Top glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 border-b border-white/5 relative z-10',
        sidebarCollapsed ? 'justify-center h-16 px-2' : 'justify-between h-16 px-4'
      )}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={closeSidebar}>
          {!sidebarCollapsed && (
            <span className="font-bold text-base text-white tracking-tight truncate">{APP_NAME}</span>
          )}
        </Link>
        <button
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Business info mini */}
      {business && !sidebarCollapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white/80 shrink-0 overflow-hidden">
              {business.logo ? (
                <Image src={business.logo ?? ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
              ) : (
                business.name[0]
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{business.name}</p>
              <p className="text-[11px] text-emerald-200/60 truncate">{business.type}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
        {/* Role switcher — show all dashboards the user has access to */}
        {!sidebarCollapsed && (canAccessBusiness || canAccessDeveloper || canAccessAdmin) && (
          <div className="px-3 pb-2 mb-2 border-b border-white/10">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-1.5">Mes espaces</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => switchSpace('CLIENT', '/dashboard')}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  inClientSpace ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/50 hover:text-white hover:bg-white/10'
                )}>
                Client
              </button>
              {canAccessBusiness && (
                <button onClick={() => switchSpace('BUSINESS', '/dashboard/business')}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    inBusinessSpace ? 'bg-emerald-500/20 text-emerald-200' : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}>
                  Business
                </button>
              )}
              {canAccessDeveloper && (
                <button onClick={() => switchSpace('DEVELOPER', '/dashboard/developer')}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    inDeveloperSpace ? 'bg-indigo-500/20 text-indigo-200' : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}>
                  Développeur
                </button>
              )}
              {canAccessAdmin && (
                <button onClick={() => switchSpace('ADMIN', '/dashboard/admin')}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                    inAdminSpace ? 'bg-rose-500/20 text-rose-200' : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}>
                  Admin
                </button>
              )}
            </div>
          </div>
        )}

        {/* Primary sections */}
        {activeNav.map((group: any) => (
          <div key={group.label} className="mb-1">
            {!sidebarCollapsed && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em]">
                {group.label}
              </p>
            )}
            {renderNavItems(group.items, sidebarCollapsed)}
          </div>
        ))}

        {/* Developer section */}
        {inDeveloperSpace && DEVELOPER_NAV_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.key] !== false;
          const anyActive = group.items.some((item) => isActive(item.href));
          return (
            <div key={group.key} className="mb-1">
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className={cn(
                    'flex items-center w-full rounded-xl px-3 py-2 transition-colors',
                    anyActive ? 'text-indigo-200' : 'text-white/30 hover:text-white/60'
                  )}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                    {group.label}
                  </span>
                  <ChevronDown className={cn(
                    'ml-auto h-3 w-3 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} />
                </button>
              )}
              {(isExpanded || sidebarCollapsed) && (
                <div className={cn(sidebarCollapsed ? 'space-y-0.5' : 'mt-0.5 space-y-0.5')}>
                  {group.items.map((item) => {
                    const Icon = iconMap[item.icon];
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeSidebar}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                          sidebarCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5',
                          active
                            ? 'bg-indigo-500/20 text-indigo-200 shadow-sm'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {active && !sidebarCollapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r-full" />
                        )}
                        {Icon && <Icon className={cn('shrink-0', sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />}
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin section */}
        {inAdminSpace && (
          <>
            {[
              {
                label: 'Administration',
                key: 'admin',
                items: [
                  { label: 'Tableau de bord', href: '/dashboard/admin', icon: 'LayoutDashboard' },
                ],
              },
              {
                label: 'Gestion',
                key: 'admin_manage',
                items: [
                  { label: 'Utilisateurs', href: '/dashboard/admin/users', icon: 'Users' },
                  { label: 'Business', href: '/dashboard/admin/businesses', icon: 'Building2' },
                  { label: 'Développeurs', href: '/dashboard/admin/developers', icon: 'Code' },
                  { label: 'Modules', href: '/dashboard/admin/modules', icon: 'Package' },
                  { label: 'Marketplace', href: '/dashboard/admin/marketplace', icon: 'Store' },
                ],
              },
              {
                label: 'Finances',
                key: 'admin_finance',
                items: [
                  { label: 'Publicités', href: '/dashboard/admin/ads', icon: 'Megaphone' },
                  { label: 'Paiements', href: '/dashboard/admin/payments', icon: 'CreditCard' },
                  { label: 'Escrow', href: '/dashboard/admin/escrow', icon: 'Shield' },
                  { label: 'Abonnements', href: '/dashboard/admin/subscriptions', icon: 'Repeat' },
                  { label: 'Plans', href: '/dashboard/admin/subscriptions/plans', icon: 'Gem' },
                  { label: 'Commissions', href: '/dashboard/admin/commissions', icon: 'Percent' },
                  { label: 'Comm. développeurs', href: '/dashboard/admin/developers/commissions', icon: 'Code' },
                ],
              },
              {
                label: 'Media & Contenu',
                key: 'admin_media',
                items: [
                  { label: 'AfriBiz TV', href: '/dashboard/admin/media/tv', icon: 'Monitor' },
                  { label: 'Contenus signalés', href: '/dashboard/admin/media/reports', icon: 'Flag' },
                  { label: 'Stories', href: '/dashboard/admin/media/stories', icon: 'Sparkles' },
                  { label: 'Shorts', href: '/dashboard/admin/media/shorts', icon: 'Film' },
                  { label: 'Lives', href: '/dashboard/admin/media/lives', icon: 'Radio' },
                ],
              },
              {
                label: 'Données',
                key: 'admin_data',
                items: [
                  { label: 'AfriScore', href: '/dashboard/admin/afriscore', icon: 'Award' },
                  { label: 'Data Hub', href: '/dashboard/admin/datahub', icon: 'Database' },
                  { label: 'Copilot', href: '/dashboard/admin/copilot', icon: 'Bot' },
                  { label: 'Rétention', href: '/dashboard/admin/data-retention', icon: 'Clock' },
                ],
              },
              {
                label: 'Support',
                key: 'admin_support',
                items: [
                  { label: 'Support', href: '/dashboard/admin/support', icon: 'LifeBuoy' },
                  { label: 'Litiges', href: '/dashboard/admin/disputes', icon: 'Scale' },
                  { label: 'Avis', href: '/dashboard/admin/reviews', icon: 'Star' },
                  { label: 'Signalements', href: '/dashboard/admin/reports', icon: 'Flag' },
                  { label: 'Avertissements', href: '/dashboard/admin/warnings', icon: 'AlertTriangle' },
                ],
              },
              {
                label: 'Analyse',
                key: 'admin_analytics',
                items: [
                  { label: 'Statistiques', href: '/dashboard/admin/statistics', icon: 'BarChart3' },
                  { label: 'Rapports', href: '/dashboard/admin/reports/financial', icon: 'FileText' },
                  { label: 'Notifications', href: '/dashboard/admin/notifications', icon: 'Bell' },
                ],
              },
              {
                label: 'Système',
                key: 'admin_system',
                items: [
                  { label: 'Paramètres', href: '/dashboard/admin/settings', icon: 'Settings' },
                  { label: 'Sécurité', href: '/dashboard/admin/security', icon: 'Lock' },
                  { label: 'Rôles Admin', href: '/dashboard/admin/roles', icon: 'ShieldCheck' },
                  { label: 'Feature Flags', href: '/dashboard/admin/feature-flags', icon: 'Flag' },
                  { label: 'Automatisation', href: '/dashboard/admin/automation', icon: 'Zap' },
                  { label: 'CMS', href: '/dashboard/admin/cms', icon: 'FileText' },
                  { label: 'Formulaires', href: '/dashboard/admin/forms', icon: 'ClipboardList' },
                  { label: 'Notifications', href: '/dashboard/admin/notification-templates', icon: 'Bell' },
                  { label: 'Audit monétisation', href: '/dashboard/admin/monetization/audit', icon: 'History' },
                  { label: 'Logs système', href: '/dashboard/admin/logs', icon: 'Activity' },
                  { label: 'Clés API', href: '/dashboard/admin/api-keys', icon: 'Key' },
                  { label: 'Sauvegardes', href: '/dashboard/admin/backups', icon: 'HardDrive' },
                ],
              },
            ].map((group) => {
              const isExpanded = expandedGroups[group.key] !== false;
              const anyActive = group.items.some((item) => isActive(item.href));
              return (
                <div key={group.key} className="mb-1">
                  {!sidebarCollapsed && (
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className={cn(
                        'flex items-center w-full rounded-xl px-3 py-2 transition-colors',
                        anyActive ? 'text-rose-200' : 'text-white/30 hover:text-white/60'
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                        {group.label}
                      </span>
                      <ChevronDown className={cn(
                        'ml-auto h-3 w-3 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )} />
                    </button>
                  )}
                  {(isExpanded || sidebarCollapsed) && (
                    <div className={cn(sidebarCollapsed ? 'space-y-0.5' : 'mt-0.5 space-y-0.5')}>
                      {group.items.map((item) => {
                        const Icon = iconMap[item.icon];
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeSidebar}
                            title={sidebarCollapsed ? item.label : undefined}
                            className={cn(
                              'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                              sidebarCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5',
                              active
                                ? 'bg-rose-500/20 text-rose-200 shadow-sm'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            )}
                          >
                            {active && !sidebarCollapsed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-rose-400 rounded-r-full" />
                            )}
                            {Icon && <Icon className={cn('shrink-0', sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />}
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Modules section — visible uniquement dans l'espace business */}
        {inBusinessSpace && moduleNav.length > 0 && (
          <div className="mb-1">
            <button
              onClick={() => toggleGroup('modules')}
              className={cn(
                'flex items-center w-full rounded-xl transition-colors',
                sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              {!sidebarCollapsed && (
                <>
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em]">
                    Mes modules
                  </span>
                  <ChevronDown className={cn(
                    'ml-auto h-3.5 w-3.5 transition-transform duration-200',
                    expandedGroups['modules'] && 'rotate-180'
                  )} />
                </>
              )}
            </button>
            {(expandedGroups['modules'] || sidebarCollapsed) && (
              <div className={cn(sidebarCollapsed ? 'space-y-0.5' : 'mt-0.5 space-y-0.5')}>
                {moduleNav.map((item) => {
                  const Icon = iconMap[item.icon];
                  const active = isActive(item.href);
                  const subItemsMap: Record<string, { label: string; href: string; icon: string }[]> = {
                    Promotions: [
                      { label: 'Coupons', href: '/dashboard/promotions/coupons', icon: 'Tag' },
                      { label: 'Bundles', href: '/dashboard/promotions/bundles', icon: 'Package' },
                      { label: 'Campagnes', href: '/dashboard/promotions/campaigns', icon: 'Megaphone' },
                      { label: 'Stats', href: '/dashboard/promotions/stats', icon: 'BarChart3' },
                      { label: 'Fidélité', href: '/dashboard/promotions/loyalty', icon: 'Award' },
                    ],
                    Planning: [
                      { label: 'Calendrier', href: '/dashboard/planning/calendar', icon: 'CalendarDays' },
                      { label: 'Schedules', href: '/dashboard/planning/schedules', icon: 'Clock' },
                      { label: 'Stats', href: '/dashboard/planning/stats', icon: 'BarChart3' },
                    ],
                    ['Employés']: [
                      { label: 'Rôles', href: '/dashboard/employees/roles', icon: 'Shield' },
                      { label: 'Pointage', href: '/dashboard/employees/attendances', icon: 'CalendarCheck' },
                      { label: 'Performance', href: '/dashboard/employees/performance', icon: 'TrendingUp' },
                      { label: 'Documents', href: '/dashboard/employees/documents', icon: 'File' },
                      { label: 'Stats', href: '/dashboard/employees/stats', icon: 'BarChart3' },
                      { label: 'Activités', href: '/dashboard/employees/activities', icon: 'Activity' },
                      { label: 'Portail', href: '/dashboard/employees/portal', icon: 'User' },
                    ],
                    Portfolio: [
                      { label: 'Témoignages', href: '/dashboard/portfolio/testimonials', icon: 'MessageSquare' },
                      { label: 'Catégories', href: '/dashboard/portfolio/categories', icon: 'Folder' },
                      { label: 'Média', href: '/dashboard/portfolio/media', icon: 'Image' },
                      { label: 'Stats', href: '/dashboard/portfolio/stats', icon: 'BarChart3' },
                    ],
                    ['Abonnements']: [
                      { label: 'Abonnés', href: '/dashboard/subscriptions/subscribers', icon: 'Users' },
                      { label: 'Paiements', href: '/dashboard/subscriptions/payments', icon: 'CreditCard' },
                      { label: 'Stats', href: '/dashboard/subscriptions/stats', icon: 'BarChart3' },
                      { label: 'Activités', href: '/dashboard/subscriptions/logs', icon: 'Activity' },
                    ],
                  };
                  const subItems = subItemsMap[item.label] || [];
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeSidebar}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                          sidebarCollapsed ? 'justify-center p-2.5 mx-auto w-10 h-10' : 'px-3 py-2.5',
                          active
                            ? 'bg-white/15 text-white shadow-sm'
                            : 'text-white/50 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {active && !sidebarCollapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-glow" />
                        )}
                        {Icon && <Icon className={cn('shrink-0', sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4')} />}
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                      {/* Sub-nav for modules */}
                      {!sidebarCollapsed && expandedGroups['modules'] && subItems.length > 0 && (
                        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                          {subItems.map((sub) => {
                            const SubIcon = iconMap[sub.icon] || Package;
                            const subActive = isActive(sub.href);
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={closeSidebar}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg text-xs font-medium transition-all duration-200 py-1.5 px-2',
                                  subActive
                                    ? 'text-white bg-white/10'
                                    : 'text-white/40 hover:text-white hover:bg-white/5'
                                )}
                              >
                                <SubIcon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Module marketplace link */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-4">
            <Link
              href="/dashboard/marketplace"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-emerald-400/5 hover:from-emerald-500/25 hover:via-emerald-500/20 hover:to-emerald-400/15 transition-all duration-200 border border-emerald-400/10 hover:border-emerald-400/20 group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:from-emerald-400/40 group-hover:to-emerald-500/30 transition-all duration-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Découvrir des modules</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebarCollapsed}
        className="hidden lg:flex items-center justify-center h-10 border-t border-white/5 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
      >
        <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
      </button>

      {/* Version */}
      {!sidebarCollapsed && (
        <div className="px-4 py-2.5 border-t border-white/5 shrink-0">
          <p className="text-[10px] text-white/20 font-mono">{APP_NAME} v1.0.0</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className={cn(
        'hidden lg:flex lg:flex-col h-full shrink-0 overflow-hidden transition-all duration-300',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeSidebar} />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-slide-right">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
