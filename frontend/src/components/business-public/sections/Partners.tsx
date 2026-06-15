'use client';

import Image from 'next/image';
import { Partner } from '@/types/business';
import { Users, ExternalLink } from 'lucide-react';

interface PartnersProps {
  partners: Partner[];
}

export function Partners({ partners }: PartnersProps) {
  if (!partners?.length) return null;

  return (
    <section id="section-partners" className="scroll-mt-32 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Nos Partenaires</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {partners.map((partner) => (
            <a
              key={partner.id}
              href={partner.website || '#'}
              target={partner.website ? '_blank' : undefined}
              rel={partner.website ? 'noopener noreferrer' : undefined}
              className="group flex flex-col items-center gap-3 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                {partner.logo ? (
                  <Image src={partner.logo} alt={partner.name} fill className="object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-brand" />
                )}
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm flex items-center justify-center gap-1">
                  {partner.name}
                  {partner.website && <ExternalLink className="w-3 h-3 text-gray-400" />}
                </h3>
                {partner.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{partner.description}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
