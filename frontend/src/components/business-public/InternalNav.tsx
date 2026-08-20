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
  Repeat,
} from 'lucide-react';

interface InternalNavProps {
  modules: BusinessModule[];
  hasStories?: boolean;
  hasShorts?: boolean;
  hasActiveLive?: boolean;
  slug?: string;
  hasProducts?: boolean;
  hasServices?: boolean;
  hasMenu?: boolean;
  hasRooms?: boolean;
  hasEvents?: boolean;
  hasRentals?: boolean;
  hasPortfolio?: boolean;
  hasPromotions?: boolean;
  hasPartners?: boolean;
  hasTrainings?: boolean;
  hasSubscriptions?: boolean;
}

const CLIENT_MODULE_CONFIG: Partial<
  Record<BusinessModule, { label: string; icon: React.ReactNode }>
> = {
  PRODUCTS: { label: 'Produits', icon: <ShoppingBag className="w-4 h-4" /> },
  SERVICES: { label: 'Services', icon: <Wrench className="w-4 h-4" /> },
  MENU: { label: 'Menu', icon: <Utensils className="w-4 h-4" /> },
  ROOMS: { label: 'Chambres', icon: <Bed className="w-4 h-4" /> },
  BOOKINGS: { label: 'Réservations', icon: <CalendarRange className="w-4 h-4" /> },
  EVENTS: { label: 'Événements', icon: <CalendarRange className="w-4 h-4" /> },
  RENTALS: { label: 'Locations', icon: <Package className="w-4 h-4" /> },
  PORTFOLIO: { label: 'Portfolio', icon: <Image className="w-4 h-4" /> },
  PROMOTIONS: { label: 'Promotions', icon: <Tag className="w-4 h-4" /> },
  PARTNERS: { label: 'Partenaires', icon: <Users className="w-4 h-4" /> },
  TRAINING: { label: 'Formations', icon: <BookOpen className="w-4 h-4" /> },
  SUBSCRIPTIONS: { label: 'Abonnements', icon: <Repeat className="w-4 h-4" /> },
};

export function InternalNav({ modules, hasStories, hasShorts, hasActiveLive }: InternalNavProps) {
  const [activeId, setActiveId] = useState('section-accueil');
  const [isSticking, setIsSticking] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const mediaSections: { id: string; label: string; icon: React.ReactNode }[] = [];
  if (hasActiveLive) {
    mediaSections.push({ id: 'section-live', label: 'En Direct', icon: <Radio className="w-4 h-4 text-red-500" /> });
  }
  if (hasStories) {
    mediaSections.push({ id: 'section-media-stories', label: 'Stories', icon: <Camera className="w-4 h-4" /> });
  }
  if (hasShorts) {
    mediaSections.push({ id: 'section-media-shorts', label: 'Shorts', icon: <Play className="w-4 h-4" /> });
  }

  const clientSections = modules
    .filter((m) => CLIENT_MODULE_CONFIG[m])
    .map((m) => ({
      id: `section-${m.toLowerCase()}`,
      label: CLIENT_MODULE_CONFIG[m]?.label || m,
      icon: CLIENT_MODULE_CONFIG[m]?.icon,
    }));

  const allSections = [
    { id: 'section-accueil', label: 'Accueil', icon: <Home className="w-4 h-4" /> },
    ...mediaSections,
    ...clientSections,
    { id: 'section-reviews', label: 'Avis', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'section-contact', label: 'Contact', icon: <Mail className="w-4 h-4" /> },
  ];

  // IntersectionObserver scroll spy
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
  }, [allSections.length]);

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
        aria-label="Navigation sections"
        className={cn(
          'transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isSticking
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-100 dark:border-gray-800'
            : 'bg-transparent'
        )}
        style={{ position: 'sticky', top: '4rem', zIndex: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3" role="tablist">
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
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
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
