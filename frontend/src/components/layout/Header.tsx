'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, ChevronDown, LayoutDashboard, LogOut, Search as SearchIcon,
  Menu, X, Store, Code, BookOpen, Info, Play, Building2, Package,
  TrendingUp, ArrowRight as ArrowRightIcon, ShoppingCart as ShoppingCartIcon,
} from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { apiClient } from '@/services/apiClient';
import { CartIconPublic } from '@/components/CartIconPublic';

const navLinks = [
  { label: 'Accueil', href: '/', icon: Store },
  { label: 'Marketplace', href: '/marketplace', icon: BookOpen },
  { label: 'Media', href: '/media', icon: Play },
  { label: 'Développeurs', href: '/developers', icon: Code },
  { label: 'Tarifs', href: '/pricing', icon: null },
  { label: 'À propos', href: '/about', icon: Info },
  { label: 'Contact', href: '/contact', icon: null },
];

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await apiClient.searchMarketplace({ q, limit: 6 });
      const data = res.data?.data || [];
      setSearchResults(Array.isArray(data) ? data.slice(0, 6) : []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => doSearch(value), 300);
  };

  const navigateSearch = (item: any) => {
    setSearchOpen(false);
    setShowResults(false);
    setSearchQuery('');
    if (item._type === 'business') {
      router.push(`/business/${item.slug}`);
    } else {
      router.push(`/marketplace?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    router.replace('/');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-2xl border-b border-gray-200/80 dark:border-gray-800/80 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <span className="font-bold text-xl text-brand dark:text-brand-400">
            AfriBiz
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Global Search */}
        <div ref={searchRef} className="hidden md:flex items-center">
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand/30 transition-all">
                <SearchIcon className="h-4 w-4 text-gray-400 ml-3 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un business, produit..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  className="w-64 bg-transparent px-2.5 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(''); setShowResults(false); }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                title="Rechercher"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
            )}

            {/* Search results dropdown */}
            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
                >
                  {searching ? (
                    <div className="p-6 text-center text-sm text-gray-400">Recherche...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">Aucun résultat</div>
                  ) : (
                    <div>
                      <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                        Résultats
                      </div>
                      {searchResults.map((item: any, i: number) => (
                        <button
                          key={item.id || i}
                          onClick={() => navigateSearch(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-50 dark:border-gray-700/30 last:border-0"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white shrink-0">
                            {item._type === 'business' ? <Building2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.name || item.title || 'Sans nom'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {item._type === 'business' ? item.city || item.country || 'Business' : 'Produit'}
                            </p>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 text-gray-300 shrink-0" />
                        </button>
                      ))}
                      <Link
                        href={`/marketplace?q=${encodeURIComponent(searchQuery)}`}
                        onClick={() => { setSearchOpen(false); setShowResults(false); setSearchQuery(''); }}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                      >
                        <SearchIcon className="h-4 w-4" />
                        Voir tous les résultats
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Cart icon */}
          <CartIconPublic />

          {isAuthenticated() && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.firstName}
                </span>
                <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg py-1"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Mon tableau de bord
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand to-emerald-400 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 transition-all duration-200"
              >
                Créer mon business
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                aria-label={mobileMenu ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {/* Mobile search */}
              <div className="relative mb-2">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un business, produit..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 border border-gray-200 dark:border-gray-700"
                />
                {searchResults.length > 0 && searchQuery.trim() && (
                  <div className="mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-lg">
                    {searchResults.slice(0, 4).map((item: any, i: number) => (
                      <button
                        key={item.id || i}
                        onClick={() => { navigateSearch(item); setMobileMenu(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white shrink-0">
                          {item._type === 'business' ? <Building2 className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.name || item.title || 'Sans nom'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenu(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {link.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-gray-100 dark:border-gray-800" />
              <Link
                href="/login"
                onClick={() => setMobileMenu(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenu(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand to-emerald-400 text-white text-center hover:shadow-lg transition-all"
              >
                Créer mon business
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
