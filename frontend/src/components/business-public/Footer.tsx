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
  CheckCircle,
  Music,
  Globe,
  Heart,
} from 'lucide-react';

interface FooterProps {
  business: Business;
}

const SOCIAL_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  facebook: {
    icon: <Share2 className="w-4 h-4" />,
    label: 'Facebook',
    color: 'hover:bg-blue-500/10 hover:text-blue-400',
  },
  instagram: {
    icon: <Camera className="w-4 h-4" />,
    label: 'Instagram',
    color: 'hover:bg-pink-500/10 hover:text-pink-400',
  },
  twitter: {
    icon: <MessageCircle className="w-4 h-4" />,
    label: 'Twitter / X',
    color: 'hover:bg-sky-500/10 hover:text-sky-400',
  },
  linkedin: {
    icon: <ExternalLink className="w-4 h-4" />,
    label: 'LinkedIn',
    color: 'hover:bg-blue-600/10 hover:text-blue-500',
  },
  youtube: {
    icon: <Play className="w-4 h-4" />,
    label: 'YouTube',
    color: 'hover:bg-red-500/10 hover:text-red-400',
  },
  tiktok: {
    icon: <Music className="w-4 h-4" />,
    label: 'TikTok',
    color: 'hover:bg-white/10 hover:text-white',
  },
  website: {
    icon: <Globe className="w-4 h-4" />,
    label: 'Site web',
    color: 'hover:bg-emerald-500/10 hover:text-emerald-400',
  },
};

export function Footer({ business }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

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

  flatSocials.forEach(({ key, href }) => {
    if (href && SOCIAL_CONFIG[key]) {
      socialLinks.push({ href, ...SOCIAL_CONFIG[key] });
    }
  });

  if (business.socialLinks) {
    Object.entries(business.socialLinks).forEach(([key, href]) => {
      if (href && !socialLinks.some((s) => s.label.toLowerCase() === key)) {
        const config = SOCIAL_CONFIG[key.toLowerCase()] || {
          icon: <ExternalLink className="w-4 h-4" />,
          label: key,
          color: 'hover:bg-emerald-500/10 hover:text-emerald-400',
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
      await new Promise((r) => setTimeout(r, 500));
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    } finally {
      setSubscribing(false);
    }
  };

  const contactLinks = [
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
    <footer className="relative overflow-hidden">
      {/* ─── Gradient top border ─── */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

      {/* ─── Newsletter Section ─── */}
      <div className="bg-gray-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-8">
          <div className="relative p-6 sm:p-8 md:p-10 rounded-[1.5rem] overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-900 to-gray-900 rounded-[1.5rem]" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <span className="inline-block rounded-full px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                  Newsletter
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Restez informé</h3>
                <p className="text-sm text-gray-400">Offres et nouveautés directement par email</p>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[340px]">
                {subscribed ? (
                  <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-300">
                      Inscription envoyée !
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      className="flex-1 px-4 py-3 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all min-w-0"
                    />
                    <button
                      type="submit"
                      disabled={subscribing || !email.trim()}
                      className="flex items-center gap-1.5 px-5 py-3 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-400 transition-all duration-300 active:scale-[0.97] disabled:opacity-40 shrink-0 shadow-lg shadow-emerald-500/20"
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
        </div>
      </div>

      {/* ─── Main Footer Content ─── */}
      <div className="bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pt-8 border-t border-white/5">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                {business.logo ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden relative bg-white/5">
                    <Image src={business.logo} alt={business.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                    {business.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-base font-bold text-white">{business.name}</h3>
              </div>
              {business.shortDescription && (
                <p className="text-[13px] text-gray-500 leading-relaxed mb-5 line-clamp-3">
                  {business.shortDescription}
                </p>
              )}

              {contactLinks.length > 0 && (
                <div className="flex items-center gap-2">
                  {contactLinks.map((s, i) => (
                    <a
                      key={i}
                      href={s.href!}
                      target={s.href?.startsWith('http') ? '_blank' : undefined}
                      rel={s.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all duration-300 active:scale-95"
                      aria-label={s.label}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-5">
                Navigation
              </h4>
              <div className="space-y-3 text-[13px]">
                {[
                  { href: '/', label: 'Accueil' },
                  { href: '/marketplace', label: 'Marketplace' },
                  { href: '/pricing', label: 'Tarifs' },
                  { href: '/developers', label: 'Développeurs' },
                  { href: '/contact', label: 'Contact' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors duration-300 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-emerald-500 transition-colors duration-300" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Coordonnées */}
            <div>
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-5">
                Coordonnées
              </h4>
              <div className="space-y-3 text-[13px]">
                {business.address && (
                  <p className="flex items-start gap-2 text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
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
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" /> {business.phone}
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" /> {business.email}
                  </a>
                )}
                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em] mb-5">
                Légal
              </h4>
              <div className="space-y-3 text-[13px]">
                {[
                  {
                    href: '/privacy',
                    icon: <Shield className="w-3.5 h-3.5 text-gray-600" />,
                    label: 'Confidentialité',
                  },
                  {
                    href: '/terms',
                    icon: <FileText className="w-3.5 h-3.5 text-gray-600" />,
                    label: 'Conditions',
                  },
                  {
                    href: '/cookies',
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-gray-600" />,
                    label: 'Cookies',
                  },
                  {
                    href: '/legal',
                    icon: <FileText className="w-3.5 h-3.5 text-gray-600" />,
                    label: 'Mentions légales',
                  },
                  {
                    href: `mailto:${business.email || 'contact@afribiz.com'}`,
                    icon: <MessageCircle className="w-3.5 h-3.5 text-gray-600" />,
                    label: 'Contacter',
                  },
                ].map((link) => (
                  <a
                    key={link.href + link.label}
                    href={link.href}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
                  >
                    {link.icon}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Social Links ─── */}
          {socialLinks.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[13px] text-gray-600">Suivez {business.name}</p>
                <div className="flex items-center gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 transition-all duration-300 active:scale-95 ${social.color}`}
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

          {/* ─── Bottom Bar ─── */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-gray-600">
            <p>
              © {new Date().getFullYear()} {business.name}. Tous droits réservés.
            </p>
            <p className="flex items-center gap-1">
              Propulsé par{' '}
              <a
                href="/"
                className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
              >
                AfriBiz
              </a>
              <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
