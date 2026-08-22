'use client';

import Image from 'next/image';
import { Partner } from '@/types/business';
import { Users, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface PartnersProps {
  partners: Partner[];
}

export function Partners({ partners }: PartnersProps) {
  const stagger = useStaggerReveal(partners?.length || 0);
  if (!partners?.length) return null;

  return (
    <section id="section-partners" className="scroll-mt-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <SectionHeader eyebrow="Écosystème" title="Nos Partenaires" count={partners.length} />

        <div
          ref={stagger.ref}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"
        >
          {partners.map((partner, idx) => {
            const Wrapper = (partner.website ? 'a' : 'div') as 'a';
            return (
              <Wrapper
                key={partner.id}
                {...(partner.website
                  ? { href: partner.website, target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className={cn(
                  'group flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-2xl biz-card border border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-800 hover:shadow-lg hover:shadow-brand-900/5 transition-all duration-300',
                  revealClasses(stagger.visible, idx)
                )}
                style={revealDelay(idx)}
              >
                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative ring-1 ring-gray-100 dark:ring-gray-600 group-hover:ring-brand-200 transition-all">
                  {partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      sizes="64px"
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-brand-500" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center justify-center gap-1">
                    {partner.name}
                    {partner.website && (
                      <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-brand-500 transition-colors" />
                    )}
                  </h3>
                  {partner.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {partner.description}
                    </p>
                  )}
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
