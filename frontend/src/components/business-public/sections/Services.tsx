'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Service } from '@/types/business';
import { Clock, Wrench, Calendar, FileText } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { QuoteRequestModal } from '../QuoteRequestModal';
import { SectionHeader } from '../ui/SectionHeader';
import { useStaggerReveal, revealClasses, revealDelay } from '../ui/reveal';

interface ServicesProps {
  services: Service[];
  businessSlug?: string;
}

export function Services({ services, businessSlug }: ServicesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const stagger = useStaggerReveal(services?.length || 0);

  if (!services?.length) return null;

  const openQuoteModal = (serviceName?: string) => {
    setSelectedService(serviceName);
    setModalOpen(true);
  };

  return (
    <>
      <section id="section-services" className="scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <SectionHeader eyebrow="Prestations" title="Nos Services" count={services.length} />

          {/* ─── Grid — double-bezel cards ─── */}
          <div
            ref={stagger.ref}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
          >
            {services.map((service, idx) => {
              const isHero = idx === 0 && services.length > 2;
              return (
                <div
                  key={service.id}
                  className={cn(
                    'group relative',
                    isHero && 'sm:col-span-2 lg:col-span-2',
                    revealClasses(stagger.visible, idx)
                  )}
                  style={revealDelay(idx)}
                >
                  <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 h-full biz-card">
                    <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden h-full flex flex-col">
                      {/* Image Zone */}
                      <div
                        className={cn(
                          'relative overflow-hidden bg-gray-50',
                          isHero ? 'aspect-[16/9]' : 'aspect-video'
                        )}
                      >
                        {service.images?.[0] ? (
                          <Image
                            src={service.images[0]}
                            alt={service.name}
                            fill
                            sizes={
                              isHero
                                ? '(max-width: 768px) 100vw, 66vw'
                                : '(max-width: 768px) 100vw, 33vw'
                            }
                            className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                              <Wrench className="w-6 h-6 text-brand-500" />
                            </div>
                          </div>
                        )}

                        {/* Duration chip */}
                        {service.duration && (
                          <span className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-white/85 backdrop-blur-md text-gray-700 rounded-full">
                            <Clock className="w-3 h-3" />
                            {service.duration} min
                          </span>
                        )}

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      {/* Content Zone */}
                      <div className="p-4 md:p-5 flex flex-col flex-1">
                        <h3 className="font-semibold text-gray-900 text-[15px] leading-tight mb-1 line-clamp-1">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {service.description}
                          </p>
                        )}

                        {/* Price */}
                        <div className="mt-auto mb-3">
                          {service.price != null ? (
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                              {formatPrice(Number(service.price), service.currency)}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-brand-600">Sur devis</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                          <button
                            onClick={() =>
                              document
                                .getElementById('section-bookings')
                                ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10 transition-all duration-300 active:scale-[0.97]"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Réserver
                          </button>
                          <button
                            onClick={() => openQuoteModal(service.name)}
                            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-all duration-300 active:scale-[0.97]"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Devis
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {businessSlug && (
        <QuoteRequestModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          businessSlug={businessSlug}
          serviceName={selectedService}
        />
      )}
    </>
  );
}
