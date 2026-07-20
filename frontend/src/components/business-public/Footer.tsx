'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Business } from '@/types/business';
import {
  Share2,
  Camera,
  MessageCircle,
  ExternalLink,
  Play,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  AlertTriangle,
  Send,
  ChevronRight,
  CheckCircle,
  Music,
  Globe,
} from 'lucide-react';

interface FooterProps {
  business: Business;
}

const SOCIAL_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  facebook: { icon: <Share2 className="w-4 h-4" />, label: 'Facebook', color: 'hover:bg-blue-600' },
  instagram: {
    icon: <Camera className="w-4 h-4" />,
    label: 'Instagram',
    color: 'hover:bg-pink-600',
  },
  twitter: {
    icon: <MessageCircle className="w-4 h-4" />,
    label: 'Twitter / X',
    color: 'hover:bg-gray-600',
  },
  linkedin: {
    icon: <ExternalLink className="w-4 h-4" />,
    label: 'LinkedIn',
    color: 'hover:bg-blue-700',
  },
  youtube: { icon: <Play className="w-4 h-4" />, label: 'YouTube', color: 'hover:bg-red-600' },
  tiktok: { icon: <Music className="w-4 h-4" />, label: 'TikTok', color: 'hover:bg-gray-900' },
  website: { icon: <Globe className="w-4 h-4" />, label: 'Site web', color: 'hover:bg-brand' },
};

export function Footer({ business }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Collect social links from both flat fields AND socialLinks record
  const socialLinks: { href: string; label: string; icon: React.ReactNode; color: string }[] = [];

  const flatSocials = [
    { key: 'facebook', href: business.facebook },
    { key: 'instagram', href: business.instagram },
    { key: 'twitter', href: business.twitter },
    { key: 'linkedin', href: business.linkedin },
    { key: 'youtube', href: business.youtube },
    { key: 'tiktok', href: business.tiktok },
    { key: 'website', href: business.website },
  ];

  // From flat fields
  flatSocials.forEach(({ key, href }) => {
    if (href && SOCIAL_CONFIG[key]) {
      socialLinks.push({ href, ...SOCIAL_CONFIG[key] });
    }
  });

  // From socialLinks record (e.g. {"instagram": "https://..."})
  if (business.socialLinks) {
    Object.entries(business.socialLinks).forEach(([key, href]) => {
      if (href && !socialLinks.some((s) => s.label.toLowerCase() === key)) {
        const config = SOCIAL_CONFIG[key.toLowerCase()] || {
          icon: <ExternalLink className="w-4 h-4" />,
          label: key,
          color: 'hover:bg-brand',
        };
        socialLinks.push({ href, ...config });
      }
    });
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      // Simulate subscription - in production, call API
      await new Promise((r) => setTimeout(r, 500));
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    } finally {
      setSubscribing(false);
    }
  };

  const socialIcons = [
    {
      icon: <Phone className="w-4 h-4" />,
      href: business.phone ? `tel:${business.phone}` : null,
      label: 'Téléphone',
    },
    {
      icon: <Mail className="w-4 h-4" />,
      href: business.email ? `mailto:${business.email}` : null,
      label: 'Email',
    },
    {
      icon: <MessageCircle className="w-4 h-4" />,
      href: business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}` : null,
      label: 'WhatsApp',
    },
  ].filter((s) => s.href);

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 relative overflow-hidden">
      {/* Gradient top border */}
      <div className="h-1 bg-gradient-to-r from-brand via-emerald-500 to-cyan-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Newsletter section */}
        <div className="relative mb-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Restez informé de nos actualités
              </h3>
              <p className="text-sm text-gray-400">
                Recevez nos offres et nouveautés directement par email
              </p>
            </div>
            <div className="w-full sm:w-auto sm:min-w-[320px]">
              {subscribed ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-700 text-emerald-400">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Merci de votre inscription !</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-600 bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all min-w-0"
                  />
                  <button
                    type="submit"
                    disabled={subscribing || !email.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {subscribing ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {business.logo ? (
                <Image
                  src={business.logo}
                  alt={business.name}
                  width={44}
                  height={44}
                  className="rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {business.name.charAt(0)}
                </div>
              )}
              <h3 className="text-lg font-bold text-white">{business.name}</h3>
            </div>
            {business.shortDescription && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                {business.shortDescription}
              </p>
            )}
            {!business.shortDescription && business.description && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3">
                {business.description}
              </p>
            )}

            {/* Contact icons */}
            {socialIcons.length > 0 && (
              <div className="flex items-center gap-2">
                {socialIcons.map((s, i) => (
                  <a
                    key={i}
                    href={s.href!}
                    target={s.href?.startsWith('http') ? '_blank' : undefined}
                    rel={s.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-brand flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <div className="space-y-2.5 text-sm">
              <a
                href="/"
                className="flex items-center gap-2 hover:text-brand transition-colors group"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-brand transition-colors" />
                Accueil
              </a>
              <a
                href="/marketplace"
                className="flex items-center gap-2 hover:text-brand transition-colors group"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-brand transition-colors" />
                Marketplace
              </a>
              <a
                href="/pricing"
                className="flex items-center gap-2 hover:text-brand transition-colors group"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-brand transition-colors" />
                Tarifs
              </a>
              <a
                href="/developers"
                className="flex items-center gap-2 hover:text-brand transition-colors group"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-brand transition-colors" />
                Développeurs
              </a>
              <a
                href="/contact"
                className="flex items-center gap-2 hover:text-brand transition-colors group"
              >
                <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-brand transition-colors" />
                Contact
              </a>
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Coordonnées
            </h4>
            <div className="space-y-2.5 text-sm">
              {business.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>
                    {business.address}
                    {business.city ? `, ${business.city}` : ''}
                    {business.country ? `, ${business.country}` : ''}
                  </span>
                </p>
              )}
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center gap-2 hover:text-brand transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" /> {business.phone}
                </a>
              )}
              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="flex items-center gap-2 hover:text-brand transition-colors"
                >
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" /> {business.email}
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Légal
            </h4>
            <div className="space-y-2.5 text-sm">
              <a
                href="/privacy"
                className="flex items-center gap-2 hover:text-brand transition-colors"
              >
                <Shield className="w-4 h-4 text-gray-500" /> Confidentialité
              </a>
              <a
                href="/terms"
                className="flex items-center gap-2 hover:text-brand transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-500" /> Conditions
              </a>
              <a
                href="/cookies"
                className="flex items-center gap-2 hover:text-brand transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-gray-500" /> Cookies
              </a>
              <a
                href="/legal"
                className="flex items-center gap-2 hover:text-brand transition-colors"
              >
                <FileText className="w-4 h-4 text-gray-500" /> Mentions légales
              </a>
              <a
                href={`mailto:${business.email || 'contact@afribiz.com'}`}
                className="flex items-center gap-2 hover:text-brand transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-gray-500" /> Contacter
              </a>
            </div>
          </div>
        </div>

        {/* Social Links Bar */}
        {socialLinks.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Suivez {business.name} sur les réseaux sociaux
              </p>
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95',
                      social.color
                    )}
                    aria-label={social.label}
                    title={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} {business.name}. Tous droits réservés.
          </p>
          <p>
            Propulsé par{' '}
            <a href="/" className="text-brand hover:underline font-medium">
              AfriBiz
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
