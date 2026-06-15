'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Mail, Phone, MapPin,
  Globe, Camera, MessageCircle, Share2, Play,
  Send, ArrowRight, Heart,
} from 'lucide-react';

const quickLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Media', href: '/media' },
  { label: 'Développeurs', href: '/developers' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Politique de confidentialité', href: '/privacy' },
  { label: "Conditions d'utilisation", href: '/terms' },
  { label: 'Mentions légales', href: '/legal' },
  { label: 'Paramètres des cookies', href: '/cookies' },
];

const socialLinks = [
  { icon: Globe, href: 'https://facebook.com/afribiz', label: 'Facebook' },
  { icon: MessageCircle, href: 'https://twitter.com/afribiz', label: 'Twitter' },
  { icon: Camera, href: 'https://instagram.com/afribiz', label: 'Instagram' },
  { icon: Share2, href: 'https://linkedin.com/company/afribiz', label: 'LinkedIn' },
  { icon: Play, href: 'https://youtube.com/@afribiz', label: 'YouTube' },
];

const modules = [
  { label: 'E-Commerce', href: '/pricing' },
  { label: 'Réservations', href: '/pricing' },
  { label: 'Facturation', href: '/pricing' },
  { label: 'Marketing & SMS', href: '/pricing' },
  { label: 'Location', href: '/pricing' },
  { label: 'Événements', href: '/pricing' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300">
      {/* Newsletter section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Restez informé
              </h3>
              <p className="text-sm text-gray-400">
                Recevez les dernières actualités, astuces et mises à jour d&apos;AfriBiz.
              </p>
            </div>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand to-emerald-400 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 transition-all duration-200 shrink-0"
              >
                {subscribed ? 'Inscrit !' : (
                  <>
                    S&apos;inscrire
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <span className="font-bold text-lg text-white">AfriBiz</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              La plateforme SaaS tout-en-un pour les entrepreneurs africains.
              Vendez, gérez et développez votre business depuis chez vous.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-brand flex items-center justify-center transition-all duration-200 group"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Modules */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Modules
            </h4>
            <ul className="space-y-2.5">
              {modules.map((mod) => (
                <li key={mod.label}>
                  <Link
                    href={mod.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {mod.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@afribiz.com"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Mail className="h-4 w-4 text-gray-500 shrink-0" />
                  contact@afribiz.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+22890000000"
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Phone className="h-4 w-4 text-gray-500 shrink-0" />
                  +228 90 00 00 00
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                <span>Lomé, Togo</span>
              </li>
            </ul>

            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                Légal
              </h4>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} AfriBiz. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Fait avec <Heart className="h-3 w-3 text-red-500 fill-red-500" /> pour l&apos;Afrique
          </p>
        </div>
      </div>
    </footer>
  );
}
