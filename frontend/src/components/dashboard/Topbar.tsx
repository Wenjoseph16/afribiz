'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu, Bell, LogOut, User, Settings, ChevronDown, Search, Moon, Sun, Command, ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/index';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';
import { useUnreadCount, useCart } from '@/features/hooks';

export function CartIconWithCount() {
  const { data: cartData, isLoading } = useCart();
  const cartItems = (cartData as { items?: Array<{ quantity: number }> })?.items || [];
  const itemCount = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  return (
    <Link href="/dashboard/cart" className="relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
      <ShoppingCart className="h-4 w-4" />
      {!isLoading && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-brand rounded-full ring-2 ring-background">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}

export function Topbar() {
  const router = useRouter();
  const { toggleSidebar } = useUiStore();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const { apiClient } = await import('@/services/apiClient');
      await apiClient.logout();
    } catch (e) { console.error(e); }
    logout();
    router.replace('/login');
  };

  const { data: unreadData } = useUnreadCount();
  const unreadCount = (unreadData as { count?: number } | undefined)?.count ?? 0;

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'
    : '?';

  return (
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
            <span className="font-bold text-lg text-brand dark:text-brand-400 hidden sm:block">AfriBiz</span>
          </Link>

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
                  router.push(`/dashboard/explore?q=${encodeURIComponent(searchQuery.trim())}`);
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
          <Link
            href="/dashboard/notifications"
            className="relative p-2.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-destructive rounded-full ring-2 ring-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Link>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-muted transition-colors ml-1"
            >
              <Avatar
                initials={initials}
                size="sm"
                status="online"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {user ? `${user.firstName} ${user.lastName}` : 'Client'}
                </p>
                <p className="text-[11px] text-muted-foreground">{user?.email || ''}</p>
              </div>
              <ChevronDown className={cn('hidden md:block h-4 w-4 text-muted-foreground transition-transform duration-200', showUserMenu && 'rotate-180')} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-2xl border border-border shadow-dropdown py-1 animate-fade-in-down overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar initials={initials} size="md" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {user ? `${user.firstName} ${user.lastName}` : 'Client'}
                      </p>
                      <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
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
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
