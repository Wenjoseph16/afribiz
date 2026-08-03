'use client';

import Link from 'next/link';
import { Store, Menu, X, Sun, Moon, ShoppingCart } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/cart/CartDrawer';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/media', label: 'Media' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cartOpen = useCartStore((s) => s.open);
  const openCart = useCartStore((s) => s.openDrawer);
  const closeCart = useCartStore((s) => s.closeDrawer);
  const totalItems = useCartStore((s) => s.totalItems());

  useEffect(() => setMounted(true), []);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Store className="w-6 h-6 text-brand" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">AfriBiz</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand dark:hover:text-brand-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openCart()}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                aria-label="Voir le panier"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                    {totalItems}
                  </span>
                )}
              </button>

              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-brand transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Créer mon business
                </Link>
              </div>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand dark:hover:text-brand-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand dark:hover:text-brand-300 rounded-lg transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-center bg-brand text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              Créer mon business
            </Link>
          </div>
        </div>
      )}
      <CartDrawer isOpen={cartOpen} onClose={closeCart} />
    </>
  );
}
