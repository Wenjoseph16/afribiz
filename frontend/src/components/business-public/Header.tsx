'use client';

import { Business } from '@/types/business';
import { Phone, MessageCircle, ShoppingCart, Calendar, FileText, Package, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  business: Business;
}

export function Header({ business }: HeaderProps) {
  const actions: { label: string; icon: React.ReactNode; href?: string; onClick?: () => void; variant?: 'primary' | 'secondary' }[] = [];

  if (business.phone) {
    actions.push({
      label: 'Appeler',
      icon: <Phone className="w-4 h-4" />,
      href: `tel:${business.phone}`,
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

  if (business.modules.includes('ROOMS') || business.modules.includes('SERVICES')) {
    actions.push({
      label: 'Réserver',
      icon: <Calendar className="w-4 h-4" />,
      onClick: () => {
        const target = business.modules.includes('ROOMS') ? 'section-rooms' : 'section-services';
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
      },
    });
  }

  if (business.modules.includes('PRODUCTS')) {
    actions.push({
      label: 'Commander',
      icon: <ShoppingCart className="w-4 h-4" />,
      onClick: () => document.getElementById('section-products')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (business.modules.includes('SERVICES') || business.type === 'FREELANCE') {
    actions.push({
      label: 'Demander un devis',
      icon: <FileText className="w-4 h-4" />,
      onClick: () => document.getElementById('section-services')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (business.modules.includes('RENTALS')) {
    actions.push({
      label: 'Louer',
      icon: <Package className="w-4 h-4" />,
      onClick: () => document.getElementById('section-rentals')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (business.type === 'CENTRE_FORMATION' || business.type === 'ECOLE_PRIVEE') {
    actions.push({
      label: "S'abonner",
      icon: <Bookmark className="w-4 h-4" />,
      onClick: () => document.getElementById('section-services')?.scrollIntoView({ behavior: 'smooth' }),
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {actions.map((action, i) => (
            <a
              key={i}
              href={action.href}
              onClick={(e) => {
                if (action.onClick) {
                  e.preventDefault();
                  action.onClick();
                }
              }}
              target={action.href?.startsWith('http') ? '_blank' : undefined}
              rel={action.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                action.variant === 'primary'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {action.icon}
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
