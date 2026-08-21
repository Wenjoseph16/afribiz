'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  X,
  ChevronDown,
  ChevronLeft,
  Package,
  User,
  Store,
  Code,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/index';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useMyBusiness } from '@/features/hooks';
import { useDeveloperProfile } from '@/features/developerHooks';
import { useSidebarUnreadCount } from '@/hooks/useSidebarUnreadCount';
import { APP_NAME, NAV_GROUPS } from '@/constants/index';
import { iconMap, MODULE_SUB_ITEMS } from './sidebar-data';
import { DEVELOPER_NAV_GROUPS, BUSINESS_CORE_NAV } from './sidebar-data';
import { InstalledModulesSection } from './InstalledModulesSection';

// La navigation business (10 pôles) et les sous-nav de modules viennent de ./sidebar-data

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, closeSidebar, toggleSidebarCollapsed } = useUiStore();
  const { user, selectedSpace, setSelectedSpace, hasPermission } = useAuthStore();
  const { business, setBusiness } = useBusinessStore();
  const { data: myBusiness } = useMyBusiness({
    enabled: !!user?.roles?.includes('BUSINESS') || !!business,
  });
  const { data: devProfile } = useDeveloperProfile();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const { data: unreadData } = useSidebarUnreadCount();
  const unreadTotal = unreadData?.total ?? 0;

  const currentPath = pathname || '';

  const switchSpace = useCallback(
    (role: string, href: string) => {
      setSelectedSpace(role);
      queryClient.invalidateQueries();
      closeSidebar();
      router.push(href);
    },
    [setSelectedSpace, queryClient, closeSidebar, router]
  );

  // ⭐ ESPACE ACTIF — modèle déterministe (workspace) :
  // - Les chemins EXPLICITES (/dashboard/business/*, /dashboard/developer/*,
  //   /dashboard/admin/*) forcent leur espace.
  // - Toute autre page /dashboard/* reste dans l'espace CHOISI explicitement
  //   (selectedSpace persisté via « Mes espaces ») : plus aucun rebond client↔business
  //   par inférence de chemin — c'est le fix du bug « ça me ramène dans l'espace client ».
  // - S'assure que selectedSpace correspond à un rôle réellement possédé.
  const activeSpace =
    selectedSpace && user?.roles?.includes(selectedSpace)
      ? selectedSpace
      : user?.primaryRole || 'CLIENT';

  const onExplicitBusinessPath = currentPath.startsWith('/dashboard/business');
  const onExplicitDeveloperPath = currentPath.startsWith('/dashboard/developer');
  const onExplicitAdminPath = currentPath.startsWith('/dashboard/admin');

  const inDeveloperSpace = onExplicitDeveloperPath;
  const inAdminSpace = onExplicitAdminPath;
  const inBusinessSpace =
    onExplicitBusinessPath || (!inDeveloperSpace && !inAdminSpace && activeSpace === 'BUSINESS');
  // /dashboard (accueil client) reste TOUJOURS affiché en espace client : le contenu de
  // cette page EST le dashboard client. selectedSpace n'est pas modifié, donc un gérant
  // en espace business qui repasse par /dashboard/products (chemin partagé) retrouve
  // bien sa sidebar business — pas de rebond.
  const onExplicitClientPath = currentPath === '/dashboard' || currentPath === '/dashboard/';
  const inClientSpace =
    onExplicitClientPath || (!inBusinessSpace && !inDeveloperSpace && !inAdminSpace);

  // ⭐ Rôles ACCESSIBLES (pour afficher/masquer les boutons dans 'Mes espaces')
  // L'espace Développeur n'est accessible QUE si l'onboarding dev est terminé
  // (profil développeur existant). Un rôle DEVELOPER sans profil = onboarding
  // non terminé → on masque l'entrée pour éviter le conflit d'espace.
  const canAccessDeveloper = !!user?.roles?.includes('DEVELOPER') && !!devProfile;
  const canAccessBusiness = user?.roles?.includes('BUSINESS') || !!business;
  const canAccessAdmin = user?.roles?.includes('ADMIN');

  // ⭐ KYC : tant que le compte dev n'est pas validé par l'admin (VERIFIED),
  // la sidebar ne montre AUCUNE section développeur — uniquement un lien vers
  // l'onboarding (statut + motif de rejet + re-soumission KYC).
  const devVerified = devProfile?.verificationStatus === 'VERIFIED';
  const devNavGroups = devVerified
    ? DEVELOPER_NAV_GROUPS
    : [
        {
          label: 'Développeur',
          key: 'dev_kyc_pending',
          items: [
            {
              label: 'Compléter mon dossier',
              href: '/dashboard/developer/onboarding',
              icon: 'Shield',
            },
          ],
        },
      ];

  // Synchronise selectedSpace avec les chemins EXPLICITES (espaces dédiés).
  // Jamais de retour automatique vers CLIENT : l'espace est un choix persistant,
  // modifiable uniquement via le sélecteur « Mes espaces » (sidebar + topbar).
  useEffect(() => {
    const path = currentPath;
    if (path.startsWith('/dashboard/business') && activeSpace !== 'BUSINESS') {
      setSelectedSpace('BUSINESS');
    } else if (path.startsWith('/dashboard/developer') && activeSpace !== 'DEVELOPER') {
      setSelectedSpace('DEVELOPER');
    } else if (path.startsWith('/dashboard/admin') && activeSpace !== 'ADMIN') {
      setSelectedSpace('ADMIN');
    }
  }, [currentPath]);

  useEffect(() => {
    if (myBusiness) setBusiness(myBusiness);
  }, [myBusiness, setBusiness]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard';
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleItem = (href: string) => {
    setExpandedItems((prev) => ({ ...prev, [href]: prev[href] === false }));
  };

  const renderNavItems = (
    items: { label: string; href: string; icon: string; badge?: number; roles?: string[] }[],
    collapsed: boolean
  ) =>
    items
      .filter((item) => !item.roles || item.roles.some((r) => user?.roles?.includes(r)))
      .map((item) => {
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
            {/* Badge messages non lus */}
            {!collapsed && unreadTotal > 0 && item.href === '/dashboard/messages' && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-red-500/30">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
            {collapsed && unreadTotal > 0 && item.href === '/dashboard/messages' && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-emerald-950" />
            )}
            {item.badge !== undefined && !collapsed && item.href !== '/dashboard/messages' && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      });

  const coreNavGroups = inBusinessSpace
    ? BUSINESS_CORE_NAV
    : inClientSpace
      ? (NAV_GROUPS as any)
      : [];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-emerald-900 via-emerald-950 to-black text-white relative overflow-hidden">
      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyLjUiIGN5PSIyLjUiIHI9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-60 pointer-events-none" />
      {/* Top glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Logo */}
      <div
        className={cn(
          'flex items-center shrink-0 border-b border-white/5 relative z-10',
          sidebarCollapsed ? 'justify-center h-16 px-2' : 'justify-between h-16 px-4'
        )}
      >
        <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={closeSidebar}>
          {!sidebarCollapsed && (
            <span className="font-bold text-base text-white tracking-tight truncate">
              {APP_NAME}
            </span>
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
                <Image
                  src={business.logo ?? ''}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
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
        {/* Sélecteur d'espace pro (workspace) — icône + libellé + état actif */}
        {!sidebarCollapsed && (canAccessBusiness || canAccessDeveloper || canAccessAdmin) && (
          <div className="px-3 pb-3 mb-2 border-b border-white/10">
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em] mb-2">
              Mes espaces
            </p>
            <div className="space-y-1">
              {[
                {
                  key: 'CLIENT',
                  label: 'Client',
                  icon: User,
                  href: '/dashboard',
                  active: inClientSpace,
                  visible: true,
                  accent: 'bg-sky-500/20 border-sky-400/30 text-sky-200',
                },
                {
                  key: 'BUSINESS',
                  label: 'Business',
                  icon: Store,
                  href: '/dashboard/business',
                  active: inBusinessSpace,
                  visible: canAccessBusiness,
                  accent: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
                },
                {
                  key: 'DEVELOPER',
                  label: 'Développeur',
                  icon: Code,
                  href: '/dashboard/developer',
                  active: inDeveloperSpace,
                  visible: canAccessDeveloper,
                  accent: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200',
                },
                {
                  key: 'ADMIN',
                  label: 'Admin',
                  icon: ShieldCheck,
                  href: '/dashboard/admin',
                  active: inAdminSpace,
                  visible: canAccessAdmin,
                  accent: 'bg-rose-500/20 border-rose-400/30 text-rose-200',
                },
              ]
                .filter((s) => s.visible)
                .map((space) => {
                  const SpaceIcon = space.icon;
                  return (
                    <button
                      key={space.key}
                      onClick={() => switchSpace(space.key, space.href)}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                        space.active
                          ? space.accent
                          : 'border-transparent text-white/50 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <SpaceIcon
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          space.active ? 'text-current' : 'text-white/40'
                        )}
                      />
                      <span className="truncate">{space.label}</span>
                      {space.active && <Check className="ml-auto h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Core sections — espace business : 10 pôles filtrés par modules actifs ET permissions */}
        {inBusinessSpace
          ? BUSINESS_CORE_NAV.map((group) => {
              // Un item n'apparaît que si :
              //  1. Le module est activé (ou pas de module requis)
              //  2. L'utilisateur a la permission requise (ou pas de permission requise)
              const visibleItems = (group.items as any[]).filter(
                (item) =>
                  (!item.module || business?.modules?.includes(item.module)) &&
                  (!item.permission || hasPermission(item.permission))
              );
              if (visibleItems.length === 0) return null;
              const isExpanded = expandedGroups[group.label] !== false;
              const anyActive = visibleItems.some((item) => isActive(item.href));
              return (
                <div key={group.label} className="mb-1">
                  {!sidebarCollapsed && (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={cn(
                        'flex items-center w-full rounded-xl transition-colors',
                        sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                        anyActive ? 'text-emerald-200' : 'text-white/30 hover:text-white/60'
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                        {group.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          'ml-auto h-3 w-3 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  )}
                  {(isExpanded || sidebarCollapsed) && (
                    <div className={cn(sidebarCollapsed ? 'space-y-0.5' : 'mt-0.5 space-y-0.5')}>
                      {visibleItems.map((item) => {
                        const Icon = iconMap[item.icon];
                        const active = isActive(item.href);
                        const isMessagerie = item.href === '/dashboard/business/messages';
                        const subItems = MODULE_SUB_ITEMS[item.label] || [];
                        // Sous-nav repliée par défaut : on ne l'ouvre que si l'utilisateur
                        // clique sur la flèche OU si un sous-item est actif (page courante).
                        const itemExpanded = expandedItems[item.href] === true;
                        const anySubActive = subItems.some((sub) => isActive(sub.href));
                        const showSub = !sidebarCollapsed && (itemExpanded || anySubActive);
                        return (
                          <div key={item.href}>
                            <div className="relative flex items-center">
                              <Link
                                href={item.href}
                                onClick={closeSidebar}
                                title={sidebarCollapsed ? item.label : undefined}
                                className={cn(
                                  'relative flex flex-1 items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                                  sidebarCollapsed
                                    ? 'justify-center p-2.5 mx-auto w-10 h-10'
                                    : 'px-3 py-2.5',
                                  active
                                    ? 'bg-emerald-500/20 text-emerald-200 shadow-sm'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                )}
                              >
                                {active && !sidebarCollapsed && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full" />
                                )}
                                {Icon && (
                                  <Icon
                                    className={cn(
                                      'shrink-0',
                                      sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'
                                    )}
                                  />
                                )}
                                {!sidebarCollapsed && (
                                  <span className="truncate">{item.label}</span>
                                )}
                                {/* Badge messages non lus — espace business */}
                                {!sidebarCollapsed && unreadTotal > 0 && isMessagerie && (
                                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-red-500/30">
                                    {unreadTotal > 99 ? '99+' : unreadTotal}
                                  </span>
                                )}
                                {sidebarCollapsed && unreadTotal > 0 && isMessagerie && (
                                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-emerald-950" />
                                )}
                              </Link>
                              {/* Toggle sous-nav du pôle */}
                              {!sidebarCollapsed && subItems.length > 0 && (
                                <button
                                  onClick={() => toggleItem(item.href)}
                                  className={cn(
                                    'p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors',
                                    anySubActive && 'text-white'
                                  )}
                                  aria-label={`Sous-menu ${item.label}`}
                                >
                                  <ChevronDown
                                    className={cn(
                                      'h-3.5 w-3.5 transition-transform duration-200',
                                      showSub && 'rotate-180'
                                    )}
                                  />
                                </button>
                              )}
                            </div>
                            {/* Sous-nav du pôle (Catégories, Stats, Zones…) */}
                            {showSub && subItems.length > 0 && (
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
              );
            })
          : coreNavGroups.map((group: any) => (
              <div key={group.label} className="mb-1">
                {!sidebarCollapsed && (
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-white/30 uppercase tracking-[0.15em]">
                    {group.label}
                  </p>
                )}
                {renderNavItems(group.items, sidebarCollapsed)}
              </div>
            ))}

        {/* Modules installés (écosystème dev) — section dynamique espace business */}
        {inBusinessSpace && <InstalledModulesSection collapsed={sidebarCollapsed} />}

        {/* Developer section — masquée tant que le KYC n'est pas validé */}
        {inDeveloperSpace &&
          devNavGroups.map((group) => {
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
                    <ChevronDown
                      className={cn(
                        'ml-auto h-3 w-3 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
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
                            sidebarCollapsed
                              ? 'justify-center p-2.5 mx-auto w-10 h-10'
                              : 'px-3 py-2.5',
                            active
                              ? 'bg-indigo-500/20 text-indigo-200 shadow-sm'
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {active && !sidebarCollapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-400 rounded-r-full" />
                          )}
                          {Icon && (
                            <Icon
                              className={cn('shrink-0', sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4')}
                            />
                          )}
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
                  { label: 'Demandes', href: '/dashboard/admin/demands', icon: 'Users' },
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
                  {
                    label: 'Comm. développeurs',
                    href: '/dashboard/admin/developers/commissions',
                    icon: 'Code',
                  },
                ],
              },
              {
                label: 'Media & Contenu',
                key: 'admin_media',
                items: [
                  { label: 'AfriBiz TV', href: '/dashboard/admin/media/tv', icon: 'Monitor' },
                  {
                    label: 'Contenus signalés',
                    href: '/dashboard/admin/media/reports',
                    icon: 'Flag',
                  },
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
                  { label: 'Messages', href: '/dashboard/admin/messages', icon: 'MessageCircle' },
                  { label: 'Support', href: '/dashboard/admin/support', icon: 'LifeBuoy' },
                  { label: 'Litiges', href: '/dashboard/admin/disputes', icon: 'Scale' },
                  { label: 'Avis', href: '/dashboard/admin/reviews', icon: 'Star' },
                  { label: 'Signalements', href: '/dashboard/admin/reports', icon: 'Flag' },
                  {
                    label: 'Avertissements',
                    href: '/dashboard/admin/warnings',
                    icon: 'AlertTriangle',
                  },
                ],
              },
              {
                label: 'Analyse',
                key: 'admin_analytics',
                items: [
                  { label: 'Statistiques', href: '/dashboard/admin/statistics', icon: 'BarChart3' },
                  {
                    label: 'Rapports',
                    href: '/dashboard/admin/reports/financial',
                    icon: 'FileText',
                  },
                  { label: 'Notifications', href: '/dashboard/admin/notifications', icon: 'Bell' },
                  {
                    label: 'Analyse notifs',
                    href: '/dashboard/admin/notification-analytics',
                    icon: 'BarChart3',
                  },
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
                  { label: 'Campagnes', href: '/dashboard/admin/campaigns', icon: 'Megaphone' },
                  { label: 'CMS', href: '/dashboard/admin/cms', icon: 'FileText' },
                  { label: 'Formulaires', href: '/dashboard/admin/forms', icon: 'ClipboardList' },
                  {
                    label: 'Notifications',
                    href: '/dashboard/admin/notification-templates',
                    icon: 'Bell',
                  },
                  {
                    label: 'Audit monétisation',
                    href: '/dashboard/admin/monetization/audit',
                    icon: 'History',
                  },
                  {
                    label: 'Monitoring CRON',
                    href: '/dashboard/admin/cron-monitoring',
                    icon: 'Activity',
                  },
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
                      <ChevronDown
                        className={cn(
                          'ml-auto h-3 w-3 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
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
                              sidebarCollapsed
                                ? 'justify-center p-2.5 mx-auto w-10 h-10'
                                : 'px-3 py-2.5',
                              active
                                ? 'bg-rose-500/20 text-rose-200 shadow-sm'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            )}
                          >
                            {active && !sidebarCollapsed && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-rose-400 rounded-r-full" />
                            )}
                            {Icon && (
                              <Icon
                                className={cn('shrink-0', sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4')}
                              />
                            )}
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

        {/* Module analysis link */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-4 space-y-1">
            <Link
              href="/dashboard/modules-analysis"
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border group cursor-pointer',
                isActive('/dashboard/modules-analysis')
                  ? 'bg-white/15 text-white border-white/10'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-transparent hover:border-white/10'
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400/30 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-200">
                <Package className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <span className="text-sm font-medium transition-colors">Analyse des modules</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebarCollapsed}
        className="hidden lg:flex items-center justify-center h-10 border-t border-white/5 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
      >
        <ChevronLeft
          className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')}
        />
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
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col h-full shrink-0 overflow-hidden transition-all duration-300',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
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
