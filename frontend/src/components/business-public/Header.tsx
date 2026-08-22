'use client';

import { useState } from 'react';
import { Business } from '@/types/business';
import {
  Phone,
  MessageCircle,
  ShoppingCart,
  Calendar,
  FileText,
  Package,
  Bookmark,
  QrCode,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShareBusinessModal } from './ShareBusinessModal';

interface HeaderProps {
  business: Business;
  slug?: string;
  // Drapeaux de contenu : les CTA ne s'affichent que si la section cible a de la donnée
  hasProducts?: boolean;
  hasServices?: boolean;
  hasRooms?: boolean;
  hasRentals?: boolean;
}

export function Header({
  business,
  slug,
  hasProducts,
  hasServices,
  hasRooms,
  hasRentals,
}: HeaderProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const actions: {
    label: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary';
  }[] = [];

  if (business.phone) {
    actions.push({
      label: 'Appeler',
      icon: <Phone className="w-4 h-4" />,
      href: `tel:${business.phone}`,
    });
  }

  // Itinéraire — Google Maps (GPS réel ou lien configuré par le business)
  const mapsHref =
    business.googleMapsLink ||
    (business.latitude != null && business.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : business.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${business.name} ${business.address} ${business.city}`
          )}`
        : null);
  if (mapsHref) {
    actions.push({
      label: 'Itinéraire',
      icon: <MapPin className="w-4 h-4" />,
      href: mapsHref,
    });
  }

  if (business.whatsapp) {
    actions.push({
      label: 'WhatsApp',
      icon: <MessageCircle className="w-4 h-4" />,
      href: `https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`,
      variant: 'primary',
    });
  }

  const canBookRooms = business.modules.includes('ROOMS') && hasRooms;
  const canBookServices = business.modules.includes('SERVICES') && hasServices;
  if (canBookRooms || canBookServices) {
    actions.push({
      label: 'Réserver',
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => {
        const target = canBookRooms ? 'section-rooms' : 'section-services';
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      },
    });
  }

  if (business.modules.includes('PRODUCTS') && hasProducts) {
    actions.push({
      label: 'Commander',
      icon: <ShoppingCart className="w-4 h-4" />,
      onClick: () =>
        document.getElementById('section-products')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if ((business.modules.includes('SERVICES') && hasServices) || business.type === 'FREELANCE') {
    actions.push({
      label: 'Demander un devis',
      icon: <FileText className="w-4 h-4" />,
      onClick: () =>
        document.getElementById('section-services')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (business.modules.includes('RENTALS') && hasRentals) {
    actions.push({
      label: 'Louer',
      icon: <Package className="w-4 h-4" />,
      onClick: () =>
        document.getElementById('section-rentals')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (business.type === 'CENTRE_FORMATION' || business.type === 'ECOLE_PRIVEE') {
    actions.push({
      label: "S'abonner",
      icon: <Bookmark className="w-4 h-4" />,
      onClick: () =>
        document.getElementById('section-services')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  // Lien + QR code unique de la vitrine — toujours visible, même sans contact
  const showShare = !!slug;
  if (actions.length === 0 && !showShare) return null;

  return (
    <div className="relative z-40 -mt-4" role="region" aria-label="Actions rapides">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 shadow-xl shadow-black/[0.06] px-3 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {actions.map((action, i) => (
            <a
              key={i}
              href={action.href}
              aria-label={action.label}
              onClick={(e) => {
                if (action.onClick) {
                  e.preventDefault();
                  action.onClick();
                }
              }}
              target={action.href?.startsWith('http') ? '_blank' : undefined}
              rel={action.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]',
                action.variant === 'primary'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/25 hover:bg-green-700'
                  : 'bg-gray-100/80 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-200/80 dark:hover:bg-white/10'
              )}
            >
              {action.icon}
              {action.label}
            </a>
          ))}

          {/* 🔗 Lien & QR code unique de la vitrine */}
          {showShare && (
            <button
              onClick={() => setShareOpen(true)}
              aria-label="Partager et QR code de la vitrine"
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ring-1 ring-brand-200 dark:ring-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/30"
            >
              <QrCode className="w-4 h-4" />
              Partager
            </button>
          )}
        </div>
      </div>

      <ShareBusinessModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        businessName={business.name}
        slug={slug || ''}
        logo={business.logo}
      />
    </div>
  );
}
