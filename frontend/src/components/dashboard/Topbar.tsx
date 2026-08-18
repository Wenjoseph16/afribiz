'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Search,
  Moon,
  Sun,
  Command,
  ShoppingCart,
  Store,
  Code,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/index';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { apiClient } from '@/services/apiClient';
import { useDeveloperProfile } from '@/features/developerHooks';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function CartIconWithCount() {
  const itemCount = useCartStore((s) => s.totalItems());
  const openDrawer = useCartStore((s) => s.openDrawer);

  return (
    <button
      onClick={openDrawer}
      title="Panier"
      aria-label="Ouvrir le panier"
      className="relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand rounded-full ring-2 ring-background">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export function Topbar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toggleSidebar } = useUiStore();
  const { user, logout, selectedSpace, setSelectedSpace, employee } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const spaceRef = useRef<HTMLDivElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();
  const { data: devProfile } = useDeveloperProfile();

  // ⭐ Sélecteur d'espace (workspace) — mêmes règles déterministes que la Sidebar
  const activeSpace =
    selectedSpace && user?.roles?.includes(selectedSpace)
      ? selectedSpace
      : user?.primaryRole || 'CLIENT';
  const spaces = [
    { key: 'CLIENT', label: 'Espace Client', href: '/dashboard', icon: User },
    { key: 'BUSINESS', label: 'Espace Business', href: '/dashboard/business', icon: Store },
    { key: 'DEVELOPER', label: 'Espace Développeur', href: '/dashboard/developer', icon: Code },
    { key: 'ADMIN', label: 'Espace Admin', href: '/dashboard/admin', icon: ShieldCheck },
  ].filter((s) => {
    if (!(user?.roles ?? []).includes(s.key)) return false;
    // L'espace Développeur n'est accessible QUE si l'onboarding dev est terminé
    // (profil existant). Un rôle DEVELOPER sans profil = onboarding non terminé.
    if (s.key === 'DEVELOPER') return !!devProfile;
    return true;
  });
  const currentSpace = spaces.find((s) => s.key === activeSpace) ?? spaces[0];
  const CurrentSpaceIcon = currentSpace?.icon ?? User;

  const goToSpace = (key: string, href: string) => {
    setSelectedSpace(key);
    setShowSpaceMenu(false);
    queryClient.invalidateQueries();
    router.push(href);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (spaceRef.current && !spaceRef.current.contains(e.target as Node)) {
        setShowSpaceMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return; // Éviter les doubles clics
    setLoggingOut(true);
    try {
      // Vrai endpoint backend (http://localhost:3001/api/auth/logout) — révoque la session
      await apiClient.logout();
    } catch {
      // Erreur réseau ou timeout : on nettoie localement quand même
    }
    logout();
    window.location.href = '/login';
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase() ||
      '?'
    : '?';

  const cartOpen = useCartStore((s) => s.open);
  const cartCloseDrawer = useCartStore((s) => s.closeDrawer);

  return (
    <>
      <header className="sticky top-0 z-30 glass-strong">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-lg text-brand dark:text-brand-400 hidden sm:block">
                AfriBiz
              </span>
            </Link>

            {/* Sélecteur d'espace — visible quand l'utilisateur a plusieurs espaces */}
            {spaces.length > 1 && currentSpace && (
              <div className="relative hidden md:block ml-1" ref={spaceRef}>
                <button
                  onClick={() => setShowSpaceMenu((v) => !v)}
                  className="flex items-center gap-1.5 pl-2 pr-2 py-1.5 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-medium text-foreground/80 transition-colors"
                  aria-label={`Espace actif : ${currentSpace.label}`}
                >
                  <CurrentSpaceIcon className="h-3.5 w-3.5 text-brand" />
                  <span className="hidden lg:inline">{currentSpace.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-muted-foreground transition-transform duration-200',
                      showSpaceMenu && 'rotate-180'
                    )}
                  />
                </button>

                {showSpaceMenu && (
                  <div className="absolute left-0 mt-2 w-52 bg-card rounded-xl border border-border shadow-dropdown py-1 animate-fade-in-down z-40">
                    {spaces.map((s) => {
                      const SIcon = s.icon;
                      const isCurrent = s.key === currentSpace.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => goToSpace(s.key, s.href)}
                          className={cn(
                            'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                            isCurrent
                              ? 'text-brand font-medium bg-muted'
                              : 'text-foreground/80 hover:bg-muted'
                          )}
                        >
                          <SIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{s.label}</span>
                          {isCurrent && <Check className="ml-auto h-3.5 w-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Search bar */}
            <div className="hidden lg:flex relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand transition-colors" />
              <input
                type="text"
                placeholder="Rechercher un business, produit, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-72 lg:w-96 pl-10 pr-12 py-2.5 text-sm bg-muted border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all placeholder:text-muted-foreground"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 text-[11px] text-muted-foreground bg-muted rounded-lg border border-border font-mono">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* Cart icon with count */}
            <CartIconWithCount />

            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-muted transition-colors ml-1"
              >
                <Avatar initials={initials} size="sm" status="online" />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {employee
                      ? `${employee.firstName} ${employee.lastName}`
                      : user
                        ? `${user.firstName} ${user.lastName}`
                        : 'Client'}
                  </p>
                  {employee ? (
                    <p className="text-[11px] text-emerald-600 font-medium">
                      {employee.position}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">{user?.email || ''}</p>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'hidden md:block h-4 w-4 text-muted-foreground transition-transform duration-200',
                    showUserMenu && 'rotate-180'
                  )}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl border border-border shadow-dropdown py-1 animate-fade-in-down overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initials} size="md" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {employee
                            ? `${employee.firstName} ${employee.lastName}`
                            : user
                              ? `${user.firstName} ${user.lastName}`
                              : 'Client'}
                        </p>
                        {employee ? (
                          <p className="text-xs text-emerald-600 font-medium">
                            {employee.position}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Mon profil
                  </Link>
                  <Link
                    href="/dashboard/security"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Sécurité
                  </Link>
                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? 'Déconnexion...' : 'Déconnexion'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <CartDrawer
        isOpen={cartOpen}
        onClose={cartCloseDrawer}
        checkoutHref="/dashboard/cart"
        checkoutLabel="Voir le panier"
      />
    </>
  );
}
