'use client';

import { BusinessModule } from '@/types/business';
import { cn } from '@/lib/utils';
import { ShoppingBag, Wrench, Utensils, Bed, CalendarRange, Package, Image, Tag, Users, MessageSquare, Home, BookOpen, HelpCircle, Mail, Play, Camera, Radio } from 'lucide-react';

interface InternalNavProps {
  modules: BusinessModule[];
  hasStories?: boolean;
  hasShorts?: boolean;
  hasActiveLive?: boolean;
}

const moduleConfig: Partial<Record<BusinessModule, { label: string; icon: React.ReactNode }>> = {
  PRODUCTS: { label: 'Produits', icon: <ShoppingBag className="w-4 h-4" /> },
  SERVICES: { label: 'Services', icon: <Wrench className="w-4 h-4" /> },
  MENU: { label: 'Menu', icon: <Utensils className="w-4 h-4" /> },
  ROOMS: { label: 'Chambres', icon: <Bed className="w-4 h-4" /> },
  EVENTS: { label: 'Événements', icon: <CalendarRange className="w-4 h-4" /> },
  RENTALS: { label: 'Locations', icon: <Package className="w-4 h-4" /> },
  PORTFOLIO: { label: 'Portfolio', icon: <Image className="w-4 h-4" /> },
  PROMOTIONS: { label: 'Promotions', icon: <Tag className="w-4 h-4" /> },
  PARTNERS: { label: 'Partenaires', icon: <Users className="w-4 h-4" /> },
  TRAINING: { label: 'Formations', icon: <BookOpen className="w-4 h-4" /> },
};

export function InternalNav({ modules, hasStories, hasShorts, hasActiveLive }: InternalNavProps) {
  const mediaSections = [
    ...(hasActiveLive ? [{ id: 'section-media-stories', label: 'En Direct', icon: <Radio className="w-4 h-4 text-red-500" /> }] : []),
    ...(hasStories ? [{ id: 'section-media-stories', label: 'Stories', icon: <Camera className="w-4 h-4" /> }] : []),
    ...(hasShorts ? [{ id: 'section-media-shorts', label: 'Shorts', icon: <Play className="w-4 h-4" /> }] : []),
  ];

  const allSections = [
    { id: 'section-accueil', label: 'Accueil', icon: <Home className="w-4 h-4" /> },
    ...mediaSections,
    ...modules.map((m) => ({
      id: `section-${m.toLowerCase()}`,
      label: moduleConfig[m]?.label || m,
      icon: moduleConfig[m]?.icon,
    })),
    { id: 'section-faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'section-contact', label: 'Contact', icon: <Mail className="w-4 h-4" /> },
    { id: 'section-reviews', label: 'Avis', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm sticky top-[4.5rem] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {allSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollTo(section.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors',
                'text-gray-600 dark:text-gray-300 hover:text-brand dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20'
              )}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
