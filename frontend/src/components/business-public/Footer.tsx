'use client';

import Image from 'next/image';
import { Business } from '@/types/business';
import { Share2, Camera, MessageCircle, ExternalLink, Play, Mail, Phone, MapPin, Shield, FileText, AlertTriangle } from 'lucide-react';

interface FooterProps {
  business: Business;
}

export function Footer({ business }: FooterProps) {
  const socialLinks: { icon: React.ReactNode; href?: string | null; label: string }[] = [
    { icon: <Share2 className="w-4 h-4" />, href: business.facebook, label: 'Facebook' },
    { icon: <Camera className="w-4 h-4" />, href: business.instagram, label: 'Instagram' },
    { icon: <MessageCircle className="w-4 h-4" />, href: business.twitter, label: 'Twitter' },
    { icon: <ExternalLink className="w-4 h-4" />, href: business.linkedin, label: 'LinkedIn' },
    { icon: <Play className="w-4 h-4" />, href: business.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {business.logo ? (
                <Image src={business.logo} alt={business.name} width={40} height={40} className="rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white font-bold">
                  {business.name.charAt(0)}
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">{business.name}</h3>
            </div>
            {business.shortDescription && (
              <p className="text-sm text-gray-400 max-w-md">{business.shortDescription}</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-brand flex items-center justify-center transition-colors" aria-label="Téléphone">
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="w-9 h-9 rounded-full bg-gray-800 hover:bg-brand flex items-center justify-center transition-colors" aria-label="Email">
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {business.whatsapp && (
                <a href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-colors" aria-label="WhatsApp">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Coords */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Coordonnées</h4>
            <div className="space-y-2 text-sm">
              {business.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>{business.address}{business.city ? `, ${business.city}` : ''}</span>
                </p>
              )}
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 hover:text-brand transition-colors">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" /> {business.phone}
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`} className="flex items-center gap-2 hover:text-brand transition-colors">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" /> {business.email}
                </a>
              )}
            </div>
          </div>

          {/* Liens utiles */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Liens</h4>
            <div className="space-y-2 text-sm">
              <a href="/privacy" className="flex items-center gap-2 hover:text-brand transition-colors">
                <Shield className="w-4 h-4 text-gray-500" /> Politique de confidentialité
              </a>
              <a href="/terms" className="flex items-center gap-2 hover:text-brand transition-colors">
                <FileText className="w-4 h-4 text-gray-500" /> Conditions d&apos;utilisation
              </a>
              <a href="/report" className="flex items-center gap-2 hover:text-brand transition-colors">
                <AlertTriangle className="w-4 h-4 text-gray-500" /> Signaler un problème
              </a>
              <a href={`mailto:${business.email || 'contact@afribiz.com'}`} className="flex items-center gap-2 hover:text-brand transition-colors">
                <MessageCircle className="w-4 h-4 text-gray-500" /> Contacter le business
              </a>
            </div>
          </div>
        </div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-brand flex items-center justify-center transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {business.name}. Propulsé par{' '}
          <a href="/" className="text-brand hover:underline">AfriBiz</a>.
        </div>
      </div>
    </footer>
  );
}
