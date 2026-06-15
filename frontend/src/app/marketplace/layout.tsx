'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, Search, Bell, User, ChevronDown,
  ShoppingBag, Store, MessageCircle, LogIn, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Media', href: '/media' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-800/50'
          : 'bg-white dark:bg-gray-900'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">AfriBiz</span>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/marketplace"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm w-48 lg:w-56"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span className="truncate">Rechercher...</span>
                <span className="ml-auto text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">⌘K</span>
              </Link>

              <ThemeToggle />

              <button className="hidden sm:flex p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {user ? (
                <Link href="/dashboard" className={cn(
                  'hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                )}>
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/auth/login" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Connexion
                  </Link>
                  <Link href="/auth/signup" className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30">
                    Créer mon business
                  </Link>
                </div>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-fadeIn">
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                {user ? (
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white">
                    <Store className="h-4 w-4" />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <LogIn className="h-4 w-4" />
                      Connexion
                    </Link>
                    <Link href="/auth/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white mt-1">
                      <Plus className="h-4 w-4" />
                      Créer mon business
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="font-bold text-base text-white">AfriBiz</span>
              </div>
              <p className="text-sm leading-relaxed">
                La plateforme qui connecte les professionnels africains à leurs clients. 
                Découvrez, commandez et réservez localement.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Plateforme</h4>
              <div className="space-y-2.5">
                {['Marketplace', 'Tarifs', 'Pour les business', 'Devenir développeur', 'API'].map((item) => (
                  <Link key={item} href="#" className="block text-sm hover:text-white transition-colors">{item}</Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <div className="space-y-2.5">
                {['Aide', 'Contact', 'FAQ', 'Conditions d\'utilisation', 'Politique de confidentialité'].map((item) => (
                  <Link key={item} href="#" className="block text-sm hover:text-white transition-colors">{item}</Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Pays</h4>
              <div className="space-y-2.5">
                {[
                  { name: 'Togo', code: '/tg/marketplace' },
                  { name: 'Bénin', code: '/bj/marketplace' },
                  { name: "Côte d'Ivoire", code: '/ci/marketplace' },
                  { name: 'Ghana', code: '/gh/marketplace' },
                  { name: 'Sénégal', code: '/sn/marketplace' },
                  { name: 'Nigeria', code: '/ng/marketplace' },
                ].map((item) => (
                  <Link key={item.name} href={item.code} className="block text-sm hover:text-white transition-colors">{item.name}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs">&copy; {new Date().getFullYear()} AfriBiz. Tous droits réservés.</p>
            <div className="flex items-center gap-4 text-xs">
              <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="#" className="hover:text-white transition-colors">CGU</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
