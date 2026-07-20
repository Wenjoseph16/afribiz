'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Star, MapPin, Shield, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function HoverCard({
  children,
  content,
  side = 'bottom',
  className,
}: HoverCardProps) {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!show || !triggerRef.current || !cardRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const card = cardRef.current;
    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = trigger.top - 8;
        left = trigger.left + trigger.width / 2;
        card.style.transform = 'translateX(-50%) translateY(-100%)';
        break;
      case 'bottom':
        top = trigger.bottom + 8;
        left = trigger.left + trigger.width / 2;
        card.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        top = trigger.top + trigger.height / 2;
        left = trigger.left - 8;
        card.style.transform = 'translateY(-50%) translateX(-100%)';
        break;
      case 'right':
        top = trigger.top + trigger.height / 2;
        left = trigger.right + 8;
        card.style.transform = 'translateY(-50%)';
        break;
    }
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
  }, [show, side]);

  useEffect(() => {
    updatePosition();
    if (!show) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition, show]);

  return (
    <div ref={triggerRef} className={cn('relative inline-flex', className)}>
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      {show && (
        <div
          ref={cardRef}
          className="fixed z-50 w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export function BusinessHoverPreview({
  item,
}: {
  item: {
    name?: string;
    slug?: string;
    rating?: number;
    reviewCount?: number;
    city?: string;
    description?: string;
    badges?: string[];
    image?: string;
    category?: string;
  };
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3 mb-2">
        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-base font-bold text-brand overflow-hidden shrink-0">
          {item.image ? (
            <Image
              src={item.image ?? ''}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            item.name?.[0]
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {item.rating && item.rating > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                {item.rating}
              </span>
            )}
            {item.city && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {item.city}
              </span>
            )}
          </div>
        </div>
      </div>
      {item.description && (
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {item.description}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {item.badges?.includes('verified') && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
            <BadgeCheck className="h-3 w-3" /> Vérifié
          </span>
        )}
        {item.badges?.includes('premium') && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full">
            <Shield className="h-3 w-3" /> Premium
          </span>
        )}
        {item.category && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {item.category}
          </span>
        )}
      </div>
    </div>
  );
}
