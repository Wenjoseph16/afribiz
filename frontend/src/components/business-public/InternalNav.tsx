'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BusinessModule } from '@/types/business';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Wrench,
  Utensils,
  Bed,
  CalendarRange,
  Package,
  Image,
  Tag,
  Users,
  MessageSquare,
  Home,
  BookOpen,
  HelpCircle,
  Mail,
  Play,
  Camera,
  Radio,
} from 'lucide-react';

interface InternalNavProps {
  modules: BusinessModule[];
  hasStories?: boolean;
  hasShorts?: boolean;
  hasActiveLive?: boolean;
  slug?: string;
}

const moduleConfig: Partial<Record<BusinessModule, { label: string; icon: React.ReactNode }>> = {
  PRODUCTS: { label: 'Produits', icon: <ShoppingBag className="w-5 h-5" /> },
  SERVICES: { label: 'Services', icon: <Wrench className="w-5 h-5" /> },
  MENU: { label: 'Menu', icon: <Utensils className="w-5 h-5" /> },
  ROOMS: { label: 'Chambres', icon: <Bed className="w-5 h-5" /> },
  BOOKINGS: { label: 'Réservations', icon: <CalendarRange className="w-5 h-5" /> },
  EVENTS: { label: 'Événements', icon: <CalendarRange className="w-5 h-5" /> },
  RENTALS: { label: 'Locations', icon: <Package className="w-5 h-5" /> },
  PORTFOLIO: { label: 'Portfolio', icon: <Image className="w-5 h-5" /> },
  PROMOTIONS: { label: 'Promotions', icon: <Tag className="w-5 h-5" /> },
  PARTNERS: { label: 'Partenaires', icon: <Users className="w-5 h-5" /> },
  TRAINING: { label: 'Formations', icon: <BookOpen className="w-5 h-5" /> },
};

export function InternalNav({ modules, hasStories, hasShorts, hasActiveLive }: InternalNavProps) {
  const [activeId, setActiveId] = useState('section-accueil');
  const [isSticking, setIsSticking] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const mediaSections = [
    ...(hasActiveLive
      ? [
          {
            id: 'section-media-stories',
            label: 'En Direct',
            icon: <Radio className="w-5 h-5 text-red-500" />,
          },
        ]
      : []),
    ...(hasStories
      ? [{ id: 'section-media-stories', label: 'Stories', icon: <Camera className="w-5 h-5" /> }]
      : []),
    ...(hasShorts
      ? [{ id: 'section-media-shorts', label: 'Shorts', icon: <Play className="w-5 h-5" /> }]
      : []),
  ];

  const allSections = [
    { id: 'section-accueil', label: 'Accueil', icon: <Home className="w-5 h-5" /> },
    ...mediaSections,
    ...modules.map((m) => ({
      id: `section-${m.toLowerCase()}`,
      label: moduleConfig[m]?.label || m,
      icon: moduleConfig[m]?.icon,
    })),
    { id: 'section-faq', label: 'FAQ', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'section-contact', label: 'Contact', icon: <Mail className="w-5 h-5" /> },
    { id: 'section-reviews', label: 'Avis', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  // IntersectionObserver-based scroll spy
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const sectionIds = allSections.map((s) => s.id);
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const visibleSections = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        // Pick the section with the highest intersection ratio
        let bestId = 'section-accueil';
        let bestRatio = 0;
        visibleSections.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) setActiveId(bestId);
      },
      {
        rootMargin: '-90px 0px -40% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionElements.forEach((el) => observerRef.current!.observe(el));

    return () => observerRef.current?.disconnect();
  }, [allSections.length]); // Re-observe when sections change

  // Sentinel for shadow effect on sticky nav
  const handleIntersect = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    setIsSticking(!entry.isIntersecting);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveId(id);
  };

  return (
    <>
      <div ref={sentinelRef} className="h-0" />
      <nav
        ref={navRef}
        aria-label="Navigation sections"
        className={cn(
          'border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm transition-shadow duration-200',
          isSticking ? 'shadow-md' : 'shadow-none'
        )}
        style={{ position: 'sticky', top: '4.5rem', zIndex: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide py-2.5" role="tablist">
            {allSections.map((section) => {
              const isActive = activeId === section.id;
              return (
                <button
                  key={section.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={section.label}
                  onClick={() => scrollTo(section.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'bg-brand text-white shadow-sm shadow-brand/20 scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-brand dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                  )}
                >
                  <span className={cn('w-4 h-4', isActive ? 'text-white' : '')}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
